// ═══════════════════════════════════════════════════════════════
// Cart Service Layer
// Orchestrates persistent cart retrievals, stock validations, and cart merges
// ═══════════════════════════════════════════════════════════════

import { CartRepository } from './cart.repository';
import { ApiError } from '../../utils/api-error';
import { prisma } from '../../config/database';

export class CartService {
  private repo: CartRepository;

  constructor(repo: CartRepository) {
    this.repo = repo;
  }

  /** Retrieve or initialize user or guest cart, validating active products and stock */
  async getOrCreateCart(userId?: string, sessionId?: string) {
    if (!userId && !sessionId) {
      throw ApiError.badRequest('Either userId or sessionId must be provided');
    }

    const rawCart = userId
      ? await this.repo.findByUserId(userId)
      : await this.repo.findBySessionId(sessionId!);

    let cart = rawCart || await this.repo.createCart(userId, sessionId);

    // Process and validate items (filter inactive, check stock levels)
    const validItems: any[] = [];
    let subtotal = 0;
    let totalItems = 0;
    let itemsUpdated = false;

    for (const item of cart.items) {
      // Filter out deleted/inactive products
      if (!item.product || item.product.status !== 'ACTIVE') {
        await prisma.cartItem.delete({ where: { id: item.id } });
        itemsUpdated = true;
        continue;
      }

      // Verify variant active and in stock
      if (item.variantId && (!item.variant || !item.variant.isActive)) {
        await prisma.cartItem.delete({ where: { id: item.id } });
        itemsUpdated = true;
        continue;
      }

      const stock = item.variant ? item.variant.stock : 0;
      let qty = item.quantity;

      // Auto-correct quantity to maximum available stock
      if (qty > stock) {
        qty = stock;
        if (qty === 0) {
          await prisma.cartItem.delete({ where: { id: item.id } });
          itemsUpdated = true;
          continue;
        } else {
          await prisma.cartItem.update({ where: { id: item.id }, data: { quantity: qty } });
          itemsUpdated = true;
        }
      }

      const price = item.variant
        ? Number(item.variant.price)
        : Number(item.product.salePrice || item.product.basePrice);

      validItems.push({
        id: item.id,
        productId: item.productId,
        productName: item.product.name,
        productSlug: item.product.slug,
        image: item.product.images[0]?.url || null,
        variantId: item.variantId,
        variantName: item.variant?.name || null,
        sku: item.variant?.sku || item.product.sku,
        price,
        quantity: qty,
        total: price * qty,
        stock,
      });

      subtotal += price * qty;
      totalItems += qty;
    }

    // Refresh cart if items were updated or deleted
    if (itemsUpdated) {
      const refreshed = userId
        ? await this.repo.findByUserId(userId)
        : await this.repo.findBySessionId(sessionId!);
      if (refreshed) {
        cart = refreshed;
      }
    }

    // Calculate coupon discounts
    let discountAmount = 0;
    if (cart.coupon && cart.coupon.isActive) {
      const now = new Date();
      if (cart.coupon.startDate <= now && cart.coupon.endDate >= now) {
        if (!cart.coupon.minOrderAmount || subtotal >= Number(cart.coupon.minOrderAmount)) {
          if (cart.coupon.type === 'PERCENTAGE') {
            discountAmount = subtotal * (Number(cart.coupon.value) / 100);
            if (cart.coupon.maxDiscountAmount) {
              discountAmount = Math.min(discountAmount, Number(cart.coupon.maxDiscountAmount));
            }
          } else if (cart.coupon.type === 'FIXED_AMOUNT') {
            discountAmount = Number(cart.coupon.value);
          }
        }
      }
    }

    return {
      id: cart.id,
      userId: cart.userId,
      sessionId: cart.sessionId,
      items: validItems,
      subtotal,
      discountAmount,
      totalAmount: Math.max(0, subtotal - discountAmount),
      itemCount: totalItems,
      coupon: cart.coupon ? { code: cart.coupon.code, type: cart.coupon.type, value: cart.coupon.value } : null,
    };
  }

  async addToCart(userId: string | undefined, sessionId: string | undefined, data: { productId: string; variantId?: string | null; quantity: number }) {
    const { productId, variantId = null, quantity } = data;

    // Verify product and variant
    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product || product.deletedAt || product.status !== 'ACTIVE') {
      throw ApiError.notFound('Product not found or inactive');
    }

    let selectedVariant = null;
    if (variantId) {
      selectedVariant = await prisma.productVariant.findUnique({ where: { id: variantId } });
      if (!selectedVariant || !selectedVariant.isActive || selectedVariant.productId !== productId) {
        throw ApiError.notFound('Product variant not found or inactive');
      }
    } else {
      // Find default variant if none specified
      selectedVariant = await prisma.productVariant.findFirst({ where: { productId, isDefault: true } });
      if (!selectedVariant) throw ApiError.notFound('No default variant found for product');
    }

    const stock = selectedVariant.stock;
    const resolvedVariantId = selectedVariant.id;

    // Fetch or create cart
    const cartDetails = await this.getOrCreateCart(userId, sessionId);

    // Look for existing item
    const existingItem = await this.repo.findCartItem(cartDetails.id, productId, resolvedVariantId);
    const prevQty = existingItem ? existingItem.quantity : 0;
    const newQty = prevQty + quantity;

    if (newQty > stock) {
      throw ApiError.badRequest(`Requested quantity exceeds available stock (${stock} items)`);
    }

    if (existingItem) {
      await this.repo.updateCartItem(existingItem.id, newQty);
    } else {
      await this.repo.addCartItem(cartDetails.id, productId, resolvedVariantId, quantity);
    }

    return this.getOrCreateCart(userId, sessionId);
  }

  async updateCartItem(userId: string | undefined, sessionId: string | undefined, itemId: string, quantity: number) {
    const cartDetails = await this.getOrCreateCart(userId, sessionId);
    const item = await prisma.cartItem.findUnique({
      where: { id: itemId, cartId: cartDetails.id },
      include: { variant: true },
    });

    if (!item) throw ApiError.notFound('Item not found in cart');

    const stock = item.variant ? item.variant.stock : 0;
    if (quantity > stock) {
      throw ApiError.badRequest(`Requested quantity exceeds available stock (${stock} items)`);
    }

    await this.repo.updateCartItem(itemId, quantity);
    return this.getOrCreateCart(userId, sessionId);
  }

  async removeCartItem(userId: string | undefined, sessionId: string | undefined, itemId: string) {
    const cartDetails = await this.getOrCreateCart(userId, sessionId);
    const item = await prisma.cartItem.findUnique({
      where: { id: itemId, cartId: cartDetails.id },
    });

    if (!item) throw ApiError.notFound('Item not found in cart');

    await this.repo.removeCartItem(itemId);
    return this.getOrCreateCart(userId, sessionId);
  }

  async clearCart(userId: string | undefined, sessionId: string | undefined) {
    const cartDetails = await this.getOrCreateCart(userId, sessionId);
    await this.repo.clearCart(cartDetails.id);
    return this.getOrCreateCart(userId, sessionId);
  }

  /** Merge guest session cart items into logged-in user cart */
  async mergeCart(userId: string, guestSessionId: string) {
    const guestCart = await this.repo.findBySessionId(guestSessionId);
    if (!guestCart || guestCart.items.length === 0) {
      return this.getOrCreateCart(userId);
    }

    const userCartDetails = await this.getOrCreateCart(userId);

    await prisma.$transaction(async (tx) => {
      for (const guestItem of guestCart.items) {
        // Find if user cart already has this product/variant
        const existingUserItem = await tx.cartItem.findUnique({
          where: {
            cartId_productId_variantId: {
              cartId: userCartDetails.id,
              productId: guestItem.productId,
              variantId: guestItem.variantId || '',
            },
          },
        });

        const stock = guestItem.variant ? guestItem.variant.stock : 0;

        if (existingUserItem) {
          const combinedQty = Math.min(stock, existingUserItem.quantity + guestItem.quantity);
          await tx.cartItem.update({
            where: { id: existingUserItem.id },
            data: { quantity: combinedQty },
          });
        } else {
          const validQty = Math.min(stock, guestItem.quantity);
          if (validQty > 0) {
            await tx.cartItem.create({
              data: {
                cartId: userCartDetails.id,
                productId: guestItem.productId,
                variantId: guestItem.variantId,
                quantity: validQty,
              },
            });
          }
        }
      }

      // Delete the guest cart after successful merge
      await tx.cartItem.deleteMany({ where: { cartId: guestCart.id } });
      await tx.cart.delete({ where: { id: guestCart.id } });
    });

    return this.getOrCreateCart(userId);
  }
}

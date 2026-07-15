// ═══════════════════════════════════════════════════════════════
// Cart Database Repository
// Direct access layer for persistent customer carts and items
// ═══════════════════════════════════════════════════════════════

import { prisma } from '../../config/database';
import { CartItem } from '@prisma/client';
import { PaymentProvider } from '@nexastore/shared';

const CART_INCLUDE = {
  items: {
    include: {
      product: {
        select: {
          id: true,
          name: true,
          slug: true,
          basePrice: true,
          salePrice: true,
          status: true,
          sku: true,
          images: { where: { isPrimary: true }, take: 1 },
        },
      },
      variant: {
        select: {
          id: true,
          name: true,
          sku: true,
          price: true,
          stock: true,
          isActive: true,
        },
      },
    },
  },
  coupon: true,
};

export class CartRepository {
  async findByUserId(userId: string) {
    return prisma.cart.findFirst({
      where: { userId },
      include: CART_INCLUDE,
    });
  }

  async findBySessionId(sessionId: string) {
    return prisma.cart.findUnique({
      where: { sessionId },
      include: CART_INCLUDE,
    });
  }

  async createCart(userId?: string, sessionId?: string) {
    return prisma.cart.create({
      data: { userId, sessionId },
      include: CART_INCLUDE,
    });
  }

  async addCartItem(cartId: string, productId: string, variantId: string | null, quantity: number): Promise<CartItem> {
    return prisma.cartItem.create({
      data: { cartId, productId, variantId, quantity },
    });
  }

  async findCartItem(cartId: string, productId: string, variantId: string | null): Promise<CartItem | null> {
    return prisma.cartItem.findUnique({
      where: { cartId_productId_variantId: { cartId, productId, variantId: variantId || '' } },
    });
  }

  async updateCartItem(id: string, quantity: number): Promise<CartItem> {
    return prisma.cartItem.update({
      where: { id },
      data: { quantity },
    });
  }

  async removeCartItem(id: string): Promise<void> {
    await prisma.cartItem.delete({ where: { id } });
  }

  async clearCart(cartId: string): Promise<void> {
    await prisma.cartItem.deleteMany({ where: { cartId } });
  }

  async applyCoupon(cartId: string, couponId: string | null) {
    return prisma.cart.update({
      where: { id: cartId },
      data: { couponId },
      include: CART_INCLUDE,
    });
  }

  async deleteCart(id: string): Promise<void> {
    await prisma.cart.delete({ where: { id } });
  }
}

// ═══════════════════════════════════════════════════════════════
// Coupon Service Layer
// Business logic for validating and applying coupon discounts to carts
// ═══════════════════════════════════════════════════════════════

import { CouponRepository } from './coupon.repository';
import { ApiError } from '../../utils/api-error';
import { prisma } from '../../config/database';
import { buildPaginationMeta } from '../../utils/pagination';

export class CouponService {
  private repo: CouponRepository;

  constructor(repo: CouponRepository) {
    this.repo = repo;
  }

  async getAll(query: any) {
    const { coupons, total } = await this.repo.findAll(query);
    return {
      coupons,
      meta: buildPaginationMeta(total, query.page || 1, query.limit || 20),
    };
  }

  async getById(id: string) {
    const coupon = await this.repo.findById(id);
    if (!coupon) throw ApiError.notFound('Coupon not found');
    return coupon;
  }

  async create(data: any) {
    const existing = await this.repo.findByCode(data.code);
    if (existing) throw ApiError.conflict('Coupon code already exists');

    if (data.startDate >= data.endDate) {
      throw ApiError.badRequest('Start date must be before end date');
    }

    return this.repo.create(data);
  }

  async update(id: string, data: any) {
    await this.getById(id);

    if (data.code) {
      const existing = await this.repo.findByCode(data.code);
      if (existing && existing.id !== id) throw ApiError.conflict('Coupon code already exists');
    }

    if (data.startDate && data.endDate && data.startDate >= data.endDate) {
      throw ApiError.badRequest('Start date must be before end date');
    }

    return this.repo.update(id, data);
  }

  async delete(id: string) {
    await this.getById(id);
    await this.repo.delete(id);
  }

  /**
   * Validates a coupon code against subtotal, items list, and user details
   */
  async validateCoupon(code: string, userId?: string, subtotal = 0, items: any[] = []) {
    const coupon = await this.repo.findByCode(code);
    if (!coupon || !coupon.isActive) {
      throw ApiError.notFound('Invalid or inactive coupon code');
    }

    const now = new Date();
    if (coupon.startDate > now || coupon.endDate < now) {
      throw ApiError.badRequest('Coupon has expired or is not yet active');
    }

    if (coupon.minOrderAmount && subtotal < Number(coupon.minOrderAmount)) {
      throw ApiError.badRequest(
        `Minimum order amount of $${coupon.minOrderAmount} required for this coupon`
      );
    }

    // Check usage limits
    if (coupon.usageLimit) {
      const totalUsed = await this.repo.getCouponOrderCount(coupon.id);
      if (totalUsed >= coupon.usageLimit) {
        throw ApiError.badRequest('Coupon usage limit has been reached');
      }
    }

    // Check per user limits
    if (userId && coupon.perUserLimit) {
      const userUsed = await this.repo.getUserCouponOrderCount(userId, coupon.id);
      if (userUsed >= coupon.perUserLimit) {
        throw ApiError.badRequest('You have already reached the usage limit for this coupon');
      }
    }

    // Verify applicability to products or categories
    let applicableSubtotal = subtotal;

    const hasProductScope = coupon.applicableProducts.length > 0;
    const hasCategoryScope = coupon.applicableCategories.length > 0;

    if (hasProductScope || hasCategoryScope) {
      let scopedSubtotal = 0;
      for (const item of items) {
        const matchesProduct = hasProductScope && coupon.applicableProducts.includes(item.productId);
        const matchesCategory = hasCategoryScope && coupon.applicableCategories.includes(item.categoryId);

        if (matchesProduct || matchesCategory) {
          scopedSubtotal += item.price * item.quantity;
        }
      }

      if (scopedSubtotal === 0) {
        throw ApiError.badRequest('Coupon is not applicable to any items in your cart');
      }

      applicableSubtotal = scopedSubtotal;
    }

    // Calculate discount amount
    let discountAmount = 0;
    if (coupon.type === 'PERCENTAGE') {
      discountAmount = applicableSubtotal * (Number(coupon.value) / 100);
      if (coupon.maxDiscountAmount) {
        discountAmount = Math.min(discountAmount, Number(coupon.maxDiscountAmount));
      }
    } else if (coupon.type === 'FIXED_AMOUNT') {
      discountAmount = Math.min(applicableSubtotal, Number(coupon.value));
    }

    return {
      couponId: coupon.id,
      code: coupon.code,
      type: coupon.type,
      discountAmount,
    };
  }

  async applyCouponToCart(userId: string | undefined, sessionId: string | undefined, code: string) {
    const { CartService } = require('../cart/cart.service');
    const { CartRepository } = require('../cart/cart.repository');
    const cartService = new CartService(new CartRepository());

    const cartDetails = await cartService.getOrCreateCart(userId, sessionId);
    if (cartDetails.items.length === 0) {
      throw ApiError.badRequest('Cannot apply coupon to an empty cart');
    }

    const validated = await this.validateCoupon(
      code,
      userId,
      cartDetails.subtotal,
      cartDetails.items
    );

    const { CartRepository: CartRepositoryClass } = require('../cart/cart.repository');
    const cartRepo = new CartRepositoryClass();
    await cartRepo.applyCoupon(cartDetails.id, validated.couponId);

    return cartService.getOrCreateCart(userId, sessionId);
  }

  async removeCouponFromCart(userId: string | undefined, sessionId: string | undefined) {
    const { CartService } = require('../cart/cart.service');
    const { CartRepository } = require('../cart/cart.repository');
    const cartService = new CartService(new CartRepository());

    const cartDetails = await cartService.getOrCreateCart(userId, sessionId);

    const { CartRepository: CartRepositoryClass } = require('../cart/cart.repository');
    const cartRepo = new CartRepositoryClass();
    await cartRepo.applyCoupon(cartDetails.id, null);

    return cartService.getOrCreateCart(userId, sessionId);
  }
}

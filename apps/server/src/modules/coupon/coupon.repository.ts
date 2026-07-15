// ═══════════════════════════════════════════════════════════════
// Coupon Database Repository
// Direct access layer for promotional coupons
// ═══════════════════════════════════════════════════════════════

import { prisma } from '../../config/database';
import { Coupon, Prisma } from '@prisma/client';

export class CouponRepository {
  async findByCode(code: string): Promise<Coupon | null> {
    return prisma.coupon.findUnique({
      where: { code },
    });
  }

  async findById(id: string): Promise<Coupon | null> {
    return prisma.coupon.findUnique({
      where: { id },
    });
  }

  async create(data: any): Promise<Coupon> {
    return prisma.coupon.create({ data });
  }

  async update(id: string, data: any): Promise<Coupon> {
    return prisma.coupon.update({
      where: { id },
      data,
    });
  }

  async delete(id: string): Promise<void> {
    await prisma.coupon.delete({ where: { id } });
  }

  async findAll(query: any): Promise<{ coupons: Coupon[]; total: number }> {
    const { page = 1, limit = 20, isActive } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.CouponWhereInput = {};
    if (isActive !== undefined) where.isActive = isActive;

    const [coupons, total] = await Promise.all([
      prisma.coupon.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.coupon.count({ where }),
    ]);

    return { coupons, total };
  }

  async getCouponOrderCount(couponId: string): Promise<number> {
    return prisma.order.count({
      where: { couponId },
    });
  }

  async getUserCouponOrderCount(userId: string, couponId: string): Promise<number> {
    return prisma.order.count({
      where: { userId, couponId },
    });
  }
}

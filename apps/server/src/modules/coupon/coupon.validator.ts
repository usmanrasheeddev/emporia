// ═══════════════════════════════════════════════════════════════
// Coupon Validator
// Zod schemas for coupon configurations and applications
// ═══════════════════════════════════════════════════════════════

import { z } from 'zod';
import { paginationSchema, couponCodeSchema } from '@nexastore/shared';

export const createCouponSchema = z.object({
  code: couponCodeSchema,
  description: z.string().max(500).optional(),
  type: z.enum(['PERCENTAGE', 'FIXED_AMOUNT', 'FREE_SHIPPING']),
  value: z.number().positive(),
  minOrderAmount: z.number().nonnegative().optional().nullable(),
  maxDiscountAmount: z.number().nonnegative().optional().nullable(),
  usageLimit: z.number().int().positive().optional().nullable(),
  perUserLimit: z.number().int().positive().optional().default(1),
  isActive: z.boolean().optional().default(true),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  applicableCategories: z.array(z.string().uuid()).optional().default([]),
  applicableProducts: z.array(z.string().uuid()).optional().default([]),
});

export const updateCouponSchema = createCouponSchema.partial();

export const applyCouponSchema = z.object({
  code: couponCodeSchema,
});

export const couponQuerySchema = paginationSchema.extend({
  isActive: z.coerce.boolean().optional(),
});

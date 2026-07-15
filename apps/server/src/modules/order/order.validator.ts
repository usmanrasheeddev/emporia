// ═══════════════════════════════════════════════════════════════
// Order Module Validators
// Zod schemas for order checkouts and state updates
// ═══════════════════════════════════════════════════════════════

import { z } from 'zod';
import { idSchema, paginationSchema } from '@nexastore/shared';

export const createOrderSchema = z.object({
  addressId: idSchema,
  paymentMethod: z.enum(['STRIPE', 'PAYPAL', 'COD', 'WALLET']),
  shippingMethodId: idSchema,
  notes: z.string().max(500).optional(),
  couponCode: z.string().optional().nullable(),
});

export const updateOrderStatusSchema = z.object({
  status: z.enum([
    'PENDING',
    'CONFIRMED',
    'PROCESSING',
    'PACKED',
    'SHIPPED',
    'DELIVERED',
    'CANCELLED',
    'RETURNED',
    'REFUNDED',
    'PARTIAL_REFUND',
  ]),
  note: z.string().max(500).optional(),
});

export const orderQuerySchema = paginationSchema.extend({
  status: z.enum([
    'PENDING',
    'CONFIRMED',
    'PROCESSING',
    'PACKED',
    'SHIPPED',
    'DELIVERED',
    'CANCELLED',
    'RETURNED',
    'REFUNDED',
    'PARTIAL_REFUND',
  ]).optional(),
});

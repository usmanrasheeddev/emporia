// ═══════════════════════════════════════════════════════════════
// Payment Validators
// Zod schemas for processing checkouts, wallet top-ups, and transactions
// ═══════════════════════════════════════════════════════════════

import { z } from 'zod';
import { idSchema } from '@nexastore/shared';

export const createStripeSessionSchema = z.object({
  orderId: idSchema,
});

export const createPayPalSessionSchema = z.object({
  orderId: idSchema,
});

export const verifyPayPalOrderSchema = z.object({
  orderId: idSchema,
  paypalOrderId: z.string().min(1),
});

export const walletPaymentSchema = z.object({
  orderId: idSchema,
});

export const walletTopUpSchema = z.object({
  amount: z.number().positive().min(5, 'Minimum top-up is $5'),
});

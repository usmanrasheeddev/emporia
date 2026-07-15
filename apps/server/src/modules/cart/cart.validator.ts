// ═══════════════════════════════════════════════════════════════
// Cart Validator
// Zod schemas for adding items, updating quantities, and clearing carts
// ═══════════════════════════════════════════════════════════════

import { z } from 'zod';
import { idSchema } from '@nexastore/shared';

export const addToCartSchema = z.object({
  productId: idSchema,
  variantId: idSchema.optional().nullable(),
  quantity: z.number().int().positive().default(1),
});

export const updateCartItemSchema = z.object({
  quantity: z.number().int().positive(),
});

export const mergeCartSchema = z.object({
  sessionId: z.string().min(1),
});

// ═══════════════════════════════════════════════════════════════
// Shipping & Tax Validator
// Zod schemas for shipping cost calculations and tax estimations
// ═══════════════════════════════════════════════════════════════

import { z } from 'zod';
import { idSchema } from '@nexastore/shared';

export const calculateShippingTaxSchema = z.object({
  addressId: idSchema.optional().nullable(),
  country: z.string().min(2).max(100).optional(),
  state: z.string().max(100).optional().nullable(),
  zipCode: z.string().max(20).optional().nullable(),
  subtotal: z.number().nonnegative(),
});

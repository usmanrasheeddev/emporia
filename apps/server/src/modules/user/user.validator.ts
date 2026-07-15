// ═══════════════════════════════════════════════════════════════
// User Input Validators
// Zod schemas for user profile changes, address edits, and listings
// ═══════════════════════════════════════════════════════════════

import { z } from 'zod';
import {
  nameSchema,
  phoneSchema,
  addressSchema,
  paginationSchema,
} from '@nexastore/shared';

export const updateProfileSchema = z.object({
  firstName: nameSchema.optional(),
  lastName: nameSchema.optional(),
  phone: phoneSchema.optional(),
});

export const createAddressSchema = addressSchema;

export const updateAddressSchema = addressSchema.partial();

export const adminUpdateUserSchema = z.object({
  firstName: nameSchema.optional(),
  lastName: nameSchema.optional(),
  phone: phoneSchema.optional(),
  role: z.enum(['CUSTOMER', 'ADMIN', 'SUPER_ADMIN', 'MODERATOR', 'DELIVERY_STAFF', 'WAREHOUSE_MANAGER']).optional(),
  isVerified: z.boolean().optional(),
  isBanned: z.boolean().optional(),
});

export const userListQuerySchema = paginationSchema.extend({
  role: z.enum(['CUSTOMER', 'ADMIN', 'SUPER_ADMIN', 'MODERATOR', 'DELIVERY_STAFF', 'WAREHOUSE_MANAGER']).optional(),
  isBanned: z.coerce.boolean().optional(),
});

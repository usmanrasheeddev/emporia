// ═══════════════════════════════════════════════════════════════
// Inventory & Warehouse Validators
// Zod schemas for validating stock levels, warehouses, and transfers
// ═══════════════════════════════════════════════════════════════

import { z } from 'zod';
import { nameSchema, idSchema, paginationSchema } from '@nexastore/shared';

export const createWarehouseSchema = z.object({
  name: nameSchema,
  code: z.string().min(2).max(20).toUpperCase(),
  address: z.string().min(5).max(200),
  city: z.string().min(2).max(100),
  state: z.string().max(100).optional(),
  country: z.string().min(2).max(100),
  zipCode: z.string().max(20).optional(),
  phone: z.string().max(20).optional(),
  email: z.string().email().optional(),
  isActive: z.boolean().optional().default(true),
  managerId: idSchema.optional().nullable(),
  latitude: z.number().optional().nullable(),
  longitude: z.number().optional().nullable(),
});
export const updateWarehouseSchema = createWarehouseSchema.partial();

export const updateStockSchema = z.object({
  quantity: z.number().int().optional(),
  reservedQuantity: z.number().int().min(0).optional(),
  reorderPoint: z.number().int().min(0).optional(),
  reorderQuantity: z.number().int().positive().optional(),
});

export const createStockTransferSchema = z.object({
  fromWarehouseId: idSchema,
  toWarehouseId: idSchema,
  variantId: idSchema,
  quantity: z.number().int().positive(),
  notes: z.string().max(500).optional(),
});

export const updateStockTransferSchema = z.object({
  status: z.enum(['PENDING', 'IN_TRANSIT', 'COMPLETED', 'CANCELLED']),
});

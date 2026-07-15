import { z } from 'zod';
import { nameSchema, priceSchema, skuSchema, paginationSchema, idSchema, descriptionSchema } from '@nexastore/shared';

export const createProductSchema = z.object({
  name: nameSchema,
  description: z.string().min(10).max(10000),
  shortDescription: z.string().max(500).optional(),
  sku: skuSchema,
  barcode: z.string().max(50).optional(),
  basePrice: priceSchema,
  salePrice: priceSchema.optional().nullable(),
  costPrice: priceSchema.optional().nullable(),
  type: z.enum(['PHYSICAL', 'DIGITAL', 'SUBSCRIPTION']).optional().default('PHYSICAL'),
  status: z.enum(['DRAFT', 'ACTIVE', 'ARCHIVED']).optional().default('DRAFT'),
  categoryId: idSchema,
  brandId: idSchema.optional().nullable(),
  tags: z.array(z.string()).optional().default([]),
  isFeatured: z.boolean().optional().default(false),
  isNewArrival: z.boolean().optional().default(false),
  weight: z.number().positive().optional().nullable(),
  dimensions: z.object({ length: z.number(), width: z.number(), height: z.number() }).optional().nullable(),
  metaTitle: z.string().max(200).optional(),
  metaDescription: z.string().max(500).optional(),
});
export const updateProductSchema = createProductSchema.partial();

export const createVariantSchema = z.object({
  sku: skuSchema,
  name: nameSchema,
  color: z.string().max(50).optional(),
  colorHex: z.string().regex(/^#([A-Fa-f0-9]{6})$/).optional(),
  size: z.string().max(50).optional(),
  storage: z.string().max(50).optional(),
  material: z.string().max(50).optional(),
  style: z.string().max(50).optional(),
  price: priceSchema,
  compareAtPrice: priceSchema.optional().nullable(),
  costPrice: priceSchema.optional().nullable(),
  stock: z.number().int().min(0).default(0),
  lowStockThreshold: z.number().int().min(0).default(5),
  isDefault: z.boolean().optional().default(false),
  isActive: z.boolean().optional().default(true),
  sortOrder: z.number().int().min(0).optional().default(0),
});
export const updateVariantSchema = createVariantSchema.partial();

export const productQuerySchema = paginationSchema.extend({
  categoryId: idSchema.optional(),
  brandId: idSchema.optional(),
  minPrice: z.coerce.number().min(0).optional(),
  maxPrice: z.coerce.number().min(0).optional(),
  minRating: z.coerce.number().min(0).max(5).optional(),
  type: z.enum(['PHYSICAL', 'DIGITAL', 'SUBSCRIPTION']).optional(),
  status: z.enum(['DRAFT', 'ACTIVE', 'ARCHIVED', 'OUT_OF_STOCK']).optional(),
  isFeatured: z.coerce.boolean().optional(),
  isNewArrival: z.coerce.boolean().optional(),
  inStock: z.coerce.boolean().optional(),
  tags: z.string().optional(),
});

export const addSpecificationSchema = z.object({
  group: z.string().max(100).optional(),
  key: z.string().min(1).max(100),
  value: z.string().min(1).max(500),
  sortOrder: z.number().int().min(0).optional().default(0),
});

// ═══════════════════════════════════════════════════════════════
// Category Module — Validator
// ═══════════════════════════════════════════════════════════════

import { z } from 'zod';
import { nameSchema, slugSchema, paginationSchema, idSchema } from '@nexastore/shared';

export const createCategorySchema = z.object({
  name: nameSchema,
  slug: slugSchema.optional(),
  description: z.string().max(1000).optional(),
  image: z.string().url().optional(),
  icon: z.string().max(50).optional(),
  parentId: idSchema.optional().nullable(),
  sortOrder: z.number().int().min(0).optional(),
  isActive: z.boolean().optional().default(true),
  isFeatured: z.boolean().optional().default(false),
  metaTitle: z.string().max(200).optional(),
  metaDescription: z.string().max(500).optional(),
});

export const updateCategorySchema = createCategorySchema.partial();

export const categoryQuerySchema = paginationSchema.extend({
  parentId: idSchema.optional().nullable(),
  isActive: z.coerce.boolean().optional(),
  isFeatured: z.coerce.boolean().optional(),
  level: z.coerce.number().int().min(0).optional(),
});

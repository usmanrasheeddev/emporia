import { z } from 'zod';
import { nameSchema, slugSchema, paginationSchema } from '@nexastore/shared';

export const createBrandSchema = z.object({
  name: nameSchema,
  slug: slugSchema.optional(),
  description: z.string().max(1000).optional(),
  logo: z.string().url().optional(),
  website: z.string().url().optional(),
  isFeatured: z.boolean().optional().default(false),
  isActive: z.boolean().optional().default(true),
});
export const updateBrandSchema = createBrandSchema.partial();
export const brandQuerySchema = paginationSchema.extend({
  isActive: z.coerce.boolean().optional(),
  isFeatured: z.coerce.boolean().optional(),
});

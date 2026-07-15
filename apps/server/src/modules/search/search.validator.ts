// ═══════════════════════════════════════════════════════════════
// Search Validator
// Zod schemas for parsing full-text search and autocomplete requests
// ═══════════════════════════════════════════════════════════════

import { z } from 'zod';
import { paginationSchema } from '@nexastore/shared';

export const searchParamsSchema = paginationSchema.extend({
  q: z.string().min(1, 'Search query is required').max(100),
  category: z.string().optional(),
  brand: z.string().optional(),
  minPrice: z.coerce.number().min(0).optional(),
  maxPrice: z.coerce.number().min(0).optional(),
  rating: z.coerce.number().min(0).max(5).optional(),
  inStock: z.coerce.boolean().optional(),
  sortBy: z.enum(['relevance', 'price_asc', 'price_desc', 'rating', 'newest', 'bestselling']).optional().default('relevance'),
});

export const autocompleteSchema = z.object({
  q: z.string().min(1, 'Query parameter is required').max(50),
});

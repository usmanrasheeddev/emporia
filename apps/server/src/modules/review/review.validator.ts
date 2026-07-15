// ═══════════════════════════════════════════════════════════════
// Review & Q&A Validators
// Zod schemas for reviews, product ratings, and customer questions
// ═══════════════════════════════════════════════════════════════

import { z } from 'zod';
import { paginationSchema, idSchema } from '@nexastore/shared';

export const createReviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  title: z.string().max(100).optional(),
  comment: z.string().min(5).max(1000).optional(),
});

export const createQuestionSchema = z.object({
  question: z.string().min(10).max(500),
});

export const answerQuestionSchema = z.object({
  answer: z.string().min(5).max(1000),
});

export const queryReviewSchema = paginationSchema.extend({
  isApproved: z.coerce.boolean().optional(),
});

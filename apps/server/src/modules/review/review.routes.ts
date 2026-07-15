// ═══════════════════════════════════════════════════════════════
// Review & Q&A Routes
// Routes for managing customer reviews, star ratings, and Q&A boards
// ═══════════════════════════════════════════════════════════════

import { Router } from 'express';
import { ReviewController } from './review.controller';
import { validate } from '../../middleware/validate.middleware';
import { authenticate } from '../../middleware/auth.middleware';
import { authorize } from '../../middleware/role.middleware';
import { UserRole } from '@nexastore/shared';
import {
  createReviewSchema,
  createQuestionSchema,
  answerQuestionSchema,
  queryReviewSchema,
} from './review.validator';

const router = Router();

// ─── Public Catalog Q&A and Reviews ──────────────────────────

router.get('/products/:productId/reviews', ReviewController.getReviewsByProduct);
router.get('/products/:productId/questions', ReviewController.getQuestionsByProduct);

// ─── Authenticated Customer Actions ─────────────────────────

router.post('/products/:productId/reviews', authenticate, validate(createReviewSchema), ReviewController.createReview);
router.post('/products/:productId/questions', authenticate, validate(createQuestionSchema), ReviewController.askQuestion);

router.delete('/reviews/:id', authenticate, ReviewController.deleteReview);

// ─── Admin Moderation Actions ────────────────────────────────

router.get('/reviews', authenticate, authorize(UserRole.ADMIN, UserRole.SUPER_ADMIN), validate(queryReviewSchema, 'query'), ReviewController.getAllReviews);
router.patch('/reviews/:id/approve', authenticate, authorize(UserRole.ADMIN, UserRole.SUPER_ADMIN), ReviewController.approveReview);

router.get('/questions', authenticate, authorize(UserRole.ADMIN, UserRole.SUPER_ADMIN), ReviewController.getAllQuestions);
router.patch('/questions/:id/answer', authenticate, authorize(UserRole.ADMIN, UserRole.SUPER_ADMIN), validate(answerQuestionSchema), ReviewController.answerQuestion);

export default router;
//

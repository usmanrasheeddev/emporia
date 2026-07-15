// ═══════════════════════════════════════════════════════════════
// Review & Q&A Controller Layer
// Maps HTTP endpoints to Review and QA services
// ═══════════════════════════════════════════════════════════════

import { Request, Response } from 'express';
import { ReviewService } from './review.service';
import { ReviewRepository } from './review.repository';
import { ApiResponse } from '../../utils/api-response';
import { asyncHandler } from '../../utils/async-handler';
import { RequestWithUser } from '../../types';
import { UserRole } from '@nexastore/shared';

const service = new ReviewService(new ReviewRepository());

export class ReviewController {
  // ─── Reviews ─────────────────────────────────────────────────

  static createReview = asyncHandler(async (req: RequestWithUser, res: Response) => {
    const productId = req.params.productId as string;
    const review = await service.createReview(req.user!.id, productId, req.body);
    res.status(201).json(ApiResponse.success('Review created successfully', review, 201));
  });

  static getReviewsByProduct = asyncHandler(async (req: Request, res: Response) => {
    const productId = req.params.productId as string;
    const { reviews, meta } = await service.getReviewsByProduct(productId, req.query);
    res.json(ApiResponse.success('Product reviews retrieved successfully', reviews, 200, meta));
  });

  static deleteReview = asyncHandler(async (req: RequestWithUser, res: Response) => {
    const id = req.params.id as string;
    const isAdmin = req.user!.role === UserRole.ADMIN || req.user!.role === UserRole.SUPER_ADMIN;

    await service.deleteReview(id, req.user!.id, isAdmin);
    res.json(ApiResponse.success('Review deleted successfully'));
  });

  static getAllReviews = asyncHandler(async (req: Request, res: Response) => {
    const { reviews, meta } = await service.getAllReviews(req.query);
    res.json(ApiResponse.success('Reviews list retrieved successfully', reviews, 200, meta));
  });

  static approveReview = asyncHandler(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const review = await service.approveReview(id);
    res.json(ApiResponse.success('Review approved successfully', review));
  });

  // ─── Q&As ────────────────────────────────────────────────────

  static askQuestion = asyncHandler(async (req: RequestWithUser, res: Response) => {
    const productId = req.params.productId as string;
    const { question } = req.body;
    const qa = await service.askQuestion(req.user!.id, productId, question);
    res.status(201).json(ApiResponse.success('Question submitted successfully', qa, 201));
  });

  static answerQuestion = asyncHandler(async (req: RequestWithUser, res: Response) => {
    const id = req.params.id as string;
    const { answer } = req.body;
    const qa = await service.answerQuestion(id, answer, req.user!.id);
    res.json(ApiResponse.success('Question answered and published successfully', qa));
  });

  static getQuestionsByProduct = asyncHandler(async (req: Request, res: Response) => {
    const productId = req.params.productId as string;
    const { questions, meta } = await service.getQuestionsByProduct(productId, req.query);
    res.json(ApiResponse.success('Product Q&As retrieved successfully', questions, 200, meta));
  });

  static getAllQuestions = asyncHandler(async (req: Request, res: Response) => {
    const { questions, meta } = await service.getAllQuestions(req.query);
    res.json(ApiResponse.success('Questions list retrieved successfully', questions, 200, meta));
  });
}

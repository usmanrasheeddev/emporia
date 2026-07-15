// ═══════════════════════════════════════════════════════════════
// Review & Q&A Service Layer
// Business logic for user reviews, rating calculations, and product Q&As
// ═══════════════════════════════════════════════════════════════

import { ReviewRepository } from './review.repository';
import { ApiError } from '../../utils/api-error';
import { prisma } from '../../config/database';
import { buildPaginationMeta } from '../../utils/pagination';

export class ReviewService {
  private repo: ReviewRepository;

  constructor(repo: ReviewRepository) {
    this.repo = repo;
  }

  // ─── Reviews ─────────────────────────────────────────────────

  async createReview(
    userId: string,
    productId: string,
    data: { rating: number; title?: string; comment?: string }
  ) {
    // 1. Verify product exists
    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) throw ApiError.notFound('Product not found');

    // 2. Check if user already reviewed this product
    const existing = await this.repo.findReview(userId, productId);
    if (existing) throw ApiError.badRequest('You have already submitted a review for this product');

    // 3. Verify purchase (user ordered the product and order status is DELIVERED)
    const verifiedOrder = await prisma.order.findFirst({
      where: {
        userId,
        status: 'DELIVERED',
        items: { some: { productId } },
      },
    });

    const isVerifiedPurchase = !!verifiedOrder;

    // 4. Create review inside a transaction
    const review = await prisma.$transaction(async (tx) => {
      const newReview = await tx.review.create({
        data: {
          userId,
          productId,
          rating: data.rating,
          title: data.title,
          comment: data.comment,
          isVerifiedPurchase,
          isApproved: true, // Auto-approve reviews for immediate display
        },
      });

      return newReview;
    });

    // 5. Update product rating stats (async)
    this.repo.updateRatingStats(productId).catch(console.error);

    return review;
  }

  async getReviewsByProduct(productId: string, query: any) {
    const { reviews, total } = await this.repo.findReviewsByProduct(productId, query);
    return {
      reviews,
      meta: buildPaginationMeta(total, query.page || 1, query.limit || 10),
    };
  }

  async deleteReview(id: string, userId: string, isAdmin = false) {
    const review = await this.repo.findReviewById(id);
    if (!review) throw ApiError.notFound('Review not found');

    if (review.userId !== userId && !isAdmin) {
      throw ApiError.forbidden('You are not authorized to delete this review');
    }

    await this.repo.deleteReview(id);

    // Update product rating stats (async)
    this.repo.updateRatingStats(review.productId).catch(console.error);
  }

  async getAllReviews(query: any) {
    const { reviews, total } = await this.repo.findAllReviews(query);
    return {
      reviews,
      meta: buildPaginationMeta(total, query.page || 1, query.limit || 20),
    };
  }

  async approveReview(id: string) {
    const review = await this.repo.findReviewById(id);
    if (!review) throw ApiError.notFound('Review not found');

    const updated = await this.repo.approveReview(id);
    await this.repo.updateRatingStats(review.productId);
    return updated;
  }

  // ─── Questions & Answers ─────────────────────────────────────

  async askQuestion(userId: string, productId: string, question: string) {
    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) throw ApiError.notFound('Product not found');

    return this.repo.createQuestion({
      productId,
      question,
      askedById: userId,
    });
  }

  async answerQuestion(id: string, answer: string, userId: string) {
    const question = await this.repo.findQuestionById(id);
    if (!question) throw ApiError.notFound('Question not found');

    return this.repo.answerQuestion(id, answer, userId);
  }

  async getQuestionsByProduct(productId: string, query: any) {
    const { questions, total } = await this.repo.findQuestionsByProduct(productId, query);
    return {
      questions,
      meta: buildPaginationMeta(total, query.page || 1, query.limit || 10),
    };
  }

  async getAllQuestions(query: any) {
    const { questions, total } = await this.repo.findAllQuestions(query);
    return {
      questions,
      meta: buildPaginationMeta(total, query.page || 1, query.limit || 20),
    };
  }
}

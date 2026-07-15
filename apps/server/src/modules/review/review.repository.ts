// ═══════════════════════════════════════════════════════════════
// Review & Q&A Database Repository
// Direct access layer for product reviews, ratings, and Q&A logs
// ═══════════════════════════════════════════════════════════════

import { prisma } from '../../config/database';
import { Review, QuestionAnswer, Prisma } from '@prisma/client';

export class ReviewRepository {
  // ─── Reviews ─────────────────────────────────────────────────

  async findReview(userId: string, productId: string): Promise<Review | null> {
    return prisma.review.findUnique({
      where: { userId_productId: { userId, productId } },
    });
  }

  async findReviewById(id: string): Promise<Review | null> {
    return prisma.review.findUnique({ where: { id } });
  }

  async createReview(data: {
    userId: string;
    productId: string;
    rating: number;
    title?: string;
    comment?: string;
    isVerifiedPurchase?: boolean;
    isApproved?: boolean;
  }): Promise<Review> {
    return prisma.review.create({ data });
  }

  async deleteReview(id: string): Promise<void> {
    await prisma.review.delete({ where: { id } });
  }

  async findReviewsByProduct(productId: string, query: any): Promise<{ reviews: Review[]; total: number }> {
    const { page = 1, limit = 10 } = query;
    const skip = (page - 1) * limit;

    const where = { productId, isApproved: true };

    const [reviews, total] = await Promise.all([
      prisma.review.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          user: { select: { id: true, firstName: true, lastName: true, avatar: true } },
          images: true,
        },
      }),
      prisma.review.count({ where }),
    ]);

    return { reviews, total };
  }

  async findAllReviews(query: any): Promise<{ reviews: Review[]; total: number }> {
    const { page = 1, limit = 20, isApproved } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.ReviewWhereInput = {};
    if (isApproved !== undefined) where.isApproved = isApproved;

    const [reviews, total] = await Promise.all([
      prisma.review.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          user: { select: { id: true, firstName: true, lastName: true, email: true } },
          product: { select: { id: true, name: true, slug: true } },
        },
      }),
      prisma.review.count({ where }),
    ]);

    return { reviews, total };
  }

  async approveReview(id: string): Promise<Review> {
    return prisma.review.update({
      where: { id },
      data: { isApproved: true },
    });
  }

  async updateRatingStats(productId: string) {
    const stats = await prisma.review.aggregate({
      where: { productId, isApproved: true },
      _avg: { rating: true },
      _count: { _all: true },
    });
    await prisma.product.update({
      where: { id: productId },
      data: {
        avgRating: stats._avg.rating || 0,
        totalReviews: stats._count._all,
      },
    });
  }

  // ─── Questions & Answers ─────────────────────────────────────

  async createQuestion(data: {
    productId: string;
    question: string;
    askedById: string;
  }): Promise<QuestionAnswer> {
    return prisma.questionAnswer.create({ data });
  }

  async findQuestionById(id: string): Promise<QuestionAnswer | null> {
    return prisma.questionAnswer.findUnique({ where: { id } });
  }

  async answerQuestion(
    id: string,
    answer: string,
    answeredById: string
  ): Promise<QuestionAnswer> {
    return prisma.questionAnswer.update({
      where: { id },
      data: {
        answer,
        answeredById,
        isPublished: true,
      },
    });
  }

  async findQuestionsByProduct(
    productId: string,
    query: any
  ): Promise<{ questions: QuestionAnswer[]; total: number }> {
    const { page = 1, limit = 10 } = query;
    const skip = (page - 1) * limit;

    const where = { productId, isPublished: true };

    const [questions, total] = await Promise.all([
      prisma.questionAnswer.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          askedBy: { select: { id: true, firstName: true, lastName: true } },
          answeredBy: { select: { id: true, firstName: true, lastName: true } },
        },
      }),
      prisma.questionAnswer.count({ where }),
    ]);

    return { questions, total };
  }

  async findAllQuestions(query: any): Promise<{ questions: QuestionAnswer[]; total: number }> {
    const { page = 1, limit = 20, isPublished } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.QuestionAnswerWhereInput = {};
    if (isPublished !== undefined) where.isPublished = isPublished;

    const [questions, total] = await Promise.all([
      prisma.questionAnswer.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          askedBy: { select: { id: true, firstName: true, lastName: true } },
          product: { select: { id: true, name: true, slug: true } },
        },
      }),
      prisma.questionAnswer.count({ where }),
    ]);

    return { questions, total };
  }
}

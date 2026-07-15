// ═══════════════════════════════════════════════════════════════
// Pagination Utilities
// Parse queries and build metadata for pagination results
// ═══════════════════════════════════════════════════════════════

import { PaginationMeta, PaginationQuery } from '@nexastore/shared';

export interface PrismaPaginationOptions {
  skip: number;
  take: number;
}

/**
 * Parses query parameters and returns skip and take options for Prisma
 */
export function parsePagination(query: PaginationQuery): PrismaPaginationOptions & { page: number; limit: number } {
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.max(1, Math.min(100, Number(query.limit) || 20));
  const skip = (page - 1) * limit;

  return {
    skip,
    take: limit,
    page,
    limit,
  };
}

/**
 * Builds the standard pagination metadata object
 */
export function buildPaginationMeta(total: number, page: number, limit: number): PaginationMeta {
  const totalPages = Math.ceil(total / limit);

  return {
    page,
    limit,
    total,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1,
  };
}

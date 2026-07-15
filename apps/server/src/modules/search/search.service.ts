// ═══════════════════════════════════════════════════════════════
// Search Service Layer
// Executes database search queries and builds matching facets dynamically
// ═══════════════════════════════════════════════════════════════

import { prisma } from '../../config/database';
import { buildPaginationMeta } from '../../utils/pagination';
import { Prisma } from '@prisma/client';

export class SearchService {
  async searchProducts(query: any) {
    const { q, category, brand, minPrice, maxPrice, rating, inStock, sortBy, page = 1, limit = 20 } = query;
    const skip = (page - 1) * limit;

    // ─── 1. Build Base Filters ──────────────────────────────────
    const where: Prisma.ProductWhereInput = {
      deletedAt: null,
      status: 'ACTIVE',
    };

    // Full-Text Search on name, description, tags, and category
    if (q) {
      where.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
        { tags: { has: q } },
        { category: { name: { contains: q, mode: 'insensitive' } } },
        { brand: { name: { contains: q, mode: 'insensitive' } } },
      ];
    }

    // Category Filter (supports child categories recursively)
    if (category) {
      const cat = await prisma.category.findUnique({ where: { slug: category } });
      if (cat) {
        const subCats = await prisma.category.findMany({ where: { parentId: cat.id } });
        const catIds = [cat.id, ...subCats.map((c) => c.id)];
        where.categoryId = { in: catIds };
      }
    }

    // Brand Filter
    if (brand) {
      const b = await prisma.brand.findUnique({ where: { slug: brand } });
      if (b) {
        where.brandId = b.id;
      }
    }

    // Price Filter
    if (minPrice || maxPrice) {
      where.basePrice = {
        ...(minPrice ? { gte: minPrice } : {}),
        ...(maxPrice ? { lte: maxPrice } : {}),
      };
    }

    // Rating Filter
    if (rating) {
      where.avgRating = { gte: rating };
    }

    // In Stock Filter
    if (inStock) {
      where.variants = {
        some: { stock: { gt: 0 }, isActive: true },
      };
    }

    // ─── 2. Build Sorting Order ──────────────────────────────────
    let orderBy: Prisma.ProductOrderByWithRelationInput = { createdAt: 'desc' };

    if (sortBy === 'price_asc') {
      orderBy = { basePrice: 'asc' };
    } else if (sortBy === 'price_desc') {
      orderBy = { basePrice: 'desc' };
    } else if (sortBy === 'rating') {
      orderBy = { avgRating: 'desc' };
    } else if (sortBy === 'bestselling') {
      orderBy = { totalSold: 'desc' };
    } else if (sortBy === 'newest') {
      orderBy = { createdAt: 'desc' };
    }

    // ─── 3. Query Execution & Facet Building ─────────────────────
    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        include: {
          category: { select: { name: true, slug: true } },
          brand: { select: { name: true, slug: true } },
          images: { where: { isPrimary: true }, take: 1 },
          variants: { where: { isActive: true }, orderBy: { sortOrder: 'asc' }, take: 1 },
        },
      }),
      prisma.product.count({ where }),
    ]);

    // Build facets (aggregations of categories and brands matching the search query)
    const facetWhere = { ...where };
    delete facetWhere.categoryId;
    delete facetWhere.brandId;

    const [categoryCounts, brandCounts] = await Promise.all([
      prisma.product.groupBy({
        by: ['categoryId'],
        where: facetWhere,
        _count: { _all: true },
      }),
      prisma.product.groupBy({
        by: ['brandId'],
        where: facetWhere,
        _count: { _all: true },
      }),
    ]);

    // Map Category and Brand info to aggregates
    const matchedCategories = await prisma.category.findMany({
      where: { id: { in: categoryCounts.map((c) => c.categoryId) } },
      select: { id: true, name: true, slug: true },
    });

    const categoriesFacet = categoryCounts.map((c) => {
      const cat = matchedCategories.find((cat) => cat.id === c.categoryId);
      return {
        id: c.categoryId,
        name: cat?.name || 'Unknown',
        slug: cat?.slug || '',
        count: c._count._all,
      };
    });

    const matchedBrands = await prisma.brand.findMany({
      where: { id: { in: brandCounts.filter((b) => b.brandId !== null).map((b) => b.brandId as string) } },
      select: { id: true, name: true, slug: true },
    });

    const brandsFacet = brandCounts
      .filter((b) => b.brandId !== null)
      .map((b) => {
        const br = matchedBrands.find((brand) => brand.id === b.brandId);
        return {
          id: b.brandId as string,
          name: br?.name || 'Unknown',
          slug: br?.slug || '',
          count: b._count._all,
        };
      });

    return {
      products,
      facets: {
        categories: categoriesFacet,
        brands: brandsFacet,
      },
      meta: buildPaginationMeta(total, page, limit),
    };
  }

  async autocomplete(q: string): Promise<string[]> {
    const products = await prisma.product.findMany({
      where: {
        deletedAt: null,
        status: 'ACTIVE',
        name: { contains: q, mode: 'insensitive' },
      },
      select: { name: true },
      take: 10,
    });

    return products.map((p) => p.name);
  }
}

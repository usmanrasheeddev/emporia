import { prisma } from '../../config/database';
import { Product, ProductVariant, Prisma } from '@prisma/client';

const PRODUCT_INCLUDE = {
  category: { select: { id: true, name: true, slug: true } },
  brand: { select: { id: true, name: true, slug: true } },
  variants: { where: { isActive: true }, orderBy: { sortOrder: 'asc' as const } },
  images: { orderBy: { sortOrder: 'asc' as const } },
  specifications: { orderBy: { sortOrder: 'asc' as const } },
};

export class ProductRepository {
  async findAll(query: any): Promise<{ products: Product[]; total: number }> {
    const { page = 1, limit = 20, sortBy = 'createdAt', sortOrder = 'desc', search, categoryId, brandId, minPrice, maxPrice, minRating, type, status, isFeatured, isNewArrival, inStock, tags } = query;
    const skip = (page - 1) * limit;
    const where: Prisma.ProductWhereInput = { deletedAt: null };

    if (categoryId) where.categoryId = categoryId;
    if (brandId) where.brandId = brandId;
    if (type) where.type = type;
    if (status) where.status = status; else where.status = 'ACTIVE';
    if (isFeatured !== undefined) where.isFeatured = isFeatured;
    if (isNewArrival !== undefined) where.isNewArrival = isNewArrival;
    if (minPrice || maxPrice) where.basePrice = { ...(minPrice ? { gte: minPrice } : {}), ...(maxPrice ? { lte: maxPrice } : {}) };
    if (minRating) where.avgRating = { gte: minRating };
    if (tags) where.tags = { hasSome: tags.split(',').map((t: string) => t.trim()) };
    if (search) where.OR = [{ name: { contains: search, mode: 'insensitive' } }, { description: { contains: search, mode: 'insensitive' } }, { sku: { contains: search, mode: 'insensitive' } }];

    if (inStock) {
      where.variants = { some: { stock: { gt: 0 }, isActive: true } };
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({ where, orderBy: { [sortBy]: sortOrder }, skip, take: limit, include: { category: { select: { id: true, name: true, slug: true } }, brand: { select: { id: true, name: true, slug: true } }, images: { where: { isPrimary: true }, take: 1 }, variants: { where: { isActive: true, isDefault: true }, take: 1 } } }),
      prisma.product.count({ where }),
    ]);
    return { products, total };
  }

  async findById(id: string): Promise<Product | null> {
    return prisma.product.findFirst({ where: { id, deletedAt: null }, include: PRODUCT_INCLUDE });
  }

  async findBySlug(slug: string): Promise<Product | null> {
    return prisma.product.findFirst({ where: { slug, deletedAt: null }, include: { ...PRODUCT_INCLUDE, videos: true, reviews: { take: 5, orderBy: { createdAt: 'desc' }, include: { user: { select: { id: true, firstName: true, lastName: true, avatar: true } } } } } });
  }

  async slugExists(slug: string): Promise<boolean> { return !!(await prisma.product.findFirst({ where: { slug } })); }
  async skuExists(sku: string): Promise<boolean> { return !!(await prisma.product.findFirst({ where: { sku } })); }
  async variantSkuExists(sku: string): Promise<boolean> { return !!(await prisma.productVariant.findFirst({ where: { sku } })); }

  async create(data: any): Promise<Product> { return prisma.product.create({ data, include: PRODUCT_INCLUDE }); }
  async update(id: string, data: any): Promise<Product> { return prisma.product.update({ where: { id }, data, include: PRODUCT_INCLUDE }); }
  async softDelete(id: string): Promise<void> { await prisma.product.update({ where: { id }, data: { deletedAt: new Date(), status: 'ARCHIVED' } }); }

  async incrementViewCount(id: string): Promise<void> { await prisma.product.update({ where: { id }, data: { viewCount: { increment: 1 } } }); }

  // Variants
  async createVariant(data: any): Promise<ProductVariant> { return prisma.productVariant.create({ data }); }
  async updateVariant(id: string, data: any): Promise<ProductVariant> { return prisma.productVariant.update({ where: { id }, data }); }
  async deleteVariant(id: string): Promise<void> { await prisma.productVariant.delete({ where: { id } }); }
  async getVariants(productId: string): Promise<ProductVariant[]> { return prisma.productVariant.findMany({ where: { productId }, orderBy: { sortOrder: 'asc' } }); }

  // Images
  async addImage(data: any) { return prisma.productImage.create({ data }); }
  async deleteImage(id: string) { await prisma.productImage.delete({ where: { id } }); }
  async reorderImages(productId: string, imageIds: string[]) {
    for (let i = 0; i < imageIds.length; i++) {
      await prisma.productImage.update({ where: { id: imageIds[i] }, data: { sortOrder: i } });
    }
  }

  // Specifications
  async addSpec(data: any) { return prisma.productSpecification.create({ data }); }
  async deleteSpec(id: string) { await prisma.productSpecification.delete({ where: { id } }); }
  async getSpecs(productId: string) { return prisma.productSpecification.findMany({ where: { productId }, orderBy: { sortOrder: 'asc' } }); }

  // Rating update
  async updateRatingStats(productId: string) {
    const stats = await prisma.review.aggregate({ where: { productId, isApproved: true }, _avg: { rating: true }, _count: { _all: true } });
    await prisma.product.update({ where: { id: productId }, data: { avgRating: stats._avg.rating || 0, totalReviews: stats._count._all } });
  }

  // Related products
  async getRelated(productId: string) {
    return prisma.relatedProduct.findMany({ where: { productId }, include: { relatedProduct: { include: { images: { where: { isPrimary: true }, take: 1 } } } }, orderBy: { sortOrder: 'asc' } });
  }
}

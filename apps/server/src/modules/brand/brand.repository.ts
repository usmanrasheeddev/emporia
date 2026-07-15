import { prisma } from '../../config/database';
import { Brand, Prisma } from '@prisma/client';

export class BrandRepository {
  async findAll(query: any): Promise<{ brands: Brand[]; total: number }> {
    const { page = 1, limit = 50, sortBy = 'name', sortOrder = 'asc', search, isActive, isFeatured } = query;
    const skip = (page - 1) * limit;
    const where: Prisma.BrandWhereInput = {};
    if (isActive !== undefined) where.isActive = isActive;
    if (isFeatured !== undefined) where.isFeatured = isFeatured;
    if (search) where.name = { contains: search, mode: 'insensitive' };
    const [brands, total] = await Promise.all([
      prisma.brand.findMany({ where, orderBy: { [sortBy]: sortOrder }, skip, take: limit }),
      prisma.brand.count({ where }),
    ]);
    return { brands, total };
  }

  async findById(id: string): Promise<Brand | null> { return prisma.brand.findUnique({ where: { id } }); }
  async findBySlug(slug: string): Promise<Brand | null> { return prisma.brand.findUnique({ where: { slug } }); }
  async slugExists(slug: string): Promise<boolean> { return !!(await prisma.brand.findUnique({ where: { slug } })); }
  async create(data: Prisma.BrandCreateInput): Promise<Brand> { return prisma.brand.create({ data }); }
  async update(id: string, data: Prisma.BrandUpdateInput): Promise<Brand> { return prisma.brand.update({ where: { id }, data }); }
  async delete(id: string): Promise<void> { await prisma.brand.delete({ where: { id } }); }
  async updateProductCount(id: string): Promise<void> {
    const count = await prisma.product.count({ where: { brandId: id, deletedAt: null, status: 'ACTIVE' } });
    await prisma.brand.update({ where: { id }, data: { productCount: count } });
  }
}

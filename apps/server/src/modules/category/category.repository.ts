// ═══════════════════════════════════════════════════════════════
// Category Repository — Database access layer
// ═══════════════════════════════════════════════════════════════

import { prisma } from '../../config/database';
import { Category, Prisma } from '@prisma/client';

export class CategoryRepository {
  async findAll(query: any): Promise<{ categories: Category[]; total: number }> {
    const { page = 1, limit = 50, sortBy = 'sortOrder', sortOrder = 'asc', search, parentId, isActive, isFeatured, level } = query;
    const skip = (page - 1) * limit;
    const where: Prisma.CategoryWhereInput = {};

    if (parentId !== undefined) where.parentId = parentId === 'null' ? null : parentId;
    if (isActive !== undefined) where.isActive = isActive;
    if (isFeatured !== undefined) where.isFeatured = isFeatured;
    if (level !== undefined) where.level = level;
    if (search) where.name = { contains: search, mode: 'insensitive' };

    const [categories, total] = await Promise.all([
      prisma.category.findMany({ where, orderBy: { [sortBy]: sortOrder }, skip, take: limit, include: { children: { where: { isActive: true }, orderBy: { sortOrder: 'asc' } } } }),
      prisma.category.count({ where }),
    ]);
    return { categories, total };
  }

  async findById(id: string): Promise<Category | null> {
    return prisma.category.findUnique({ where: { id }, include: { parent: true, children: { where: { isActive: true }, orderBy: { sortOrder: 'asc' } } } });
  }

  async findBySlug(slug: string): Promise<Category | null> {
    return prisma.category.findUnique({ where: { slug }, include: { parent: true, children: { where: { isActive: true }, orderBy: { sortOrder: 'asc' } } } });
  }

  async slugExists(slug: string): Promise<boolean> {
    const cat = await prisma.category.findUnique({ where: { slug } });
    return !!cat;
  }

  async create(data: Prisma.CategoryCreateInput): Promise<Category> {
    return prisma.category.create({ data });
  }

  async update(id: string, data: Prisma.CategoryUpdateInput): Promise<Category> {
    return prisma.category.update({ where: { id }, data });
  }

  async delete(id: string): Promise<void> {
    // Move children to parent of deleted category
    const cat = await prisma.category.findUnique({ where: { id } });
    if (cat) {
      await prisma.category.updateMany({ where: { parentId: id }, data: { parentId: cat.parentId, level: Math.max(0, cat.level - 1) } });
    }
    await prisma.category.delete({ where: { id } });
  }

  /** Build full category tree recursively */
  async getTree(): Promise<Category[]> {
    return prisma.category.findMany({
      where: { parentId: null, isActive: true },
      orderBy: { sortOrder: 'asc' },
      include: {
        children: {
          where: { isActive: true },
          orderBy: { sortOrder: 'asc' },
          include: {
            children: {
              where: { isActive: true },
              orderBy: { sortOrder: 'asc' },
              include: {
                children: { where: { isActive: true }, orderBy: { sortOrder: 'asc' } },
              },
            },
          },
        },
      },
    });
  }

  async updateProductCount(id: string): Promise<void> {
    const count = await prisma.product.count({ where: { categoryId: id, deletedAt: null, status: 'ACTIVE' } });
    await prisma.category.update({ where: { id }, data: { productCount: count } });
  }
}

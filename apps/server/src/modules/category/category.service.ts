// ═══════════════════════════════════════════════════════════════
// Category Service — Business logic
// ═══════════════════════════════════════════════════════════════

import { CategoryRepository } from './category.repository';
import { ApiError } from '../../utils/api-error';
import { generateUniqueSlug } from '../../utils/slug';
import { buildPaginationMeta } from '../../utils/pagination';
import { invalidateCache } from '../../middleware/cache.middleware';

export class CategoryService {
  private repo: CategoryRepository;
  constructor(repo: CategoryRepository) { this.repo = repo; }

  async getAll(query: any) {
    const { categories, total } = await this.repo.findAll(query);
    const meta = buildPaginationMeta(total, query.page || 1, query.limit || 50);
    return { categories, meta };
  }

  async getById(id: string) {
    const category = await this.repo.findById(id);
    if (!category) throw ApiError.notFound('Category not found');
    return category;
  }

  async getBySlug(slug: string) {
    const category = await this.repo.findBySlug(slug);
    if (!category) throw ApiError.notFound('Category not found');
    return category;
  }

  async getTree() {
    return this.repo.getTree();
  }

  async create(data: any) {
    const slug = data.slug || await generateUniqueSlug(data.name, (s) => this.repo.slugExists(s));
    let level = 0;
    if (data.parentId) {
      const parent = await this.repo.findById(data.parentId);
      if (!parent) throw ApiError.badRequest('Parent category not found');
      level = parent.level + 1;
    }
    const category = await this.repo.create({ ...data, slug, level });
    await invalidateCache('/api/v1/categories*');
    return category;
  }

  async update(id: string, data: any) {
    await this.getById(id);
    if (data.slug) {
      const existing = await this.repo.findBySlug(data.slug);
      if (existing && existing.id !== id) throw ApiError.conflict('Slug already in use');
    }
    if (data.parentId) {
      if (data.parentId === id) throw ApiError.badRequest('Category cannot be its own parent');
      const parent = await this.repo.findById(data.parentId);
      if (!parent) throw ApiError.badRequest('Parent category not found');
      data.level = parent.level + 1;
    }
    const updated = await this.repo.update(id, data);
    await invalidateCache('/api/v1/categories*');
    return updated;
  }

  async delete(id: string) {
    await this.getById(id);
    await this.repo.delete(id);
    await invalidateCache('/api/v1/categories*');
  }
}

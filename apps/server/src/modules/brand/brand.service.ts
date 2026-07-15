import { BrandRepository } from './brand.repository';
import { ApiError } from '../../utils/api-error';
import { generateUniqueSlug } from '../../utils/slug';
import { buildPaginationMeta } from '../../utils/pagination';
import { invalidateCache } from '../../middleware/cache.middleware';

export class BrandService {
  private repo: BrandRepository;
  constructor(repo: BrandRepository) { this.repo = repo; }

  async getAll(query: any) {
    const { brands, total } = await this.repo.findAll(query);
    return { brands, meta: buildPaginationMeta(total, query.page || 1, query.limit || 50) };
  }
  async getById(id: string) { const b = await this.repo.findById(id); if (!b) throw ApiError.notFound('Brand not found'); return b; }
  async getBySlug(slug: string) { const b = await this.repo.findBySlug(slug); if (!b) throw ApiError.notFound('Brand not found'); return b; }

  async create(data: any) {
    const slug = data.slug || await generateUniqueSlug(data.name, (s) => this.repo.slugExists(s));
    const brand = await this.repo.create({ ...data, slug });
    await invalidateCache('/api/v1/brands*');
    return brand;
  }

  async update(id: string, data: any) {
    await this.getById(id);
    if (data.slug) { const e = await this.repo.findBySlug(data.slug); if (e && e.id !== id) throw ApiError.conflict('Slug in use'); }
    const brand = await this.repo.update(id, data);
    await invalidateCache('/api/v1/brands*');
    return brand;
  }

  async delete(id: string) { await this.getById(id); await this.repo.delete(id); await invalidateCache('/api/v1/brands*'); }
}

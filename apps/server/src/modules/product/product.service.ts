// ═══════════════════════════════════════════════════════════════
// Product Service Layer
// Orchestrates catalog queries, variants management, specs, and uploads
// ═══════════════════════════════════════════════════════════════

import { ProductRepository } from './product.repository';
import { ApiError } from '../../utils/api-error';
import { generateUniqueSlug } from '../../utils/slug';
import { buildPaginationMeta } from '../../utils/pagination';
import { invalidateCache } from '../../middleware/cache.middleware';
import { uploadToCloudinary, deleteFromCloudinary } from '../../config/cloudinary';
import { prisma } from '../../config/database';

export class ProductService {
  private repo: ProductRepository;

  constructor(repo: ProductRepository) {
    this.repo = repo;
  }

  async getAll(query: any) {
    const { products, total } = await this.repo.findAll(query);
    const meta = buildPaginationMeta(total, query.page || 1, query.limit || 20);
    return { products, meta };
  }

  async getById(id: string) {
    const product = await this.repo.findById(id);
    if (!product) throw ApiError.notFound('Product not found');
    return product;
  }

  async getBySlug(slug: string) {
    const product = await this.repo.findBySlug(slug);
    if (!product) throw ApiError.notFound('Product not found');
    // Increment view count asynchronously
    this.repo.incrementViewCount(product.id).catch(console.error);
    return product;
  }

  async create(data: any) {
    // Check SKU duplicate
    const skuExists = await this.repo.skuExists(data.sku);
    if (skuExists) throw ApiError.conflict('Product SKU already exists');

    // Generate unique slug
    const slug = await generateUniqueSlug(data.name, (s) => this.repo.slugExists(s));

    // Verify category exists
    const category = await prisma.category.findUnique({ where: { id: data.categoryId } });
    if (!category) throw ApiError.badRequest('Invalid category ID');

    if (data.brandId) {
      const brand = await prisma.brand.findUnique({ where: { id: data.brandId } });
      if (!brand) throw ApiError.badRequest('Invalid brand ID');
    }

    // Create inside a transaction
    const product = await prisma.$transaction(async (tx) => {
      // 1. Create product
      const newProduct = await tx.product.create({
        data: {
          name: data.name,
          slug,
          description: data.description,
          shortDescription: data.shortDescription,
          sku: data.sku,
          barcode: data.barcode,
          basePrice: data.basePrice,
          salePrice: data.salePrice,
          costPrice: data.costPrice,
          type: data.type,
          status: data.status,
          categoryId: data.categoryId,
          brandId: data.brandId,
          tags: data.tags,
          isFeatured: data.isFeatured,
          isNewArrival: data.isNewArrival,
          weight: data.weight,
          dimensions: data.dimensions,
          metaTitle: data.metaTitle,
          metaDescription: data.metaDescription,
        },
      });

      // 2. Create a default variant if none provided
      await tx.productVariant.create({
        data: {
          productId: newProduct.id,
          sku: `${data.sku}-DEF`,
          name: `${data.name} Default Variant`,
          price: data.salePrice || data.basePrice,
          compareAtPrice: data.salePrice ? data.basePrice : null,
          stock: 0,
          isDefault: true,
          isActive: true,
        },
      });

      return newProduct;
    });

    await invalidateCache('/api/v1/products*');
    return this.getById(product.id);
  }

  async update(id: string, data: any) {
    const existing = await this.getById(id);

    if (data.sku && data.sku !== existing.sku) {
      const skuExists = await this.repo.skuExists(data.sku);
      if (skuExists) throw ApiError.conflict('Product SKU already exists');
    }

    if (data.categoryId) {
      const category = await prisma.category.findUnique({ where: { id: data.categoryId } });
      if (!category) throw ApiError.badRequest('Invalid category ID');
    }

    if (data.brandId) {
      const brand = await prisma.brand.findUnique({ where: { id: data.brandId } });
      if (!brand) throw ApiError.badRequest('Invalid brand ID');
    }

    const updated = await this.repo.update(id, data);
    await invalidateCache('/api/v1/products*');
    return updated;
  }

  async delete(id: string) {
    await this.getById(id);
    await this.repo.softDelete(id);
    await invalidateCache('/api/v1/products*');
  }

  // ─── Variants Management ────────────────────────────────────

  async addVariant(productId: string, data: any) {
    await this.getById(productId);
    const skuExists = await this.repo.variantSkuExists(data.sku);
    if (skuExists) throw ApiError.conflict('Variant SKU already exists');

    // If making this variant default, unset other default variants
    if (data.isDefault) {
      await prisma.productVariant.updateMany({
        where: { productId, isDefault: true },
        data: { isDefault: false },
      });
    }

    const variant = await this.repo.createVariant({
      productId,
      ...data,
    });
    return variant;
  }

  async updateVariant(productId: string, variantId: string, data: any) {
    await this.getById(productId);
    const variants = await this.repo.getVariants(productId);
    const variant = variants.find((v) => v.id === variantId);
    if (!variant) throw ApiError.notFound('Variant not found');

    if (data.sku && data.sku !== variant.sku) {
      const skuExists = await this.repo.variantSkuExists(data.sku);
      if (skuExists) throw ApiError.conflict('Variant SKU already exists');
    }

    if (data.isDefault && !variant.isDefault) {
      await prisma.productVariant.updateMany({
        where: { productId, isDefault: true },
        data: { isDefault: false },
      });
    }

    return this.repo.updateVariant(variantId, data);
  }

  async deleteVariant(productId: string, variantId: string) {
    await this.getById(productId);
    const variants = await this.repo.getVariants(productId);
    const variant = variants.find((v) => v.id === variantId);
    if (!variant) throw ApiError.notFound('Variant not found');

    if (variant.isDefault) {
      throw ApiError.badRequest('Cannot delete default variant. Mark another variant as default first.');
    }

    await this.repo.deleteVariant(variantId);
  }

  // ─── Image Management ──────────────────────────────────────

  async addImage(productId: string, file: Express.Multer.File, isPrimary = false, variantId?: string) {
    await this.getById(productId);

    if (variantId) {
      const variants = await this.repo.getVariants(productId);
      if (!variants.some((v) => v.id === variantId)) {
        throw ApiError.badRequest('Invalid variant ID for this product');
      }
    }

    // Upload to Cloudinary
    const uploadResult = await uploadToCloudinary(file.buffer, 'nexastore/products');

    if (isPrimary) {
      // Unset previous primary images for this product/variant
      await prisma.productImage.updateMany({
        where: { productId, variantId: variantId || null, isPrimary: true },
        data: { isPrimary: false },
      });
    }

    const image = await this.repo.addImage({
      productId,
      variantId,
      url: uploadResult.secureUrl,
      altText: file.originalname,
      isPrimary,
    });

    return image;
  }

  async deleteImage(productId: string, imageId: string) {
    await this.getById(productId);
    const image = await prisma.productImage.findFirst({ where: { id: imageId, productId } });
    if (!image) throw ApiError.notFound('Image not found');

    // Extract publicId from url (e.g. "https://res.cloudinary.com/.../nexastore/products/xyz.jpg")
    const match = image.url.match(/\/v\d+\/(.+)\.[a-z]+$/i);
    if (match && match[1]) {
      await deleteFromCloudinary(match[1]);
    }

    await this.repo.deleteImage(imageId);

    // If primary deleted, promote another image to primary
    if (image.isPrimary) {
      const remaining = await prisma.productImage.findFirst({
        where: { productId, variantId: image.variantId },
      });
      if (remaining) {
        await prisma.productImage.update({ where: { id: remaining.id }, data: { isPrimary: true } });
      }
    }
  }

  // ─── Specifications ─────────────────────────────────────────

  async addSpec(productId: string, data: any) {
    await this.getById(productId);
    return this.repo.addSpec({
      productId,
      ...data,
    });
  }

  async deleteSpec(productId: string, specId: string) {
    await this.getById(productId);
    const spec = await prisma.productSpecification.findFirst({ where: { id: specId, productId } });
    if (!spec) throw ApiError.notFound('Specification not found');
    await this.repo.deleteSpec(specId);
  }
}

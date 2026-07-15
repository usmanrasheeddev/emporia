// ═══════════════════════════════════════════════════════════════
// Product Controller Layer
// Maps HTTP endpoints to Product catalog services
// ═══════════════════════════════════════════════════════════════

import { Request, Response } from 'express';
import { ProductService } from './product.service';
import { ProductRepository } from './product.repository';
import { ApiResponse } from '../../utils/api-response';
import { asyncHandler } from '../../utils/async-handler';
import { ApiError } from '../../utils/api-error';

const service = new ProductService(new ProductRepository());

export class ProductController {
  static getAll = asyncHandler(async (req: Request, res: Response) => {
    const { products, meta } = await service.getAll(req.query);
    res.json(ApiResponse.success('Products retrieved', products, 200, meta));
  });

  static getById = asyncHandler(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const product = await service.getById(id);
    res.json(ApiResponse.success('Product retrieved', product));
  });

  static getBySlug = asyncHandler(async (req: Request, res: Response) => {
    const slug = req.params.slug as string;
    const product = await service.getBySlug(slug);
    res.json(ApiResponse.success('Product retrieved', product));
  });

  static create = asyncHandler(async (req: Request, res: Response) => {
    const product = await service.create(req.body);
    res.status(201).json(ApiResponse.success('Product created successfully', product, 201));
  });

  static update = asyncHandler(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const product = await service.update(id, req.body);
    res.json(ApiResponse.success('Product updated successfully', product));
  });

  static delete = asyncHandler(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    await service.delete(id);
    res.json(ApiResponse.success('Product soft deleted successfully'));
  });

  // ─── Variants ──────────────────────────────────────────────

  static addVariant = asyncHandler(async (req: Request, res: Response) => {
    const productId = req.params.productId as string;
    const variant = await service.addVariant(productId, req.body);
    res.status(201).json(ApiResponse.success('Variant added successfully', variant, 201));
  });

  static updateVariant = asyncHandler(async (req: Request, res: Response) => {
    const productId = req.params.productId as string;
    const variantId = req.params.variantId as string;
    const variant = await service.updateVariant(productId, variantId, req.body);
    res.json(ApiResponse.success('Variant updated successfully', variant));
  });

  static deleteVariant = asyncHandler(async (req: Request, res: Response) => {
    const productId = req.params.productId as string;
    const variantId = req.params.variantId as string;
    await service.deleteVariant(productId, variantId);
    res.json(ApiResponse.success('Variant deleted successfully'));
  });

  // ─── Images ────────────────────────────────────────────────

  static addImage = asyncHandler(async (req: Request, res: Response) => {
    const productId = req.params.productId as string;
    const { isPrimary, variantId } = req.body;

    if (!req.file) {
      throw ApiError.badRequest('No file uploaded');
    }

    const image = await service.addImage(
      productId,
      req.file,
      isPrimary === 'true' || isPrimary === true,
      variantId
    );
    res.status(201).json(ApiResponse.success('Image uploaded successfully', image, 201));
  });

  static deleteImage = asyncHandler(async (req: Request, res: Response) => {
    const productId = req.params.productId as string;
    const imageId = req.params.imageId as string;
    await service.deleteImage(productId, imageId);
    res.json(ApiResponse.success('Image deleted successfully'));
  });

  // ─── Specifications ─────────────────────────────────────────

  static addSpec = asyncHandler(async (req: Request, res: Response) => {
    const productId = req.params.productId as string;
    const spec = await service.addSpec(productId, req.body);
    res.status(201).json(ApiResponse.success('Specification added successfully', spec, 201));
  });

  static deleteSpec = asyncHandler(async (req: Request, res: Response) => {
    const productId = req.params.productId as string;
    const specId = req.params.specId as string;
    await service.deleteSpec(productId, specId);
    res.json(ApiResponse.success('Specification deleted successfully'));
  });
}

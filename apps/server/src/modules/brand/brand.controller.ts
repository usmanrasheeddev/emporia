import { Request, Response } from 'express';
import { BrandService } from './brand.service';
import { BrandRepository } from './brand.repository';
import { ApiResponse } from '../../utils/api-response';
import { asyncHandler } from '../../utils/async-handler';

const service = new BrandService(new BrandRepository());

export class BrandController {
  static getAll = asyncHandler(async (req: Request, res: Response) => { const r = await service.getAll(req.query); res.json(ApiResponse.success('Brands retrieved', r.brands, 200, r.meta)); });
  static getById = asyncHandler(async (req: Request, res: Response) => { res.json(ApiResponse.success('Brand retrieved', await service.getById(req.params.id as string))); });
  static getBySlug = asyncHandler(async (req: Request, res: Response) => { res.json(ApiResponse.success('Brand retrieved', await service.getBySlug(req.params.slug as string))); });
  static create = asyncHandler(async (req: Request, res: Response) => { res.status(201).json(ApiResponse.success('Brand created', await service.create(req.body), 201)); });
  static update = asyncHandler(async (req: Request, res: Response) => { res.json(ApiResponse.success('Brand updated', await service.update(req.params.id as string, req.body))); });
  static delete = asyncHandler(async (req: Request, res: Response) => { await service.delete(req.params.id as string); res.json(ApiResponse.success('Brand deleted')); });
}

// ═══════════════════════════════════════════════════════════════
// Category Controller
// ═══════════════════════════════════════════════════════════════

import { Request, Response } from 'express';
import { CategoryService } from './category.service';
import { CategoryRepository } from './category.repository';
import { ApiResponse } from '../../utils/api-response';
import { asyncHandler } from '../../utils/async-handler';

const service = new CategoryService(new CategoryRepository());

export class CategoryController {
  static getAll = asyncHandler(async (req: Request, res: Response) => {
    const { categories, meta } = await service.getAll(req.query);
    res.json(ApiResponse.success('Categories retrieved', categories, 200, meta));
  });

  static getTree = asyncHandler(async (req: Request, res: Response) => {
    const tree = await service.getTree();
    res.json(ApiResponse.success('Category tree retrieved', tree));
  });

  static getById = asyncHandler(async (req: Request, res: Response) => {
    const category = await service.getById(req.params.id as string);
    res.json(ApiResponse.success('Category retrieved', category));
  });

  static getBySlug = asyncHandler(async (req: Request, res: Response) => {
    const category = await service.getBySlug(req.params.slug as string);
    res.json(ApiResponse.success('Category retrieved', category));
  });

  static create = asyncHandler(async (req: Request, res: Response) => {
    const category = await service.create(req.body);
    res.status(201).json(ApiResponse.success('Category created', category, 201));
  });

  static update = asyncHandler(async (req: Request, res: Response) => {
    const category = await service.update(req.params.id as string, req.body);
    res.json(ApiResponse.success('Category updated', category));
  });

  static delete = asyncHandler(async (req: Request, res: Response) => {
    await service.delete(req.params.id as string);
    res.json(ApiResponse.success('Category deleted'));
  });
}

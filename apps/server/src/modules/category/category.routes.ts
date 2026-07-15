// ═══════════════════════════════════════════════════════════════
// Category Routes
// ═══════════════════════════════════════════════════════════════

import { Router } from 'express';
import { CategoryController } from './category.controller';
import { validate } from '../../middleware/validate.middleware';
import { authenticate } from '../../middleware/auth.middleware';
import { authorize } from '../../middleware/role.middleware';
import { cacheResponse } from '../../middleware/cache.middleware';
import { UserRole, CACHE_TTL } from '@nexastore/shared';
import { createCategorySchema, updateCategorySchema, categoryQuerySchema } from './category.validator';

const router = Router();

// Public
router.get('/', validate(categoryQuerySchema, 'query'), cacheResponse(CACHE_TTL.CATEGORY_TREE), CategoryController.getAll);
router.get('/tree', cacheResponse(CACHE_TTL.CATEGORY_TREE), CategoryController.getTree);
router.get('/slug/:slug', cacheResponse(CACHE_TTL.CATEGORY_TREE), CategoryController.getBySlug);
router.get('/:id', cacheResponse(CACHE_TTL.CATEGORY_TREE), CategoryController.getById);

// Admin
router.post('/', authenticate, authorize(UserRole.ADMIN, UserRole.SUPER_ADMIN), validate(createCategorySchema), CategoryController.create);
router.patch('/:id', authenticate, authorize(UserRole.ADMIN, UserRole.SUPER_ADMIN), validate(updateCategorySchema), CategoryController.update);
router.delete('/:id', authenticate, authorize(UserRole.ADMIN, UserRole.SUPER_ADMIN), CategoryController.delete);

export default router;

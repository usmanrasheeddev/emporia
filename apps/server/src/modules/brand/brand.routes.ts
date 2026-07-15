import { Router } from 'express';
import { BrandController } from './brand.controller';
import { validate } from '../../middleware/validate.middleware';
import { authenticate } from '../../middleware/auth.middleware';
import { authorize } from '../../middleware/role.middleware';
import { cacheResponse } from '../../middleware/cache.middleware';
import { UserRole, CACHE_TTL } from '@nexastore/shared';
import { createBrandSchema, updateBrandSchema, brandQuerySchema } from './brand.validator';

const router = Router();
router.get('/', validate(brandQuerySchema, 'query'), cacheResponse(CACHE_TTL.BRANDS), BrandController.getAll);
router.get('/slug/:slug', cacheResponse(CACHE_TTL.BRANDS), BrandController.getBySlug);
router.get('/:id', cacheResponse(CACHE_TTL.BRANDS), BrandController.getById);
router.post('/', authenticate, authorize(UserRole.ADMIN, UserRole.SUPER_ADMIN), validate(createBrandSchema), BrandController.create);
router.patch('/:id', authenticate, authorize(UserRole.ADMIN, UserRole.SUPER_ADMIN), validate(updateBrandSchema), BrandController.update);
router.delete('/:id', authenticate, authorize(UserRole.ADMIN, UserRole.SUPER_ADMIN), BrandController.delete);
export default router;

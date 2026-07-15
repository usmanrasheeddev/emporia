// ═══════════════════════════════════════════════════════════════
// Product Route Declarations
// Hooks product CRUD, variants, uploads, and specification sub-routes
// ═══════════════════════════════════════════════════════════════

import { Router } from 'express';
import { ProductController } from './product.controller';
import { validate } from '../../middleware/validate.middleware';
import { authenticate } from '../../middleware/auth.middleware';
import { authorize } from '../../middleware/role.middleware';
import { uploadSingle } from '../../middleware/upload.middleware';
import { cacheResponse } from '../../middleware/cache.middleware';
import { UserRole, CACHE_TTL } from '@nexastore/shared';
import {
  createProductSchema,
  updateProductSchema,
  createVariantSchema,
  updateVariantSchema,
  productQuerySchema,
  addSpecificationSchema,
} from './product.validator';

const router = Router();

// ─── Public Catalog Endpoints ────────────────────────────────

router.get('/', validate(productQuerySchema, 'query'), cacheResponse(CACHE_TTL.PRODUCT_LIST), ProductController.getAll);
router.get('/slug/:slug', cacheResponse(CACHE_TTL.PRODUCT), ProductController.getBySlug);
router.get('/:id', cacheResponse(CACHE_TTL.PRODUCT), ProductController.getById);

// ─── Admin Product Management ────────────────────────────────

router.post('/', authenticate, authorize(UserRole.ADMIN, UserRole.SUPER_ADMIN), validate(createProductSchema), ProductController.create);
router.patch('/:id', authenticate, authorize(UserRole.ADMIN, UserRole.SUPER_ADMIN), validate(updateProductSchema), ProductController.update);
router.delete('/:id', authenticate, authorize(UserRole.ADMIN, UserRole.SUPER_ADMIN), ProductController.delete);

// ─── Variants sub-management ────────────────────────────────

router.post('/:productId/variants', authenticate, authorize(UserRole.ADMIN, UserRole.SUPER_ADMIN), validate(createVariantSchema), ProductController.addVariant);
router.patch('/:productId/variants/:variantId', authenticate, authorize(UserRole.ADMIN, UserRole.SUPER_ADMIN), validate(updateVariantSchema), ProductController.updateVariant);
router.delete('/:productId/variants/:variantId', authenticate, authorize(UserRole.ADMIN, UserRole.SUPER_ADMIN), ProductController.deleteVariant);

// ─── Images sub-management ──────────────────────────────────

router.post('/:productId/images', authenticate, authorize(UserRole.ADMIN, UserRole.SUPER_ADMIN), uploadSingle('image'), ProductController.addImage);
router.delete('/:productId/images/:imageId', authenticate, authorize(UserRole.ADMIN, UserRole.SUPER_ADMIN), ProductController.deleteImage);

// ─── Specifications sub-management ──────────────────────────

router.post('/:productId/specs', authenticate, authorize(UserRole.ADMIN, UserRole.SUPER_ADMIN), validate(addSpecificationSchema), ProductController.addSpec);
router.delete('/:productId/specs/:specId', authenticate, authorize(UserRole.ADMIN, UserRole.SUPER_ADMIN), ProductController.deleteSpec);

export default router;
//

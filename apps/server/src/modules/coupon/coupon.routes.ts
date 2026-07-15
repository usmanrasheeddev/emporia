// ═══════════════════════════════════════════════════════════════
// Coupon Routes
// Promotion routes for managing coupon codes and applying discounts
// ═══════════════════════════════════════════════════════════════

import { Router } from 'express';
import { CouponController } from './coupon.controller';
import { validate } from '../../middleware/validate.middleware';
import { authenticate, optionalAuthenticate } from '../../middleware/auth.middleware';
import { authorize } from '../../middleware/role.middleware';
import { UserRole } from '@nexastore/shared';
import {
  createCouponSchema,
  updateCouponSchema,
  applyCouponSchema,
  couponQuerySchema,
} from './coupon.validator';

const router = Router();

// ─── Customer Promotional Actions ───────────────────────────

router.post('/apply', optionalAuthenticate, validate(applyCouponSchema), CouponController.applyToCart);
router.delete('/apply', optionalAuthenticate, CouponController.removeFromCart);

// ─── Administrative Coupon Configurations ─────────────────────

router.get('/', authenticate, authorize(UserRole.ADMIN, UserRole.SUPER_ADMIN), validate(couponQuerySchema, 'query'), CouponController.getAll);
router.get('/:id', authenticate, authorize(UserRole.ADMIN, UserRole.SUPER_ADMIN), CouponController.getById);

router.post('/', authenticate, authorize(UserRole.ADMIN, UserRole.SUPER_ADMIN), validate(createCouponSchema), CouponController.create);
router.patch('/:id', authenticate, authorize(UserRole.ADMIN, UserRole.SUPER_ADMIN), validate(updateCouponSchema), CouponController.update);
router.delete('/:id', authenticate, authorize(UserRole.ADMIN, UserRole.SUPER_ADMIN), CouponController.delete);

export default router;
//

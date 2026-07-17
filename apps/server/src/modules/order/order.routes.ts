// ═══════════════════════════════════════════════════════════════
// Order Routes
// Checkout and order history endpoints with RBAC controls
// ═══════════════════════════════════════════════════════════════

import { Router } from 'express';
import { OrderController } from './order.controller';
import { validate } from '../../middleware/validate.middleware';
import { authenticate } from '../../middleware/auth.middleware';
import { authorize } from '../../middleware/role.middleware';
import { UserRole } from '@nexastore/shared';
import {
  createOrderSchema,
  updateOrderStatusSchema,
  orderQuerySchema,
} from './order.validator';

const router = Router();

// Apply auth to all order routes
router.use(authenticate);

// ─── Customer Order History & Checkout ───────────────────────

router.get('/me', validate(orderQuerySchema, 'query'), OrderController.getMyOrders);
router.post('/', validate(createOrderSchema), OrderController.create);
router.get('/dashboard/stats', authorize(UserRole.ADMIN, UserRole.SUPER_ADMIN), OrderController.getDashboardStats);
router.get('/dashboard/daily', authorize(UserRole.ADMIN, UserRole.SUPER_ADMIN), OrderController.getDailyAnalytics);
router.get('/:id', OrderController.getById);

// ─── Administrative Order Operations ─────────────────────────

router.get('/', authorize(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.MODERATOR), validate(orderQuerySchema, 'query'), OrderController.getAll);
router.patch('/:id/status', authorize(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.MODERATOR, UserRole.DELIVERY_STAFF), validate(updateOrderStatusSchema), OrderController.updateStatus);

export default router;
//

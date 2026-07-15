// ═══════════════════════════════════════════════════════════════
// User Module Route Declarations
// Hooks user profiles, addresses, and admin user dashboards to paths
// ═══════════════════════════════════════════════════════════════

import { Router } from 'express';
import { UserController } from './user.controller';
import { validate } from '../../middleware/validate.middleware';
import { authenticate } from '../../middleware/auth.middleware';
import { authorize } from '../../middleware/role.middleware';
import { uploadSingle } from '../../middleware/upload.middleware';
import { UserRole } from '@nexastore/shared';
import {
  updateProfileSchema,
  createAddressSchema,
  updateAddressSchema,
  adminUpdateUserSchema,
  userListQuerySchema,
} from './user.validator';
import { changePasswordSchema } from '../auth/auth.validator';

const router = Router();

// ─── Customer Profile Routes ─────────────────────────────────

router.get('/me', authenticate, UserController.getProfile);
router.patch('/me', authenticate, validate(updateProfileSchema), UserController.updateProfile);
router.patch('/me/avatar', authenticate, uploadSingle('avatar'), UserController.updateAvatar);
router.patch('/me/password', authenticate, validate(changePasswordSchema), UserController.changePassword);
router.delete('/me', authenticate, UserController.deleteAccount);

// ─── Address Routes ──────────────────────────────────────────

router.get('/me/addresses', authenticate, UserController.getAddresses);
router.post('/me/addresses', authenticate, validate(createAddressSchema), UserController.createAddress);
router.patch('/me/addresses/:id', authenticate, validate(updateAddressSchema), UserController.updateAddress);
router.delete('/me/addresses/:id', authenticate, UserController.deleteAddress);
router.patch('/me/addresses/:id/default', authenticate, UserController.setDefaultAddress);

// ─── Admin Management Routes ────────────────────────────────

router.get('/', authenticate, authorize(UserRole.ADMIN, UserRole.SUPER_ADMIN), validate(userListQuerySchema, 'query'), UserController.getAll);
router.get('/stats', authenticate, authorize(UserRole.ADMIN, UserRole.SUPER_ADMIN), UserController.getUserStats);

router.get('/:id', authenticate, authorize(UserRole.ADMIN, UserRole.SUPER_ADMIN), UserController.getUserById);
router.patch('/:id/role', authenticate, authorize(UserRole.SUPER_ADMIN), UserController.updateUserRole);
router.patch('/:id/ban', authenticate, authorize(UserRole.ADMIN, UserRole.SUPER_ADMIN), UserController.banUser);
router.patch('/:id/unban', authenticate, authorize(UserRole.ADMIN, UserRole.SUPER_ADMIN), UserController.unbanUser);
router.delete('/:id', authenticate, authorize(UserRole.SUPER_ADMIN), UserController.deleteUser);

export default router;

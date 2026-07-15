// ═══════════════════════════════════════════════════════════════
// Authentication Route Declarations
// Hooks auth validators, controllers, and limiters to Express paths
// ═══════════════════════════════════════════════════════════════

import { Router } from 'express';
import { AuthController } from './auth.controller';
import { validate } from '../../middleware/validate.middleware';
import { authenticate } from '../../middleware/auth.middleware';
import { authLimiter } from '../../middleware/rate-limit.middleware';
import {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  verifyEmailSchema,
  verifyOTPSchema,
  refreshTokenSchema,
  twoFactorVerifySchema,
} from './auth.validator';

const router = Router();

router.post('/register', validate(registerSchema), AuthController.register);
router.post('/login', authLimiter, validate(loginSchema), AuthController.login);
router.post('/2fa/verify', validate(twoFactorVerifySchema), AuthController.verifyTwoFactor);
router.post('/refresh', validate(refreshTokenSchema), AuthController.refreshToken);

router.post('/logout', authenticate, AuthController.logout);
router.post('/logout-all', authenticate, AuthController.logoutAll);

router.post('/verify-email', validate(verifyEmailSchema), AuthController.verifyEmail);
router.post('/forgot-password', authLimiter, validate(forgotPasswordSchema), AuthController.forgotPassword);
router.post('/reset-password', validate(resetPasswordSchema), AuthController.resetPassword);
router.post('/verify-otp', validate(verifyOTPSchema), AuthController.verifyOTP);

router.post('/2fa/setup', authenticate, AuthController.setupTwoFactor);
router.post('/2fa/enable', authenticate, AuthController.enableTwoFactor);
router.post('/2fa/disable', authenticate, AuthController.disableTwoFactor);

router.get('/sessions', authenticate, AuthController.getSessions);
router.delete('/sessions/:id', authenticate, AuthController.revokeSession);
router.get('/me', authenticate, AuthController.me);

export default router;

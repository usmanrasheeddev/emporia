// ═══════════════════════════════════════════════════════════════
// Authentication Route Declarations
// Hooks auth validators, controllers, and limiters to Express paths
// ═══════════════════════════════════════════════════════════════

import { Router } from 'express';
import passport from 'passport';
import { AuthController } from './auth.controller';
import { validate } from '../../middleware/validate.middleware';
import { authenticate } from '../../middleware/auth.middleware';
import { authLimiter } from '../../middleware/rate-limit.middleware';
import { env } from '../../config/env';
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

// ─── OAuth Authentication ────────────────────────────────────
router.get('/google', (req, res, next) => {
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    res.status(400).json({ success: false, message: 'Google OAuth is not configured on this server.' });
  } else {
    passport.authenticate('google', { scope: ['profile', 'email'] })(req, res, next);
  }
});

router.get('/google/callback', (req, res, next) => {
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    res.status(400).json({ success: false, message: 'Google OAuth is not configured on this server.' });
  } else {
    passport.authenticate('google', { failureRedirect: `${env.NEXT_PUBLIC_APP_URL}/login?error=oauth_failed`, session: false })(req, res, next);
  }
}, AuthController.oauthCallback);

router.get('/github', (req, res, next) => {
  if (!process.env.GITHUB_CLIENT_ID || !process.env.GITHUB_CLIENT_SECRET) {
    res.status(400).json({ success: false, message: 'GitHub OAuth is not configured on this server.' });
  } else {
    passport.authenticate('github', { scope: ['user:email'] })(req, res, next);
  }
});

router.get('/github/callback', (req, res, next) => {
  if (!process.env.GITHUB_CLIENT_ID || !process.env.GITHUB_CLIENT_SECRET) {
    res.status(400).json({ success: false, message: 'GitHub OAuth is not configured on this server.' });
  } else {
    passport.authenticate('github', { failureRedirect: `${env.NEXT_PUBLIC_APP_URL}/login?error=oauth_failed`, session: false })(req, res, next);
  }
}, AuthController.oauthCallback);

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
router.post('/resend-verify', AuthController.resendVerifyOTP);

router.post('/2fa/setup', authenticate, AuthController.setupTwoFactor);
router.post('/2fa/enable', authenticate, AuthController.enableTwoFactor);
router.post('/2fa/disable', authenticate, AuthController.disableTwoFactor);

router.get('/sessions', authenticate, AuthController.getSessions);
router.delete('/sessions/:id', authenticate, AuthController.revokeSession);
router.get('/me', authenticate, AuthController.me);

export default router;

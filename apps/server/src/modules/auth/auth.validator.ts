// ═══════════════════════════════════════════════════════════════
// Auth Input Validators
// Zod schemas for validating authentication requests
// ═══════════════════════════════════════════════════════════════

import { z } from 'zod';
import { emailSchema, passwordSchema, nameSchema, phoneSchema } from '@nexastore/shared';

export const registerSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  firstName: nameSchema,
  lastName: nameSchema,
  phone: phoneSchema.optional(),
});

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
  rememberMe: z.boolean().optional().default(false),
});

export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  password: passwordSchema,
});

export const verifyEmailSchema = z.object({
  token: z.string().min(1, 'Verification token is required'),
});

export const verifyOTPSchema = z.object({
  email: emailSchema,
  otp: z.string().length(6, 'OTP code must be 6 digits'),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

export const twoFactorVerifySchema = z.object({
  userId: z.string().uuid('Invalid user ID'),
  code: z.string().length(6, 'TOTP code must be 6 digits'),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: passwordSchema,
});

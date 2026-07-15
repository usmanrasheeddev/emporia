// ═══════════════════════════════════════════════════════════════
// Auth Module Types
// Types specific to the backend authentication flow
// ═══════════════════════════════════════════════════════════════

import { z } from 'zod';
import {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  verifyEmailSchema,
  verifyOTPSchema,
  refreshTokenSchema,
  twoFactorVerifySchema,
  changePasswordSchema,
} from './auth.validator';

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type VerifyEmailInput = z.infer<typeof verifyEmailSchema>;
export type VerifyOTPInput = z.infer<typeof verifyOTPSchema>;
export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>;
export type TwoFactorVerifyInput = z.infer<typeof twoFactorVerifySchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;

export interface OAuthProfile {
  provider: 'GOOGLE' | 'GITHUB';
  providerId: string;
  email: string;
  firstName: string;
  lastName: string;
  avatar?: string;
}

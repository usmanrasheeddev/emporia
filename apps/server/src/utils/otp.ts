// ═══════════════════════════════════════════════════════════════
// OTP Utilities
// Generate and verify One-Time Passwords
// ═══════════════════════════════════════════════════════════════

import crypto from 'crypto';
import { env } from '../config/env';

/**
 * Generates a random 6-digit numeric OTP string
 */
export function generateOTP(): string {
  const digits = '0123456789';
  let otp = '';
  // Secure random generation
  const randomBytes = crypto.randomBytes(6);
  for (let i = 0; i < 6; i++) {
    otp += digits[randomBytes[i] % 10];
  }
  return otp;
}

/**
 * Returns the expiration date for the OTP based on configured minutes
 */
export function generateOTPExpiry(): Date {
  const expiryDate = new Date();
  expiryDate.setMinutes(expiryDate.getMinutes() + env.OTP_EXPIRY_MINUTES);
  return expiryDate;
}

/**
 * Returns true if the expiry date is in the past
 */
export function isOTPExpired(expiry: Date): boolean {
  return new Date() > expiry;
}

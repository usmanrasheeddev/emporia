// ═══════════════════════════════════════════════════════════════
// Hashing Utilities
// Password hashing and comparison using bcryptjs
// ═══════════════════════════════════════════════════════════════

import bcrypt from 'bcryptjs';
import { env } from '../config/env';

/**
 * Hashes a plain text password using bcryptjs
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(env.BCRYPT_SALT_ROUNDS);
  return bcrypt.hash(password, salt);
}

/**
 * Compares a plain text password with a hashed password
 */
export async function comparePassword(plain: string, hashed: string): Promise<boolean> {
  return bcrypt.compare(plain, hashed);
}

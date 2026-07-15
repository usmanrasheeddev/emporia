// ═══════════════════════════════════════════════════════════════
// Token Management Utilities
// Deals with generating and verifying JWT access/refresh tokens
// ═══════════════════════════════════════════════════════════════

import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { env } from '../config/env';

export interface TokenPayload {
  userId: string;
  role: string;
  sessionId?: string;
}

export function generateAccessToken(payload: TokenPayload): string {
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, {
    expiresIn: env.JWT_ACCESS_EXPIRY as any,
  });
}

export function generateRefreshToken(payload: TokenPayload & { jti: string }): string {
  return jwt.sign(payload, env.JWT_REFRESH_SECRET, {
    expiresIn: env.JWT_REFRESH_EXPIRY as any,
  });
}

export function verifyAccessToken(token: string): TokenPayload {
  return jwt.verify(token, env.JWT_ACCESS_SECRET) as TokenPayload;
}

export function verifyRefreshToken(token: string): TokenPayload & { jti: string } {
  return jwt.verify(token, env.JWT_REFRESH_SECRET) as TokenPayload & { jti: string };
}

export function generateTokenId(): string {
  return uuidv4();
}

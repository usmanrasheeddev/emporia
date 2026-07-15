// ═══════════════════════════════════════════════════════════════
// Rate Limiting Middleware
// Limits request frequency using express-rate-limit
// ═══════════════════════════════════════════════════════════════

import rateLimit from 'express-rate-limit';
import { ApiError } from '../utils/api-error';
import { RATE_LIMIT } from '@nexastore/shared';

// Note: In production with multiple instances, use rate-limit-redis store.
// For now, in-memory store acts as the robust default.

/** Limit rate of general API requests */
export const apiLimiter = rateLimit({
  windowMs: RATE_LIMIT.API.windowMs,
  max: RATE_LIMIT.API.max,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, next) => {
    next(ApiError.tooManyRequests('Too many API requests, please try again later'));
  },
});

/** Limit rate of authentication requests (login, register, forgot password) */
export const authLimiter = rateLimit({
  windowMs: RATE_LIMIT.AUTH.windowMs,
  max: RATE_LIMIT.AUTH.max,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, next) => {
    next(ApiError.tooManyRequests('Too many auth attempts, please try again in 1 minute'));
  },
});

/** Limit rate of uploads to avoid disk/network exhaustion */
export const uploadLimiter = rateLimit({
  windowMs: RATE_LIMIT.UPLOAD.windowMs,
  max: RATE_LIMIT.UPLOAD.max,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, next) => {
    next(ApiError.tooManyRequests('Upload limit reached, please try again later'));
  },
});

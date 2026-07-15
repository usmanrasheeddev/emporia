// ═══════════════════════════════════════════════════════════════
// Authentication Middleware
// Validates JWT tokens and checks blacklist in Redis
// ═══════════════════════════════════════════════════════════════

import { Response, NextFunction } from 'express';
import { ApiError } from '../utils/api-error';
import { verifyAccessToken } from '../utils/token';
import { isBlacklisted } from '../config/redis';
import { prisma } from '../config/database';
import { asyncHandler } from '../utils/async-handler';
import { RequestWithUser } from '../types';

/**
 * Authenticates a request by verifying the JWT access token in authorization header.
 * Attaches verified user and session ID to the request object.
 */
export const authenticate = asyncHandler(
  async (req: RequestWithUser, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw ApiError.unauthorized('Authentication token missing or invalid');
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      throw ApiError.unauthorized('Authentication token missing');
    }

    // Check token blacklist in Redis (for logged out tokens)
    const blacklisted = await isBlacklisted(`blacklist:${token}`);
    if (blacklisted) {
      throw ApiError.unauthorized('Token has been revoked');
    }

    try {
      const decoded = verifyAccessToken(token);

      // Verify user exists and is active
      const user = await prisma.user.findFirst({
        where: { id: decoded.userId, deletedAt: null },
      });

      if (!user) {
        throw ApiError.unauthorized('User associated with this token no longer exists');
      }

      if (user.isBanned) {
        throw ApiError.unauthorized('Your account has been banned');
      }

      // Check if session is still valid in database
      if (decoded.sessionId) {
        const session = await prisma.session.findUnique({
          where: { id: decoded.sessionId },
        });

        if (!session || !session.isValid || session.expiresAt < new Date()) {
          throw ApiError.unauthorized('Session has expired or is invalid');
        }
      }

      // Attach user details to request context
      req.user = {
        id: user.id,
        email: user.email,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName,
      };
      req.sessionId = decoded.sessionId;

      next();
    } catch (error: any) {
      if (error.name === 'TokenExpiredError') {
        throw new ApiError(401, 'Token expired');
      }
      throw ApiError.unauthorized('Invalid or malformed authentication token');
    }
  }
);

export const optionalAuthenticate = asyncHandler(
  async (req: RequestWithUser, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      return next();
    }

    const blacklisted = await isBlacklisted(`blacklist:${token}`);
    if (blacklisted) {
      return next();
    }

    try {
      const decoded = verifyAccessToken(token);

      const user = await prisma.user.findFirst({
        where: { id: decoded.userId, deletedAt: null },
      });

      if (user && !user.isBanned) {
        req.user = {
          id: user.id,
          email: user.email,
          role: user.role,
          firstName: user.firstName,
          lastName: user.lastName,
        };
        req.sessionId = decoded.sessionId;
      }
    } catch {}

    next();
  }
);

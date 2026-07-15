// ═══════════════════════════════════════════════════════════════
// Role Authorization Middleware
// Restricts endpoints to specific user roles
// ═══════════════════════════════════════════════════════════════

import { Response, NextFunction } from 'express';
import { ApiError } from '../utils/api-error';
import { UserRole } from '@nexastore/shared';
import { RequestWithUser } from '../types';

/**
 * Restricts access to requests containing any of the allowed roles
 */
export function authorize(...allowedRoles: UserRole[]) {
  return (req: RequestWithUser, res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(ApiError.unauthorized('User context is missing'));
    }

    const hasRole = allowedRoles.includes(req.user.role as UserRole);
    if (!hasRole) {
      return next(ApiError.forbidden('You do not have permission to access this resource'));
    }

    next();
  };
}

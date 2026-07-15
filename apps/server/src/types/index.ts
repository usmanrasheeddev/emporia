// ═══════════════════════════════════════════════════════════════
// Express Type Extensions
// Extends standard Express Request to support authentication contexts
// ═══════════════════════════════════════════════════════════════

import { Request } from 'express';
import { UserRole } from '@nexastore/shared';

export interface AuthenticatedUser {
  id: string;
  email: string;
  role: UserRole | string;
  firstName: string;
  lastName: string;
}

declare global {
  namespace Express {
    interface User extends AuthenticatedUser {}
    interface Request {
      sessionId?: string;
    }
  }
}

export type RequestWithUser = Request;

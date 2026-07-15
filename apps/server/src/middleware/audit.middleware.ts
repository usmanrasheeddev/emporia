// ═══════════════════════════════════════════════════════════════
// Audit Log Middleware
// Asynchronously logs user mutations for auditing purposes
// ═══════════════════════════════════════════════════════════════

import { Response, NextFunction } from 'express';
import { prisma } from '../config/database';
import { logger } from '../utils/logger';
import { getClientIp, parseUserAgent } from '../utils/helpers';
import { RequestWithUser } from '../types';

/**
 * Audit log helper that can be run mid-route or post-response
 */
export async function createAuditLog(options: {
  userId: string;
  action: string;
  entity: string;
  entityId?: string;
  oldData?: any;
  newData?: any;
  ipAddress?: string;
  userAgent?: string;
}): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        userId: options.userId,
        action: options.action,
        entity: options.entity,
        entityId: options.entityId,
        oldData: options.oldData || null,
        newData: options.newData || null,
        ipAddress: options.ipAddress || '127.0.0.1',
        userAgent: options.userAgent,
      },
    });
  } catch (error) {
    logger.error('Failed to save audit log:', error);
  }
}

/**
 * Middleware that schedules an audit log creation after a successful response
 */
export function auditLog(action: string, entity: string, getEntityId?: (req: RequestWithUser) => string) {
  return (req: RequestWithUser, res: Response, next: NextFunction): void => {
    const originalSend = res.send.bind(res);
    const ipAddress = getClientIp(req);
    const userAgent = parseUserAgent(req);

    res.send = (body: any) => {
      res.send = originalSend; // Restore original

      // Capture only successful mutations (POST, PUT, PATCH, DELETE)
      const isSuccess = res.statusCode >= 200 && res.statusCode < 300;
      if (isSuccess && req.user) {
        let entityId: string | undefined;
        try {
          entityId = getEntityId ? getEntityId(req) : (req.params.id as string) || undefined;
        } catch {}

        createAuditLog({
          userId: req.user.id,
          action,
          entity,
          entityId,
          newData: req.method !== 'DELETE' ? req.body : undefined,
          ipAddress,
          userAgent,
        }).catch((err) => logger.error('Async audit log failed:', err));
      }

      return originalSend(body);
    };

    next();
  };
}

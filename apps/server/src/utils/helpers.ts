// ═══════════════════════════════════════════════════════════════
// Backend Specific Helpers
// Helper methods that are specific to the server application
// ═══════════════════════════════════════════════════════════════

export * from '@nexastore/shared'; // Re-export all shared helpers

/**
 * Returns clean request IP address, handling proxy headers
 */
import { Request } from 'express';

export function getClientIp(req: Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    const ips = typeof forwarded === 'string' ? forwarded.split(',') : forwarded;
    return ips[0].trim();
  }
  return req.socket.remoteAddress || '127.0.0.1';
}

/**
 * Parses user agent to basic details
 */
export function parseUserAgent(req: Request): string {
  return req.headers['user-agent'] || 'Unknown';
}

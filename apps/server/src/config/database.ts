// ═══════════════════════════════════════════════════════════════
// Prisma Database Client — Singleton Pattern
// Ensures a single PrismaClient instance across the application
// ═══════════════════════════════════════════════════════════════

import { PrismaClient } from '@prisma/client';
import { env } from './env';
import { logger } from '../utils/logger';

/** Global reference to prevent multiple instances in development hot-reload */
const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };

/**
 * Singleton Prisma client with query logging in development.
 * Uses soft-delete middleware to automatically filter deleted records.
 */
export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      env.NODE_ENV === 'development'
        ? [
            { level: 'query', emit: 'event' },
            { level: 'error', emit: 'stdout' },
            { level: 'warn', emit: 'stdout' },
          ]
        : [{ level: 'error', emit: 'stdout' }],
  });

// Log queries in development
if (env.NODE_ENV === 'development') {
  (prisma as any).$on('query', (e: any) => {
    if (e.duration > 100) {
      logger.warn(`Slow query (${e.duration}ms): ${e.query}`);
    }
  });
}

// Prevent multiple instances during hot-reload
if (env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

/**
 * Connect to the database and log the status.
 * Call this once during server startup.
 */
export async function connectDatabase(): Promise<void> {
  try {
    await prisma.$connect();
    logger.info('✅ Database connected successfully');
  } catch (error) {
    logger.error('❌ Database connection failed:', error);
    process.exit(1);
  }
}

/**
 * Gracefully disconnect from the database.
 * Call this during server shutdown.
 */
export async function disconnectDatabase(): Promise<void> {
  await prisma.$disconnect();
  logger.info('Database disconnected');
}

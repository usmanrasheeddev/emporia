// ═══════════════════════════════════════════════════════════════
// Server Bootstrap & Orchestration
// Initialises connections, schedules cron jobs, and starts HTTP listener
// ═══════════════════════════════════════════════════════════════

import app from './app';
import { env } from './config/env';
import { connectDatabase, disconnectDatabase } from './config/database';
import { connectRedis, disconnectRedis } from './config/redis';
import { verifyMailer } from './config/mailer';
import { logger } from './utils/logger';
import http from 'http';

const server = http.createServer(app);

async function bootstrap() {
  try {
    // 1. Database Connections
    await connectDatabase();
    await connectRedis();

    // 2. Third-Party Integrations
    await verifyMailer();

    // 3. Start Server Listener
    server.listen(env.PORT, () => {
      logger.info(`🚀 Server running in ${env.NODE_ENV} mode on port ${env.PORT}`);
    });
  } catch (error) {
    logger.error('Server failed to start:', error);
    process.exit(1);
  }
}

// ─── Graceful Shutdown ───────────────────────────────────────

const gracefulShutdown = async (signal: string) => {
  logger.warn(`⚠️ Received ${signal}. Starting graceful shutdown...`);

  server.close(async () => {
    logger.info('HTTP server closed.');

    try {
      await disconnectDatabase();
      await disconnectRedis();
      logger.info('Shutdown complete. Goodbye!');
      process.exit(0);
    } catch (err) {
      logger.error('Error during shutdown:', err);
      process.exit(1);
    }
  });

  // Force close after 10s
  setTimeout(() => {
    logger.error('Could not close connections in time, forcefully shutting down');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Uncaught Exception handling
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

bootstrap();

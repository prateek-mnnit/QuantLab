import { createApp } from './app.js';
import { env } from './config/env.js';
import { logger } from './infrastructure/logging/logger.js';
import { prisma } from './infrastructure/persistence/prisma/client.js';

/**
 * Composition root and process entrypoint.
 *
 * This is the ONLY file in the API that should ever construct concrete
 * infrastructure (the Express app, the process's HTTP server). Everything
 * else - controllers, use cases (added in later phases), repositories -
 * depends on abstractions and gets its concrete dependencies wired here.
 * That's what keeps the rest of the codebase swappable and unit-testable.
 */
async function main(): Promise<void> {
  const app = createApp();

  const server = app.listen(env.PORT, () => {
    logger.info(`QuantLab API listening on http://localhost:${env.PORT} (${env.NODE_ENV})`);
  });

  // Graceful shutdown: stop accepting new connections and close the
  // database pool cleanly instead of dropping in-flight requests when the
  // process is killed (e.g. during a deploy).
  const shutdown = async (signal: string): Promise<void> => {
    logger.info(`Received ${signal}, shutting down gracefully...`);
    server.close(async () => {
      await prisma.$disconnect();
      logger.info('Shutdown complete.');
      process.exit(0);
    });
  };

  process.on('SIGINT', () => void shutdown('SIGINT'));
  process.on('SIGTERM', () => void shutdown('SIGTERM'));
}

main().catch((error) => {
  logger.error({ error }, 'Fatal error during startup');
  process.exit(1);
});

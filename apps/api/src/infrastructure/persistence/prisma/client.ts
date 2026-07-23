import { PrismaClient } from '@prisma/client';
import { env } from '../../../config/env.js';
import { logger } from '../../logging/logger.js';

/**
 * Single, shared PrismaClient instance for the whole process.
 *
 * Why a singleton: Prisma manages its own connection pool internally: every
 * `new PrismaClient()` opens a new pool. Instantiating one per request (or
 * per repository class) would exhaust database connections under load. Every
 * repository in the infrastructure layer imports this instance rather than
 * constructing its own client.
 */
export const prisma = new PrismaClient({
  log: env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
});

/**
 * Used by the health check to prove the API can actually reach the database,
 * not just that the process is running. `SELECT 1` is the standard
 * lightweight way to verify a live connection without touching real tables.
 */
export async function checkDatabaseConnection(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch (error) {
    logger.error({ error }, 'Database connectivity check failed');
    return false;
  }
}

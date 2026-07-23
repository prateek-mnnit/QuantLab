import type { Request, Response } from 'express';
import type { ApiSuccessResponse, HealthCheckResult } from '@quantlab/shared-types';
import { checkDatabaseConnection } from '../../../infrastructure/persistence/prisma/client.js';
import { ServiceUnavailableError } from '../../../application/errors/AppError.js';

/**
 * Deliberately bypasses the usual controller -> use case -> repository
 * layering. A health check isn't business logic - it's an infrastructure
 * diagnostic ("is this process alive, can it reach the database"), so
 * talking directly to the Prisma connectivity check here is the right call
 * rather than manufacturing a fake "use case" around it.
 */
export async function getHealth(_req: Request, res: Response): Promise<void> {
  const isDatabaseConnected = await checkDatabaseConnection();

  if (!isDatabaseConnected) {
    throw new ServiceUnavailableError('Database is unreachable');
  }

  const body: ApiSuccessResponse<HealthCheckResult> = {
    success: true,
    data: { status: 'ok', timestamp: new Date().toISOString(), database: 'connected' },
  };
  res.status(200).json(body);
}

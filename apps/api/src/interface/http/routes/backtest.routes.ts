import { Router, type RequestHandler } from 'express';
import { runBacktestSchema } from '@quantlab/shared-types';
import type { createBacktestController } from '../controllers/backtest.controller.js';
import { validateBody, validateQuery } from '../middleware/validate.js';
import { listBacktestsQuerySchema } from '../validators/backtest.validators.js';

export function createBacktestRouter(
  controller: ReturnType<typeof createBacktestController>,
  authenticate: RequestHandler,
): Router {
  const router = Router();

  router.use(authenticate);

  router.get('/', validateQuery(listBacktestsQuerySchema), controller.list);
  router.post('/', validateBody(runBacktestSchema), controller.run);
  router.get('/:id', controller.getOne);
  router.get('/:id/trades', controller.getTrades);

  return router;
}

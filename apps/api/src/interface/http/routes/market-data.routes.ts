import { Router, type RequestHandler } from 'express';
import type { createMarketDataController } from '../controllers/market-data.controller.js';
import { validateQuery } from '../middleware/validate.js';
import { candlesQuerySchema } from '../validators/market-data.validators.js';

export function createMarketDataRouter(
  controller: ReturnType<typeof createMarketDataController>,
  authenticate: RequestHandler,
): Router {
  const router = Router();

  router.use(authenticate);
  router.get('/:symbol/candles', validateQuery(candlesQuerySchema), controller.getCandles);

  return router;
}

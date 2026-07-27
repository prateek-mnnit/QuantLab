import { Router, type RequestHandler } from 'express';
import type { createMarketDataController } from '../controllers/market-data.controller.js';
import { validateQuery } from '../middleware/validate.js';
import { symbolSearchQuerySchema } from '../validators/market-data.validators.js';

export function createSymbolRouter(
  controller: ReturnType<typeof createMarketDataController>,
  authenticate: RequestHandler,
): Router {
  const router = Router();

  router.use(authenticate);
  router.get('/search', validateQuery(symbolSearchQuerySchema), controller.search);

  return router;
}

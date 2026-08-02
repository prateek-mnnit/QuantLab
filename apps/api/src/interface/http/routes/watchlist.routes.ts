import { Router, type RequestHandler } from 'express';
import { addToWatchlistSchema } from '@quantlab/shared-types';
import type { createWatchlistController } from '../controllers/watchlist.controller.js';
import { validateBody } from '../middleware/validate.js';

export function createWatchlistRouter(
  controller: ReturnType<typeof createWatchlistController>,
  authenticate: RequestHandler,
): Router {
  const router = Router();

  router.use(authenticate);

  router.get('/', controller.list);
  router.post('/', validateBody(addToWatchlistSchema), controller.add);
  router.delete('/:symbol', controller.remove);

  return router;
}

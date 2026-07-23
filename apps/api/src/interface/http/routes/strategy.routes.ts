import { Router, type RequestHandler } from 'express';
import { strategyInputSchema } from '@quantlab/shared-types';
import type { createStrategyController } from '../controllers/strategy.controller.js';
import { validateBody } from '../middleware/validate.js';

/**
 * Every route here takes `authenticate` as a parameter (rather than
 * importing a singleton) for the same reason the controller and use cases
 * do: the concrete `TokenService` it depends on is wired once, in
 * container.ts, and passed down - not reached for globally.
 */
export function createStrategyRouter(
  controller: ReturnType<typeof createStrategyController>,
  authenticate: RequestHandler,
): Router {
  const router = Router();

  router.use(authenticate);

  router.get('/', controller.list);
  router.post('/', validateBody(strategyInputSchema), controller.create);
  router.get('/:id', controller.getOne);
  router.put('/:id', validateBody(strategyInputSchema), controller.update);
  router.delete('/:id', controller.remove);

  return router;
}

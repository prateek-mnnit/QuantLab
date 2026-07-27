import { Router } from 'express';
import { healthRouter } from './health.routes.js';
import { createAuthRouter } from './auth.routes.js';
import { createStrategyRouter } from './strategy.routes.js';
import { createMarketDataRouter } from './market-data.routes.js';
import { createSymbolRouter } from './symbol.routes.js';
import { authController, strategyController, marketDataController, authenticate } from '../../../container.js';

/**
 * Aggregates every resource router under one mount point. As new resources
 * (backtests, watchlist, ...) are added in later phases, they get one line
 * here rather than being wired individually in app.ts.
 */
export const apiRouter = Router();

apiRouter.use('/health', healthRouter);
apiRouter.use('/auth', createAuthRouter(authController));
apiRouter.use('/strategies', createStrategyRouter(strategyController, authenticate));
apiRouter.use('/market-data', createMarketDataRouter(marketDataController, authenticate));
apiRouter.use('/symbols', createSymbolRouter(marketDataController, authenticate));

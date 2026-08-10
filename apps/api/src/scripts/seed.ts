import { prisma } from '../infrastructure/persistence/prisma/client.js';
import { StrategyRepository } from '../infrastructure/persistence/repositories/StrategyRepository.js';
import { WatchlistRepository } from '../infrastructure/persistence/repositories/WatchlistRepository.js';
import { BacktestRunRepository } from '../infrastructure/persistence/repositories/BacktestRunRepository.js';
import { TradeRepository } from '../infrastructure/persistence/repositories/TradeRepository.js';
import { YahooFinanceProvider } from '../infrastructure/market-data/providers/YahooFinanceProvider.js';
import { CreateStrategyUseCase } from '../application/strategies/CreateStrategyUseCase.js';
import { AddToWatchlistUseCase } from '../application/watchlist/AddToWatchlistUseCase.js';
import { RunBacktestUseCase } from '../application/backtests/RunBacktestUseCase.js';
import { logger } from '../infrastructure/logging/logger.js';
import { seedPrebuiltContent } from './seedPrebuiltContent.js';

/**
 * Thin executable entrypoint - mirrors `container.ts`'s own "wire concrete
 * infrastructure, then hand it to application-layer code" shape, just for
 * a one-off script instead of the long-running server. All of the actual
 * seeding logic (what to create, in what order, how idempotency is
 * checked) lives in `seedPrebuiltContent.ts`, which is unit-tested against
 * fake repositories - this file exists only to build the REAL dependencies
 * and is intentionally not itself unit-tested, same as `container.ts`.
 *
 * There is no demo user, no demo credentials, and nothing in this file
 * authenticates as anyone - every piece of content this creates is
 * built-in/product-level (`userId: null`), visible to every real,
 * independently-registered user (see seedPrebuiltContent.ts's own doc
 * comment for the full ownership model).
 *
 * Run via `npm run db:seed` (see apps/api/package.json / root
 * package.json) - safe to run multiple times (see seedPrebuiltContent.ts).
 */

const strategyRepository = new StrategyRepository(prisma);
const watchlistRepository = new WatchlistRepository(prisma);
const backtestRunRepository = new BacktestRunRepository(prisma);
const tradeRepository = new TradeRepository(prisma);
const marketDataProvider = new YahooFinanceProvider();

const createStrategyUseCase = new CreateStrategyUseCase(strategyRepository);
const addToWatchlistUseCase = new AddToWatchlistUseCase(watchlistRepository, marketDataProvider);
const runBacktestUseCase = new RunBacktestUseCase(
  strategyRepository,
  backtestRunRepository,
  tradeRepository,
  marketDataProvider,
);

async function main() {
  logger.info('Seeding prebuilt product content...');

  const result = await seedPrebuiltContent({
    strategyRepository,
    createStrategyUseCase,
    watchlistRepository,
    addToWatchlistUseCase,
    backtestRunRepository,
    runBacktestUseCase,
    onProgress: (message) => logger.info(message),
  });

  logger.info(
    {
      strategies: { created: result.strategiesCreated.length, skipped: result.strategiesSkipped.length },
      watchlist: { created: result.watchlistItemsCreated.length, skipped: result.watchlistItemsSkipped.length },
      backtests: {
        created: result.backtestsCreated.length,
        skipped: result.backtestsSkipped.length,
        failed: result.backtestsFailed,
      },
    },
    'Prebuilt content seed complete.',
  );

  if (result.backtestsFailed.length > 0) {
    // Non-fatal (see seedPrebuiltContent.ts) but surfaced with a non-zero
    // exit code so a CI/deploy pipeline running this as a post-deploy step
    // still notices, rather than silently shipping fewer example
    // backtests than intended.
    process.exitCode = 1;
  }
}

main()
  .catch((error) => {
    logger.error({ error }, 'Prebuilt content seed failed.');
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

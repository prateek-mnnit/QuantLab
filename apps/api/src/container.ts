import { prisma } from './infrastructure/persistence/prisma/client.js';

// Infrastructure
import { PasswordHasher } from './infrastructure/auth/PasswordHasher.js';
import { TokenService } from './infrastructure/auth/TokenService.js';
import { UserRepository } from './infrastructure/persistence/repositories/UserRepository.js';
import { RefreshTokenRepository } from './infrastructure/persistence/repositories/RefreshTokenRepository.js';
import { StrategyRepository } from './infrastructure/persistence/repositories/StrategyRepository.js';
import { BacktestRunRepository } from './infrastructure/persistence/repositories/BacktestRunRepository.js';
import { TradeRepository } from './infrastructure/persistence/repositories/TradeRepository.js';
import { WatchlistRepository } from './infrastructure/persistence/repositories/WatchlistRepository.js';
import { YahooFinanceProvider } from './infrastructure/market-data/providers/YahooFinanceProvider.js';

// Application (use cases)
import { RegisterUseCase } from './application/auth/RegisterUseCase.js';
import { LoginUseCase } from './application/auth/LoginUseCase.js';
import { RefreshTokenUseCase } from './application/auth/RefreshTokenUseCase.js';
import { LogoutUseCase } from './application/auth/LogoutUseCase.js';
import { CreateStrategyUseCase } from './application/strategies/CreateStrategyUseCase.js';
import { UpdateStrategyUseCase } from './application/strategies/UpdateStrategyUseCase.js';
import { GetStrategyUseCase } from './application/strategies/GetStrategyUseCase.js';
import { ListStrategiesUseCase } from './application/strategies/ListStrategiesUseCase.js';
import { DeleteStrategyUseCase } from './application/strategies/DeleteStrategyUseCase.js';
import { GetCandlesUseCase } from './application/market-data/GetCandlesUseCase.js';
import { SearchSymbolsUseCase } from './application/market-data/SearchSymbolsUseCase.js';
import { RunBacktestUseCase } from './application/backtests/RunBacktestUseCase.js';
import { GetBacktestUseCase } from './application/backtests/GetBacktestUseCase.js';
import { GetBacktestTradesUseCase } from './application/backtests/GetBacktestTradesUseCase.js';
import { ListBacktestsUseCase } from './application/backtests/ListBacktestsUseCase.js';
import { AddToWatchlistUseCase } from './application/watchlist/AddToWatchlistUseCase.js';
import { RemoveFromWatchlistUseCase } from './application/watchlist/RemoveFromWatchlistUseCase.js';
import { ListWatchlistUseCase } from './application/watchlist/ListWatchlistUseCase.js';

// Interface (controllers + middleware that need a dependency injected)
import { createAuthController } from './interface/http/controllers/auth.controller.js';
import { createStrategyController } from './interface/http/controllers/strategy.controller.js';
import { createMarketDataController } from './interface/http/controllers/market-data.controller.js';
import { createBacktestController } from './interface/http/controllers/backtest.controller.js';
import { createWatchlistController } from './interface/http/controllers/watchlist.controller.js';
import { createAuthenticateMiddleware } from './interface/http/middleware/authenticate.js';

/**
 * The dependency injection "container" - the single place, alongside
 * server.ts, that's allowed to know concrete infrastructure classes exist.
 * This project doesn't use a DI framework (e.g. InversifyJS, tsyringe):
 * with a codebase this size, plain constructor calls in one file are more
 * readable and just as effective as framework-managed DI, and they're
 * exactly what makes the wiring here traceable top to bottom by just
 * reading the file. A DI framework starts paying for itself at a scale
 * (dozens of services, conditional/lazy wiring) this project isn't at yet.
 *
 * Everything below is built bottom-up: infrastructure first, then the use
 * cases that depend on it, then the controllers/middleware that depend on
 * those. `routes/index.ts` imports only the exported controllers and
 * `authenticate` - it never touches a repository or use case directly.
 */

// --- Infrastructure ---
const passwordHasher = new PasswordHasher();
const tokenService = new TokenService();
const userRepository = new UserRepository(prisma);
const refreshTokenRepository = new RefreshTokenRepository(prisma);
const strategyRepository = new StrategyRepository(prisma);
const backtestRunRepository = new BacktestRunRepository(prisma);
const tradeRepository = new TradeRepository(prisma);
const watchlistRepository = new WatchlistRepository(prisma);
// Typed as the MarketDataProvider interface it implements, not the
// concrete class - every use case below depends on that interface, so
// swapping providers later is a one-line change right here.
const marketDataProvider = new YahooFinanceProvider();

// --- Application ---
const registerUseCase = new RegisterUseCase(userRepository, passwordHasher);
const loginUseCase = new LoginUseCase(userRepository, refreshTokenRepository, passwordHasher, tokenService);
const refreshTokenUseCase = new RefreshTokenUseCase(refreshTokenRepository, userRepository, tokenService);
const logoutUseCase = new LogoutUseCase(refreshTokenRepository, tokenService);

const createStrategyUseCase = new CreateStrategyUseCase(strategyRepository);
const updateStrategyUseCase = new UpdateStrategyUseCase(strategyRepository);
const getStrategyUseCase = new GetStrategyUseCase(strategyRepository);
const listStrategiesUseCase = new ListStrategiesUseCase(strategyRepository);
const deleteStrategyUseCase = new DeleteStrategyUseCase(strategyRepository);

const getCandlesUseCase = new GetCandlesUseCase(marketDataProvider);
const searchSymbolsUseCase = new SearchSymbolsUseCase(marketDataProvider);

const runBacktestUseCase = new RunBacktestUseCase(
  strategyRepository,
  backtestRunRepository,
  tradeRepository,
  marketDataProvider,
);
const getBacktestUseCase = new GetBacktestUseCase(backtestRunRepository);
const getBacktestTradesUseCase = new GetBacktestTradesUseCase(backtestRunRepository, tradeRepository);
const listBacktestsUseCase = new ListBacktestsUseCase(backtestRunRepository);

const addToWatchlistUseCase = new AddToWatchlistUseCase(watchlistRepository, marketDataProvider);
const removeFromWatchlistUseCase = new RemoveFromWatchlistUseCase(watchlistRepository);
const listWatchlistUseCase = new ListWatchlistUseCase(watchlistRepository);

// --- Interface ---
export const authenticate = createAuthenticateMiddleware(tokenService);

export const authController = createAuthController({
  registerUseCase,
  loginUseCase,
  refreshTokenUseCase,
  logoutUseCase,
});

export const strategyController = createStrategyController({
  createStrategyUseCase,
  updateStrategyUseCase,
  getStrategyUseCase,
  listStrategiesUseCase,
  deleteStrategyUseCase,
});

export const marketDataController = createMarketDataController({
  getCandlesUseCase,
  searchSymbolsUseCase,
});

export const backtestController = createBacktestController({
  runBacktestUseCase,
  getBacktestUseCase,
  getBacktestTradesUseCase,
  listBacktestsUseCase,
});

export const watchlistController = createWatchlistController({
  addToWatchlistUseCase,
  removeFromWatchlistUseCase,
  listWatchlistUseCase,
});

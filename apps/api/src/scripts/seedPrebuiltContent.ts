import { STRATEGY_TEMPLATES } from '@quantlab/shared-types';
import type { Timeframe } from '@quantlab/shared-types';
import type { IStrategyRepository } from '../infrastructure/persistence/repositories/StrategyRepository.js';
import type { IWatchlistRepository } from '../infrastructure/persistence/repositories/WatchlistRepository.js';
import type { IBacktestRunRepository } from '../infrastructure/persistence/repositories/BacktestRunRepository.js';
import type { CreateStrategyUseCase } from '../application/strategies/CreateStrategyUseCase.js';
import type { AddToWatchlistUseCase } from '../application/watchlist/AddToWatchlistUseCase.js';
import type { RunBacktestUseCase } from '../application/backtests/RunBacktestUseCase.js';
import { ConflictError } from '../application/errors/AppError.js';

/**
 * Ten Indian NSE stocks for the featured/default watchlist (Group AH,
 * section 2/3). Yahoo Finance's own symbol convention for NSE-listed
 * equities is `SYMBOL.NS` (confirmed by reading `YahooFinanceProvider`: it
 * passes `symbol` straight into the chart URL with no US-market assumption
 * baked in, so any symbol Yahoo itself recognizes works unmodified) - NOT
 * the bare tickers a US-centric reading of the target list might suggest.
 */
export const FEATURED_WATCHLIST_SYMBOLS: readonly string[] = [
  'RELIANCE.NS',
  'TCS.NS',
  'INFY.NS',
  'HDFCBANK.NS',
  'ICICIBANK.NS',
  'SBIN.NS',
  'ITC.NS',
  'LT.NS',
  'BHARTIARTL.NS',
  'AXISBANK.NS',
];

/**
 * Five (strategy template, symbol) combinations to pre-run into real,
 * persisted example backtests (Group AH, section 3) - matching the exact
 * pairings suggested in the group's own spec. Every `templateId` here must
 * exist in `STRATEGY_TEMPLATES`; `seedPrebuiltContent` throws early if one
 * doesn't, rather than silently skipping a typo'd id.
 */
export const EXAMPLE_BACKTEST_PLAN: ReadonlyArray<{ templateId: string; symbol: string }> = [
  { templateId: 'ema-trend-following', symbol: 'RELIANCE.NS' },
  { templateId: 'sma-crossover', symbol: 'TCS.NS' },
  { templateId: 'rsi-reversal', symbol: 'INFY.NS' },
  { templateId: 'macd-trend-following', symbol: 'HDFCBANK.NS' },
  { templateId: 'bollinger-mean-reversion', symbol: 'ICICIBANK.NS' },
];

/** How far back each example backtest looks - two years of daily bars, well within Yahoo's unlimited daily history and long enough for every template's longest indicator warm-up (the 200-period SMA in `sma-50-200-golden-cross`) to produce real signals. */
const EXAMPLE_BACKTEST_LOOKBACK_DAYS = 365 * 2;

export interface SeedPrebuiltContentDeps {
  strategyRepository: IStrategyRepository;
  createStrategyUseCase: CreateStrategyUseCase;
  watchlistRepository: IWatchlistRepository;
  addToWatchlistUseCase: AddToWatchlistUseCase;
  backtestRunRepository: IBacktestRunRepository;
  runBacktestUseCase: RunBacktestUseCase;
  /** Optional progress callback - `seed.ts` passes `logger.info`; tests omit it. */
  onProgress?: (message: string) => void;
}

export interface SeedPrebuiltContentResult {
  strategiesCreated: string[];
  strategiesSkipped: string[];
  watchlistItemsCreated: string[];
  watchlistItemsSkipped: string[];
  backtestsCreated: string[];
  backtestsSkipped: string[];
  backtestsFailed: Array<{ label: string; error: string }>;
}

/**
 * Seeds (or re-confirms) QuantLab's PREBUILT PRODUCT CONTENT: ten built-in
 * strategies, ten featured Indian-stock watchlist symbols, and five real,
 * engine-generated example backtests.
 *
 * PREBUILT CONTENT VS. USER DATA (Group AH's corrected architecture):
 * there is no demo account here, and nothing in this function references
 * `userId` for the content it creates - every write below passes
 * `userId: null` (directly, or implicitly through `isBuiltIn: true`,
 * depending on the use case's signature), which every repository treats
 * as "this is built-in/product-level content" (see
 * `schema.prisma`'s doc comments on `Strategy.userId` / `WatchlistItem.
 * userId` / `BacktestRun.userId`). That single convention - applied
 * consistently across all three tables - is what makes this content
 * visible to EVERY authenticated user (`findManyVisibleToUser` on each
 * repository) while remaining un-editable and un-deletable by any of them
 * (`findByIdForUser`/`findOneForUser` are strictly own-only, and a
 * null-owned row can never equal a real userId). Nothing here bypasses
 * authentication, mixes rows across users, hardcodes a user id, or
 * requires a demo account to exist.
 *
 * IDEMPOTENCY: every step is check-then-create, never a bare create or an
 * upsert-on-guessed-key. Running this function twice makes zero additional
 * writes on the second run (besides log lines) - each already-exists
 * branch below explains what it's checking and why that check is enough to
 * make re-running safe.
 */
export async function seedPrebuiltContent(deps: SeedPrebuiltContentDeps): Promise<SeedPrebuiltContentResult> {
  const log = deps.onProgress ?? (() => {});

  // --- 1. Built-in strategies ------------------------------------------
  // Matched by name among the EXISTING built-in strategies (there is no
  // separate "template id" column on Strategy - a persisted strategy is
  // just a strategy). Strategy names have no uniqueness constraint at the
  // schema level, so this is a plain "does a built-in one with this name
  // already exist" check, not a guaranteed-unique lookup - correct here
  // because built-in strategies are only ever created by this function.
  const existingBuiltInStrategies = await deps.strategyRepository.findManyBuiltIn();
  const strategyIdByTemplateId = new Map<string, string>();
  const strategiesCreated: string[] = [];
  const strategiesSkipped: string[] = [];

  for (const template of STRATEGY_TEMPLATES) {
    const existing = existingBuiltInStrategies.find((strategy) => strategy.name === template.input.name);
    if (existing) {
      strategyIdByTemplateId.set(template.id, existing.id);
      strategiesSkipped.push(template.input.name);
      continue;
    }

    const created = await deps.createStrategyUseCase.execute(null, template.input, { isBuiltIn: true });
    strategyIdByTemplateId.set(template.id, created.id);
    strategiesCreated.push(template.input.name);
    log(`Created built-in strategy "${template.input.name}"`);
  }

  // --- 2. Featured watchlist --------------------------------------------
  // Checked against the existing built-in items directly (not
  // `findOneForUser`, which needs a real userId and is deliberately
  // strict/own-only - see WatchlistRepository's doc comments) - this
  // mirrors `AddToWatchlistUseCase`'s own null-userId branch, done here
  // too so a skip never even reaches (and re-validates against Yahoo) a
  // symbol that's already featured.
  const existingBuiltInWatchlistItems = await deps.watchlistRepository.findManyBuiltIn();
  const watchlistItemsCreated: string[] = [];
  const watchlistItemsSkipped: string[] = [];

  for (const symbol of FEATURED_WATCHLIST_SYMBOLS) {
    const existing = existingBuiltInWatchlistItems.find((item) => item.symbol === symbol);
    if (existing) {
      watchlistItemsSkipped.push(symbol);
      continue;
    }

    try {
      await deps.addToWatchlistUseCase.execute(null, symbol, { isBuiltIn: true });
      watchlistItemsCreated.push(symbol);
      log(`Added ${symbol} to the featured watchlist`);
    } catch (error) {
      if (error instanceof ConflictError) {
        // Another seed run (or a concurrent process) won this race after
        // our check above - the item exists either way, which is the
        // outcome we wanted, so this isn't a failure.
        watchlistItemsSkipped.push(symbol);
      } else {
        throw error;
      }
    }
  }

  // --- 3. Example backtests ---------------------------------------------
  // The ONLY step that makes a real external market-data request - and
  // only for combinations that don't already have a COMPLETED example run,
  // so a second seed run makes zero additional Yahoo Finance calls. This
  // is what keeps this a one-time seed operation rather than something
  // that could ever run per-visitor (Group AH's explicit performance
  // requirement).
  const backtestsCreated: string[] = [];
  const backtestsSkipped: string[] = [];
  const backtestsFailed: Array<{ label: string; error: string }> = [];

  const dateTo = new Date();
  const dateFrom = new Date();
  dateFrom.setDate(dateFrom.getDate() - EXAMPLE_BACKTEST_LOOKBACK_DAYS);

  for (const plan of EXAMPLE_BACKTEST_PLAN) {
    const template = STRATEGY_TEMPLATES.find((candidate) => candidate.id === plan.templateId);
    if (!template) {
      throw new Error(`EXAMPLE_BACKTEST_PLAN references unknown template id "${plan.templateId}".`);
    }
    const strategyId = strategyIdByTemplateId.get(plan.templateId);
    if (!strategyId) {
      // Can't happen in practice (every template is seeded in step 1
      // before this loop runs), but fails loudly rather than silently
      // skipping a planned example backtest if it ever did.
      throw new Error(`No seeded strategy found for template id "${plan.templateId}".`);
    }

    const label = `${plan.symbol} + ${template.input.name}`;
    const alreadyRun = (await deps.backtestRunRepository.findManyBuiltIn(strategyId)).some(
      (run) => run.symbol === plan.symbol && run.timeframe === template.input.timeframe && run.status === 'COMPLETED',
    );
    if (alreadyRun) {
      backtestsSkipped.push(label);
      continue;
    }

    try {
      // userId: null - see RunBacktestUseCase's own doc comment: this is
      // what marks the resulting BacktestRun as a global example rather
      // than something a real user personally ran.
      const result = await deps.runBacktestUseCase.execute(null, {
        strategyId,
        symbol: plan.symbol,
        timeframe: template.input.timeframe as Timeframe,
        dateFrom: dateFrom.toISOString(),
        dateTo: dateTo.toISOString(),
      });
      // RunBacktestUseCase never THROWS for a data/provider problem - it
      // persists the run with status FAILED and a message instead (see
      // RunBacktestUseCase.test.ts). That has to be checked explicitly
      // here, or a failed example backtest would be silently counted as a
      // success.
      if (result.status === 'FAILED') {
        backtestsFailed.push({ label, error: result.errorMessage ?? 'Backtest failed for an unknown reason.' });
        log(`Example backtest failed: ${label} (${result.errorMessage ?? 'unknown reason'})`);
      } else {
        backtestsCreated.push(label);
        log(`Ran example backtest: ${label}`);
      }
    } catch (error) {
      // A single symbol's data being temporarily unavailable shouldn't
      // abort the whole seed run and leave the other four example
      // backtests (and every strategy/watchlist item already written
      // above) rolled back with them - each backtest is independent, so a
      // failure here is recorded and the run continues.
      const message = error instanceof Error ? error.message : String(error);
      backtestsFailed.push({ label, error: message });
      log(`Failed example backtest: ${label} (${message})`);
    }
  }

  return {
    strategiesCreated,
    strategiesSkipped,
    watchlistItemsCreated,
    watchlistItemsSkipped,
    backtestsCreated,
    backtestsSkipped,
    backtestsFailed,
  };
}

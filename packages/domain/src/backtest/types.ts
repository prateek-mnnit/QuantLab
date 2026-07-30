import type { ConditionExplanation } from '../conditions/evaluateConditionTree.js';

export type TradeExitReason = 'TAKE_PROFIT' | 'STOP_LOSS' | 'TRAILING_STOP' | 'EXIT_SIGNAL' | 'END_OF_BACKTEST';

/**
 * The domain-layer shape of a completed (or still-open) trade. Deliberately
 * separate from the Prisma `Trade` model and the API `Trade` DTO - this is
 * pure simulation output with no database concerns (no id, no
 * backtestRunId); mapping it into a persisted row is the application
 * layer's job in the phase that wires this engine up to `POST /backtests`.
 */
export interface SimulatedTrade {
  entryTime: number; // Unix seconds, matching Candle.time
  entryPrice: number;
  exitTime: number | null;
  exitPrice: number | null;
  size: number;
  pnl: number | null;
  exitReason: TradeExitReason | null;
  entryExplanation: ConditionExplanation;
  exitExplanation: ConditionExplanation | null;
}

export interface BacktestMetrics {
  totalReturnPct: number;
  cagr: number;
  winRate: number;
  profitFactor: number;
  maxDrawdownPct: number;
  sharpeRatio: number;
  totalTrades: number;
}

export interface BacktestResult {
  trades: SimulatedTrade[];
  metrics: BacktestMetrics;
}

export interface BacktestOptions {
  initialCapital: number;
  /** Applied against every fill, e.g. 0.0005 = 0.05% - always works against the trader (worse fills, never better). */
  slippagePct: number;
  /** A flat fee charged on both entry and exit. */
  commissionPerTrade: number;
}

export const DEFAULT_BACKTEST_OPTIONS: BacktestOptions = {
  initialCapital: 10_000,
  slippagePct: 0.0005,
  commissionPerTrade: 1,
};

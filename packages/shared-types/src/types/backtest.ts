import type { ComparisonOperator } from '../schemas/condition-tree.schema.js';

/**
 * Mirrors packages/domain's ConditionExplanation shape exactly, but is
 * defined independently here rather than imported from `@quantlab/domain`.
 * That's a deliberate boundary, not duplication-by-accident: `shared-types`
 * is consumed by the FRONTEND, which has no reason to depend on the
 * backend-only simulation engine (no I/O, pure functions, but still
 * conceptually backend/worker logic). The two shapes are kept in sync by
 * convention (both represent the same "which conditions fired and what
 * were their values" concept) rather than by a shared import, the same way
 * the Prisma schema and this package independently mirror each other.
 */
export interface ConditionExplanationLeaf {
  type: 'CONDITION';
  id: string;
  result: boolean;
  operator: ComparisonOperator;
  leftValue: number | null;
  rightValue: number | null;
}

export interface ConditionExplanationGroup {
  type: 'AND' | 'OR';
  id: string;
  result: boolean;
  children: ConditionExplanation[];
}

export type ConditionExplanation = ConditionExplanationLeaf | ConditionExplanationGroup;

export type TradeExitReason = 'TAKE_PROFIT' | 'STOP_LOSS' | 'TRAILING_STOP' | 'EXIT_SIGNAL' | 'END_OF_BACKTEST';

export type BacktestStatus = 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED';

export interface Trade {
  id: string;
  backtestRunId: string;
  entryTime: string;
  entryPrice: number;
  exitTime: string | null;
  exitPrice: number | null;
  size: number;
  pnl: number | null;
  exitReason: TradeExitReason | null;
  entryExplanation: ConditionExplanation;
  exitExplanation: ConditionExplanation | null;
}

export interface BacktestRun {
  id: string;
  strategyId: string;
  symbol: string;
  timeframe: '1D' | '1W';
  dateFrom: string;
  dateTo: string;
  status: BacktestStatus;
  errorMessage: string | null;
  totalReturnPct: number | null;
  cagr: number | null;
  winRate: number | null;
  /**
   * `null` represents "undefined/unbounded" (a strategy with zero losing
   * trades has no meaningful profit factor) rather than the domain engine's
   * `Infinity` for that same case - `Infinity` doesn't survive JSON
   * serialization (`JSON.stringify(Infinity) === "null"` already, silently)
   * so this makes that conversion explicit and intentional at the mapping
   * boundary instead of an implicit side effect of `res.json()`.
   */
  profitFactor: number | null;
  maxDrawdownPct: number | null;
  sharpeRatio: number | null;
  totalTrades: number | null;
  createdAt: string;
  completedAt: string | null;
}

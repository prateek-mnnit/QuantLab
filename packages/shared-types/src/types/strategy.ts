import type {
  PositionSizingConfig,
  StopLossConfig,
  TakeProfitConfig,
  TrailingStopConfig,
} from '../schemas/strategy.schema.js';
import type { ConditionNode } from '../schemas/condition-tree.schema.js';
import type { Timeframe } from './candle.js';

/**
 * The shape of a strategy as returned BY the API - includes server-assigned
 * fields (id, userId, version, timestamps) that `StrategyInput` (what the
 * client sends) never does. Keeping these as two distinct types, rather
 * than one type with optional server fields, makes it a compile error to
 * accidentally send a client-generated `id` in a create request.
 */
export interface Strategy {
  id: string;
  /** Group AH: null for a built-in/product-level strategy, a real user id for one the user created themselves. */
  userId: string | null;
  name: string;
  description: string | null;
  version: number;
  timeframe: Timeframe;
  entryConditions: ConditionNode;
  exitConditions: ConditionNode;
  stopLossConfig: StopLossConfig | null;
  takeProfitConfig: TakeProfitConfig | null;
  trailingStopConfig: TrailingStopConfig | null;
  positionSizingConfig: PositionSizingConfig;
  /** Group AH: true for a seeded/curated example strategy, false for one the user built themselves. */
  isBuiltIn: boolean;
  createdAt: string;
  updatedAt: string;
}

/** Trimmed-down shape for list views - avoids shipping full condition trees over the wire for a table row. */
export interface StrategySummary {
  id: string;
  name: string;
  description: string | null;
  timeframe: Timeframe;
  version: number;
  /** Group AH: true for a seeded/curated example strategy, false for one the user built themselves. */
  isBuiltIn: boolean;
  createdAt: string;
  updatedAt: string;
}

import type {
  PositionSizingConfig,
  StopLossConfig,
  TakeProfitConfig,
  TrailingStopConfig,
} from '../schemas/strategy.schema.js';
import type { ConditionNode } from '../schemas/condition-tree.schema.js';

/**
 * The shape of a strategy as returned BY the API - includes server-assigned
 * fields (id, userId, version, timestamps) that `StrategyInput` (what the
 * client sends) never does. Keeping these as two distinct types, rather
 * than one type with optional server fields, makes it a compile error to
 * accidentally send a client-generated `id` in a create request.
 */
export interface Strategy {
  id: string;
  userId: string;
  name: string;
  description: string | null;
  version: number;
  timeframe: '1D' | '1W';
  entryConditions: ConditionNode;
  exitConditions: ConditionNode;
  stopLossConfig: StopLossConfig | null;
  takeProfitConfig: TakeProfitConfig | null;
  trailingStopConfig: TrailingStopConfig | null;
  positionSizingConfig: PositionSizingConfig;
  createdAt: string;
  updatedAt: string;
}

/** Trimmed-down shape for list views - avoids shipping full condition trees over the wire for a table row. */
export interface StrategySummary {
  id: string;
  name: string;
  description: string | null;
  timeframe: '1D' | '1W';
  version: number;
  createdAt: string;
  updatedAt: string;
}

import { z } from 'zod';
import { conditionNodeSchema } from './condition-tree.schema.js';

/**
 * Each risk-management config uses the same `{ type, value }` shape family
 * as the PRD/architecture describe: a `type` selecting the calculation
 * method and a `value` interpreted according to that type (e.g. `PERCENT`
 * -> value is a percentage, `ATR` -> value is a multiple of ATR). Kept
 * optional/nullable except position sizing, which mirrors the schema:
 * every strategy MUST define how big a position it takes, but stop loss /
 * take profit / trailing stop are all optional risk controls.
 */
const stopLossConfigSchema = z
  .object({
    type: z.enum(['PERCENT', 'POINTS', 'ATR']),
    value: z.number().positive(),
  })
  .nullable()
  .optional();

const takeProfitConfigSchema = z
  .object({
    type: z.enum(['PERCENT', 'POINTS', 'RISK_REWARD_MULTIPLE']),
    value: z.number().positive(),
  })
  .nullable()
  .optional();

const trailingStopConfigSchema = z
  .object({
    type: z.enum(['PERCENT', 'ATR']),
    value: z.number().positive(),
  })
  .nullable()
  .optional();

const positionSizingConfigSchema = z.object({
  type: z.enum(['FIXED_SHARES', 'PERCENT_CAPITAL', 'RISK_BASED']),
  value: z.number().positive(),
});

export type StopLossConfig = NonNullable<z.infer<typeof stopLossConfigSchema>>;
export type TakeProfitConfig = NonNullable<z.infer<typeof takeProfitConfigSchema>>;
export type TrailingStopConfig = NonNullable<z.infer<typeof trailingStopConfigSchema>>;
export type PositionSizingConfig = z.infer<typeof positionSizingConfigSchema>;

const timeframeSchema = z.enum(['5m', '15m', '30m', '1H', '4H', '1D', '1W']);

/**
 * Shared by both create and update - a strategy's shape doesn't change
 * based on whether it's new or being edited, only whether an `id` is
 * already assigned (handled by the URL param on PUT, not the body).
 */
export const strategyInputSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(120),
  description: z.string().trim().max(1000).optional(),
  timeframe: timeframeSchema,
  entryConditions: conditionNodeSchema,
  exitConditions: conditionNodeSchema,
  stopLossConfig: stopLossConfigSchema,
  takeProfitConfig: takeProfitConfigSchema,
  trailingStopConfig: trailingStopConfigSchema,
  positionSizingConfig: positionSizingConfigSchema,
});

export type StrategyInput = z.infer<typeof strategyInputSchema>;

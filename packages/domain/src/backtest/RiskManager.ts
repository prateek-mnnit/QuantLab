import type { StopLossConfig, TakeProfitConfig, TrailingStopConfig } from '@quantlab/shared-types';

/**
 * The STATIC stop-loss price, fixed at the moment a trade opens - unlike
 * the trailing stop below, this never moves for the life of the trade.
 * `entryAtr` is the ATR value at entry time, required only for ATR-based
 * configs; `null` (e.g. too early in the series for ATR to have warmed up)
 * makes an ATR-based stop simply not apply for that trade rather than
 * throwing, since a backtest shouldn't crash over one edge-case trade.
 */
export function calculateStopLossPrice(
  config: StopLossConfig | null,
  entryPrice: number,
  entryAtr: number | null,
): number | null {
  if (!config) return null;
  if (config.type === 'PERCENT') return entryPrice * (1 - config.value / 100);
  if (config.type === 'POINTS') return entryPrice - config.value;
  return entryAtr !== null ? entryPrice - config.value * entryAtr : null; // ATR
}

/**
 * The static take-profit price. `RISK_REWARD_MULTIPLE` defines "1R" as the
 * distance from entry to the stop loss, so it requires a stop loss to be
 * configured too - a risk/reward target is meaningless without a defined
 * risk. Returns `null` (no take profit applied) rather than an arbitrary
 * fallback if that dependency isn't met, matching how a trader would
 * actually treat an under-specified rule.
 */
export function calculateTakeProfitPrice(
  config: TakeProfitConfig | null,
  entryPrice: number,
  stopLossPrice: number | null,
): number | null {
  if (!config) return null;
  if (config.type === 'PERCENT') return entryPrice * (1 + config.value / 100);
  if (config.type === 'POINTS') return entryPrice + config.value;

  if (stopLossPrice === null) return null; // RISK_REWARD_MULTIPLE with no stop loss - undefined, so unset.
  const riskDistance = entryPrice - stopLossPrice;
  return entryPrice + config.value * riskDistance;
}

/**
 * The trailing stop RECOMPUTES every bar, unlike the two above -
 * `highestPriceSinceEntry` is maintained by the engine's open-position
 * state and passed in fresh each time this is called.
 */
export function calculateTrailingStopPrice(
  config: TrailingStopConfig | null,
  highestPriceSinceEntry: number,
  currentAtr: number | null,
): number | null {
  if (!config) return null;
  if (config.type === 'PERCENT') return highestPriceSinceEntry * (1 - config.value / 100);
  return currentAtr !== null ? highestPriceSinceEntry - config.value * currentAtr : null; // ATR
}

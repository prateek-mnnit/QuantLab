import type { PositionSizingConfig } from '@quantlab/shared-types';

/**
 * Converts a position sizing config into a concrete share/unit count for
 * one trade. `stopDistance` (entry price minus stop price, always a
 * positive number) is required for genuinely risk-based sizing and ignored
 * by the other two modes; callers pass `null` when the strategy has no
 * stop loss configured.
 */
export function calculatePositionSize(
  config: PositionSizingConfig,
  availableCapital: number,
  entryPrice: number,
  stopDistance: number | null,
): number {
  switch (config.type) {
    case 'FIXED_SHARES':
      return config.value;

    case 'PERCENT_CAPITAL':
      return (availableCapital * (config.value / 100)) / entryPrice;

    case 'RISK_BASED': {
      const riskAmount = availableCapital * (config.value / 100);
      // Without a stop distance, "risk per share" is undefined - fall back
      // to treating the risk amount as capital to deploy, same as
      // PERCENT_CAPITAL, rather than dividing by zero or refusing to size
      // the trade at all.
      if (stopDistance === null || stopDistance <= 0) {
        return riskAmount / entryPrice;
      }
      return riskAmount / stopDistance;
    }
  }
}

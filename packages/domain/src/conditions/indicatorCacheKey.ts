import type { IndicatorType } from '@quantlab/shared-types';

/**
 * A stable string key for one (indicator, params) pair - e.g.
 * "RSI(period=14)" - shared by `collectIndicatorRequirements` (which
 * decides what needs computing) and `evaluateConditionTree` (which looks up
 * the already-computed series). Sorting the param keys first means the same
 * logical indicator+params always produces the same cache key regardless of
 * object key insertion order.
 */
export function indicatorCacheKey(indicator: IndicatorType, params: Record<string, number>): string {
  const sortedParams = Object.keys(params)
    .sort()
    .map((key) => `${key}=${params[key]}`)
    .join(',');
  return `${indicator}(${sortedParams})`;
}

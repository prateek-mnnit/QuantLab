import type { ConditionNode, IndicatorType } from '@quantlab/shared-types';
import { indicatorCacheKey } from './indicatorCacheKey.js';

export interface IndicatorRequirement {
  indicator: IndicatorType;
  params: Record<string, number>;
}

/**
 * Walks a condition tree once, up front, and collects every DISTINCT
 * (indicator, params) pair it references - so the backtest engine can
 * compute each one exactly once over the full candle series, rather than
 * recomputing e.g. an RSI(14) from scratch every time a condition leaf
 * references it. Both `left` and `right` operands of every leaf are
 * checked, since either side of a comparison can be an indicator (e.g.
 * "EMA(20) crosses above EMA(50)" needs both).
 */
export function collectIndicatorRequirements(
  node: ConditionNode,
  requirements: Map<string, IndicatorRequirement> = new Map(),
): Map<string, IndicatorRequirement> {
  if (node.type === 'CONDITION') {
    for (const operand of [node.left, node.right]) {
      if (operand.source === 'INDICATOR') {
        requirements.set(indicatorCacheKey(operand.indicator, operand.params), {
          indicator: operand.indicator,
          params: operand.params,
        });
      }
    }
    return requirements;
  }

  for (const child of node.children) {
    collectIndicatorRequirements(child, requirements);
  }
  return requirements;
}

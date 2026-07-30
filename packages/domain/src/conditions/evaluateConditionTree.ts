import type { Candle, ComparisonOperator, ConditionLeaf, ConditionNode, ConditionOperand } from '@quantlab/shared-types';
import { indicatorCacheKey } from './indicatorCacheKey.js';

export type IndicatorSeriesCache = Map<string, Record<string, Array<number | null>>>;

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

/**
 * A snapshot of exactly how a condition tree evaluated at one bar: every
 * leaf's actual computed values and whether it fired, combined through the
 * same AND/OR structure as the strategy itself. This IS the "explain why
 * this trade happened" feature from the PRD - it's stored verbatim as a
 * trade's `entryExplanation`/`exitExplanation` (per the approved Prisma
 * schema), not recomputed after the fact, so explanations are exact and
 * cheap to display.
 */
export type ConditionExplanation = ConditionExplanationLeaf | ConditionExplanationGroup;

function evaluateOperand(
  operand: ConditionOperand,
  candles: Candle[],
  index: number,
  seriesCache: IndicatorSeriesCache,
): number | null {
  if (operand.source === 'VALUE') return operand.value;
  if (operand.source === 'PRICE') return candles[index]?.[operand.field] ?? null;

  const series = seriesCache.get(indicatorCacheKey(operand.indicator, operand.params));
  if (!series) return null; // Shouldn't happen if collectIndicatorRequirements ran first - defensive, not expected.

  const outputKey = operand.output ?? Object.keys(series)[0]!;
  return series[outputKey]?.[index] ?? null;
}

function evaluateLeaf(
  leaf: ConditionLeaf,
  candles: Candle[],
  index: number,
  seriesCache: IndicatorSeriesCache,
): ConditionExplanationLeaf {
  const { operator } = leaf;

  // CROSSES_ABOVE/BELOW are inherently about the transition between two
  // bars, not a single bar's values - they need bar `index - 1` as well,
  // and can never fire on the very first bar (there's no "previous" to
  // have crossed from).
  if (operator === 'CROSSES_ABOVE' || operator === 'CROSSES_BELOW') {
    const leftNow = evaluateOperand(leaf.left, candles, index, seriesCache);
    const rightNow = evaluateOperand(leaf.right, candles, index, seriesCache);

    if (index === 0) {
      return { type: 'CONDITION', id: leaf.id, result: false, operator, leftValue: leftNow, rightValue: rightNow };
    }

    const leftPrev = evaluateOperand(leaf.left, candles, index - 1, seriesCache);
    const rightPrev = evaluateOperand(leaf.right, candles, index - 1, seriesCache);

    let result = false;
    if (leftNow !== null && rightNow !== null && leftPrev !== null && rightPrev !== null) {
      result =
        operator === 'CROSSES_ABOVE'
          ? leftPrev <= rightPrev && leftNow > rightNow
          : leftPrev >= rightPrev && leftNow < rightNow;
    }

    return { type: 'CONDITION', id: leaf.id, result, operator, leftValue: leftNow, rightValue: rightNow };
  }

  const leftValue = evaluateOperand(leaf.left, candles, index, seriesCache);
  const rightValue = evaluateOperand(leaf.right, candles, index, seriesCache);

  let result = false;
  if (leftValue !== null && rightValue !== null) {
    if (operator === 'GREATER_THAN') result = leftValue > rightValue;
    else if (operator === 'LESS_THAN') result = leftValue < rightValue;
    else result = leftValue === rightValue; // EQUALS
  }

  return { type: 'CONDITION', id: leaf.id, result, operator, leftValue, rightValue };
}

/**
 * Evaluates an entire condition tree at one bar, recursively - the exact
 * counterpart to the recursive `ConditionGroupEditor` on the frontend,
 * walking the same tree shape. `seriesCache` must already contain every
 * indicator series `collectIndicatorRequirements` found for this tree,
 * computed over the full candle series (the backtest engine does this once
 * up front, not per bar).
 */
export function evaluateConditionTree(
  node: ConditionNode,
  candles: Candle[],
  index: number,
  seriesCache: IndicatorSeriesCache,
): ConditionExplanation {
  if (node.type === 'CONDITION') {
    return evaluateLeaf(node, candles, index, seriesCache);
  }

  const childExplanations = node.children.map((child) =>
    evaluateConditionTree(child, candles, index, seriesCache),
  );

  // An empty group (no children yet, e.g. a strategy still being built)
  // evaluates to false rather than the vacuous-truth default an empty
  // `.every()` would otherwise give an AND group - an empty entry-condition
  // tree should never fire on every single bar.
  const result =
    node.children.length === 0
      ? false
      : node.type === 'AND'
        ? childExplanations.every((child) => child.result)
        : childExplanations.some((child) => child.result);

  return { type: node.type, id: node.id, result, children: childExplanations };
}

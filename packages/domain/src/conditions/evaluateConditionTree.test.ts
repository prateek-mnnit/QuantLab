import { describe, expect, it } from 'vitest';
import type { Candle, ConditionGroup, ConditionLeaf } from '@quantlab/shared-types';
import { evaluateConditionTree } from './evaluateConditionTree.js';

function candle(close: number): Candle {
  return { time: 0, open: close, high: close, low: close, close, volume: 0 };
}

function priceLeaf(id: string, operator: ConditionLeaf['operator'], value: number): ConditionLeaf {
  return {
    type: 'CONDITION',
    id,
    left: { source: 'PRICE', field: 'close' },
    operator,
    right: { source: 'VALUE', value },
  };
}

describe('evaluateConditionTree', () => {
  const candles = [10, 20, 30].map(candle);
  const noIndicators = new Map();

  it('evaluates a single leaf condition against price', () => {
    const tree: ConditionGroup = { type: 'AND', id: 'root', children: [priceLeaf('c1', 'GREATER_THAN', 15)] };

    expect(evaluateConditionTree(tree, candles, 0, noIndicators).result).toBe(false); // close=10
    expect(evaluateConditionTree(tree, candles, 1, noIndicators).result).toBe(true); // close=20
  });

  it('AND requires every child true; OR requires only one', () => {
    const andTree: ConditionGroup = {
      type: 'AND',
      id: 'root',
      children: [priceLeaf('a', 'GREATER_THAN', 15), priceLeaf('b', 'GREATER_THAN', 25)],
    };
    const orTree: ConditionGroup = { ...andTree, type: 'OR' };

    // At index 1 (close=20): only the ">15" leaf is true.
    expect(evaluateConditionTree(andTree, candles, 1, noIndicators).result).toBe(false);
    expect(evaluateConditionTree(orTree, candles, 1, noIndicators).result).toBe(true);
  });

  it('an empty group never fires, for either AND or OR', () => {
    expect(evaluateConditionTree({ type: 'AND', id: 'root', children: [] }, candles, 0, noIndicators).result).toBe(false);
    expect(evaluateConditionTree({ type: 'OR', id: 'root', children: [] }, candles, 0, noIndicators).result).toBe(false);
  });

  it('CROSSES_ABOVE fires only on the bar where the cross actually happens', () => {
    const crossCandles = [candle(5), candle(25), candle(30)];
    const tree: ConditionGroup = {
      type: 'AND',
      id: 'root',
      children: [{ ...priceLeaf('c1', 'CROSSES_ABOVE', 20) }],
    };

    expect(evaluateConditionTree(tree, crossCandles, 0, noIndicators).result).toBe(false); // no previous bar
    expect(evaluateConditionTree(tree, crossCandles, 1, noIndicators).result).toBe(true); // 5 -> 25 crosses 20
    expect(evaluateConditionTree(tree, crossCandles, 2, noIndicators).result).toBe(false); // already above, no new cross
  });

  it('nested groups combine correctly: (A OR B) AND C', () => {
    const inner: ConditionGroup = {
      type: 'OR',
      id: 'inner',
      children: [priceLeaf('a', 'GREATER_THAN', 100), priceLeaf('b', 'GREATER_THAN', 15)],
    };
    const outer: ConditionGroup = {
      type: 'AND',
      id: 'outer',
      children: [inner, priceLeaf('c', 'LESS_THAN', 25)],
    };

    // index 1: close=20 -> inner: (20>100=false OR 20>15=true)=true; outer: true AND (20<25=true) = true
    expect(evaluateConditionTree(outer, candles, 1, noIndicators).result).toBe(true);
    // index 2: close=30 -> outer: true AND (30<25=false) = false
    expect(evaluateConditionTree(outer, candles, 2, noIndicators).result).toBe(false);
  });
});

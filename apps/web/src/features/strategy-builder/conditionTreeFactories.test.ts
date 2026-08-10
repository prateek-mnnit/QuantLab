import { describe, expect, it } from 'vitest';
import { createEmptyCondition, createEmptyGroup } from './conditionTreeFactories.js';

describe('createEmptyGroup', () => {
  it('defaults to an AND group with no children', () => {
    const group = createEmptyGroup();

    expect(group.type).toBe('AND');
    expect(group.children).toEqual([]);
  });

  it('honors an explicit OR type', () => {
    expect(createEmptyGroup('OR').type).toBe('OR');
  });

  it('gives every group a unique id', () => {
    const a = createEmptyGroup();
    const b = createEmptyGroup();

    expect(a.id).not.toBe(b.id);
  });
});

describe('createEmptyCondition', () => {
  it('defaults to a valid, always-submittable RSI < 30 leaf', () => {
    const condition = createEmptyCondition();

    expect(condition.type).toBe('CONDITION');
    expect(condition.left).toEqual({ source: 'INDICATOR', indicator: 'RSI', params: { period: 14 } });
    expect(condition.operator).toBe('LESS_THAN');
    expect(condition.right).toEqual({ source: 'VALUE', value: 30 });
  });

  it('gives every condition a unique id', () => {
    const a = createEmptyCondition();
    const b = createEmptyCondition();

    expect(a.id).not.toBe(b.id);
  });
});

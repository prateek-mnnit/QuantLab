import type { ConditionGroup, ConditionLeaf } from '@quantlab/shared-types';

/**
 * `crypto.randomUUID()` is a browser-native Web Crypto API function - no
 * library needed. It's only available in "secure contexts" (HTTPS, or
 * localhost during development), which every real deployment of this app
 * satisfies. These client-generated ids exist purely so React can key list
 * items and so the tree editors below can address a specific node when
 * updating it - the backend's zod schema validates that an id is present
 * but never interprets what it contains.
 */
function generateId(): string {
  return crypto.randomUUID();
}

export function createEmptyGroup(type: 'AND' | 'OR' = 'AND'): ConditionGroup {
  return { type, id: generateId(), children: [] };
}

/**
 * A sensible, always-valid default leaf condition (RSI below 30 - a classic
 * oversold signal) rather than an empty/invalid shape - so the moment a
 * user adds a condition, the form is already submittable without them
 * having to fill in every field first.
 */
export function createEmptyCondition(): ConditionLeaf {
  return {
    type: 'CONDITION',
    id: generateId(),
    left: { source: 'INDICATOR', indicator: 'RSI', params: { period: 14 } },
    operator: 'LESS_THAN',
    right: { source: 'VALUE', value: 30 },
  };
}

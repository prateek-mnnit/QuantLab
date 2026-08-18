import type { ConditionGroup, ConditionLeaf } from '@quantlab/shared-types';

/**
 * `crypto.randomUUID()` is a browser-native Web Crypto API function.
 * It's only available in "secure contexts" (HTTPS or localhost).
 * For non-secure deployments (like an initial EC2 deployment on HTTP),
 * we gracefully fall back to a Math.random() UUID implementation.
 * These client-generated ids exist purely so React can key list items 
 * and address specific nodes when updating - they do not require 
 * cryptographic security.
 */
function generateId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  // Fallback UUID v4 implementation
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
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

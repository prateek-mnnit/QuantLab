import { z } from 'zod';
import { INDICATOR_TYPES } from '../types/indicator-catalog.js';

/**
 * zod: a TypeScript-first schema validation library. The key idea is that
 * you define validation rules once and get a matching TypeScript type for
 * free via `z.infer<...>` - there's no separate interface to keep in sync
 * by hand, and unlike a plain TS type (which only exists at compile time),
 * a zod schema also gives you a `.parse()`/`.safeParse()` you can run at
 * runtime against real, untrusted input (like a JSON request body). It's
 * the de-facto standard for this in the current Node/TypeScript ecosystem
 * (the more established alternative, Joi, predates TypeScript-first design
 * and doesn't infer types this cleanly).
 *
 * This file lives in `shared-types`, not `apps/api`, specifically so the
 * frontend's condition-tree editor can import the SAME schema for
 * real-time client-side validation that the backend uses to authoritatively
 * re-validate on save - one schema, not two hand-maintained copies that can
 * quietly drift apart.
 */

const operandSourceIndicator = z.object({
  source: z.literal('INDICATOR'),
  indicator: z.enum(INDICATOR_TYPES as [string, ...string[]]),
  /** e.g. { period: 14 } - validated against the indicator's own bounds by refine() below. */
  params: z.record(z.string(), z.number()),
  /** Required for multi-output indicators (MACD, Bollinger Bands); omitted for single-output ones. */
  output: z.string().optional(),
});

const operandSourcePrice = z.object({
  source: z.literal('PRICE'),
  field: z.enum(['open', 'high', 'low', 'close']),
});

const operandSourceValue = z.object({
  source: z.literal('VALUE'),
  value: z.number(),
});

/**
 * A discriminated union: zod (and TypeScript) use the `source` field to
 * know which of the three shapes applies, which is what lets
 * `operand.source === 'INDICATOR'` narrow `operand` to have `.indicator`
 * and `.params` available - the same pattern as a tagged union in plain
 * TypeScript, just with runtime validation attached.
 */
const operandSchema = z.discriminatedUnion('source', [
  operandSourceIndicator,
  operandSourcePrice,
  operandSourceValue,
]);

export type ConditionOperand = z.infer<typeof operandSchema>;

const comparisonOperatorSchema = z.enum([
  'GREATER_THAN',
  'LESS_THAN',
  'EQUALS',
  'CROSSES_ABOVE',
  'CROSSES_BELOW',
]);

export type ComparisonOperator = z.infer<typeof comparisonOperatorSchema>;

const conditionLeafSchema = z
  .object({
    type: z.literal('CONDITION'),
    id: z.string().min(1),
    left: operandSchema,
    operator: comparisonOperatorSchema,
    right: operandSchema,
  })
  // Two plain numbers being compared (VALUE vs VALUE) isn't really a
  // trading rule - it can never change truth value bar to bar - so it's
  // rejected here rather than silently accepted as a strategy that can
  // never behave as the user probably intended.
  .refine((leaf) => !(leaf.left.source === 'VALUE' && leaf.right.source === 'VALUE'), {
    message: 'A condition cannot compare two fixed values - at least one side must reference price or an indicator.',
  });

export type ConditionLeaf = z.infer<typeof conditionLeafSchema>;

export interface ConditionGroup {
  type: 'AND' | 'OR';
  id: string;
  children: ConditionNode[];
}

export type ConditionNode = ConditionLeaf | ConditionGroup;

/**
 * `z.lazy` is how zod expresses a recursive schema - a condition group's
 * `children` array contains more `ConditionNode`s, which may themselves be
 * groups. Without the explicit `z.ZodType<ConditionNode>` annotation,
 * TypeScript can't infer the recursive type on its own and this won't
 * compile - this is a well-known zod pattern for exactly this situation.
 */
export const conditionNodeSchema: z.ZodType<ConditionNode> = z.lazy(() =>
  z.union([
    conditionLeafSchema,
    z.object({
      type: z.enum(['AND', 'OR']),
      id: z.string().min(1),
      children: z
        .array(conditionNodeSchema)
        .min(1, 'A group must contain at least one condition or nested group.'),
    }),
  ]),
);

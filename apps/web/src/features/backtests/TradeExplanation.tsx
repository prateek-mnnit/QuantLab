import type { ConditionExplanation } from '@quantlab/shared-types';

const OPERATOR_LABEL: Record<string, string> = {
  GREATER_THAN: '>',
  LESS_THAN: '<',
  EQUALS: '=',
  CROSSES_ABOVE: 'crosses above',
  CROSSES_BELOW: 'crosses below',
};

function formatValue(value: number | null): string {
  return value === null ? '—' : value.toFixed(2);
}

interface TradeExplanationProps {
  explanation: ConditionExplanation;
  depth?: number;
}

/**
 * Renders a ConditionExplanation tree read-only - the same recursive shape
 * as the strategy builder's ConditionGroupEditor (AND/OR groups nesting
 * leaf conditions), but for DISPLAY rather than editing, and driven by
 * exactly what the API returns (operator, the two evaluated values, and
 * whether each node fired) rather than any indicator/price labeling the
 * backend doesn't currently include in the explanation payload.
 */
export function TradeExplanation({ explanation, depth = 0 }: TradeExplanationProps) {
  const resultBadge = (
    <span
      className={`inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
        explanation.result ? 'bg-profit/20 text-profit' : 'bg-zinc-700/50 text-zinc-500'
      }`}
    >
      {explanation.result ? '✓' : '✗'}
    </span>
  );

  if (explanation.type === 'CONDITION') {
    return (
      <div className="flex items-center gap-2 py-1 text-sm" style={{ marginLeft: depth * 16 }}>
        {resultBadge}
        <span className="text-zinc-400">
          {formatValue(explanation.leftValue)} {OPERATOR_LABEL[explanation.operator] ?? explanation.operator}{' '}
          {formatValue(explanation.rightValue)}
        </span>
      </div>
    );
  }

  return (
    <div style={{ marginLeft: depth * 16 }}>
      <div className="flex items-center gap-2 py-1 text-sm">
        {resultBadge}
        <span className="font-medium text-zinc-300">{explanation.type === 'AND' ? 'ALL of:' : 'ANY of:'}</span>
      </div>
      {explanation.children.map((child) => (
        <TradeExplanation key={child.id} explanation={child} depth={depth + 1} />
      ))}
    </div>
  );
}

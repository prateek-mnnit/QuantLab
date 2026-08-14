import type { ComparisonOperator, ConditionLeaf } from '@quantlab/shared-types';
import { OperandEditor } from './OperandEditor';

const OPERATORS: { value: ComparisonOperator; label: string }[] = [
  { value: 'GREATER_THAN', label: 'is greater than' },
  { value: 'LESS_THAN', label: 'is less than' },
  { value: 'EQUALS', label: 'equals' },
  { value: 'CROSSES_ABOVE', label: 'crosses above' },
  { value: 'CROSSES_BELOW', label: 'crosses below' },
];

interface ConditionLeafEditorProps {
  leaf: ConditionLeaf;
  onChange: (leaf: ConditionLeaf) => void;
  onRemove: () => void;
}

/** One row: [left operand] [operator] [right operand] [remove]. UI-3:
    operator gets its own visually distinct slot between the two operand
    blocks (rather than sitting in the same flow as their internal
    controls), and the remove action is now an icon-only button so it
    reads as "row chrome" rather than competing with the row's own fields
    for attention. */
export function ConditionLeafEditor({ leaf, onChange, onRemove }: ConditionLeafEditorProps) {
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-lg border border-surface-border bg-surface p-3">
      <OperandEditor value={leaf.left} onChange={(left) => onChange({ ...leaf, left })} />

      <select
        aria-label="Operator"
        className="shrink-0 rounded-md border border-surface-border bg-surface-raised px-2.5 py-1.5 text-xs font-medium uppercase tracking-wide text-slate-300 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
        value={leaf.operator}
        onChange={(event) => onChange({ ...leaf, operator: event.target.value as ComparisonOperator })}
      >
        {OPERATORS.map((operator) => (
          <option key={operator.value} value={operator.value}>
            {operator.label}
          </option>
        ))}
      </select>

      <OperandEditor value={leaf.right} onChange={(right) => onChange({ ...leaf, right })} />

      <button
        type="button"
        onClick={onRemove}
        aria-label="Remove condition"
        title="Remove condition"
        className="ml-auto inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-slate-500 transition-colors hover:bg-loss/10 hover:text-loss"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4" aria-hidden="true">
          <path d="M3 6h18M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2m2 0-.867 12.142A2 2 0 0 1 15.138 20H8.862a2 2 0 0 1-1.995-1.858L6 6" />
        </svg>
      </button>
    </div>
  );
}

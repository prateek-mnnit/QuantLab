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

/** One row: [left operand] [operator] [right operand] [remove]. */
export function ConditionLeafEditor({ leaf, onChange, onRemove }: ConditionLeafEditorProps) {
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-lg border border-surface-border bg-surface p-3">
      <OperandEditor value={leaf.left} onChange={(left) => onChange({ ...leaf, left })} />

      <select
        className="rounded-md border border-surface-border bg-surface px-2 py-1.5 text-sm text-slate-100 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
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
        className="ml-auto text-xs font-medium text-loss hover:text-loss/80"
      >
        Remove
      </button>
    </div>
  );
}

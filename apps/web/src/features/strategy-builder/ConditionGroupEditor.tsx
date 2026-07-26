import type { ConditionGroup, ConditionNode } from '@quantlab/shared-types';
import { ConditionLeafEditor } from './ConditionLeafEditor';
import { createEmptyCondition, createEmptyGroup } from './conditionTreeFactories';

interface ConditionGroupEditorProps {
  group: ConditionGroup;
  onChange: (group: ConditionGroup) => void;
  /** Undefined for the root group - the top-level AND/OR group can't be removed, only nested ones. */
  onRemove?: () => void;
  depth?: number;
}

/**
 * Renders ITSELF for nested groups - this recursion is what lets a single
 * component represent an arbitrarily nested `(A AND B) OR (C AND D)` tree,
 * mirroring the JSON condition-tree shape 1:1 (per the approved Strategy
 * Builder Architecture). There's no separate "tree walking" utility -
 * each level only ever manages its own direct children and reports the new
 * version of itself upward via `onChange`; React's own reconciliation
 * handles the rest. `depth` just caps how deeply a user can nest groups in
 * the UI (3 levels) - a product/UX limit, not a schema limit, since the
 * underlying condition tree supports arbitrary nesting.
 */
export function ConditionGroupEditor({ group, onChange, onRemove, depth = 0 }: ConditionGroupEditorProps) {
  function updateChild(index: number, updated: ConditionNode): void {
    const children = [...group.children];
    children[index] = updated;
    onChange({ ...group, children });
  }

  function removeChild(index: number): void {
    onChange({ ...group, children: group.children.filter((_, i) => i !== index) });
  }

  return (
    <div className={`space-y-3 rounded-lg border border-surface-border p-4 ${depth > 0 ? 'bg-surface-raised' : ''}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium uppercase tracking-wide text-slate-500">Match</span>
          <select
            className="rounded-md border border-surface-border bg-surface px-2 py-1 text-sm font-medium text-brand-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
            value={group.type}
            onChange={(event) => onChange({ ...group, type: event.target.value as 'AND' | 'OR' })}
          >
            <option value="AND">ALL of the following (AND)</option>
            <option value="OR">ANY of the following (OR)</option>
          </select>
        </div>
        {onRemove && (
          <button
            type="button"
            onClick={onRemove}
            className="text-xs font-medium text-loss hover:text-loss/80"
          >
            Remove group
          </button>
        )}
      </div>

      {group.children.length === 0 && (
        <p className="text-sm text-slate-500">No conditions yet - add one below.</p>
      )}

      <div className="space-y-2">
        {group.children.map((child, index) =>
          child.type === 'CONDITION' ? (
            <ConditionLeafEditor
              key={child.id}
              leaf={child}
              onChange={(updated) => updateChild(index, updated)}
              onRemove={() => removeChild(index)}
            />
          ) : (
            <ConditionGroupEditor
              key={child.id}
              group={child}
              onChange={(updated) => updateChild(index, updated)}
              onRemove={() => removeChild(index)}
              depth={depth + 1}
            />
          ),
        )}
      </div>

      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => onChange({ ...group, children: [...group.children, createEmptyCondition()] })}
          className="text-xs font-medium text-brand-400 hover:text-brand-300"
        >
          + Condition
        </button>
        {depth < 2 && (
          <button
            type="button"
            onClick={() => onChange({ ...group, children: [...group.children, createEmptyGroup()] })}
            className="text-xs font-medium text-brand-400 hover:text-brand-300"
          >
            + Nested group
          </button>
        )}
      </div>
    </div>
  );
}

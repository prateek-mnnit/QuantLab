import type { ReactNode } from 'react';
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

const MAX_NESTING_DEPTH = 2;

/** Small dashed-border "chip" affordance shared by the two add actions
    below - neutral by design (no brand-blue text), per the UI-3 direction
    that ordinary actions shouldn't lean on the brand accent color. A plus
    icon (rather than a literal "+" character) keeps it legible at this
    size and matches the stroke-icon style already used in AppShell. */
function AddActionButton({ onClick, children }: { onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1.5 rounded-md border border-dashed border-zinc-700 px-3 py-1.5 text-xs font-medium text-zinc-400 transition-colors hover:border-zinc-500 hover:text-zinc-200"
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" className="h-3.5 w-3.5" aria-hidden="true">
        <path d="M12 5v14M5 12h14" />
      </svg>
      {children}
    </button>
  );
}

/**
 * A two-way segmented control for the group's AND/OR match type - replaces
 * the old plain `<select>` styled in brand-blue text. Both states read as
 * plain, restrained UI chrome; only the ACTIVE option gets a light brand
 * tint, since it's the one piece of state genuinely worth calling out here
 * (a wrong AND/OR choice silently changes what the strategy does).
 */
function MatchTypeToggle({ value, onChange }: { value: 'AND' | 'OR'; onChange: (value: 'AND' | 'OR') => void }) {
  const optionClass = (isActive: boolean): string =>
    `rounded-md px-2.5 py-1 text-xs font-semibold transition-colors ${
      isActive ? 'bg-accent-500/15 text-accent-400' : 'text-zinc-500 hover:text-zinc-300'
    }`;

  return (
    <div role="radiogroup" aria-label="Match type" className="inline-flex items-center rounded-md border border-zinc-700 bg-zinc-900 p-0.5">
      <button type="button" role="radio" aria-checked={value === 'AND'} onClick={() => onChange('AND')} className={optionClass(value === 'AND')}>
        ALL (AND)
      </button>
      <button type="button" role="radio" aria-checked={value === 'OR'} onClick={() => onChange('OR')} className={optionClass(value === 'OR')}>
        ANY (OR)
      </button>
    </div>
  );
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
 *
 * UI-3: a left accent border scales with `depth` so nested groups read as
 * "inside" their parent at a glance, and an inline AND/OR connector renders
 * between sibling rows (not just once in the header) so a dense group of
 * conditions is readable without re-reading the header above it.
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
    <div
      className={`space-y-3 rounded-lg border border-zinc-800 p-4 ${
        depth > 0 ? 'border-l-2 border-l-zinc-700 bg-zinc-900/40' : ''
      }`}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium uppercase tracking-wider text-zinc-600">Match</span>
          <MatchTypeToggle value={group.type} onChange={(type) => onChange({ ...group, type })} />
        </div>
        {onRemove && (
          <button
            type="button"
            onClick={onRemove}
            className="inline-flex items-center gap-1 text-xs font-medium text-loss hover:text-loss/80"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5" aria-hidden="true">
              <path d="M3 6h18M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2m2 0-.867 12.142A2 2 0 0 1 15.138 20H8.862a2 2 0 0 1-1.995-1.858L6 6" />
            </svg>
            Remove group
          </button>
        )}
      </div>

      {group.children.length === 0 && (
        <div className="rounded-md border border-dashed border-zinc-800 px-3 py-3 text-center">
          <p className="text-sm text-zinc-500">No conditions yet — add one below to get started.</p>
        </div>
      )}

      <div className="space-y-2">
        {group.children.map((child, index) => (
          <div key={child.id}>
            {/* Connector between sibling rows, mirroring the group's own
                AND/OR choice - purely presentational, computed fresh from
                `group.type` on every render rather than stored anywhere. */}
            {index > 0 && (
              <div className="flex justify-start py-1 pl-1">
                <span className="rounded bg-zinc-800 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                  {group.type}
                </span>
              </div>
            )}
            {child.type === 'CONDITION' ? (
              <ConditionLeafEditor leaf={child} onChange={(updated) => updateChild(index, updated)} onRemove={() => removeChild(index)} />
            ) : (
              <ConditionGroupEditor
                group={child}
                onChange={(updated) => updateChild(index, updated)}
                onRemove={() => removeChild(index)}
                depth={depth + 1}
              />
            )}
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        <AddActionButton onClick={() => onChange({ ...group, children: [...group.children, createEmptyCondition()] })}>
          Condition
        </AddActionButton>
        {depth < MAX_NESTING_DEPTH && (
          <AddActionButton onClick={() => onChange({ ...group, children: [...group.children, createEmptyGroup()] })}>
            Nested group
          </AddActionButton>
        )}
      </div>
    </div>
  );
}

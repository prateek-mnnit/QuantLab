import { useState } from 'react';
import { STRATEGY_TEMPLATES } from '@quantlab/shared-types';
import type { StrategyTemplate } from '@quantlab/shared-types';

interface StrategyTemplatePickerProps {
  /** Applies a built-in template's input as the new draft (mirrors edit mode's `loadDraft(existingStrategy)` call in StrategyBuilderPage). */
  onSelectTemplate: (template: StrategyTemplate) => void;
  /** Resets to today's existing empty-draft behavior - the "Blank Strategy" option is just this, not template data. */
  onSelectBlank: () => void;
}

/**
 * A row of selectable cards shown above the strategy form when creating a
 * NEW strategy (never in edit mode - editing an existing strategy has
 * nothing to do with templates). Selecting a card immediately replaces the
 * draft and the form below re-renders with the template's conditions and
 * risk settings already filled in, fully editable before saving - the
 * SAME `ConditionGroupEditor`/`RiskManagementFields`/submit flow every
 * hand-built strategy already uses, per Group AB's "do not modify existing
 * strategy creation logic" requirement. This component only ever produces
 * a `StrategyInput` (or triggers the existing blank-draft reset) and hands
 * it to the store - it doesn't touch validation, submission, or persistence
 * itself.
 */
export function StrategyTemplatePicker({ onSelectTemplate, onSelectBlank }: StrategyTemplatePickerProps) {
  // Local-only "which card was last clicked" for a visual highlight - NOT
  // persisted with the draft. The user is free to keep editing after
  // picking a template; this just tracks the picker's own UI state, the
  // same way `pendingDeleteId` in StrategiesPage is local UI state that
  // doesn't belong in a shared store.
  const [selectedId, setSelectedId] = useState<string | null>(null);

  function handleSelectBlank(): void {
    setSelectedId('blank');
    onSelectBlank();
  }

  function handleSelectTemplate(template: StrategyTemplate): void {
    setSelectedId(template.id);
    onSelectTemplate(template);
  }

  const cardClassName = (isSelected: boolean): string =>
    `rounded-lg border p-4 text-left transition-colors ${
      isSelected
        ? 'border-brand-500/60 bg-brand-500/5'
        : 'border-surface-border bg-surface hover:border-slate-600'
    }`;

  return (
    <div className="space-y-3">
      <div>
        <h2 className="text-sm font-semibold text-slate-200">Start from a template</h2>
        <p className="mt-1 text-sm text-slate-400">
          Pick a built-in strategy as a starting point, or start blank - either way, every
          condition and setting below stays fully editable before you save.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <button
          type="button"
          onClick={handleSelectBlank}
          className={cardClassName(selectedId === 'blank')}
        >
          <p className="text-sm font-medium text-slate-100">Blank Strategy</p>
          <p className="mt-1 text-xs text-slate-400">Start from scratch and build your own conditions.</p>
        </button>

        {STRATEGY_TEMPLATES.map((template) => (
          <button
            key={template.id}
            type="button"
            onClick={() => handleSelectTemplate(template)}
            className={cardClassName(selectedId === template.id)}
          >
            <p className="text-sm font-medium text-slate-100">{template.name}</p>
            <p className="mt-1 text-xs text-slate-400">{template.description}</p>
          </button>
        ))}
      </div>
    </div>
  );
}

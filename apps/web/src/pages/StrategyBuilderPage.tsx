import { useEffect, type FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import type { ConditionGroup, StrategyTemplate, Timeframe } from '@quantlab/shared-types';
import { TIMEFRAMES, TIMEFRAME_LABELS } from '@quantlab/shared-types';
import { useStrategyDraftStore } from '../store/strategyDraftStore';
import { useCreateStrategy, useStrategy, useUpdateStrategy } from '../features/strategies/useStrategies';
import { ConditionGroupEditor } from '../features/strategy-builder/ConditionGroupEditor';
import { RiskManagementFields } from '../features/strategy-builder/RiskManagementFields';
import { StrategyTemplatePicker } from '../features/strategy-builder/StrategyTemplatePicker';
import { TextField } from '../components/TextField';
import { Button } from '../components/Button';
import { ApiError } from '../lib/api-client';

/**
 * Handles BOTH create (`/strategies/new`, no `:id`) and edit
 * (`/strategies/:id/edit`) - one page rather than two near-identical ones,
 * since the form itself, validation, and submit handling are identical;
 * only "where does the initial draft come from" and "POST vs PUT" differ.
 */
export function StrategyBuilderPage() {
  const { id } = useParams<{ id: string }>();
  const isEditMode = Boolean(id);
  const navigate = useNavigate();

  const draft = useStrategyDraftStore((state) => state.draft);
  const loadDraft = useStrategyDraftStore((state) => state.load);
  const resetDraft = useStrategyDraftStore((state) => state.reset);
  const updateDraft = useStrategyDraftStore((state) => state.update);

  const { data: existingStrategy, isLoading: isLoadingStrategy } = useStrategy(id);
  const createStrategy = useCreateStrategy();
  const updateStrategy = useUpdateStrategy();

  // Seeds the draft store from the fetched strategy in edit mode, or clears
  // any leftover draft when landing on "new" (e.g. after navigating away
  // from an in-progress edit without saving).
  useEffect(() => {
    if (isEditMode && existingStrategy) {
      // `Strategy.description` is `string | null` (mirrors the nullable DB
      // column); `StrategyInput.description` is `string | undefined` (the
      // zod schema only marks it `.optional()`, never `.nullable()`). These
      // two types genuinely disagree on this one field - null in, undefined
      // out - so it's normalized here rather than loosening either type.
      loadDraft({ ...existingStrategy, description: existingStrategy.description ?? undefined });
    } else if (!isEditMode) {
      resetDraft();
    }
    // Intentionally only re-runs when the route/loaded strategy identity
    // changes, not on every draft edit (which would fight the user's typing).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEditMode, existingStrategy?.id]);

  function handleSubmit(event: FormEvent): void {
    event.preventDefault();
    if (isEditMode && id) {
      updateStrategy.mutate({ id, input: draft }, { onSuccess: () => navigate('/strategies') });
    } else {
      createStrategy.mutate(draft, { onSuccess: () => navigate('/strategies') });
    }
  }

  // Both handlers below only ever call `load`/`reset` - the SAME
  // draft-store actions edit mode (loadDraft(existingStrategy)) and
  // "New Strategy" (resetDraft(), in the effect above) already use. A
  // template is just a different starting point for the exact same draft;
  // handleSubmit above is completely unaware templates exist.
  function handleSelectTemplate(template: StrategyTemplate): void {
    loadDraft(template.input);
  }

  function handleSelectBlank(): void {
    resetDraft();
  }

  const mutation = isEditMode ? updateStrategy : createStrategy;
  const errorMessage =
    mutation.error instanceof ApiError
      ? mutation.error.message
      : mutation.error
        ? 'Something went wrong. Please try again.'
        : null;

  if (isEditMode && isLoadingStrategy) {
    return <p className="text-sm text-slate-400">Loading strategy...</p>;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8 pb-16">
      <div>
        <h1 className="text-2xl font-semibold text-slate-50">
          {isEditMode ? 'Edit strategy' : 'New strategy'}
        </h1>
        <p className="mt-1 text-sm text-slate-400">
          Combine indicators with AND/OR logic to define when this strategy enters and exits a
          position.
        </p>
      </div>

      {/* Templates only make sense when starting a NEW strategy - editing
          an existing one already has a concrete draft loaded from the
          server, which a template has no business overwriting. */}
      {!isEditMode && (
        <StrategyTemplatePicker onSelectTemplate={handleSelectTemplate} onSelectBlank={handleSelectBlank} />
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <TextField
          id="name"
          label="Name"
          required
          value={draft.name}
          onChange={(event) => updateDraft({ name: event.target.value })}
        />
        <div className="space-y-1.5">
          <label htmlFor="timeframe" className="block text-sm font-medium text-slate-300">
            Timeframe
          </label>
          <select
            id="timeframe"
            className="w-full rounded-lg border border-surface-border bg-surface px-3.5 py-2.5 text-sm text-slate-100 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
            value={draft.timeframe}
            onChange={(event) => updateDraft({ timeframe: event.target.value as Timeframe })}
          >
            {TIMEFRAMES.map((value) => (
              <option key={value} value={value}>
                {TIMEFRAME_LABELS[value]}
              </option>
            ))}
          </select>
        </div>
      </div>

      <TextField
        id="description"
        label="Description (optional)"
        value={draft.description ?? ''}
        onChange={(event) => updateDraft({ description: event.target.value })}
      />

      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-slate-200">Entry conditions</h2>
        {/* The root of a draft's condition tree is always a group by
            construction (see strategyDraftStore's defaultDraft and every
            factory in conditionTreeFactories) - this cast reflects that
            guarantee rather than weakening ConditionGroupEditor's props. */}
        <ConditionGroupEditor
          group={draft.entryConditions as ConditionGroup}
          onChange={(entryConditions) => updateDraft({ entryConditions })}
        />
      </div>

      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-slate-200">Exit conditions</h2>
        <ConditionGroupEditor
          group={draft.exitConditions as ConditionGroup}
          onChange={(exitConditions) => updateDraft({ exitConditions })}
        />
      </div>

      <RiskManagementFields
        stopLossConfig={draft.stopLossConfig}
        takeProfitConfig={draft.takeProfitConfig}
        trailingStopConfig={draft.trailingStopConfig}
        positionSizingConfig={draft.positionSizingConfig}
        onStopLossChange={(stopLossConfig) => updateDraft({ stopLossConfig })}
        onTakeProfitChange={(takeProfitConfig) => updateDraft({ takeProfitConfig })}
        onTrailingStopChange={(trailingStopConfig) => updateDraft({ trailingStopConfig })}
        onPositionSizingChange={(positionSizingConfig) => updateDraft({ positionSizingConfig })}
      />

      {errorMessage && <p className="text-sm text-loss">{errorMessage}</p>}

      <div className="flex gap-3">
        <Button type="submit" isLoading={mutation.isPending}>
          {isEditMode ? 'Save changes' : 'Create strategy'}
        </Button>
        <button
          type="button"
          onClick={() => navigate('/strategies')}
          className="text-sm font-medium text-slate-400 hover:text-slate-200"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

import { useEffect, type FormEvent, type ReactNode } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
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

const selectClass =
  'w-full rounded-md border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 focus:border-zinc-600 focus:outline-none focus:ring-1 focus:ring-zinc-600/30 transition-colors disabled:cursor-not-allowed disabled:opacity-50';


/** Shared card chrome for the builder's major sections (details, entry,
    exit) - one consistent container instead of each section inventing its
    own border/padding, so the page reads as a series of clearly separated
    steps rather than one long unbroken form. */
function BuilderSection({
  title,
  description,
  icon,
  children,
}: {
  title: string;
  description?: string;
  icon?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-4 sm:p-5">
      <div className="mb-4 flex items-start gap-3">
        {icon && (
          <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-md bg-zinc-800 text-zinc-400">
            {icon}
          </div>
        )}
        <div>
          <h2 className="text-sm font-semibold text-zinc-100">{title}</h2>
          {description && <p className="mt-0.5 text-xs text-zinc-500">{description}</p>}
        </div>
      </div>
      {children}
    </section>
  );
}


const EntryIcon = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4" aria-hidden="true">
    <path d="M12 19V5M5 12l7-7 7 7" />
  </svg>
);

const ExitIcon = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4" aria-hidden="true">
    <path d="M12 5v14M5 12l7 7 7-7" />
  </svg>
);

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
    return <p className="text-sm text-zinc-400">Loading strategy…</p>;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 pb-16">
      <div>
        <Link
          to="/strategies"
          className="inline-flex items-center gap-1 text-xs font-medium text-zinc-500 transition-colors hover:text-zinc-300"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5" aria-hidden="true">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          Back to strategies
        </Link>
        <h1 className="mt-2 text-2xl font-semibold text-zinc-100">
          {isEditMode ? 'Edit Strategy' : 'New Strategy'}
        </h1>
        <p className="mt-1 text-sm text-zinc-500">
          Combine indicators with AND/OR logic to define when this strategy enters and exits a position.
        </p>
      </div>

      {/* Templates only make sense when starting a NEW strategy - editing
          an existing one already has a concrete draft loaded from the
          server, which a template has no business overwriting. */}
      {!isEditMode && (
        <StrategyTemplatePicker onSelectTemplate={handleSelectTemplate} onSelectBlank={handleSelectBlank} />
      )}

      <BuilderSection title="Strategy details" description="How this strategy is identified across QuantLab.">
        <div className="space-y-4">
          <TextField
            id="name"
            label="Name"
            required
            placeholder="e.g. RSI Oversold Bounce"
            value={draft.name}
            onChange={(event) => updateDraft({ name: event.target.value })}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label htmlFor="timeframe" className="block text-sm font-medium text-zinc-300">
                Timeframe
              </label>
              <select
                id="timeframe"
                className={selectClass}
                value={draft.timeframe}
                onChange={(event) => updateDraft({ timeframe: event.target.value as Timeframe })}
              >
                {TIMEFRAMES.map((value) => (
                  <option key={value} value={value}>
                    {TIMEFRAME_LABELS[value]}
                  </option>
                ))}
              </select>
              <p className="text-xs text-zinc-600">The candle interval this strategy evaluates conditions on.</p>
            </div>
            <TextField
              id="description"
              label="Description (optional)"
              placeholder="A short note on what this strategy does"
              value={draft.description ?? ''}
              onChange={(event) => updateDraft({ description: event.target.value })}
            />
          </div>
        </div>
      </BuilderSection>

      <BuilderSection
        title="Entry conditions"
        description="Must be true to open a new position."
        icon={EntryIcon}
      >
        {/* The root of a draft's condition tree is always a group by
            construction (see strategyDraftStore's defaultDraft and every
            factory in conditionTreeFactories) - this cast reflects that
            guarantee rather than weakening ConditionGroupEditor's props. */}
        <ConditionGroupEditor
          group={draft.entryConditions as ConditionGroup}
          onChange={(entryConditions) => updateDraft({ entryConditions })}
        />
      </BuilderSection>

      <BuilderSection
        title="Exit conditions"
        description="Must be true to close an open position."
        icon={ExitIcon}
      >
        <ConditionGroupEditor
          group={draft.exitConditions as ConditionGroup}
          onChange={(exitConditions) => updateDraft({ exitConditions })}
        />
      </BuilderSection>

      <BuilderSection title="Risk management" description="Optional guardrails applied to every trade this strategy takes.">
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
      </BuilderSection>

      {errorMessage && (
        <p role="alert" className="rounded-lg border border-loss/30 bg-loss/10 px-4 py-3 text-sm text-loss">
          {errorMessage}
        </p>
      )}

      <div className="flex flex-wrap gap-3">
        <Button type="submit" isLoading={mutation.isPending}>
          {isEditMode ? 'Save changes' : 'Create strategy'}
        </Button>
        <Button type="button" variant="secondary" onClick={() => navigate('/strategies')}>
          Cancel
        </Button>
      </div>
    </form>
  );
}

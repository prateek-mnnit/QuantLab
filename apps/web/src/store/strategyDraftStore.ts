import { create } from 'zustand';
import type { StrategyInput } from '@quantlab/shared-types';
import { createEmptyGroup } from '../features/strategy-builder/conditionTreeFactories';

/**
 * The draft's shape IS `StrategyInput` - the exact same type the API
 * expects on create/update - rather than a separate "UI model" that gets
 * transformed before saving. This is the specific design decision called
 * out in the approved architecture: keeping the builder's in-progress state
 * structurally identical to what gets persisted avoids an entire class of
 * bugs where the two representations quietly drift apart.
 */
function defaultDraft(): StrategyInput {
  return {
    name: '',
    description: '',
    timeframe: '1D',
    entryConditions: createEmptyGroup(),
    exitConditions: createEmptyGroup(),
    stopLossConfig: null,
    takeProfitConfig: null,
    trailingStopConfig: null,
    positionSizingConfig: { type: 'PERCENT_CAPITAL', value: 10 },
  };
}

interface StrategyDraftState {
  draft: StrategyInput;
  /** Replaces the draft wholesale - used when opening an existing strategy for editing. */
  load: (input: StrategyInput) => void;
  /** Back to a blank draft - used when starting a new strategy. */
  reset: () => void;
  /** Shallow-merges a partial update - used by every field in the builder form. */
  update: (patch: Partial<StrategyInput>) => void;
}

export const useStrategyDraftStore = create<StrategyDraftState>((set) => ({
  draft: defaultDraft(),
  load: (input) => set({ draft: input }),
  reset: () => set({ draft: defaultDraft() }),
  update: (patch) => set((state) => ({ draft: { ...state.draft, ...patch } })),
}));

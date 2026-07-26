import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { StrategyInput } from '@quantlab/shared-types';
import {
  createStrategyRequest,
  deleteStrategyRequest,
  fetchStrategies,
  fetchStrategy,
  updateStrategyRequest,
} from './api';

const STRATEGIES_QUERY_KEY = ['strategies'] as const;
const strategyQueryKey = (id: string) => ['strategies', id] as const;

export function useStrategies() {
  return useQuery({
    queryKey: STRATEGIES_QUERY_KEY,
    queryFn: fetchStrategies,
  });
}

/**
 * `enabled: Boolean(id)` is TanStack Query's standard pattern for a
 * conditional query - when `id` is undefined (the "new strategy" route),
 * the query simply never runs rather than the caller needing an `if` guard
 * before calling the hook (hooks can't be called conditionally anyway).
 */
export function useStrategy(id: string | undefined) {
  return useQuery({
    queryKey: strategyQueryKey(id ?? ''),
    queryFn: () => fetchStrategy(id as string),
    enabled: Boolean(id),
  });
}

export function useCreateStrategy() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: StrategyInput) => createStrategyRequest(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: STRATEGIES_QUERY_KEY });
    },
  });
}

export function useUpdateStrategy() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: StrategyInput }) => updateStrategyRequest(id, input),
    onSuccess: (_result, variables) => {
      void queryClient.invalidateQueries({ queryKey: STRATEGIES_QUERY_KEY });
      void queryClient.invalidateQueries({ queryKey: strategyQueryKey(variables.id) });
    },
  });
}

export function useDeleteStrategy() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteStrategyRequest(id),
    // Refetch the list after a successful delete rather than manually
    // splicing the deleted item out of cached data - simpler and less
    // error-prone at this scale, and the list is cheap to refetch.
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: STRATEGIES_QUERY_KEY });
    },
  });
}

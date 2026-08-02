import { useMutation, useQuery } from '@tanstack/react-query';
import type { RunBacktestInput } from '@quantlab/shared-types';
import { fetchBacktest, fetchBacktests, fetchBacktestTrades, runBacktestRequest } from './api';

/**
 * No onSuccess side effect here (unlike useCreateStrategy, which
 * invalidates the strategies list) - running a backtest doesn't change any
 * other cached data the app currently shows; the caller navigates to the
 * new run's detail page instead, where useBacktest below fetches fresh.
 */
export function useRunBacktest() {
  return useMutation({
    mutationFn: (input: RunBacktestInput) => runBacktestRequest(input),
  });
}

export function useBacktest(id: string | undefined) {
  return useQuery({
    queryKey: ['backtests', id],
    queryFn: () => fetchBacktest(id as string),
    enabled: Boolean(id),
  });
}

export function useBacktestTrades(id: string | undefined) {
  return useQuery({
    queryKey: ['backtests', id, 'trades'],
    queryFn: () => fetchBacktestTrades(id as string),
    enabled: Boolean(id),
  });
}

export function useBacktestsList(strategyId?: string) {
  return useQuery({
    queryKey: ['backtests', 'list', strategyId ?? 'all'],
    queryFn: () => fetchBacktests(strategyId),
  });
}

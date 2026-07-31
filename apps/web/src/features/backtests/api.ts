import type { BacktestRun, RunBacktestInput } from '@quantlab/shared-types';
import { apiRequest } from '../../lib/api-client';

export function runBacktestRequest(input: RunBacktestInput): Promise<BacktestRun> {
  return apiRequest<BacktestRun>('/backtests', { method: 'POST', body: JSON.stringify(input) });
}

export function fetchBacktest(id: string): Promise<BacktestRun> {
  return apiRequest<BacktestRun>(`/backtests/${id}`);
}

import type { Strategy, StrategyInput, StrategySummary } from '@quantlab/shared-types';
import { apiRequest } from '../../lib/api-client';

export function fetchStrategies(): Promise<StrategySummary[]> {
  return apiRequest<StrategySummary[]>('/strategies');
}

export function fetchStrategy(id: string): Promise<Strategy> {
  return apiRequest<Strategy>(`/strategies/${id}`);
}

export function createStrategyRequest(input: StrategyInput): Promise<Strategy> {
  return apiRequest<Strategy>('/strategies', { method: 'POST', body: JSON.stringify(input) });
}

export function updateStrategyRequest(id: string, input: StrategyInput): Promise<Strategy> {
  return apiRequest<Strategy>(`/strategies/${id}`, { method: 'PUT', body: JSON.stringify(input) });
}

export function deleteStrategyRequest(id: string): Promise<void> {
  return apiRequest<void>(`/strategies/${id}`, { method: 'DELETE' });
}

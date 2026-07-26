import type { StrategySummary } from '@quantlab/shared-types';
import { apiRequest } from '../../lib/api-client';

export function fetchStrategies(): Promise<StrategySummary[]> {
  return apiRequest<StrategySummary[]>('/strategies');
}

export function deleteStrategyRequest(id: string): Promise<void> {
  return apiRequest<void>(`/strategies/${id}`, { method: 'DELETE' });
}

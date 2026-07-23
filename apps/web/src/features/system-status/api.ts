import type { HealthCheckResult } from '@quantlab/shared-types';
import { apiRequest } from '../../lib/api-client';

export function fetchHealth(): Promise<HealthCheckResult> {
  return apiRequest<HealthCheckResult>('/health');
}

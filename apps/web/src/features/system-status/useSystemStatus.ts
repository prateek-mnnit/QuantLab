import { useQuery } from '@tanstack/react-query';
import { fetchHealth } from './api';

/**
 * Polls the API's health endpoint so the dashboard can show a live
 * connected/disconnected indicator - useful in development for immediately
 * spotting "the API isn't running" instead of silently failing requests.
 * A short refetchInterval is fine here specifically because the payload is
 * tiny and the endpoint is deliberately cheap to call.
 */
export function useSystemStatus() {
  return useQuery({
    queryKey: ['system-status'],
    queryFn: fetchHealth,
    refetchInterval: 15_000,
    retry: false,
  });
}

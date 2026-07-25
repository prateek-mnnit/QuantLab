import { useEffect } from 'react';
import { useAuthStore } from '../../store/authStore';
import { refreshRequest } from './api';

/**
 * Runs once per app load (guarded by `status !== 'idle'`, so it never
 * re-fires on every re-render). Not a TanStack Query `useQuery` on purpose:
 * this isn't cacheable "data" a component reads - it's a one-time
 * side effect that seeds the auth store, which is exactly what a plain
 * `useEffect` is for.
 */
export function useSessionBootstrap(): void {
  const status = useAuthStore((state) => state.status);
  const setAccessToken = useAuthStore((state) => state.setAccessToken);
  const clearSession = useAuthStore((state) => state.clearSession);

  useEffect(() => {
    if (status !== 'idle') return;

    refreshRequest()
      .then((result) => setAccessToken(result.accessToken))
      .catch(() => clearSession());
  }, [status, setAccessToken, clearSession]);
}

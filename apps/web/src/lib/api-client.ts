import type { ApiResponse } from '@quantlab/shared-types';
import { useAuthStore } from '../store/authStore';

const API_URL = import.meta.env.VITE_API_URL;

/**
 * Thrown when the API responds with `success: false`. Kept as a distinct
 * class (rather than throwing a plain string/object) so calling code and
 * TanStack Query's `error` handling can reliably do `instanceof ApiError`.
 */
export class ApiError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// Routes that should NEVER trigger a silent-refresh-and-retry - refreshing
// in response to a failed login/register would be nonsensical (there's no
// valid session to refresh yet), and retrying `/auth/refresh` itself on its
// own 401 would either loop or just be redundant.
const REFRESH_EXEMPT_PATHS = new Set(['/auth/login', '/auth/register', '/auth/refresh']);

let refreshPromise: Promise<string | null> | null = null;

/**
 * Trades the httpOnly refresh cookie for a new access token. Deduplicated
 * via the module-level `refreshPromise`: if this is called again while a
 * refresh is already in flight, every caller awaits the SAME promise
 * instead of firing a second concurrent refresh (which would attempt to
 * rotate an already-rotated token and fail).
 */
function refreshAccessToken(): Promise<string | null> {
  if (!refreshPromise) {
    refreshPromise = (async () => {
      try {
        const response = await fetch(`${API_URL}/auth/refresh`, {
          method: 'POST',
          credentials: 'include',
        });
        if (!response.ok) return null;

        const body = (await response.json()) as ApiResponse<{ accessToken: string }>;
        if (!body.success) return null;

        useAuthStore.getState().setAccessToken(body.data.accessToken);
        return body.data.accessToken;
      } catch {
        return null;
      } finally {
        refreshPromise = null;
      }
    })();
  }
  return refreshPromise;
}

/**
 * Single fetch wrapper every feature's API calls go through. Beyond
 * unwrapping the `ApiResponse<T>` envelope (as in Phase 1), it now: (1)
 * attaches the current access token from the auth store, and (2) on a 401,
 * attempts exactly one silent refresh-and-retry before giving up - callers
 * (React Query hooks, etc.) never have to think about token expiry
 * themselves, they just get back `T` or a caught `ApiError`.
 */
export async function apiRequest<T>(
  path: string,
  init?: RequestInit,
  isRetry = false,
): Promise<T> {
  const accessToken = useAuthStore.getState().accessToken;

  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...init?.headers,
    },
    credentials: 'include',
  });

  if (response.status === 401 && !isRetry && !REFRESH_EXEMPT_PATHS.has(path)) {
    const newToken = await refreshAccessToken();
    if (newToken) {
      return apiRequest<T>(path, init, true);
    }
    // Refresh itself failed - the session is genuinely over (cookie
    // expired/revoked), so reflect that in the store rather than leaving
    // stale "logged in" state around.
    useAuthStore.getState().clearSession();
  }

  const body = (await response.json()) as ApiResponse<T>;

  if (!body.success) {
    throw new ApiError(body.error.message, body.error.code, body.error.details);
  }

  return body.data;
}

import type { ApiResponse } from '@quantlab/shared-types';

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

/**
 * Single fetch wrapper every feature's API calls go through, instead of
 * calling `fetch` directly all over the codebase. This is the one place
 * that knows the base URL, unwraps the `ApiResponse<T>` envelope, and turns
 * a `success: false` response into a thrown `ApiError` - callers just get
 * back `T` or a caught error, matching how TanStack Query expects an async
 * function to behave.
 */
export async function apiRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...init?.headers,
    },
    credentials: 'include',
  });

  const body = (await response.json()) as ApiResponse<T>;

  if (!body.success) {
    throw new ApiError(body.error.message, body.error.code, body.error.details);
  }

  return body.data;
}

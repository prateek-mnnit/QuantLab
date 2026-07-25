import { create } from 'zustand';
import type { AuthUser } from '@quantlab/shared-types';

type AuthStatus = 'idle' | 'authenticated' | 'unauthenticated';

interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  /**
   * 'idle' = haven't checked yet (app just loaded, session bootstrap hasn't
   * resolved). Kept distinct from 'unauthenticated' so a protected route
   * can show a loading state on first load instead of flashing the login
   * page for a split second before the silent-refresh check finishes.
   */
  status: AuthStatus;
  setSession: (user: AuthUser, accessToken: string) => void;
  /** Used after a silent refresh, where we get a new token but not a fresh user object. */
  setAccessToken: (accessToken: string) => void;
  clearSession: () => void;
}

/**
 * `create` returns a hook (`useAuthStore`) components call like
 * `useAuthStore((state) => state.user)`. Selecting just the field you need,
 * rather than the whole store, is what keeps re-renders scoped - a
 * component reading only `user` doesn't re-render when `accessToken`
 * changes on its own (e.g. during a silent refresh).
 */
export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  status: 'idle',

  setSession: (user, accessToken) => set({ user, accessToken, status: 'authenticated' }),

  setAccessToken: (accessToken) => set({ accessToken, status: 'authenticated' }),

  clearSession: () => set({ user: null, accessToken: null, status: 'unauthenticated' }),
}));

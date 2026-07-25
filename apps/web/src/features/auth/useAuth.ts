import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { LoginPayload, RegisterPayload } from '@quantlab/shared-types';
import { useAuthStore } from '../../store/authStore';
import { loginRequest, logoutRequest, registerRequest } from './api';

export function useLogin() {
  const setSession = useAuthStore((state) => state.setSession);

  return useMutation({
    mutationFn: (payload: LoginPayload) => loginRequest(payload),
    onSuccess: (result) => {
      setSession(result.user, result.tokens.accessToken);
    },
  });
}

export function useRegister() {
  // Registration deliberately does NOT log the user in - it just creates
  // the account. Keeping "create an account" and "start a session" as two
  // separate, explicit steps is simpler to reason about than an implicit
  // auto-login, and matches what most real products do (confirm the
  // account exists, then send the user to log in).
  return useMutation({
    mutationFn: (payload: RegisterPayload) => registerRequest(payload),
  });
}

export function useLogout() {
  const clearSession = useAuthStore((state) => state.clearSession);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: logoutRequest,
    onSuccess: () => {
      clearSession();
      // Every cached query (strategies, etc.) belonged to the now-logged-
      // out user - clear the cache so a subsequent login doesn't briefly
      // flash stale data from the previous session before queries refetch.
      queryClient.clear();
    },
  });
}

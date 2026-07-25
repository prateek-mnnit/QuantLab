import type { AuthUser, LoginPayload, LoginResult, RegisterPayload } from '@quantlab/shared-types';
import { apiRequest } from '../../lib/api-client';

export function registerRequest(payload: RegisterPayload): Promise<AuthUser> {
  return apiRequest<AuthUser>('/auth/register', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function loginRequest(payload: LoginPayload): Promise<LoginResult> {
  return apiRequest<LoginResult>('/auth/login', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function refreshRequest(): Promise<{ accessToken: string }> {
  return apiRequest<{ accessToken: string }>('/auth/refresh', { method: 'POST' });
}

export function logoutRequest(): Promise<{ loggedOut: true }> {
  return apiRequest<{ loggedOut: true }>('/auth/logout', { method: 'POST' });
}

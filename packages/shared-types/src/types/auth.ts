/**
 * Shared between the frontend auth store and the backend auth controller,
 * so the "what does a logged-in user look like" contract lives in one
 * place. Deliberately excludes passwordHash - the API never sends it, so it
 * has no business existing in a type the frontend imports.
 */
export interface AuthUser {
  id: string;
  email: string;
}

export interface AuthTokens {
  /** Short-lived JWT sent in the Authorization header on every request. */
  accessToken: string;
}

export interface LoginResult {
  user: AuthUser;
  tokens: AuthTokens;
}

export interface RegisterPayload {
  email: string;
  password: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

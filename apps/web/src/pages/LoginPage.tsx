import { useState, type FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useLogin } from '../features/auth/useAuth';
import { TextField } from '../components/TextField';
import { Button } from '../components/Button';
import { ApiError } from '../lib/api-client';

interface LocationState {
  from?: { pathname: string };
  justRegistered?: boolean;
}

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const login = useLogin();
  const navigate = useNavigate();
  const location = useLocation();

  const state = location.state as LocationState | null;
  const redirectTo = state?.from?.pathname ?? '/';

  function handleSubmit(event: FormEvent): void {
    event.preventDefault();
    login.mutate(
      { email, password },
      { onSuccess: () => navigate(redirectTo, { replace: true }) },
    );
  }

  // Distinguish an ApiError (the server told us something specific, e.g.
  // "Invalid email or password") from any other failure (network down,
  // unexpected exception) - the latter gets a generic message rather than
  // risking leaking something unhelpful or too technical to the user.
  const errorMessage =
    login.error instanceof ApiError
      ? login.error.message
      : login.error
        ? 'Something went wrong. Please try again.'
        : null;

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface px-4">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-brand-500 text-lg font-bold text-white">
            Q
          </div>
          <h1 className="text-xl font-semibold text-slate-50">Sign in to QuantLab</h1>
          <p className="mt-1 text-sm text-slate-400">
            Build, backtest, and analyze trading strategies.
          </p>
        </div>

        {state?.justRegistered && (
          <div className="rounded-lg border border-profit/30 bg-profit/10 px-4 py-3 text-sm text-profit">
            Account created. Sign in to continue.
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="space-y-5 rounded-xl border border-surface-border bg-surface-raised p-6"
        >
          <TextField
            id="email"
            label="Email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
          <TextField
            id="password"
            label="Password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />

          {errorMessage && <p className="text-sm text-loss">{errorMessage}</p>}

          <Button type="submit" isLoading={login.isPending} className="w-full">
            Sign in
          </Button>
        </form>

        <p className="text-center text-sm text-slate-400">
          Don&apos;t have an account?{' '}
          <Link to="/register" className="font-medium text-brand-400 hover:text-brand-300">
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
}

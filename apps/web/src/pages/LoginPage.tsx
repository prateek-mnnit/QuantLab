import { useState, useEffect, type FormEvent } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useLogin } from '../features/auth/useAuth';
import { TextField } from '../components/TextField';
import { Button } from '../components/Button';
import { ApiError } from '../lib/api-client';

function ChartIcon() {
  return (
    <svg viewBox="0 0 32 32" fill="none" className="h-9 w-9" aria-hidden="true">
      <rect width="32" height="32" rx="7" fill="#22c55e" fillOpacity="0.15" />
      <polyline
        points="6 20 11 12 16 16 21 8 26 14"
        stroke="#22c55e"
        strokeWidth="2.25"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const login = useLogin();
  const navigate = useNavigate();
  const location = useLocation();
  const authStatus = useAuthStore((state) => state.status);

  useEffect(() => {
    if (authStatus === 'authenticated') {
      const from = location.state?.from?.pathname || '/';
      navigate(from, { replace: true });
    }
  }, [authStatus, navigate, location]);

  function handleSubmit(event: FormEvent): void {
    event.preventDefault();
    login.mutate({ email, password });
  }

  const errorMessage =
    login.error instanceof ApiError
      ? login.error.message
      : login.error
        ? 'An unexpected error occurred. Please try again.'
        : null;

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      {/* Background ambient */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden="true">
        <div className="absolute -top-32 left-1/2 h-64 w-64 -translate-x-1/2 rounded-full bg-accent-500/5 blur-3xl" />
      </div>

      <div className="relative w-full max-w-sm">
        {/* Logo */}
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <ChartIcon />
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-zinc-100">QuantLab</h1>
            <p className="mt-1 text-sm text-zinc-500">Professional backtesting & strategy builder</p>
          </div>
        </div>

        {/* Card */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/80 p-7 shadow-surface backdrop-blur-sm">
          <h2 className="mb-5 text-base font-semibold text-zinc-100">Sign in to your account</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <TextField
              id="email"
              label="Email"
              type="email"
              placeholder="you@example.com"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <TextField
              id="password"
              label="Password"
              type="password"
              placeholder="••••••••"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            {errorMessage && (
              <p className="rounded-md bg-red-500/10 px-3 py-2 text-sm text-red-400">
                {errorMessage}
              </p>
            )}

            <Button
              type="submit"
              isLoading={login.isPending}
              className="w-full justify-center"
            >
              Sign in
            </Button>
          </form>

          <p className="mt-5 text-center text-sm text-zinc-600">
            Don&apos;t have an account?{' '}
            <Link to="/register" className="font-medium text-zinc-300 hover:text-zinc-100 underline decoration-zinc-700 underline-offset-4 transition-colors">
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

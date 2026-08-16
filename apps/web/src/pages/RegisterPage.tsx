import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { useRegister } from '../features/auth/useAuth';
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

export function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [clientError, setClientError] = useState<string | null>(null);
  const register = useRegister();

  function handleSubmit(event: FormEvent): void {
    event.preventDefault();
    setClientError(null);
    if (password !== confirmPassword) {
      setClientError('Passwords do not match.');
      return;
    }
    if (password.length < 8) {
      setClientError('Password must be at least 8 characters.');
      return;
    }
    register.mutate({ email, password });
  }

  const errorMessage =
    clientError ??
    (register.error instanceof ApiError
      ? register.error.message
      : register.error
        ? 'An unexpected error occurred. Please try again.'
        : null);

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
          <h2 className="mb-5 text-base font-semibold text-zinc-100">Create an account</h2>

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
              placeholder="Min 8 characters"
              autoComplete="new-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <TextField
              id="confirmPassword"
              label="Confirm Password"
              type="password"
              placeholder="Re-enter your password"
              autoComplete="new-password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />

            {errorMessage && (
              <p className="rounded-md bg-red-500/10 px-3 py-2 text-sm text-red-400">
                {errorMessage}
              </p>
            )}

            <Button
              type="submit"
              isLoading={register.isPending}
              className="w-full justify-center"
            >
              Create account
            </Button>
          </form>

          <p className="mt-5 text-center text-sm text-zinc-600">
            Already have an account?{' '}
            <Link to="/login" className="font-medium text-zinc-300 hover:text-zinc-100 underline decoration-zinc-700 underline-offset-4 transition-colors">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

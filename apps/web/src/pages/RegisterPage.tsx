import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useRegister } from '../features/auth/useAuth';
import { TextField } from '../components/TextField';
import { Button } from '../components/Button';
import { ApiError } from '../lib/api-client';

export function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [clientError, setClientError] = useState<string | null>(null);

  const register = useRegister();
  const navigate = useNavigate();

  function handleSubmit(event: FormEvent): void {
    event.preventDefault();
    setClientError(null);

    if (password !== confirmPassword) {
      setClientError('Passwords do not match.');
      return;
    }

    register.mutate(
      { email, password },
      {
        // Send them to login rather than logging in automatically here -
        // register and login are two separate use cases (see useAuth.ts),
        // and this keeps that boundary visible in the actual user flow too.
        onSuccess: () => navigate('/login', { state: { justRegistered: true }, replace: true }),
      },
    );
  }

  const errorMessage =
    clientError ??
    (register.error instanceof ApiError
      ? register.error.message
      : register.error
        ? 'Something went wrong. Please try again.'
        : null);

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface px-4">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-brand-500 text-lg font-bold text-white">
            Q
          </div>
          <h1 className="text-xl font-semibold text-slate-50">Create your account</h1>
          <p className="mt-1 text-sm text-slate-400">
            Start building no-code trading strategies.
          </p>
        </div>

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
            autoComplete="new-password"
            required
            minLength={12}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
          <TextField
            id="confirmPassword"
            label="Confirm password"
            type="password"
            autoComplete="new-password"
            required
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
          />

          {errorMessage && <p className="text-sm text-loss">{errorMessage}</p>}

          <Button type="submit" isLoading={register.isPending} className="w-full">
            Create account
          </Button>
        </form>

        <p className="text-center text-sm text-slate-400">
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-brand-400 hover:text-brand-300">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}

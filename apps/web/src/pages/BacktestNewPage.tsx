import { useState, type FormEvent } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import type { Timeframe } from '@quantlab/shared-types';
import { TIMEFRAMES, TIMEFRAME_LABELS, isIntradayTimeframe } from '@quantlab/shared-types';
import { useStrategies } from '../features/strategies/useStrategies';
import { useRunBacktest } from '../features/backtests/useBacktests';
import { TextField } from '../components/TextField';
import { Button } from '../components/Button';
import { ApiError } from '../lib/api-client';

// Consistent select styling matching TextField
const selectClass =
  'w-full rounded-md border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 focus:border-zinc-600 focus:outline-none focus:ring-1 focus:ring-zinc-600/30 transition-colors disabled:cursor-not-allowed disabled:opacity-50';

export function BacktestNewPage() {
  const [searchParams]  = useSearchParams();
  const navigate        = useNavigate();

  const { data: strategies, isLoading: isLoadingStrategies } = useStrategies();
  const runBacktest = useRunBacktest();

  const [strategyId, setStrategyId] = useState(searchParams.get('strategyId') ?? '');
  const [symbol,     setSymbol]     = useState('');
  const [timeframe,  setTimeframe]  = useState<Timeframe>('1D');
  const [dateFrom,   setDateFrom]   = useState('');
  const [dateTo,     setDateTo]     = useState('');
  const [clientError, setClientError] = useState<string | null>(null);

  function handleSubmit(event: FormEvent): void {
    event.preventDefault();
    setClientError(null);

    if (!strategyId || !symbol.trim() || !dateFrom || !dateTo) {
      setClientError('All fields are required.');
      return;
    }
    if (new Date(dateFrom) >= new Date(dateTo)) {
      setClientError('"Date From" must be earlier than "Date To".');
      return;
    }

    runBacktest.mutate(
      { strategyId, symbol: symbol.trim().toUpperCase(), timeframe, dateFrom, dateTo },
      { onSuccess: (run) => navigate(`/backtests/${run.id}`) },
    );
  }

  const errorMessage =
    clientError ??
    (runBacktest.error instanceof ApiError
      ? runBacktest.error.message
      : runBacktest.error ? 'Something went wrong. Please try again.' : null);

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-zinc-100">Run Backtest</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Test a saved strategy against historical price data.
        </p>
      </div>

      {/* Form card */}
      <div className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-6">
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Strategy select */}
          <div className="space-y-1.5">
            <label htmlFor="strategyId" className="block text-sm font-medium text-zinc-300">
              Strategy
            </label>
            <select
              id="strategyId"
              required
              value={strategyId}
              onChange={(e) => setStrategyId(e.target.value)}
              className={selectClass}
            >
              <option value="" disabled>
                {isLoadingStrategies ? 'Loading strategies…' : 'Select a strategy'}
              </option>
              {strategies?.map((strategy) => (
                <option key={strategy.id} value={strategy.id}>
                  {strategy.name}
                </option>
              ))}
            </select>
            {strategies && strategies.length === 0 && (
              <p className="text-xs text-zinc-600">
                You don&apos;t have any strategies yet. Please <Link to="/strategies/new" className="text-zinc-300 hover:text-zinc-100 underline decoration-zinc-700 underline-offset-4">create one first</Link>.
              </p>
            )}
          </div>

          {/* Symbol + Timeframe row */}
          <div className="grid grid-cols-2 gap-4">
            <TextField
              id="symbol"
              label="Symbol"
              placeholder="e.g. AAPL"
              required
              value={symbol}
              onChange={(e) => setSymbol(e.target.value)}
            />
            <div className="space-y-1.5">
              <label htmlFor="timeframe" className="block text-sm font-medium text-zinc-300">
                Timeframe
              </label>
              <select
                id="timeframe"
                value={timeframe}
                onChange={(e) => setTimeframe(e.target.value as Timeframe)}
                className={selectClass}
              >
                {TIMEFRAMES.map((value) => (
                  <option key={value} value={value}>{TIMEFRAME_LABELS[value]}</option>
                ))}
              </select>
            </div>
          </div>

          {isIntradayTimeframe(timeframe) && (
            <p className="text-xs text-zinc-600">
              Intraday history is limited to roughly
              {timeframe === '1H' || timeframe === '4H' ? ' 2 years' : ' 60 days'}.
            </p>
          )}

          {/* Date range */}
          <div className="grid grid-cols-2 gap-4">
            <TextField
              id="dateFrom"
              label="Date From"
              type="date"
              required
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
            />
            <TextField
              id="dateTo"
              label="Date To"
              type="date"
              required
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
            />
          </div>

          {/* Error */}
          {errorMessage && (
            <p className="rounded-md bg-red-500/10 px-3 py-2 text-sm text-red-400">{errorMessage}</p>
          )}

          {/* Actions */}
          <div className="flex items-center gap-3 pt-1">
            <Button type="submit" isLoading={runBacktest.isPending}>
              Run Backtest
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => navigate('/strategies')}
            >
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

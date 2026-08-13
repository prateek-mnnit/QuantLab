import { useState, type FormEvent } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import type { Timeframe } from '@quantlab/shared-types';
import { TIMEFRAMES, TIMEFRAME_LABELS, isIntradayTimeframe } from '@quantlab/shared-types';
import { useStrategies } from '../features/strategies/useStrategies';
import { useRunBacktest } from '../features/backtests/useBacktests';
import { TextField } from '../components/TextField';
import { Button } from '../components/Button';
import { ApiError } from '../lib/api-client';

const selectClass =
  'w-full rounded-lg border border-surface-border bg-surface px-3.5 py-2.5 text-sm text-slate-100 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500';

/**
 * `?strategyId=` lets the "Run" link on StrategiesPage arrive here with
 * the strategy already selected, while the field itself stays a real,
 * editable part of the form (per the requirement that strategy selection
 * be a form field, not just an implicit URL param) - a user can still open
 * this page directly and pick any of their strategies.
 */
export function BacktestNewPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const { data: strategies, isLoading: isLoadingStrategies } = useStrategies();
  const runBacktest = useRunBacktest();

  const [strategyId, setStrategyId] = useState(searchParams.get('strategyId') ?? '');
  const [symbol, setSymbol] = useState('');
  const [timeframe, setTimeframe] = useState<Timeframe>('1D');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
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
      : runBacktest.error
        ? 'Something went wrong. Please try again.'
        : null);

  return (
    <div className="mx-auto max-w-xl space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-slate-50">Run Backtest</h1>
        <p className="mt-1 text-sm text-slate-400">
          Test a saved strategy against historical price data.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="space-y-5 rounded-xl border border-surface-border bg-surface-raised p-6"
      >
        <div className="space-y-1.5">
          <label htmlFor="strategyId" className="block text-sm font-medium text-slate-300">
            Strategy
          </label>
          <select
            id="strategyId"
            required
            value={strategyId}
            onChange={(event) => setStrategyId(event.target.value)}
            className={selectClass}
          >
            <option value="" disabled>
              {isLoadingStrategies ? 'Loading strategies...' : 'Select a strategy'}
            </option>
            {strategies?.map((strategy) => (
              <option key={strategy.id} value={strategy.id}>
                {strategy.name}
              </option>
            ))}
          </select>
          {strategies && strategies.length === 0 && (
            <p className="text-xs text-slate-500">
              You don&apos;t have any saved strategies yet - create one first.
            </p>
          )}
        </div>

        <TextField
          id="symbol"
          label="Symbol"
          placeholder="e.g. AAPL"
          required
          value={symbol}
          onChange={(event) => setSymbol(event.target.value)}
        />

        <div className="space-y-1.5">
          <label htmlFor="timeframe" className="block text-sm font-medium text-slate-300">
            Timeframe
          </label>
          <select
            id="timeframe"
            value={timeframe}
            onChange={(event) => setTimeframe(event.target.value as Timeframe)}
            className={selectClass}
          >
            {TIMEFRAMES.map((value) => (
              <option key={value} value={value}>
                {TIMEFRAME_LABELS[value]}
              </option>
            ))}
          </select>
          {isIntradayTimeframe(timeframe) && (
            <p className="text-xs text-slate-500">
              Intraday history from the data provider is limited to roughly the last
              {timeframe === '1H' || timeframe === '4H' ? ' 2 years' : ' 60 days'}.
            </p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <TextField
            id="dateFrom"
            label="Date From"
            type="date"
            required
            value={dateFrom}
            onChange={(event) => setDateFrom(event.target.value)}
          />
          <TextField
            id="dateTo"
            label="Date To"
            type="date"
            required
            value={dateTo}
            onChange={(event) => setDateTo(event.target.value)}
          />
        </div>

        {errorMessage && <p className="text-sm text-loss">{errorMessage}</p>}

        <div className="flex gap-3">
          <Button type="submit" isLoading={runBacktest.isPending}>
            Run Backtest
          </Button>
          <Button type="button" variant="secondary" onClick={() => navigate('/strategies')}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}

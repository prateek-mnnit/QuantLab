import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useChartViewStore } from '../store/chartViewStore';
import {
  useWatchlist,
  useAddToWatchlist,
  useRemoveFromWatchlist,
} from '../features/watchlist/useWatchlist';
import { TextField } from '../components/TextField';
import { Button } from '../components/Button';
import { ApiError } from '../lib/api-client';

export function WatchlistPage() {
  const navigate = useNavigate();
  const selectChartSymbol = useChartViewStore((state) => state.selectSymbol);

  const { data: items, isLoading, isError } = useWatchlist();
  const addToWatchlist      = useAddToWatchlist();
  const removeFromWatchlist = useRemoveFromWatchlist();

  const [symbolInput, setSymbolInput] = useState('');
  const [clientError, setClientError] = useState<string | null>(null);

  function handleAdd(event: FormEvent): void {
    event.preventDefault();
    setClientError(null);
    const trimmed = symbolInput.trim().toUpperCase();
    if (!trimmed) {
      setClientError('Please enter a symbol.');
      return;
    }
    if (items?.some((item) => item.symbol.toUpperCase() === trimmed)) {
      setClientError(`${trimmed} is already in your watchlist.`);
      return;
    }
    addToWatchlist.mutate(
      trimmed,
      { onSuccess: () => setSymbolInput('') },
    );
  }

  function goToChart(symbol: string): void {
    selectChartSymbol({ symbol, name: symbol, exchange: '' });
    navigate('/chart');
  }

  const addError =
    clientError ??
    (addToWatchlist.error instanceof ApiError
      ? addToWatchlist.error.message
      : addToWatchlist.error ? 'Failed to add symbol.' : null);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-zinc-100">Watchlist</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Track symbols and jump to their charts.
        </p>
      </div>

      {/* Add symbol form */}
      <div className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-4">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">
          Add Symbol
        </p>
        <form onSubmit={handleAdd} className="flex flex-wrap items-end gap-3">
          <div className="w-64">
            <TextField
              id="symbol-input"
              label="Symbol"
              placeholder="e.g. RELIANCE.NS"
              value={symbolInput}
              onChange={(e) => setSymbolInput(e.target.value)}
              error={addError ?? undefined}
            />
          </div>
          <Button
            type="submit"
            isLoading={addToWatchlist.isPending}
            className="mb-0"
          >
            Add
          </Button>
        </form>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-12 animate-pulse rounded-lg bg-zinc-800/50" />
          ))}
        </div>
      )}

      {/* Error */}
      {isError && (
        <p className="text-sm text-red-400">Couldn&apos;t load watchlist. Please refresh.</p>
      )}

      {/* Table */}
      {items && (
        items.length === 0 ? (
          <div className="rounded-lg border border-dashed border-zinc-800 px-6 py-12 text-center">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1} strokeLinecap="round" strokeLinejoin="round" className="mx-auto mb-3 h-10 w-10 text-zinc-700" aria-hidden="true">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
            <p className="text-sm text-zinc-500">Your watchlist is empty.</p>
            <p className="mt-1 text-xs text-zinc-600">Add a symbol above to start tracking it.</p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-lg border border-zinc-800">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-zinc-800 bg-zinc-900/80">
                  <th className="px-4 py-2.5 text-xs font-medium uppercase tracking-wider text-zinc-600">Symbol</th>
                  <th className="px-3 py-2.5 text-xs font-medium uppercase tracking-wider text-zinc-600">Added</th>
                  <th className="px-4 py-2.5 text-right text-xs font-medium uppercase tracking-wider text-zinc-600">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id} className="border-b border-zinc-800/50 transition-colors duration-75 last:border-b-0 hover:bg-zinc-800/30">
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => goToChart(item.symbol)}
                        className="font-semibold text-zinc-100 hover:text-zinc-300 transition-colors"
                      >
                        {item.symbol}
                      </button>
                    </td>
                    <td className="px-3 py-3 text-sm text-zinc-500">
                      {new Date(item.addedAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => removeFromWatchlist.mutate(item.id)}
                        disabled={removeFromWatchlist.isPending}
                        className="text-xs font-medium text-red-500 hover:text-red-400 transition-colors disabled:opacity-50"
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}
    </div>
  );
}

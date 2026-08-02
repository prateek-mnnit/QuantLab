import { useState, type FormEvent } from 'react';
import { useAddToWatchlist, useRemoveFromWatchlist, useWatchlist } from '../features/watchlist/useWatchlist';
import { TextField } from '../components/TextField';
import { Button } from '../components/Button';
import { ApiError } from '../lib/api-client';

export function WatchlistPage() {
  const { data: items, isLoading, isError } = useWatchlist();
  const addToWatchlist = useAddToWatchlist();
  const removeFromWatchlist = useRemoveFromWatchlist();

  const [symbol, setSymbol] = useState('');
  const [pendingRemoveSymbol, setPendingRemoveSymbol] = useState<string | null>(null);

  function handleSubmit(event: FormEvent): void {
    event.preventDefault();
    const trimmed = symbol.trim();
    if (!trimmed) return;

    addToWatchlist.mutate(trimmed, { onSuccess: () => setSymbol('') });
  }

  function handleRemove(itemSymbol: string): void {
    setPendingRemoveSymbol(itemSymbol);
    removeFromWatchlist.mutate(itemSymbol, { onSettled: () => setPendingRemoveSymbol(null) });
  }

  const addErrorMessage =
    addToWatchlist.error instanceof ApiError
      ? addToWatchlist.error.message
      : addToWatchlist.error
        ? 'Something went wrong. Please try again.'
        : null;

  return (
    <div className="max-w-xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-50">Watchlist</h1>
        <p className="mt-1 text-sm text-slate-400">Symbols you&apos;re keeping an eye on.</p>
      </div>

      <form onSubmit={handleSubmit} className="flex items-end gap-3">
        <div className="flex-1">
          <TextField
            id="symbol"
            label="Add a symbol"
            placeholder="e.g. AAPL"
            value={symbol}
            onChange={(event) => setSymbol(event.target.value)}
          />
        </div>
        <Button type="submit" isLoading={addToWatchlist.isPending}>
          Add
        </Button>
      </form>
      {addErrorMessage && <p className="text-sm text-loss">{addErrorMessage}</p>}

      {isLoading && <p className="text-sm text-slate-400">Loading watchlist...</p>}
      {isError && <p className="text-sm text-loss">Couldn&apos;t load your watchlist.</p>}

      {items && items.length === 0 && (
        <div className="rounded-xl border border-dashed border-surface-border p-10 text-center">
          <p className="text-sm text-slate-400">Your watchlist is empty.</p>
        </div>
      )}

      {items && items.length > 0 && (
        <ul className="divide-y divide-surface-border overflow-hidden rounded-xl border border-surface-border">
          {items.map((item) => (
            <li key={item.id} className="flex items-center justify-between px-4 py-3">
              <div>
                <p className="font-medium text-slate-100">{item.symbol}</p>
                <p className="text-xs text-slate-500">
                  Added {new Date(item.addedAt).toLocaleDateString()}
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleRemove(item.symbol)}
                disabled={pendingRemoveSymbol === item.symbol}
                className="text-sm font-medium text-loss hover:text-loss/80 disabled:opacity-50"
              >
                {pendingRemoveSymbol === item.symbol ? 'Removing...' : 'Remove'}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

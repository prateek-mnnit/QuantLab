import { useState, type FormEvent } from 'react';
import type { WatchlistItem } from '@quantlab/shared-types';
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

  // Group AH: featured symbols are PRODUCT-LEVEL content, visible to every
  // authenticated user via the same GET /watchlist request `useWatchlist`
  // already made (ListWatchlistUseCase returns "this user's own additions
  // UNION every featured symbol" - see
  // WatchlistRepository.findManyVisibleToUser), not a second request or a
  // demo account.
  const featuredItems = items?.filter((item) => item.isBuiltIn) ?? [];
  const myItems = items?.filter((item) => !item.isBuiltIn) ?? [];

  return (
    <div className="max-w-xl space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-slate-50">Watchlist</h1>
        <p className="mt-1 text-sm text-slate-400">Featured stocks to get you started, and symbols you&apos;re keeping an eye on.</p>
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

      {items && (
        <>
          <section className="space-y-3">
            <div>
              <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">Featured Stocks</h2>
              <p className="mt-0.5 text-xs text-slate-500">
                A default set of well-known Indian stocks, shared by every account.
              </p>
            </div>
            {featuredItems.length > 0 ? (
              <WatchlistList
                items={featuredItems}
                pendingRemoveSymbol={pendingRemoveSymbol}
                onRemove={handleRemove}
              />
            ) : (
              <div className="rounded-xl border border-dashed border-surface-border p-6 text-center">
                <p className="text-sm text-slate-400">No featured stocks available yet.</p>
              </div>
            )}
          </section>

          <section className="space-y-3">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">My Watchlist</h2>
            {myItems.length > 0 ? (
              <WatchlistList items={myItems} pendingRemoveSymbol={pendingRemoveSymbol} onRemove={handleRemove} />
            ) : (
              <div className="rounded-xl border border-dashed border-surface-border p-10 text-center">
                <p className="text-sm text-slate-400">
                  You haven&apos;t added any symbols yet - use the form above to track your own.
                </p>
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}

function WatchlistList({
  items,
  pendingRemoveSymbol,
  onRemove,
}: {
  items: WatchlistItem[];
  pendingRemoveSymbol: string | null;
  onRemove: (symbol: string) => void;
}) {
  return (
    <ul className="divide-y divide-surface-border overflow-hidden rounded-xl border border-surface-border">
      {items.map((item) => (
        <li key={item.id} className="flex items-center justify-between px-4 py-3">
          <div>
            <p className="font-medium text-slate-100">{item.symbol}</p>
            <p className="text-xs text-slate-500">Added {new Date(item.addedAt).toLocaleDateString()}</p>
          </div>
          {/* Featured items have no Remove here - the API itself already
              refuses to remove them (WatchlistRepository.findOneForUser is
              strictly own-only, so a featured/built-in row can never
              match), this just keeps the UI from offering an action that
              would only ever come back as an error. */}
          {!item.isBuiltIn && (
            <button
              type="button"
              onClick={() => onRemove(item.symbol)}
              disabled={pendingRemoveSymbol === item.symbol}
              className="text-sm font-medium text-loss hover:text-loss/80 disabled:opacity-50"
            >
              {pendingRemoveSymbol === item.symbol ? 'Removing...' : 'Remove'}
            </button>
          )}
        </li>
      ))}
    </ul>
  );
}

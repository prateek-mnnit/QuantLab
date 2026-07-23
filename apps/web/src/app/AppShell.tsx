import type { ReactNode } from 'react';
import { useSystemStatus } from '../features/system-status/useSystemStatus';
import { StatusBadge } from '../components/StatusBadge';

/**
 * Top-level layout shared by every page: a persistent nav bar plus a content
 * slot. Kept intentionally minimal in Phase 1 - real navigation links
 * (Charts, Strategies, Backtests, Watchlist) get added as those pages exist,
 * rather than linking to routes that don't have anything behind them yet.
 */
export function AppShell({ children }: { children: ReactNode }) {
  const { data, isError, isLoading } = useSystemStatus();

  const status = isLoading ? 'checking' : isError || !data ? 'disconnected' : 'connected';

  return (
    <div className="min-h-screen bg-surface">
      <header className="border-b border-surface-border bg-surface-raised">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-500 font-bold text-white">
              Q
            </div>
            <span className="text-lg font-semibold tracking-tight text-slate-50">
              QuantLab
            </span>
          </div>
          <StatusBadge status={status} />
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-6 py-8">{children}</main>
    </div>
  );
}

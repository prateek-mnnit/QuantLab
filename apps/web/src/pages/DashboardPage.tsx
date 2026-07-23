/**
 * Placeholder-free landing page for Phase 1: it doesn't fake data or show
 * "coming soon" - it proves the two real things Phase 1 is responsible for,
 * that the frontend renders and that it can talk to the backend, via the
 * live API-connection badge in the AppShell header above this page.
 */
export function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-50">Dashboard</h1>
        <p className="mt-1 text-sm text-slate-400">
          Charts, your watchlist, and recent backtests will appear here as they're built out.
        </p>
      </div>

      <div className="rounded-xl border border-surface-border bg-surface-raised p-6">
        <h2 className="text-sm font-medium text-slate-300">Project status</h2>
        <p className="mt-2 text-sm text-slate-400">
          Phase 1 scaffolding is live: the React frontend, Express API, and PostgreSQL
          database are wired together. The status indicator in the header above reflects a
          real network call to the API&apos;s <code className="text-brand-300">/api/health</code>{' '}
          endpoint, which itself verifies live database connectivity.
        </p>
      </div>
    </div>
  );
}

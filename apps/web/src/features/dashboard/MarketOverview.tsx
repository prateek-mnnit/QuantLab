import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCandles } from '../market-data/useMarketData';
import { useChartViewStore } from '../../store/chartViewStore';
import { computeIndexChange } from './marketOverviewMath';

/**
 * Yahoo Finance's own tickers for these four Indian indices (the `^`
 * prefix is Yahoo's convention for an index, not a stock) - confirmed by
 * reading `YahooFinanceProvider`: it passes `symbol` straight into the
 * chart URL with no assumption that a symbol is a tradeable equity, so any
 * symbol Yahoo itself recognizes works unmodified through the EXACT same
 * `GET /api/market-data/candles` endpoint and `useCandles` hook ChartPage
 * already uses - no second market-data provider, no new endpoint.
 */
const INDICES: { symbol: string; label: string }[] = [
  { symbol: '^NSEI', label: 'NIFTY 50' },
  { symbol: '^BSESN', label: 'SENSEX' },
  { symbol: '^NSEBANK', label: 'NIFTY BANK' },
  { symbol: '^CNXIT', label: 'NIFTY IT' },
];

/** Wide enough to comfortably span at least two trading days even around a long weekend/holiday - only the last two matter (see computeIndexChange), the rest is just safety margin. */
const LOOKBACK_DAYS = 10;

const numberFormatter = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 2 });

/**
 * A compact strip of index cards, in the spirit of (not copied from) the
 * market strips common to Indian trading apps - four small cards, each
 * independently loading/failing so one bad symbol never blanks out the
 * other three or the rest of the Dashboard.
 *
 * Each card is clickable, reusing the EXACT same mechanism
 * `DashboardPage`'s own Watchlist preview uses to open the Chart page for
 * a symbol: `chartViewStore`'s `selectSymbol` action, then `navigate`d to
 * the existing `/chart` route - not a second navigation/state system.
 */
export function MarketOverview() {
  const navigate = useNavigate();
  const selectChartSymbol = useChartViewStore((state) => state.selectSymbol);

  // BUG FIX (post-Group-AJ): `to`/`from` used to be computed as `new
  // Date()` directly in the component body, which meant a NEW Date
  // instance - a different millisecond timestamp - on every render.
  // `useCandles`'s queryKey includes `from.toISOString()`/`to.toISOString()`
  // (see useMarketData.ts), so every render was producing four brand-new,
  // never-before-seen query keys instead of stable ones. React Query had
  // no way to recognize these as "the same query" across renders: each
  // one was a first-time fetch, which changes loading/success state, which
  // re-renders this component, which created four more new Date()s ->
  // an unbounded, self-sustaining fetch storm. Wrapping this in
  // `useMemo` with an empty dependency array computes `from`/`to` exactly
  // ONCE for the lifetime of this mounted component, so the four
  // `useCandles` calls below get stable query keys across re-renders -
  // the four index queries now fetch once (per normal React Query
  // caching/staleTime rules) instead of continuously.
  const { from, to } = useMemo(() => {
    const to = new Date();
    const from = new Date();
    from.setDate(from.getDate() - LOOKBACK_DAYS);
    return { from, to };
  }, []);

  // Four explicit calls (not a loop) - the array above is fixed at module
  // scope, so this never violates the rules of hooks, and it's the same
  // `useCandles` hook ChartPage already calls, just four times instead of
  // once.
  const nifty50 = useCandles(INDICES[0]!.symbol, '1D', from, to);
  const sensex = useCandles(INDICES[1]!.symbol, '1D', from, to);
  const niftyBank = useCandles(INDICES[2]!.symbol, '1D', from, to);
  const niftyIt = useCandles(INDICES[3]!.symbol, '1D', from, to);

  const queries = [nifty50, sensex, niftyBank, niftyIt];

  function openChart(index: { symbol: string; label: string }): void {
    // Same store action + route DashboardPage's Watchlist preview already
    // uses (see `goToChart` in DashboardPage.tsx) - `name` is the index's
    // display label (e.g. "NIFTY 50") rather than the bare symbol, since
    // that's more readable than "^NSEI" and, unlike a WatchlistItem, an
    // index label is already known here.
    selectChartSymbol({ symbol: index.symbol, name: index.label, exchange: '' });
    navigate('/chart');
  }

  return (
    <section className="space-y-3">
      <h2 className="text-sm font-semibold text-slate-200">Market Overview</h2>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {INDICES.map((index, i) => (
          <IndexCard
            key={index.symbol}
            label={index.label}
            isLoading={queries[i]!.isLoading}
            isError={queries[i]!.isError}
            candles={queries[i]!.data}
            onClick={() => openChart(index)}
          />
        ))}
      </div>
    </section>
  );
}

function IndexCard({
  label,
  isLoading,
  isError,
  candles,
  onClick,
}: {
  label: string;
  isLoading: boolean;
  isError: boolean;
  candles: Parameters<typeof computeIndexChange>[0] | undefined;
  onClick: () => void;
}) {
  const change = candles ? computeIndexChange(candles) : null;

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`Open ${label} chart`}
      className="w-full rounded-xl border border-surface-border bg-surface-raised p-4 text-left transition-colors hover:border-brand-500/40 hover:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/50"
    >
      <p className="text-xs font-medium text-slate-400">{label}</p>

      {isLoading && (
        <div className="mt-2 space-y-1.5">
          <div className="h-5 w-16 animate-pulse rounded bg-surface" />
          <div className="h-3 w-10 animate-pulse rounded bg-surface" />
        </div>
      )}

      {!isLoading && (isError || !change) && <p className="mt-2 text-sm text-slate-500">Unavailable</p>}

      {!isLoading && !isError && change && (
        <>
          <p className="mt-1 text-lg font-semibold text-slate-50">{numberFormatter.format(change.latestClose)}</p>
          <p className={`text-xs font-medium ${change.changePct >= 0 ? 'text-profit' : 'text-loss'}`}>
            {change.changePct >= 0 ? '+' : ''}
            {change.changePct.toFixed(2)}%
          </p>
        </>
      )}
    </button>
  );
}

import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCandles } from '../market-data/useMarketData';
import { useChartViewStore } from '../../store/chartViewStore';
import { computeIndexChange } from './marketOverviewMath';
/**
 * Yahoo Finance tickers for the four Indian market indices.
 * The `^` prefix is Yahoo's convention for an index, not a stock.
 */
const INDICES: { symbol: string; label: string }[] = [
  { symbol: '^NSEI',    label: 'NIFTY 50'   },
  { symbol: '^BSESN',   label: 'SENSEX'     },
  { symbol: '^NSEBANK', label: 'NIFTY BANK' },
  { symbol: '^CNXIT',   label: 'NIFTY IT'   },
];

const LOOKBACK_DAYS = 10;
const numberFormatter = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 2 });

/**
 * Compact 4-card market overview strip.
 * Each card is independently loading/failing — one bad symbol never
 * blanks the others or the rest of the Dashboard.
 *
 * BUG FIX preserved: `from`/`to` computed in useMemo with [] deps to
 * produce stable query keys across re-renders (prevents fetch storms).
 */
export function MarketOverview() {
  const navigate = useNavigate();
  const selectChartSymbol = useChartViewStore((state) => state.selectSymbol);

  // Stable dates — computed once per mount, not on every render.
  const { from, to } = useMemo(() => {
    const to = new Date();
    const from = new Date();
    from.setDate(from.getDate() - LOOKBACK_DAYS);
    return { from, to };
  }, []);

  // Four explicit calls — array is module-scoped so this never violates rules of hooks.
  const nifty50   = useCandles(INDICES[0]!.symbol, '1D', from, to);
  const sensex    = useCandles(INDICES[1]!.symbol, '1D', from, to);
  const niftyBank = useCandles(INDICES[2]!.symbol, '1D', from, to);
  const niftyIt   = useCandles(INDICES[3]!.symbol, '1D', from, to);

  const queries = [nifty50, sensex, niftyBank, niftyIt];

  function openChart(index: { symbol: string; label: string }): void {
    selectChartSymbol({ symbol: index.symbol, name: index.label, exchange: '' });
    navigate('/chart');
  }

  return (
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
  const isPositive = change ? change.changePct >= 0 : null;

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`Open ${label} chart`}
      className="group w-full rounded-lg border border-zinc-800 bg-zinc-900/60 p-3 text-left transition-colors duration-150 hover:border-zinc-700 hover:bg-zinc-900 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-600"
    >
      {/* Label row */}
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-zinc-500">{label}</p>
        {!isLoading && change !== null && isPositive !== null && (
          <span
            className={`h-1.5 w-1.5 rounded-full flex-shrink-0 ${
              isPositive ? 'bg-profit' : 'bg-loss'
            }`}
            aria-hidden="true"
          />
        )}
      </div>

      {/* Loading skeleton */}
      {isLoading && (
        <div className="mt-2 space-y-1.5">
          <div className="h-5 w-20 animate-pulse rounded bg-zinc-800" />
          <div className="h-3 w-12 animate-pulse rounded bg-zinc-800" />
        </div>
      )}

      {/* Error / unavailable */}
      {!isLoading && (isError || !change) && (
        <p className="mt-2 text-xs text-zinc-600">Unavailable</p>
      )}

      {/* Data & Sparkline */}
      {!isLoading && !isError && change && (
        <div className="mt-1.5 flex flex-col">
          <div className="flex items-baseline justify-between">
            <div>
              <p className="text-lg font-semibold tabular-nums text-zinc-100">
                {numberFormatter.format(change.latestClose)}
              </p>
              <p
                className={`text-xs font-medium tabular-nums ${
                  isPositive ? 'text-profit' : 'text-loss'
                }`}
              >
                {isPositive ? '+' : ''}{change.changePct.toFixed(2)}%
              </p>
            </div>
          </div>
          
          <div className="mt-3">
            <Sparkline 
              data={candles ? candles.map(c => c.close) : []} 
              isPositive={isPositive!} 
            />
          </div>
        </div>
      )}
    </button>
  );
}

function Sparkline({ data, isPositive }: { data: number[]; isPositive: boolean }) {
  if (data.length < 2) return null;
  
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  
  // SVG relative dimensions
  const width = 100;
  const height = 24;
  
  const points = data.map((val, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((val - min) / range) * height;
    return `${x},${y}`;
  }).join(' ');

  // subtle gradient fill
  const color = isPositive ? '#22c55e' : '#ef4444';

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="h-6 w-full overflow-visible" preserveAspectRatio="none">
      <defs>
        <linearGradient id={`gradient-${isPositive}`} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.2" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polyline
        points={`${width},${height} 0,${height} ${points}`}
        fill={`url(#gradient-${isPositive})`}
        stroke="none"
      />
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

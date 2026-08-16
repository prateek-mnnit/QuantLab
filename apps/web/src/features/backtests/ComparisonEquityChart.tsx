import { useEffect, useMemo, useRef } from 'react';
import { createChart, LineSeries, LineType, type IChartApi, type ISeriesApi, type UTCTimestamp } from 'lightweight-charts';
import type { BacktestRun, Trade } from '@quantlab/shared-types';
import { computeEquityCurve } from './backtestAnalytics';

const SERIES_COLORS = ['#3a4dfa', '#16c784', '#a855f7', '#f59e0b', '#06b6d4', '#ec4899'];

interface ComparisonEquityChartProps {
  runs: BacktestRun[];
  tradesByRun: Trade[][];
  height?: number;
}

/**
 * Same imperative-library wrapper pattern as EquityCurve.tsx, extended to
 * hold MULTIPLE line series on one chart instance instead of one - each
 * compared run gets its own equity curve (via the same computeEquityCurve
 * from backtestAnalytics.ts, reused unchanged) and its own color, so all
 * runs share one time axis for a direct visual comparison.
 */
export function ComparisonEquityChart({ runs, tradesByRun, height = 320 }: ComparisonEquityChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRefs = useRef<ISeriesApi<'Line'>[]>([]);

  const curves = useMemo(() => tradesByRun.map((trades) => computeEquityCurve(trades)), [tradesByRun]);

  useEffect(() => {
    if (!containerRef.current) return;

    const chart = createChart(containerRef.current, {
      height,
      layout: { background: { color: 'transparent' }, textColor: '#94a3b8' },
      grid: { vertLines: { color: '#1f2530' }, horzLines: { color: '#1f2530' } },
      timeScale: { borderColor: '#1f2530' },
      rightPriceScale: { borderColor: '#1f2530' },
    });
    chartRef.current = chart;

    function handleResize(): void {
      if (containerRef.current) chart.applyOptions({ width: containerRef.current.clientWidth });
    }
    window.addEventListener('resize', handleResize);
    handleResize();

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
      chartRef.current = null;
      seriesRefs.current = [];
    };
  }, [height]);

  useEffect(() => {
    const chart = chartRef.current;
    if (!chart) return;

    // Drop any series from a previous data set before adding the current
    // one - the set of compared runs can only change via a full page
    // navigation (a new ?ids= query), but this keeps the effect correct
    // regardless of how curves changes.
    for (const series of seriesRefs.current) {
      chart.removeSeries(series);
    }

    seriesRefs.current = curves.map((curve, index) => {
      const series = chart.addSeries(LineSeries, {
        color: SERIES_COLORS[index % SERIES_COLORS.length],
        lineWidth: 2,
        lineType: LineType.Curved,
        priceFormat: { type: 'price', precision: 1, minMove: 0.1 },
      });
      series.setData(curve.map((point) => ({ time: point.time as UTCTimestamp, value: point.equity })));
      return series;
    });

    chart.timeScale().fitContent();
  }, [curves]);

  return (
    <div className="space-y-3">
      <div ref={containerRef} className="w-full" />
      <div className="flex flex-wrap gap-4">
        {runs.map((run, index) => (
          <div key={run.id} className="flex items-center gap-2 text-xs text-zinc-500">
            <span
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: SERIES_COLORS[index % SERIES_COLORS.length] }}
            />
            {run.symbol} ({new Date(run.createdAt).toLocaleDateString()})
          </div>
        ))}
      </div>
    </div>
  );
}

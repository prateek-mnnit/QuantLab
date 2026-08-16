import { useEffect, useMemo, useRef } from 'react';
import { createChart, LineSeries, LineType, type IChartApi, type ISeriesApi, type UTCTimestamp } from 'lightweight-charts';
import type { Trade } from '@quantlab/shared-types';
import { computeEquityCurve } from './backtestAnalytics';

interface EquityCurveProps {
  trades: Trade[];
  height?: number;
}

/**
 * Same imperative-library wrapper pattern as CandlestickChart.tsx (Group
 * M): create the chart once via useEffect on mount, push data updates to
 * the existing series rather than recreating the chart on every render.
 */
export function EquityCurve({ trades, height = 240 }: EquityCurveProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<'Line'> | null>(null);

  // Memoized so a re-render triggered by a sibling component (e.g. a
  // trade row expanding elsewhere on the page) never re-walks the trade
  // list to recompute the curve.
  const points = useMemo(() => computeEquityCurve(trades), [trades]);

  useEffect(() => {
    if (!containerRef.current) return;

    const chart = createChart(containerRef.current, {
      height,
      layout: { background: { color: 'transparent' }, textColor: '#94a3b8' },
      grid: { vertLines: { color: '#1f2530' }, horzLines: { color: '#1f2530' } },
      timeScale: { borderColor: '#1f2530' },
      rightPriceScale: { borderColor: '#1f2530' },
    });

    const series = chart.addSeries(LineSeries, {
      color: '#3a4dfa',
      lineWidth: 2,
      lineType: LineType.Curved,
      priceFormat: { type: 'price', precision: 1, minMove: 0.1 },
    });

    chartRef.current = chart;
    seriesRef.current = series;

    function handleResize(): void {
      if (containerRef.current) chart.applyOptions({ width: containerRef.current.clientWidth });
    }
    window.addEventListener('resize', handleResize);
    handleResize();

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
      chartRef.current = null;
      seriesRef.current = null;
    };
  }, [height]);

  useEffect(() => {
    if (!seriesRef.current) return;
    seriesRef.current.setData(points.map((point) => ({ time: point.time as UTCTimestamp, value: point.equity })));
    chartRef.current?.timeScale().fitContent();
  }, [points]);

  if (points.length === 0) {
    return <p className="text-sm text-zinc-500">Not enough data to show an equity curve.</p>;
  }

  return <div ref={containerRef} className="w-full" />;
}

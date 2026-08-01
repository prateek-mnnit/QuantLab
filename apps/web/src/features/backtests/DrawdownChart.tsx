import { useEffect, useMemo, useRef } from 'react';
import { createChart, AreaSeries, type IChartApi, type ISeriesApi, type UTCTimestamp } from 'lightweight-charts';
import type { Trade } from '@quantlab/shared-types';
import { computeDrawdownCurve, computeEquityCurve } from './backtestAnalytics';

interface DrawdownChartProps {
  trades: Trade[];
  height?: number;
}

/**
 * Rendered as a filled area (red, below zero) rather than a plain line -
 * the conventional way drawdown is visualized, and still just
 * lightweight-charts (no new library). Derives from the SAME equity curve
 * computeEquityCurve produces, so both charts cover exactly the same date
 * range - they're two independent chart instances (lightweight-charts
 * doesn't share instances across components), so panning/zooming one does
 * not live-sync the other; both simply fit their own content to the same
 * underlying data span. True cross-chart pan/zoom sync would need
 * additional wiring beyond this group's scope.
 */
export function DrawdownChart({ trades, height = 160 }: DrawdownChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<'Area'> | null>(null);

  const points = useMemo(() => computeDrawdownCurve(computeEquityCurve(trades)), [trades]);

  useEffect(() => {
    if (!containerRef.current) return;

    const chart = createChart(containerRef.current, {
      height,
      layout: { background: { color: 'transparent' }, textColor: '#94a3b8' },
      grid: { vertLines: { color: '#1f2530' }, horzLines: { color: '#1f2530' } },
      timeScale: { borderColor: '#1f2530' },
      rightPriceScale: { borderColor: '#1f2530' },
    });

    const series = chart.addSeries(AreaSeries, {
      lineColor: '#ea3943',
      topColor: 'rgba(234, 57, 67, 0.28)',
      bottomColor: 'rgba(234, 57, 67, 0.02)',
      lineWidth: 2,
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
    seriesRef.current.setData(points.map((point) => ({ time: point.time as UTCTimestamp, value: point.drawdownPct })));
    chartRef.current?.timeScale().fitContent();
  }, [points]);

  if (points.length === 0) {
    return <p className="text-sm text-slate-500">Not enough data to show drawdown.</p>;
  }

  return <div ref={containerRef} className="w-full" />;
}

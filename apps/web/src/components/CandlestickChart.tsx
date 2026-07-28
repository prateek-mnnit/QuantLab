import { useEffect, useRef } from 'react';
import {
  createChart,
  CandlestickSeries,
  type IChartApi,
  type ISeriesApi,
  type UTCTimestamp,
} from 'lightweight-charts';
import type { Candle } from '@quantlab/shared-types';

interface CandlestickChartProps {
  candles: Candle[];
  height?: number;
}

/**
 * A thin React wrapper around TradingView's Lightweight Charts library.
 * This is an IMPERATIVE, canvas-based charting library, not a set of React
 * components - the standard (and only sane) way to use it inside React is
 * the pattern below: create the chart instance once via `useEffect` on
 * mount, keep it in a ref, and imperatively push data/option updates to it
 * as props change, rather than trying to represent thousands of candles as
 * React elements (which would fight the library's own rendering model and
 * be far slower). This is the same "escape hatch to an imperative API"
 * pattern React itself documents for wrapping non-React libraries.
 */
export function CandlestickChart({ candles, height = 420 }: CandlestickChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);

  // Create the chart ONCE on mount, not on every candle update - tearing
  // down and recreating a canvas-based chart on every data change would be
  // both slow and would discard the user's zoom/pan position.
  useEffect(() => {
    if (!containerRef.current) return;

    const chart = createChart(containerRef.current, {
      height,
      layout: {
        background: { color: 'transparent' },
        textColor: '#94a3b8',
      },
      grid: {
        vertLines: { color: '#1f2530' },
        horzLines: { color: '#1f2530' },
      },
      timeScale: { borderColor: '#1f2530' },
      rightPriceScale: { borderColor: '#1f2530' },
    });

    const series = chart.addSeries(CandlestickSeries, {
      upColor: '#16c784',
      downColor: '#ea3943',
      borderVisible: false,
      wickUpColor: '#16c784',
      wickDownColor: '#ea3943',
    });

    chartRef.current = chart;
    seriesRef.current = series;

    function handleResize(): void {
      if (containerRef.current) {
        chart.applyOptions({ width: containerRef.current.clientWidth });
      }
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

  // Push new data into the existing series whenever `candles` changes.
  useEffect(() => {
    if (!seriesRef.current) return;

    seriesRef.current.setData(
      candles.map((candle) => ({
        // Our canonical Candle.time is a Unix timestamp in SECONDS (see
        // shared-types), which is exactly what lightweight-charts expects
        // for its UTCTimestamp branded type - this cast just tells
        // TypeScript that guarantee holds, it isn't a runtime conversion.
        time: candle.time as UTCTimestamp,
        open: candle.open,
        high: candle.high,
        low: candle.low,
        close: candle.close,
      })),
    );
    chartRef.current?.timeScale().fitContent();
  }, [candles]);

  return <div ref={containerRef} className="w-full" />;
}

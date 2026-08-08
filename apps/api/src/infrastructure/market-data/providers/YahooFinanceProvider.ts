import type { Candle, SymbolResult, Timeframe } from '@quantlab/shared-types';
import type { MarketDataProvider } from '../MarketDataProvider.js';
import { SimpleTtlCache } from '../SimpleTtlCache.js';
import { aggregateCandles, FOUR_HOURS_SECONDS } from '../aggregateCandles.js';
import { NotFoundError, ServiceUnavailableError } from '../../../application/errors/AppError.js';
import { logger } from '../../logging/logger.js';

/**
 * Yahoo's own interval string for each timeframe this app supports. There
 * is deliberately no '4H' entry: Yahoo has no native 4-hour interval (see
 * `aggregateCandles.ts`), so `getCandles` below fetches '1H's underlying
 * 60m interval for a '4H' request and rolls it up itself - '4H' is a
 * derived timeframe, not a distinct Yahoo interval.
 */
const TIMEFRAME_TO_INTERVAL: Record<Exclude<Timeframe, '4H'>, string> = {
  '5m': '5m',
  '15m': '15m',
  '30m': '30m',
  '1H': '60m',
  '1D': '1d',
  '1W': '1wk',
};

interface YahooChartResponse {
  chart: {
    result:
      | Array<{
          timestamp: number[];
          indicators: {
            quote: Array<{
              open: Array<number | null>;
              high: Array<number | null>;
              low: Array<number | null>;
              close: Array<number | null>;
              volume: Array<number | null>;
            }>;
          };
        }>
      | null;
  };
}

interface YahooSearchResponse {
  quotes: Array<{
    symbol?: string;
    shortname?: string;
    longname?: string;
    exchange?: string;
    quoteType?: string;
  }>;
}

/**
 * The ONLY file in the codebase allowed to know Yahoo Finance's unofficial
 * API exists - its URLs, its response shapes, its quirks (nulls in the
 * OHLCV arrays for halted/illiquid bars). Everything it returns is mapped
 * into the canonical `Candle` / `SymbolResult` shapes from shared-types
 * before this class returns, per the Historical Market Data Architecture in
 * the approved design - no controller, use case, or (later) the backtest
 * engine ever sees a Yahoo-specific field name.
 *
 * Yahoo's endpoints are unofficial (no published SLA, no API key, subject
 * to silent changes) - exactly why the codebase never calls them directly
 * and always goes through the `MarketDataProvider` interface instead.
 */
export class YahooFinanceProvider implements MarketDataProvider {
  private readonly candleCache = new SimpleTtlCache<Candle[]>(5 * 60 * 1000);
  private readonly searchCache = new SimpleTtlCache<SymbolResult[]>(10 * 60 * 1000);

  async getCandles(symbol: string, timeframe: Timeframe, from: Date, to: Date): Promise<Candle[]> {
    const cacheKey = `${symbol}:${timeframe}:${from.toISOString()}:${to.toISOString()}`;
    const cached = this.candleCache.get(cacheKey);
    if (cached) return cached;

    // '4H' has no native Yahoo interval - fetch the 60m bars '1H' already
    // uses and aggregate them into 4-hour buckets after the fact.
    const interval = TIMEFRAME_TO_INTERVAL[timeframe === '4H' ? '1H' : timeframe];
    const period1 = Math.floor(from.getTime() / 1000);
    const period2 = Math.floor(to.getTime() / 1000);
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=${interval}&period1=${period1}&period2=${period2}`;

    const body = await this.fetchJson<YahooChartResponse>(url, symbol);
    const result = body.chart.result?.[0];

    if (!result) {
      throw new NotFoundError(`No market data found for symbol "${symbol}".`);
    }

    const quote = result.indicators.quote[0];
    const candles: Candle[] = result.timestamp
      .map((time, index): Candle | null => {
        const open = quote?.open[index];
        const high = quote?.high[index];
        const low = quote?.low[index];
        const close = quote?.close[index];
        const volume = quote?.volume[index];

        // Yahoo returns `null` in these arrays for halted/illiquid bars
        // rather than omitting the index entirely - such a bar has no
        // meaningful OHLCV data, so it's dropped rather than passed through
        // as zeros (which would silently corrupt anything computed from it).
        if (open == null || high == null || low == null || close == null || volume == null) {
          return null;
        }
        return { time, open, high, low, close, volume };
      })
      .filter((candle): candle is Candle => candle !== null);

    const finalCandles = timeframe === '4H' ? aggregateCandles(candles, FOUR_HOURS_SECONDS) : candles;

    this.candleCache.set(cacheKey, finalCandles);
    return finalCandles;
  }

  async searchSymbols(query: string): Promise<SymbolResult[]> {
    const cached = this.searchCache.get(query);
    if (cached) return cached;

    const url = `https://query1.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(query)}`;
    const body = await this.fetchJson<YahooSearchResponse>(url, query);

    const results: SymbolResult[] = body.quotes
      .filter((quote) => quote.symbol && quote.quoteType === 'EQUITY')
      .map((quote) => ({
        symbol: quote.symbol as string,
        name: quote.shortname ?? quote.longname ?? (quote.symbol as string),
        exchange: quote.exchange ?? 'UNKNOWN',
      }));

    this.searchCache.set(query, results);
    return results;
  }

  /**
   * Shared fetch+error-handling for both endpoints above. A `User-Agent`
   * header is set because Yahoo's unofficial endpoints sometimes reject
   * requests with no/default User-Agent strings - a known quirk of relying
   * on an undocumented API, isolated here rather than repeated per method.
   */
  private async fetchJson<T>(url: string, context: string): Promise<T> {
    let response: Response;
    try {
      response = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    } catch (error) {
      logger.error({ error, context }, 'Failed to reach Yahoo Finance');
      throw new ServiceUnavailableError('Market data provider is currently unreachable.');
    }

    if (!response.ok) {
      logger.error({ status: response.status, context }, 'Yahoo Finance returned a non-OK response');
      throw new ServiceUnavailableError('Market data provider is currently unreachable.');
    }

    return (await response.json()) as T;
  }
}

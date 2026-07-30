import type { Candle, StrategyInput } from '@quantlab/shared-types';
import { calculateIndicator } from '../indicators/calculateIndicator.js';
import {
  collectIndicatorRequirements,
  evaluateConditionTree,
  indicatorCacheKey,
  type ConditionExplanation,
  type IndicatorSeriesCache,
} from '../conditions/index.js';
import { calculatePositionSize } from './PositionSizing.js';
import { calculateStopLossPrice, calculateTakeProfitPrice, calculateTrailingStopPrice } from './RiskManager.js';
import { calculateMetrics } from './MetricsCalculator.js';
import { DEFAULT_BACKTEST_OPTIONS, type BacktestOptions, type BacktestResult, type SimulatedTrade } from './types.js';

/** Only the fields the engine actually needs from a strategy - lets a caller pass a full `StrategyInput` or a narrower object equally well. */
export type BacktestableStrategy = Pick<
  StrategyInput,
  'entryConditions' | 'exitConditions' | 'stopLossConfig' | 'takeProfitConfig' | 'trailingStopConfig' | 'positionSizingConfig'
>;

const RISK_ATR_PERIOD = 14;

interface OpenPosition {
  entryIndex: number;
  entryPrice: number;
  size: number;
  stopLossPrice: number | null;
  takeProfitPrice: number | null;
  highestPriceSinceEntry: number;
  entryExplanation: ConditionExplanation;
}

/**
 * The core simulation loop - walks the candle series bar-by-bar, never
 * looking ahead, and applies the strategy's condition trees and risk rules
 * exactly as configured. Single-position-at-a-time by design, per the
 * PRD's explicit Phase 1 non-goal on portfolio-level backtesting.
 *
 * FILL TIMING (a deliberate, documented assumption - not an accident):
 * a condition tree is evaluated using data through bar `i`'s CLOSE, so a
 * signal detected at bar `i` can only realistically be acted on at bar
 * `i + 1`'s OPEN - you can't trade on a bar's close before it's finished
 * printing. Risk-based exits (stop loss / take profit / trailing stop) are
 * the exception: they're checked against each bar's own high/low and fill
 * INTRABAR at the triggered price, since a resting stop/limit order is
 * continuously active rather than something that requires "seeing the
 * close" first. Risk exits are also checked BEFORE exit-signal conditions
 * on any given bar, in that fixed order - a stop loss always takes priority
 * over a slower-to-detect signal-based exit.
 */
export function runBacktest(
  strategy: BacktestableStrategy,
  candles: Candle[],
  options: Partial<BacktestOptions> = {},
): BacktestResult {
  const opts: BacktestOptions = { ...DEFAULT_BACKTEST_OPTIONS, ...options };

  const seriesCache: IndicatorSeriesCache = new Map();
  const requirements = collectIndicatorRequirements(strategy.entryConditions);
  collectIndicatorRequirements(strategy.exitConditions, requirements);
  for (const { indicator, params } of requirements.values()) {
    seriesCache.set(indicatorCacheKey(indicator, params), calculateIndicator(candles, indicator, params));
  }

  // ATR for risk sizing is computed separately, with a conventional
  // 14-period default, even if the strategy's own condition trees never
  // reference ATR - a "risk ATR" distinct from any ATR the user explicitly
  // added as a condition (which may use a different period).
  const riskAtrSeries = calculateIndicator(candles, 'ATR', { period: RISK_ATR_PERIOD }).value!;

  const trades: SimulatedTrade[] = [];
  let capital = opts.initialCapital;
  let openPosition: OpenPosition | null = null;
  let pendingEntry: ConditionExplanation | null = null;
  let pendingExit: ConditionExplanation | null = null;

  function fillBuy(price: number): number {
    return price * (1 + opts.slippagePct);
  }
  function fillSell(price: number): number {
    return price * (1 - opts.slippagePct);
  }

  function openTrade(fillPrice: number, index: number, explanation: ConditionExplanation): OpenPosition {
    const entryPrice = fillBuy(fillPrice);
    const entryAtr = riskAtrSeries[index] ?? null;
    const stopLossPrice = calculateStopLossPrice(strategy.stopLossConfig ?? null, entryPrice, entryAtr);
    const takeProfitPrice = calculateTakeProfitPrice(strategy.takeProfitConfig ?? null, entryPrice, stopLossPrice);
    const stopDistance = stopLossPrice !== null ? entryPrice - stopLossPrice : null;
    const size = calculatePositionSize(strategy.positionSizingConfig, capital, entryPrice, stopDistance);

    return {
      entryIndex: index,
      entryPrice,
      size,
      stopLossPrice,
      takeProfitPrice,
      highestPriceSinceEntry: entryPrice,
      entryExplanation: explanation,
    };
  }

  function closeTrade(fillPrice: number, index: number, reason: SimulatedTrade['exitReason'], explanation: ConditionExplanation | null): null {
    const position = openPosition;
    if (!position) return null;

    const exitPrice = fillSell(fillPrice);
    const pnl = (exitPrice - position.entryPrice) * position.size - opts.commissionPerTrade * 2;
    capital += pnl;

    trades.push({
      entryTime: candles[position.entryIndex]!.time,
      entryPrice: position.entryPrice,
      exitTime: candles[index]!.time,
      exitPrice,
      size: position.size,
      pnl,
      exitReason: reason,
      entryExplanation: position.entryExplanation,
      exitExplanation: explanation,
    });
    return null;
  }

  for (let i = 1; i < candles.length; i++) {
    const bar = candles[i]!;

    // 1. Fill whatever signal was detected on the PREVIOUS bar, at this
    //    bar's open - see the fill-timing note above.
    if (!openPosition && pendingEntry) {
      openPosition = openTrade(bar.open, i, pendingEntry);
      pendingEntry = null;
    } else if (openPosition && pendingExit) {
      openPosition = closeTrade(bar.open, i, 'EXIT_SIGNAL', pendingExit);
      pendingExit = null;
    }

    // 2. If a position is open, check risk-based exits intrabar against
    //    THIS bar's high/low, in fixed priority order.
    if (openPosition) {
      const position = openPosition;
      position.highestPriceSinceEntry = Math.max(position.highestPriceSinceEntry, bar.high);
      const trailingStopPrice = calculateTrailingStopPrice(
        strategy.trailingStopConfig ?? null,
        position.highestPriceSinceEntry,
        riskAtrSeries[i] ?? null,
      );

      if (position.stopLossPrice !== null && bar.low <= position.stopLossPrice) {
        openPosition = closeTrade(position.stopLossPrice, i, 'STOP_LOSS', null);
      } else if (trailingStopPrice !== null && bar.low <= trailingStopPrice) {
        openPosition = closeTrade(trailingStopPrice, i, 'TRAILING_STOP', null);
      } else if (position.takeProfitPrice !== null && bar.high >= position.takeProfitPrice) {
        openPosition = closeTrade(position.takeProfitPrice, i, 'TAKE_PROFIT', null);
      }
    }

    // 3. Evaluate condition trees using data through THIS bar's close, to
    //    be filled at the NEXT bar's open (step 1, next iteration).
    if (openPosition) {
      const exitSignal = evaluateConditionTree(strategy.exitConditions, candles, i, seriesCache);
      if (exitSignal.result) pendingExit = exitSignal;
    } else if (!pendingEntry) {
      const entrySignal = evaluateConditionTree(strategy.entryConditions, candles, i, seriesCache);
      if (entrySignal.result) pendingEntry = entrySignal;
    }
  }

  // Any position still open at the end of the series is closed at the
  // final bar's close - a backtest has to end somewhere, and leaving an
  // open position out of the trade log/metrics would understate risk.
  if (openPosition) {
    const lastIndex = candles.length - 1;
    openPosition = closeTrade(candles[lastIndex]!.close, lastIndex, 'END_OF_BACKTEST', null);
  }

  return { trades, metrics: calculateMetrics(trades, opts.initialCapital) };
}

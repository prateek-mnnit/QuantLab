import { describe, expect, it } from 'vitest';
import type { Candle, ConditionGroup } from '@quantlab/shared-types';
import { runBacktest, type BacktestableStrategy } from './BacktestEngine.js';

function flatCandle(time: number, price: number): Candle {
  return { time, open: price, high: price, low: price, close: price, volume: 1000 };
}

function crossCondition(operator: 'CROSSES_ABOVE' | 'CROSSES_BELOW', value: number): ConditionGroup {
  return {
    type: 'AND',
    id: 'root',
    children: [
      { type: 'CONDITION', id: 'c1', left: { source: 'PRICE', field: 'close' }, operator, right: { source: 'VALUE', value } },
    ],
  };
}

describe('runBacktest', () => {
  it('opens on the bar AFTER an entry signal and closes on the bar AFTER an exit signal', () => {
    const candles = [95, 105, 110, 95, 90].map((price, i) => flatCandle(i, price));

    const strategy: BacktestableStrategy = {
      entryConditions: crossCondition('CROSSES_ABOVE', 100),
      exitConditions: crossCondition('CROSSES_BELOW', 100),
      stopLossConfig: null,
      takeProfitConfig: null,
      trailingStopConfig: null,
      positionSizingConfig: { type: 'FIXED_SHARES', value: 1 },
    };

    const result = runBacktest(strategy, candles, { slippagePct: 0, commissionPerTrade: 0 });

    expect(result.trades).toHaveLength(1);
    const [trade] = result.trades;
    // Cross above detected using bar 1's close (105 vs prior 95) - filled at bar 2's open.
    expect(trade!.entryPrice).toBe(110);
    // Cross below detected using bar 3's close (95 vs prior 110) - filled at bar 4's open.
    expect(trade!.exitPrice).toBe(90);
    expect(trade!.exitReason).toBe('EXIT_SIGNAL');
    expect(trade!.pnl).toBeCloseTo(-20); // (90 - 110) * 1 share, zero commission/slippage
    expect(result.metrics.totalTrades).toBe(1);
    expect(result.metrics.winRate).toBe(0);
  });

  it('drives entries/exits from an indicator crossover condition, not just PRICE - proving indicators (Group AC) are wired all the way through the engine', () => {
    // A fast EMA(2) crossing above/below a slow EMA(4), same convention as
    // the PRICE-crossing test above. Crossover bars found by computing
    // both EMAs independently (see this group's PR notes): fast crosses
    // ABOVE slow at bar index 6, and back BELOW at bar index 11.
    const closes = [100, 98, 96, 94, 92, 95, 100, 105, 110, 108, 104, 98, 92, 88, 85];
    const candles = closes.map((price, i) => flatCandle(i, price));

    function emaCrossCondition(operator: 'CROSSES_ABOVE' | 'CROSSES_BELOW'): ConditionGroup {
      return {
        type: 'AND',
        id: 'root',
        children: [
          {
            type: 'CONDITION',
            id: 'c1',
            left: { source: 'INDICATOR', indicator: 'EMA', params: { period: 2 } },
            operator,
            right: { source: 'INDICATOR', indicator: 'EMA', params: { period: 4 } },
          },
        ],
      };
    }

    const strategy: BacktestableStrategy = {
      entryConditions: emaCrossCondition('CROSSES_ABOVE'),
      exitConditions: emaCrossCondition('CROSSES_BELOW'),
      stopLossConfig: null,
      takeProfitConfig: null,
      trailingStopConfig: null,
      positionSizingConfig: { type: 'FIXED_SHARES', value: 1 },
    };

    const result = runBacktest(strategy, candles, { slippagePct: 0, commissionPerTrade: 0 });

    expect(result.trades).toHaveLength(1);
    const [trade] = result.trades;
    // Entry signal (fast crosses above slow) detected using bar 6's EMA
    // values - filled at bar 7's open (105). Exit signal (fast crosses
    // back below slow) detected using bar 11's EMA values - filled at bar
    // 12's open (92).
    expect(trade!.entryPrice).toBe(105);
    expect(trade!.exitPrice).toBe(92);
    expect(trade!.exitReason).toBe('EXIT_SIGNAL');
    expect(trade!.pnl).toBeCloseTo(-13);
  });

  it('never opens a position when the entry condition tree is empty', () => {
    const candles = [95, 105, 110, 95, 90].map((price, i) => flatCandle(i, price));
    const strategy: BacktestableStrategy = {
      entryConditions: { type: 'AND', id: 'root', children: [] },
      exitConditions: { type: 'AND', id: 'root', children: [] },
      stopLossConfig: null,
      takeProfitConfig: null,
      trailingStopConfig: null,
      positionSizingConfig: { type: 'FIXED_SHARES', value: 1 },
    };

    const result = runBacktest(strategy, candles);
    expect(result.trades).toHaveLength(0);
    expect(result.metrics.totalTrades).toBe(0);
  });

  it('a stop loss triggers intrabar and takes priority over a slower exit signal', () => {
    // Price crashes hard enough on bar 3 to blow through a 5% stop loss,
    // well before the (deliberately unreachable) exit-signal condition
    // would ever fire.
    const candles = [95, 105, 110, 80, 90].map((price, i) => flatCandle(i, price));
    const strategy: BacktestableStrategy = {
      entryConditions: crossCondition('CROSSES_ABOVE', 100),
      exitConditions: crossCondition('CROSSES_BELOW', 999),
      stopLossConfig: { type: 'PERCENT', value: 5 },
      takeProfitConfig: null,
      trailingStopConfig: null,
      positionSizingConfig: { type: 'FIXED_SHARES', value: 1 },
    };

    const result = runBacktest(strategy, candles, { slippagePct: 0, commissionPerTrade: 0 });

    expect(result.trades).toHaveLength(1);
    expect(result.trades[0]!.exitReason).toBe('STOP_LOSS');
    // Entry at bar 2's open (110); 5% stop = 104.5, triggered by bar 3's low of 80.
    expect(result.trades[0]!.exitPrice).toBeCloseTo(104.5);
  });

  it('applies commission and slippage to both legs of a trade', () => {
    const candles = [95, 105, 110, 95, 90].map((price, i) => flatCandle(i, price));
    const strategy: BacktestableStrategy = {
      entryConditions: crossCondition('CROSSES_ABOVE', 100),
      exitConditions: crossCondition('CROSSES_BELOW', 100),
      stopLossConfig: null,
      takeProfitConfig: null,
      trailingStopConfig: null,
      positionSizingConfig: { type: 'FIXED_SHARES', value: 1 },
    };

    const result = runBacktest(strategy, candles, { slippagePct: 0.01, commissionPerTrade: 2 });
    const [trade] = result.trades;

    expect(trade!.entryPrice).toBeCloseTo(110 * 1.01); // buy fills worse (higher)
    expect(trade!.exitPrice).toBeCloseTo(90 * 0.99); // sell fills worse (lower)
    // pnl = (exit - entry) * size - round-trip commission (entry leg + exit leg)
    expect(trade!.pnl).toBeCloseTo((90 * 0.99 - 110 * 1.01) * 1 - 2 * 2);
  });
});

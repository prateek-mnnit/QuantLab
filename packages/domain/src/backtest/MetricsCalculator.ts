import type { BacktestMetrics, SimulatedTrade } from './types.js';

const SECONDS_PER_YEAR = 365.25 * 24 * 60 * 60;

/**
 * Computes summary statistics from a completed trade list. Every formula
 * here is the standard, textbook definition - documented per-metric since
 * these are exactly the numbers a trader (or an interviewer) will
 * scrutinize first, and "trust me, it's right" isn't good enough for
 * anything claiming to measure real money.
 */
export function calculateMetrics(trades: SimulatedTrade[], initialCapital: number): BacktestMetrics {
  const closed = trades.filter(
    (trade): trade is SimulatedTrade & { pnl: number; exitTime: number } =>
      trade.pnl !== null && trade.exitTime !== null,
  );

  if (closed.length === 0) {
    return { totalReturnPct: 0, cagr: 0, winRate: 0, profitFactor: 0, maxDrawdownPct: 0, sharpeRatio: 0, totalTrades: 0 };
  }

  const totalPnl = closed.reduce((sum, trade) => sum + trade.pnl, 0);
  const totalReturnPct = (totalPnl / initialCapital) * 100;

  const wins = closed.filter((trade) => trade.pnl > 0);
  const losses = closed.filter((trade) => trade.pnl < 0);
  const winRate = (wins.length / closed.length) * 100;

  const grossProfit = wins.reduce((sum, trade) => sum + trade.pnl, 0);
  const grossLoss = Math.abs(losses.reduce((sum, trade) => sum + trade.pnl, 0));
  // Profit factor is conventionally undefined/infinite with zero losses -
  // represented as Infinity (a real, meaningful value: "no losing trades"),
  // or 0 in the degenerate case of no profit and no loss at all.
  const profitFactor = grossLoss === 0 ? (grossProfit > 0 ? Infinity : 0) : grossProfit / grossLoss;

  // Equity curve + max drawdown, walked trade-by-trade rather than
  // bar-by-bar - correct and sufficient for a single-position-at-a-time
  // engine, since equity only actually changes when a trade closes.
  let equity = initialCapital;
  let peak = initialCapital;
  let maxDrawdownPct = 0;
  const perTradeReturns: number[] = [];

  for (const trade of closed) {
    const equityBefore = equity;
    equity += trade.pnl;
    perTradeReturns.push(equity / equityBefore - 1);
    peak = Math.max(peak, equity);
    maxDrawdownPct = Math.max(maxDrawdownPct, ((peak - equity) / peak) * 100);
  }

  // CAGR uses the ACTUAL elapsed time between the first entry and the last
  // exit (converted to years), not an assumed backtest length.
  const firstEntry = closed[0]!.entryTime;
  const lastExit = closed[closed.length - 1]!.exitTime;
  const years = Math.max((lastExit - firstEntry) / SECONDS_PER_YEAR, 1 / 365.25);
  const cagr = (Math.pow(equity / initialCapital, 1 / years) - 1) * 100;

  // A simplified, per-trade Sharpe ratio (mean trade return over its
  // standard deviation, annualized by trades-per-year) rather than a
  // daily-returns Sharpe - appropriate here since this engine tracks
  // equity only at trade close, not on every non-trading bar.
  const meanReturn = perTradeReturns.reduce((sum, r) => sum + r, 0) / perTradeReturns.length;
  const variance =
    perTradeReturns.reduce((sum, r) => sum + (r - meanReturn) ** 2, 0) / perTradeReturns.length;
  const stdDev = Math.sqrt(variance);
  const tradesPerYear = closed.length / years;
  const sharpeRatio = stdDev === 0 ? 0 : (meanReturn / stdDev) * Math.sqrt(tradesPerYear);

  return { totalReturnPct, cagr, winRate, profitFactor, maxDrawdownPct, sharpeRatio, totalTrades: closed.length };
}

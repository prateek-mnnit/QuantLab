import type { BacktestRun as PrismaBacktestRun, Trade as PrismaTrade } from '@prisma/client';
import type { BacktestRun, Trade } from '@quantlab/shared-types';

/**
 * Same purpose as StrategyMapper: Prisma's generated types model the
 * DATABASE row (JSON columns typed as the generic Prisma.JsonValue, real
 * Date objects instead of ISO strings) - nothing outside this file should
 * know that distinction exists.
 */
export function toBacktestRunDto(run: PrismaBacktestRun): BacktestRun {
  return {
    id: run.id,
    strategyId: run.strategyId,
    symbol: run.symbol,
    timeframe: run.timeframe as BacktestRun['timeframe'],
    dateFrom: run.dateFrom.toISOString(),
    dateTo: run.dateTo.toISOString(),
    status: run.status,
    errorMessage: run.errorMessage,
    totalReturnPct: run.totalReturnPct,
    cagr: run.cagr,
    winRate: run.winRate,
    profitFactor: run.profitFactor,
    maxDrawdownPct: run.maxDrawdownPct,
    sharpeRatio: run.sharpeRatio,
    totalTrades: run.totalTrades,
    createdAt: run.createdAt.toISOString(),
    completedAt: run.completedAt ? run.completedAt.toISOString() : null,
  };
}

export function toTradeDto(trade: PrismaTrade): Trade {
  return {
    id: trade.id,
    backtestRunId: trade.backtestRunId,
    entryTime: trade.entryTime.toISOString(),
    entryPrice: trade.entryPrice,
    exitTime: trade.exitTime ? trade.exitTime.toISOString() : null,
    exitPrice: trade.exitPrice,
    size: trade.size,
    pnl: trade.pnl,
    exitReason: trade.exitReason,
    entryExplanation: trade.entryExplanation as unknown as Trade['entryExplanation'],
    exitExplanation: trade.exitExplanation as unknown as Trade['exitExplanation'],
  };
}

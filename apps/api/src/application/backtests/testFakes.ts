import type { BacktestRun, Prisma, Trade } from '@prisma/client';
import type { IBacktestRunRepository } from '../../infrastructure/persistence/repositories/BacktestRunRepository.js';
import type { ITradeRepository } from '../../infrastructure/persistence/repositories/TradeRepository.js';
import type { Candle, SymbolResult, Timeframe } from '@quantlab/shared-types';
import type { MarketDataProvider } from '../../infrastructure/market-data/MarketDataProvider.js';

/**
 * In-memory fakes for the backtest use cases' dependencies - same pattern
 * as Groups V/W. `FakeStrategyRepository` is intentionally NOT redefined
 * here: it already exists in ../strategies/testFakes.ts and is imported
 * from there by the test files below, avoiding a duplicate abstraction for
 * something that would be exactly the same fake either way.
 *
 * Group AH correction: BacktestRun now has its own `userId` column
 * (mirrors the real repository - see BacktestRunRepository.ts's own doc
 * comment), so this fake stores ownership directly on each run instead of
 * needing an external "who owns this strategyId" callback the way it used
 * to. `null` means a global example run.
 */
export class FakeBacktestRunRepository implements IBacktestRunRepository {
  private readonly runs: BacktestRun[] = [];
  private idCounter = 0;

  async create(data: Prisma.BacktestRunUncheckedCreateInput): Promise<BacktestRun> {
    this.idCounter += 1;
    const now = new Date();
    const run: BacktestRun = {
      id: `run-${this.idCounter}`,
      strategyId: data.strategyId as string,
      userId: (data.userId as string | null | undefined) ?? null,
      symbol: data.symbol as string,
      timeframe: data.timeframe as string,
      dateFrom: data.dateFrom as Date,
      dateTo: data.dateTo as Date,
      status: (data.status as BacktestRun['status']) ?? 'PENDING',
      errorMessage: null,
      totalReturnPct: null,
      cagr: null,
      winRate: null,
      profitFactor: null,
      maxDrawdownPct: null,
      sharpeRatio: null,
      totalTrades: null,
      createdAt: now,
      completedAt: null,
    };
    this.runs.push(run);
    return run;
  }

  async findByIdVisibleToUser(id: string, userId: string): Promise<BacktestRun | null> {
    return this.runs.find((run) => run.id === id && (run.userId === userId || run.userId === null)) ?? null;
  }

  async findManyVisibleToUser(userId: string, strategyId?: string): Promise<BacktestRun[]> {
    return this.runs
      .filter((run) => (run.userId === userId || run.userId === null) && (!strategyId || run.strategyId === strategyId))
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async findManyBuiltIn(strategyId?: string): Promise<BacktestRun[]> {
    return this.runs.filter((run) => run.userId === null && (!strategyId || run.strategyId === strategyId));
  }

  async update(id: string, data: Prisma.BacktestRunUpdateInput): Promise<BacktestRun> {
    const run = this.runs.find((candidate) => candidate.id === id);
    if (!run) {
      throw new Error(`FakeBacktestRunRepository: no run with id "${id}"`);
    }
    if (data.status !== undefined) run.status = data.status as BacktestRun['status'];
    if (data.errorMessage !== undefined) run.errorMessage = data.errorMessage as string | null;
    if (data.totalReturnPct !== undefined) run.totalReturnPct = data.totalReturnPct as number | null;
    if (data.cagr !== undefined) run.cagr = data.cagr as number | null;
    if (data.winRate !== undefined) run.winRate = data.winRate as number | null;
    if (data.profitFactor !== undefined) run.profitFactor = data.profitFactor as number | null;
    if (data.maxDrawdownPct !== undefined) run.maxDrawdownPct = data.maxDrawdownPct as number | null;
    if (data.sharpeRatio !== undefined) run.sharpeRatio = data.sharpeRatio as number | null;
    if (data.totalTrades !== undefined) run.totalTrades = data.totalTrades as number | null;
    if (data.completedAt !== undefined) run.completedAt = data.completedAt as Date | null;
    return run;
  }
}

export class FakeTradeRepository implements ITradeRepository {
  private readonly trades: Trade[] = [];
  private idCounter = 0;

  async createMany(trades: Prisma.TradeCreateManyInput[]): Promise<Prisma.BatchPayload> {
    for (const input of trades) {
      this.idCounter += 1;
      this.trades.push({
        id: `trade-${this.idCounter}`,
        backtestRunId: input.backtestRunId as string,
        entryTime: input.entryTime as Date,
        entryPrice: input.entryPrice as number,
        exitTime: (input.exitTime as Date | null | undefined) ?? null,
        exitPrice: (input.exitPrice as number | null | undefined) ?? null,
        size: input.size as number,
        pnl: (input.pnl as number | null | undefined) ?? null,
        exitReason: (input.exitReason as Trade['exitReason']) ?? null,
        entryExplanation: input.entryExplanation as Prisma.JsonValue,
        exitExplanation: (input.exitExplanation as Prisma.JsonValue | undefined) ?? null,
      });
    }
    return { count: trades.length };
  }

  async findManyForRun(backtestRunId: string): Promise<Trade[]> {
    return this.trades.filter((trade) => trade.backtestRunId === backtestRunId);
  }
}

/**
 * A minimal, controllable stand-in for MarketDataProvider - lets a test
 * decide exactly what candles (or error) a provider call produces, without
 * hitting Yahoo Finance or any network at all. This is the same interface
 * YahooFinanceProvider implements (Group L), so it's a genuine
 * substitution, not a parallel abstraction.
 */
export class FakeMarketDataProvider implements MarketDataProvider {
  constructor(
    private readonly candlesToReturn: Candle[] = [],
    private readonly errorToThrow: Error | null = null,
  ) {}

  async getCandles(_symbol: string, _timeframe: Timeframe, _from: Date, _to: Date): Promise<Candle[]> {
    if (this.errorToThrow) throw this.errorToThrow;
    return this.candlesToReturn;
  }

  async searchSymbols(_query: string): Promise<SymbolResult[]> {
    return [];
  }
}

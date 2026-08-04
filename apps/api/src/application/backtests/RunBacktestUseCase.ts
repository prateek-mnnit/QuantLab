import type { Prisma } from '@prisma/client';
import type {
  BacktestRun,
  ConditionNode,
  PositionSizingConfig,
  RunBacktestInput,
  StopLossConfig,
  TakeProfitConfig,
  TrailingStopConfig,
} from '@quantlab/shared-types';
import { runBacktest, type BacktestableStrategy } from '@quantlab/domain';
import type { IStrategyRepository } from '../../infrastructure/persistence/repositories/StrategyRepository.js';
import type { IBacktestRunRepository } from '../../infrastructure/persistence/repositories/BacktestRunRepository.js';
import type { ITradeRepository } from '../../infrastructure/persistence/repositories/TradeRepository.js';
import type { MarketDataProvider } from '../../infrastructure/market-data/MarketDataProvider.js';
import { NotFoundError } from '../errors/AppError.js';
import { toBacktestRunDto } from './BacktestMapper.js';

/**
 * The Phase-1 execution model, exactly as decided in the approved
 * architecture (Technical Architecture doc, Section 6.3): the application
 * layer is SHAPED as if a backtest were asynchronous - a BacktestRun row
 * genuinely transitions RUNNING -> COMPLETED/FAILED, with real status and
 * timestamp fields - but for now it's executed SYNCHRONOUSLY, in-process,
 * inside a single request/response cycle, appropriate for MVP-scale
 * single-symbol backtests over a few years of daily/weekly data. When this
 * outgrows synchronous execution, only THIS use case's implementation
 * changes (swap the body for "enqueue a job, return immediately") - the
 * controller, the BacktestRun status field, and the API contract all stay
 * exactly the same, which is the entire point of shaping it this way now.
 */
export class RunBacktestUseCase {
  constructor(
    private readonly strategyRepository: IStrategyRepository,
    private readonly backtestRunRepository: IBacktestRunRepository,
    private readonly tradeRepository: ITradeRepository,
    private readonly marketDataProvider: MarketDataProvider,
  ) {}

  async execute(userId: string, payload: RunBacktestInput): Promise<BacktestRun> {
    const strategy = await this.strategyRepository.findByIdForUser(payload.strategyId, userId);
    if (!strategy) {
      throw new NotFoundError('Strategy not found.');
    }

    const dateFrom = new Date(payload.dateFrom);
    const dateTo = new Date(payload.dateTo);

    const run = await this.backtestRunRepository.create({
      strategyId: strategy.id,
      symbol: payload.symbol,
      timeframe: payload.timeframe,
      dateFrom,
      dateTo,
      status: 'RUNNING',
    });

    try {
      const candles = await this.marketDataProvider.getCandles(payload.symbol, payload.timeframe, dateFrom, dateTo);

      // Fewer than 2 candles isn't a server error - it's a legitimate
      // "this combination of symbol/date-range/timeframe has no usable
      // data" outcome, so it's recorded as a FAILED run with a clear
      // reason rather than surfacing as a 500 or 404.
      if (candles.length < 2) {
        const failed = await this.backtestRunRepository.update(run.id, {
          status: 'FAILED',
          errorMessage: 'Not enough historical data in the selected date range to run a backtest.',
          completedAt: new Date(),
        });
        return toBacktestRunDto(failed);
      }

      // Prisma's JSON columns are typed as the generic Prisma.JsonValue -
      // these casts bridge that boundary back to the precise shared-types
      // shapes runBacktest() expects, the same pattern StrategyMapper
      // already uses for the reverse direction (domain -> DTO).
      const backtestableStrategy: BacktestableStrategy = {
        entryConditions: strategy.entryConditions as unknown as ConditionNode,
        exitConditions: strategy.exitConditions as unknown as ConditionNode,
        stopLossConfig: strategy.stopLossConfig as unknown as StopLossConfig | null,
        takeProfitConfig: strategy.takeProfitConfig as unknown as TakeProfitConfig | null,
        trailingStopConfig: strategy.trailingStopConfig as unknown as TrailingStopConfig | null,
        positionSizingConfig: strategy.positionSizingConfig as unknown as PositionSizingConfig,
      };

      const result = runBacktest(backtestableStrategy, candles);

      if (result.trades.length > 0) {
        await this.tradeRepository.createMany(
          result.trades.map((trade) => ({
            backtestRunId: run.id,
            // Candle.time (and therefore SimulatedTrade.entryTime/exitTime)
            // is Unix seconds per shared-types' documented convention;
            // Prisma's DateTime columns need milliseconds.
            entryTime: new Date(trade.entryTime * 1000),
            entryPrice: trade.entryPrice,
            exitTime: trade.exitTime !== null ? new Date(trade.exitTime * 1000) : null,
            exitPrice: trade.exitPrice,
            size: trade.size,
            pnl: trade.pnl,
            exitReason: trade.exitReason,
            entryExplanation: trade.entryExplanation as unknown as Prisma.InputJsonValue,
            exitExplanation: (trade.exitExplanation ?? null) as unknown as Prisma.InputJsonValue,
          })),
        );
      }

      const completed = await this.backtestRunRepository.update(run.id, {
        status: 'COMPLETED',
        totalReturnPct: result.metrics.totalReturnPct,
        cagr: result.metrics.cagr,
        winRate: result.metrics.winRate,
        // Infinity (the domain engine's "zero losing trades" value) does
        // not survive JSON serialization - stored as null, matching the
        // BacktestRun DTO's documented convention for this case.
        profitFactor: Number.isFinite(result.metrics.profitFactor) ? result.metrics.profitFactor : null,
        maxDrawdownPct: result.metrics.maxDrawdownPct,
        sharpeRatio: result.metrics.sharpeRatio,
        totalTrades: result.metrics.totalTrades,
        completedAt: new Date(),
      });

      return toBacktestRunDto(completed);
    } catch (error) {
      const failed = await this.backtestRunRepository.update(run.id, {
        status: 'FAILED',
        errorMessage: error instanceof Error ? error.message : 'The backtest failed to run.',
        completedAt: new Date(),
      });
      return toBacktestRunDto(failed);
    }
  }
}

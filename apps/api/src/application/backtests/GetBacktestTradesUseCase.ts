import type { Trade } from '@quantlab/shared-types';
import type { IBacktestRunRepository } from '../../infrastructure/persistence/repositories/BacktestRunRepository.js';
import type { ITradeRepository } from '../../infrastructure/persistence/repositories/TradeRepository.js';
import { NotFoundError } from '../errors/AppError.js';
import { toTradeDto } from './BacktestMapper.js';

export class GetBacktestTradesUseCase {
  constructor(
    private readonly backtestRunRepository: IBacktestRunRepository,
    private readonly tradeRepository: ITradeRepository,
  ) {}

  async execute(backtestRunId: string, userId: string): Promise<Trade[]> {
    // A Trade row has no userId of its own - ownership is established by
    // confirming the PARENT RUN is visible to this user first (their own
    // run, or a global example), same pattern as everywhere else
    // ownership/visibility is checked in this codebase.
    const run = await this.backtestRunRepository.findByIdVisibleToUser(backtestRunId, userId);
    if (!run) {
      throw new NotFoundError('Backtest run not found.');
    }

    const trades = await this.tradeRepository.findManyForRun(backtestRunId);
    return trades.map(toTradeDto);
  }
}

import type { Trade } from '@quantlab/shared-types';
import type { BacktestRunRepository } from '../../infrastructure/persistence/repositories/BacktestRunRepository.js';
import type { TradeRepository } from '../../infrastructure/persistence/repositories/TradeRepository.js';
import { NotFoundError } from '../errors/AppError.js';
import { toTradeDto } from './BacktestMapper.js';

export class GetBacktestTradesUseCase {
  constructor(
    private readonly backtestRunRepository: BacktestRunRepository,
    private readonly tradeRepository: TradeRepository,
  ) {}

  async execute(backtestRunId: string, userId: string): Promise<Trade[]> {
    // A Trade row has no userId of its own - ownership is established by
    // confirming the PARENT RUN belongs to this user first, same pattern
    // as everywhere else ownership is checked in this codebase.
    const run = await this.backtestRunRepository.findByIdForUser(backtestRunId, userId);
    if (!run) {
      throw new NotFoundError('Backtest run not found.');
    }

    const trades = await this.tradeRepository.findManyForRun(backtestRunId);
    return trades.map(toTradeDto);
  }
}

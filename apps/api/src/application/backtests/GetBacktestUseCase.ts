import type { BacktestRun } from '@quantlab/shared-types';
import type { BacktestRunRepository } from '../../infrastructure/persistence/repositories/BacktestRunRepository.js';
import { NotFoundError } from '../errors/AppError.js';
import { toBacktestRunDto } from './BacktestMapper.js';

export class GetBacktestUseCase {
  constructor(private readonly backtestRunRepository: BacktestRunRepository) {}

  async execute(id: string, userId: string): Promise<BacktestRun> {
    const run = await this.backtestRunRepository.findByIdForUser(id, userId);
    if (!run) {
      throw new NotFoundError('Backtest run not found.');
    }
    return toBacktestRunDto(run);
  }
}

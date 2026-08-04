import type { BacktestRun } from '@quantlab/shared-types';
import type { IBacktestRunRepository } from '../../infrastructure/persistence/repositories/BacktestRunRepository.js';
import { toBacktestRunDto } from './BacktestMapper.js';

export class ListBacktestsUseCase {
  constructor(private readonly backtestRunRepository: IBacktestRunRepository) {}

  async execute(userId: string, strategyId?: string): Promise<BacktestRun[]> {
    const runs = await this.backtestRunRepository.findManyForUser(userId, strategyId);
    return runs.map(toBacktestRunDto);
  }
}

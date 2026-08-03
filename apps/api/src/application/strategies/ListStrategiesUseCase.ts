import type { IStrategyRepository } from '../../infrastructure/persistence/repositories/StrategyRepository.js';
import type { StrategySummary } from '@quantlab/shared-types';
import { toStrategySummaryDto } from './StrategyMapper.js';

export class ListStrategiesUseCase {
  constructor(private readonly strategyRepository: IStrategyRepository) {}

  async execute(userId: string): Promise<StrategySummary[]> {
    const strategies = await this.strategyRepository.findManyByUser(userId);
    return strategies.map(toStrategySummaryDto);
  }
}

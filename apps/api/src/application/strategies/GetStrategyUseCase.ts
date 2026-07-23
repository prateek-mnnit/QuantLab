import type { StrategyRepository } from '../../infrastructure/persistence/repositories/StrategyRepository.js';
import type { Strategy } from '@quantlab/shared-types';
import { NotFoundError } from '../errors/AppError.js';
import { toStrategyDto } from './StrategyMapper.js';

export class GetStrategyUseCase {
  constructor(private readonly strategyRepository: StrategyRepository) {}

  async execute(id: string, userId: string): Promise<Strategy> {
    const strategy = await this.strategyRepository.findByIdForUser(id, userId);
    if (!strategy) {
      throw new NotFoundError('Strategy not found.');
    }
    return toStrategyDto(strategy);
  }
}

import type { IStrategyRepository } from '../../infrastructure/persistence/repositories/StrategyRepository.js';
import { NotFoundError } from '../errors/AppError.js';

export class DeleteStrategyUseCase {
  constructor(private readonly strategyRepository: IStrategyRepository) {}

  async execute(id: string, userId: string): Promise<void> {
    const existing = await this.strategyRepository.findByIdForUser(id, userId);
    if (!existing) {
      throw new NotFoundError('Strategy not found.');
    }
    await this.strategyRepository.delete(id);
  }
}

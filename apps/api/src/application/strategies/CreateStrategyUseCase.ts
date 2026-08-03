import type { Prisma } from '@prisma/client';
import type { IStrategyRepository } from '../../infrastructure/persistence/repositories/StrategyRepository.js';
import type { Strategy, StrategyInput } from '@quantlab/shared-types';
import { toStrategyDto } from './StrategyMapper.js';

export class CreateStrategyUseCase {
  constructor(private readonly strategyRepository: IStrategyRepository) {}

  async execute(userId: string, input: StrategyInput): Promise<Strategy> {
    const strategy = await this.strategyRepository.create(userId, {
      name: input.name,
      description: input.description ?? null,
      timeframe: input.timeframe,
      // The JSON tree types are structurally plain objects, but Prisma's
      // generated types don't know that at compile time - this cast is the
      // one place that boundary is bridged, rather than weakening the
      // shared types themselves just to satisfy Prisma's Json column type.
      entryConditions: input.entryConditions as unknown as Prisma.InputJsonValue,
      exitConditions: input.exitConditions as unknown as Prisma.InputJsonValue,
      stopLossConfig: (input.stopLossConfig ?? null) as unknown as Prisma.InputJsonValue,
      takeProfitConfig: (input.takeProfitConfig ?? null) as unknown as Prisma.InputJsonValue,
      trailingStopConfig: (input.trailingStopConfig ?? null) as unknown as Prisma.InputJsonValue,
      positionSizingConfig: input.positionSizingConfig as unknown as Prisma.InputJsonValue,
    });

    return toStrategyDto(strategy);
  }
}

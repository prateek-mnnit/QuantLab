import type { Prisma } from '@prisma/client';
import type { IStrategyRepository } from '../../infrastructure/persistence/repositories/StrategyRepository.js';
import type { Strategy, StrategyInput } from '@quantlab/shared-types';
import { toStrategyDto } from './StrategyMapper.js';

export class CreateStrategyUseCase {
  constructor(private readonly strategyRepository: IStrategyRepository) {}

  /**
   * `userId: null` creates a built-in/product-level strategy - ONLY
   * Group AH's seed script ever passes null. The HTTP layer's controller
   * always calls this with `req.user!.id` (a real, authenticated user),
   * so a normal `POST /api/strategies` request can never create built-in
   * content this way.
   *
   * `options.isBuiltIn` marks the row itself (kept as an explicit column
   * for query clarity - see schema.prisma) - it's expected to be true
   * exactly when userId is null and false otherwise, though nothing here
   * enforces that pairing beyond the seed script always passing both
   * together correctly.
   */
  async execute(userId: string | null, input: StrategyInput, options?: { isBuiltIn?: boolean }): Promise<Strategy> {
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
      isBuiltIn: options?.isBuiltIn ?? false,
    });

    return toStrategyDto(strategy);
  }
}

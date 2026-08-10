import type { Strategy as PrismaStrategy } from '@prisma/client';
import type { Strategy as StrategyDto, StrategySummary } from '@quantlab/shared-types';

/**
 * Prisma's generated `Strategy` type models the DATABASE row - its JSON
 * columns (`entryConditions`, etc.) are typed as the generic `Prisma.JsonValue`,
 * not our actual `ConditionNode` shape, and its dates are real `Date`
 * objects rather than ISO strings. Nothing outside this file should know
 * that distinction exists; every use case and controller works with the
 * `@quantlab/shared-types` `Strategy` shape, which is what actually gets
 * serialized to JSON and sent to the frontend.
 */
export function toStrategyDto(strategy: PrismaStrategy): StrategyDto {
  return {
    id: strategy.id,
    userId: strategy.userId,
    name: strategy.name,
    description: strategy.description,
    version: strategy.version,
    timeframe: strategy.timeframe as StrategyDto['timeframe'],
    entryConditions: strategy.entryConditions as StrategyDto['entryConditions'],
    exitConditions: strategy.exitConditions as StrategyDto['exitConditions'],
    stopLossConfig: strategy.stopLossConfig as StrategyDto['stopLossConfig'],
    takeProfitConfig: strategy.takeProfitConfig as StrategyDto['takeProfitConfig'],
    trailingStopConfig: strategy.trailingStopConfig as StrategyDto['trailingStopConfig'],
    positionSizingConfig: strategy.positionSizingConfig as StrategyDto['positionSizingConfig'],
    isBuiltIn: strategy.isBuiltIn,
    createdAt: strategy.createdAt.toISOString(),
    updatedAt: strategy.updatedAt.toISOString(),
  };
}

export function toStrategySummaryDto(strategy: PrismaStrategy): StrategySummary {
  return {
    id: strategy.id,
    name: strategy.name,
    description: strategy.description,
    timeframe: strategy.timeframe as StrategySummary['timeframe'],
    version: strategy.version,
    isBuiltIn: strategy.isBuiltIn,
    createdAt: strategy.createdAt.toISOString(),
    updatedAt: strategy.updatedAt.toISOString(),
  };
}

import type { BacktestRun, Prisma, PrismaClient } from '@prisma/client';

export class BacktestRunRepository {
  constructor(private readonly prisma: PrismaClient) {}

  create(data: Prisma.BacktestRunUncheckedCreateInput): Promise<BacktestRun> {
    return this.prisma.backtestRun.create({ data });
  }

  /**
   * Scoped through the OWNING STRATEGY's userId in one query - the same
   * ownership pattern StrategyRepository already uses. A BacktestRun has
   * no userId of its own (only its parent Strategy does), so this nested
   * `where` is what makes "not your backtest" indistinguishable from
   * "doesn't exist" - the same information-disclosure protection already
   * established for strategies.
   */
  findByIdForUser(id: string, userId: string): Promise<BacktestRun | null> {
    return this.prisma.backtestRun.findFirst({ where: { id, strategy: { userId } } });
  }

  findManyForUser(userId: string, strategyId?: string): Promise<BacktestRun[]> {
    return this.prisma.backtestRun.findMany({
      where: { strategy: { userId }, ...(strategyId ? { strategyId } : {}) },
      orderBy: { createdAt: 'desc' },
    });
  }

  update(id: string, data: Prisma.BacktestRunUpdateInput): Promise<BacktestRun> {
    return this.prisma.backtestRun.update({ where: { id }, data });
  }
}

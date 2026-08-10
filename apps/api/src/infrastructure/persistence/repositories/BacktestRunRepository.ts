import type { BacktestRun, Prisma, PrismaClient } from '@prisma/client';

export interface IBacktestRunRepository {
  /**
   * `data.userId` is who PERSONALLY requested this run - `null` for a
   * pre-generated, global example backtest (Group AH's seed script), a
   * real user id for anyone who clicked "Run Backtest" themselves,
   * regardless of whether the strategy they ran it against is their own
   * or a built-in one.
   */
  create(data: Prisma.BacktestRunUncheckedCreateInput): Promise<BacktestRun>;
  /** VISIBLE - this user's own runs PLUS every global example run. Used for listing/reading, so "View Analysis" works on an example backtest too. */
  findByIdVisibleToUser(id: string, userId: string): Promise<BacktestRun | null>;
  /** VISIBLE - see findByIdVisibleToUser. */
  findManyVisibleToUser(userId: string, strategyId?: string): Promise<BacktestRun[]>;
  /** GLOBAL - every example run, regardless of requester. Used only by the seed script's own idempotency check (has no "requesting user"). */
  findManyBuiltIn(strategyId?: string): Promise<BacktestRun[]>;
  update(id: string, data: Prisma.BacktestRunUpdateInput): Promise<BacktestRun>;
}

/**
 * Group AH correction: this used to derive "who owns this run" entirely
 * through a nested `strategy: { userId }` join, because BacktestRun had no
 * userId of its own. That broke the moment a Strategy could be ownerless
 * (built-in): a personal backtest run AGAINST a built-in strategy still
 * needs to be recognizably the requester's, not indistinguishable from a
 * global example. BacktestRun now has its own `userId` column (see
 * schema.prisma's doc comment on it), so every query here is a direct
 * column match again - simpler than the old join, not just a workaround.
 */
export class BacktestRunRepository implements IBacktestRunRepository {
  constructor(private readonly prisma: PrismaClient) {}

  create(data: Prisma.BacktestRunUncheckedCreateInput): Promise<BacktestRun> {
    return this.prisma.backtestRun.create({ data });
  }

  findByIdVisibleToUser(id: string, userId: string): Promise<BacktestRun | null> {
    return this.prisma.backtestRun.findFirst({ where: { id, OR: [{ userId }, { userId: null }] } });
  }

  findManyVisibleToUser(userId: string, strategyId?: string): Promise<BacktestRun[]> {
    return this.prisma.backtestRun.findMany({
      where: { OR: [{ userId }, { userId: null }], ...(strategyId ? { strategyId } : {}) },
      orderBy: { createdAt: 'desc' },
    });
  }

  findManyBuiltIn(strategyId?: string): Promise<BacktestRun[]> {
    return this.prisma.backtestRun.findMany({
      where: { userId: null, ...(strategyId ? { strategyId } : {}) },
    });
  }

  update(id: string, data: Prisma.BacktestRunUpdateInput): Promise<BacktestRun> {
    return this.prisma.backtestRun.update({ where: { id }, data });
  }
}

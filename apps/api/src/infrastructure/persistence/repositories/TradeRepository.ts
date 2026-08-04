import type { Prisma, PrismaClient, Trade } from '@prisma/client';

export interface ITradeRepository {
  createMany(trades: Prisma.TradeCreateManyInput[]): Promise<Prisma.BatchPayload>;
  findManyForRun(backtestRunId: string): Promise<Trade[]>;
}

export class TradeRepository implements ITradeRepository {
  constructor(private readonly prisma: PrismaClient) {}

  createMany(trades: Prisma.TradeCreateManyInput[]): Promise<Prisma.BatchPayload> {
    return this.prisma.trade.createMany({ data: trades });
  }

  findManyForRun(backtestRunId: string): Promise<Trade[]> {
    return this.prisma.trade.findMany({ where: { backtestRunId }, orderBy: { entryTime: 'asc' } });
  }
}

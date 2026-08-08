import { z } from 'zod';

const isoDateString = z.string().refine((value) => !Number.isNaN(Date.parse(value)), {
  message: 'Must be a valid date (e.g. 2024-01-01).',
});

export const runBacktestSchema = z.object({
  strategyId: z.string().uuid('strategyId must be a valid id.'),
  symbol: z.string().trim().min(1, 'Symbol is required.'),
  timeframe: z.enum(['5m', '15m', '30m', '1H', '4H', '1D', '1W']),
  dateFrom: isoDateString,
  dateTo: isoDateString,
});

export type RunBacktestInput = z.infer<typeof runBacktestSchema>;

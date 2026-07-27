import { z } from 'zod';

const isoDateString = z.string().refine((value) => !Number.isNaN(Date.parse(value)), {
  message: 'Must be a valid date (e.g. 2024-01-01).',
});

export const candlesQuerySchema = z.object({
  timeframe: z.enum(['1D', '1W']),
  from: isoDateString,
  to: isoDateString,
});

export const symbolSearchQuerySchema = z.object({
  q: z.string().trim().min(1, 'Search query is required.'),
});

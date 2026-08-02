import { z } from 'zod';

export const addToWatchlistSchema = z.object({
  symbol: z.string().trim().min(1, 'Symbol is required.').max(20, 'Symbol is too long.'),
});

export type AddToWatchlistInput = z.infer<typeof addToWatchlistSchema>;

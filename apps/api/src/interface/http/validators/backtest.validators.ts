import { z } from 'zod';

export const listBacktestsQuerySchema = z.object({
  strategyId: z.string().uuid().optional(),
});

import type { Request, Response } from 'express';
import type { ApiSuccessResponse, Candle, SymbolResult, Timeframe } from '@quantlab/shared-types';
import type { GetCandlesUseCase } from '../../../application/market-data/GetCandlesUseCase.js';
import type { SearchSymbolsUseCase } from '../../../application/market-data/SearchSymbolsUseCase.js';

/**
 * Express 5's router types every route param as `string | string[]` (see
 * the identical helper - and the same explanation - in
 * strategy.controller.ts, which this mirrors rather than importing, to
 * avoid coupling two otherwise-unrelated controllers together over a
 * three-line helper).
 */
function getSymbolParam(params: Request['params']): string {
  const value = params.symbol;
  return Array.isArray(value) ? value[0]! : value!;
}

export function createMarketDataController(dependencies: {
  getCandlesUseCase: GetCandlesUseCase;
  searchSymbolsUseCase: SearchSymbolsUseCase;
}) {
  const { getCandlesUseCase, searchSymbolsUseCase } = dependencies;

  return {
    async getCandles(req: Request, res: Response): Promise<void> {
      // Populated by the validateQuery(candlesQuerySchema) middleware - see
      // market-data.routes.ts and middleware/validate.ts for why this reads
      // from res.locals rather than req.query.
      const { timeframe, from, to } = res.locals.validatedQuery as {
        timeframe: Timeframe;
        from: string;
        to: string;
      };

      const candles = await getCandlesUseCase.execute(
        getSymbolParam(req.params),
        timeframe,
        new Date(from),
        new Date(to),
      );

      const body: ApiSuccessResponse<Candle[]> = { success: true, data: candles };
      res.status(200).json(body);
    },

    async search(req: Request, res: Response): Promise<void> {
      const { q } = res.locals.validatedQuery as { q: string };

      const results = await searchSymbolsUseCase.execute(q);

      const body: ApiSuccessResponse<SymbolResult[]> = { success: true, data: results };
      res.status(200).json(body);
    },
  };
}

import type { Request, Response } from 'express';
import type { ApiSuccessResponse, BacktestRun, Trade } from '@quantlab/shared-types';
import type { RunBacktestUseCase } from '../../../application/backtests/RunBacktestUseCase.js';
import type { GetBacktestUseCase } from '../../../application/backtests/GetBacktestUseCase.js';
import type { GetBacktestTradesUseCase } from '../../../application/backtests/GetBacktestTradesUseCase.js';
import type { ListBacktestsUseCase } from '../../../application/backtests/ListBacktestsUseCase.js';

/**
 * Same Express-5-params-can-be-string[] situation as strategy.controller.ts
 * and market-data.controller.ts - kept local rather than shared, per the
 * precedent already set in this codebase for that three-line helper.
 */
function getIdParam(params: Request['params']): string {
  const value = params.id;
  return Array.isArray(value) ? value[0]! : value!;
}

export function createBacktestController(dependencies: {
  runBacktestUseCase: RunBacktestUseCase;
  getBacktestUseCase: GetBacktestUseCase;
  getBacktestTradesUseCase: GetBacktestTradesUseCase;
  listBacktestsUseCase: ListBacktestsUseCase;
}) {
  const { runBacktestUseCase, getBacktestUseCase, getBacktestTradesUseCase, listBacktestsUseCase } = dependencies;

  return {
    async run(req: Request, res: Response): Promise<void> {
      const run = await runBacktestUseCase.execute(req.user!.id, req.body);
      const body: ApiSuccessResponse<BacktestRun> = { success: true, data: run };
      res.status(201).json(body);
    },

    async getOne(req: Request, res: Response): Promise<void> {
      const run = await getBacktestUseCase.execute(getIdParam(req.params), req.user!.id);
      const body: ApiSuccessResponse<BacktestRun> = { success: true, data: run };
      res.status(200).json(body);
    },

    async getTrades(req: Request, res: Response): Promise<void> {
      const trades = await getBacktestTradesUseCase.execute(getIdParam(req.params), req.user!.id);
      const body: ApiSuccessResponse<Trade[]> = { success: true, data: trades };
      res.status(200).json(body);
    },

    async list(req: Request, res: Response): Promise<void> {
      const query = res.locals.validatedQuery as { strategyId?: string };
      const runs = await listBacktestsUseCase.execute(req.user!.id, query.strategyId);
      const body: ApiSuccessResponse<BacktestRun[]> = { success: true, data: runs };
      res.status(200).json(body);
    },
  };
}

import type { Request, Response } from 'express';
import type { ApiSuccessResponse, Strategy, StrategySummary } from '@quantlab/shared-types';
import type { CreateStrategyUseCase } from '../../../application/strategies/CreateStrategyUseCase.js';
import type { UpdateStrategyUseCase } from '../../../application/strategies/UpdateStrategyUseCase.js';
import type { GetStrategyUseCase } from '../../../application/strategies/GetStrategyUseCase.js';
import type { ListStrategiesUseCase } from '../../../application/strategies/ListStrategiesUseCase.js';
import type { DeleteStrategyUseCase } from '../../../application/strategies/DeleteStrategyUseCase.js';

/**
 * Every handler reads `req.user!.id` - the `!` is safe here specifically
 * because these routes are only ever mounted behind the `authenticate`
 * middleware (see strategy.routes.ts), which guarantees `req.user` is set
 * or the request never reaches this controller at all.
 */
export function createStrategyController(dependencies: {
  createStrategyUseCase: CreateStrategyUseCase;
  updateStrategyUseCase: UpdateStrategyUseCase;
  getStrategyUseCase: GetStrategyUseCase;
  listStrategiesUseCase: ListStrategiesUseCase;
  deleteStrategyUseCase: DeleteStrategyUseCase;
}) {
  const {
    createStrategyUseCase,
    updateStrategyUseCase,
    getStrategyUseCase,
    listStrategiesUseCase,
    deleteStrategyUseCase,
  } = dependencies;

  return {
    async create(req: Request, res: Response): Promise<void> {
      const strategy = await createStrategyUseCase.execute(req.user!.id, req.body);
      const body: ApiSuccessResponse<Strategy> = { success: true, data: strategy };
      res.status(201).json(body);
    },

    async update(req: Request, res: Response): Promise<void> {
      const strategy = await updateStrategyUseCase.execute(req.params.id!, req.user!.id, req.body);
      const body: ApiSuccessResponse<Strategy> = { success: true, data: strategy };
      res.status(200).json(body);
    },

    async getOne(req: Request, res: Response): Promise<void> {
      const strategy = await getStrategyUseCase.execute(req.params.id!, req.user!.id);
      const body: ApiSuccessResponse<Strategy> = { success: true, data: strategy };
      res.status(200).json(body);
    },

    async list(req: Request, res: Response): Promise<void> {
      const strategies = await listStrategiesUseCase.execute(req.user!.id);
      const body: ApiSuccessResponse<StrategySummary[]> = { success: true, data: strategies };
      res.status(200).json(body);
    },

    async remove(req: Request, res: Response): Promise<void> {
      await deleteStrategyUseCase.execute(req.params.id!, req.user!.id);
      res.status(204).send();
    },
  };
}

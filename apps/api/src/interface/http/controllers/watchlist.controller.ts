import type { Request, Response } from 'express';
import type { ApiSuccessResponse, WatchlistItem } from '@quantlab/shared-types';
import type { AddToWatchlistUseCase } from '../../../application/watchlist/AddToWatchlistUseCase.js';
import type { RemoveFromWatchlistUseCase } from '../../../application/watchlist/RemoveFromWatchlistUseCase.js';
import type { ListWatchlistUseCase } from '../../../application/watchlist/ListWatchlistUseCase.js';

/**
 * Same Express-5-params-can-be-string[] situation as every other
 * controller with a route param in this codebase - kept local rather than
 * shared, matching the established precedent for this three-line helper.
 */
function getSymbolParam(params: Request['params']): string {
  const value = params.symbol;
  return Array.isArray(value) ? value[0]! : value!;
}

export function createWatchlistController(dependencies: {
  addToWatchlistUseCase: AddToWatchlistUseCase;
  removeFromWatchlistUseCase: RemoveFromWatchlistUseCase;
  listWatchlistUseCase: ListWatchlistUseCase;
}) {
  const { addToWatchlistUseCase, removeFromWatchlistUseCase, listWatchlistUseCase } = dependencies;

  return {
    async list(req: Request, res: Response): Promise<void> {
      const items = await listWatchlistUseCase.execute(req.user!.id);
      const body: ApiSuccessResponse<WatchlistItem[]> = { success: true, data: items };
      res.status(200).json(body);
    },

    async add(req: Request, res: Response): Promise<void> {
      const item = await addToWatchlistUseCase.execute(req.user!.id, req.body.symbol);
      const body: ApiSuccessResponse<WatchlistItem> = { success: true, data: item };
      res.status(201).json(body);
    },

    async remove(req: Request, res: Response): Promise<void> {
      await removeFromWatchlistUseCase.execute(req.user!.id, getSymbolParam(req.params));
      res.status(204).send();
    },
  };
}

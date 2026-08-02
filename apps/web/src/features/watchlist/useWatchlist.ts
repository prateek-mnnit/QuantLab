import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { addToWatchlistRequest, fetchWatchlist, removeFromWatchlistRequest } from './api';

const WATCHLIST_QUERY_KEY = ['watchlist'] as const;

export function useWatchlist() {
  return useQuery({ queryKey: WATCHLIST_QUERY_KEY, queryFn: fetchWatchlist });
}

export function useAddToWatchlist() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (symbol: string) => addToWatchlistRequest(symbol),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: WATCHLIST_QUERY_KEY });
    },
  });
}

export function useRemoveFromWatchlist() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (symbol: string) => removeFromWatchlistRequest(symbol),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: WATCHLIST_QUERY_KEY });
    },
  });
}

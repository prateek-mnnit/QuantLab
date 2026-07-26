import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { deleteStrategyRequest, fetchStrategies } from './api';

const STRATEGIES_QUERY_KEY = ['strategies'] as const;

export function useStrategies() {
  return useQuery({
    queryKey: STRATEGIES_QUERY_KEY,
    queryFn: fetchStrategies,
  });
}

export function useDeleteStrategy() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteStrategyRequest(id),
    // Refetch the list after a successful delete rather than manually
    // splicing the deleted item out of cached data - simpler and less
    // error-prone at this scale, and the list is cheap to refetch.
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: STRATEGIES_QUERY_KEY });
    },
  });
}

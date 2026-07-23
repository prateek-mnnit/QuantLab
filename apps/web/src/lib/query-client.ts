import { QueryClient } from '@tanstack/react-query';

/**
 * One QueryClient instance for the whole app, created outside of React so
 * it survives component re-renders/remounts. Default options here are the
 * app-wide policy for how "fresh" server data is assumed to be; individual
 * queries can still override these per-call when a feature needs different
 * behavior (e.g. live price data wants a much shorter staleTime).
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

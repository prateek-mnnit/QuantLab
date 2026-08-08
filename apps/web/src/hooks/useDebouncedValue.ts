import { useEffect, useState } from 'react';

/**
 * Returns `value`, but only after it's stopped changing for `delayMs`.
 * Used by ChartPage's symbol search box: without this, every keystroke
 * fires a new `useSymbolSearch` query (a new API call to
 * `GET /api/market-data/search`) even though only the value after the user
 * stops typing actually matters. Generic and side-effect-free, so any
 * future debounced-input need in the app can reuse it rather than each
 * writing its own `setTimeout`/`clearTimeout` pair.
 */
export function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timeoutId = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timeoutId);
  }, [value, delayMs]);

  return debounced;
}

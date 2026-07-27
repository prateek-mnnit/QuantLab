/**
 * A minimal in-process, in-memory cache with a time-to-live per entry.
 * Exists specifically to protect against Yahoo Finance's unofficial API,
 * which aggressively rate-limits/blocks callers that hit it too often -
 * without this, reloading the same chart twice in a row would re-fetch
 * identical data every time.
 *
 * Deliberately NOT Redis: the approved architecture calls for a shared
 * Redis cache once the async job queue (the backtest engine's worker
 * process) is introduced, since a worker and the API would need to share
 * one cache. That infrastructure doesn't exist yet, and standing up Redis
 * today just for a single-process cache would be premature - this is a
 * documented, intentionally temporary stand-in for that, not a corner cut
 * silently.
 */
export class SimpleTtlCache<T> {
  private readonly store = new Map<string, { value: T; expiresAt: number }>();

  constructor(private readonly ttlMs: number) {}

  get(key: string): T | undefined {
    const entry = this.store.get(key);
    if (!entry) return undefined;

    if (entry.expiresAt < Date.now()) {
      this.store.delete(key);
      return undefined;
    }

    return entry.value;
  }

  set(key: string, value: T): void {
    this.store.set(key, { value, expiresAt: Date.now() + this.ttlMs });
  }
}

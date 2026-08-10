export interface WatchlistItem {
  id: string;
  symbol: string;
  addedAt: string;
  /** Group AH: true for a seeded demo watchlist item, false for one the user added themselves. */
  isBuiltIn: boolean;
}

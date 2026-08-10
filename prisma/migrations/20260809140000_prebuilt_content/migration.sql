-- Group AH: prebuilt/built-in product content.
--
-- Represents "this is built-in, product-level content" as a NULLABLE
-- ownership column (userId IS NULL) rather than a designated demo user
-- account - applied consistently across every ownable table. `isBuiltIn`
-- is kept as its own explicit column (rather than relying on call sites to
-- check `userId IS NULL` everywhere) purely for query/read clarity.

-- AlterTable: strategies.userId becomes optional; NULL = built-in strategy.
ALTER TABLE "strategies" ALTER COLUMN "userId" DROP NOT NULL;
ALTER TABLE "strategies" ADD COLUMN "isBuiltIn" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable: watchlist_items.userId becomes optional; NULL = featured/built-in symbol.
ALTER TABLE "watchlist_items" ALTER COLUMN "userId" DROP NOT NULL;
ALTER TABLE "watchlist_items" ADD COLUMN "isBuiltIn" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable: backtest_runs previously had NO userId at all - ownership was
-- derived entirely through strategy.userId, which breaks once a Strategy
-- can be ownerless. NULL = a pre-generated, global example backtest.
ALTER TABLE "backtest_runs" ADD COLUMN "userId" TEXT;

-- Note: strategies.userId and watchlist_items.userId already have their
-- FK constraints (strategies_userId_fkey, watchlist_items_userId_fkey)
-- from the initial migration - a NULL value in a foreign-key column simply
-- means "no reference" and needs no constraint change to permit it, only
-- the DROP NOT NULL above. Only backtest_runs.userId is a brand new
-- column and needs its FK added here.

-- AddForeignKey
ALTER TABLE "backtest_runs" ADD CONSTRAINT "backtest_runs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateIndex
CREATE INDEX "backtest_runs_userId_idx" ON "backtest_runs"("userId");

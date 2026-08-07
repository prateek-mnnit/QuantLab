import { defineConfig } from 'vitest/config';

/**
 * A dedicated config for HTTP integration tests, separate from
 * vitest.config.ts (unit tests).
 *
 * Why separate rather than one config with a broader `include`: unit tests
 * (every *.test.ts file added in Groups V-Y) run against in-memory fakes
 * and need nothing but Node - that's the whole point of the fake-repository
 * pattern used throughout `application/**`. Integration tests in this
 * folder are different in kind: they boot the real Express app
 * (`createApp()`) and drive it with supertest against a real Postgres
 * database via the real Prisma client. Mixing them into one `vitest run`
 * would mean the fast, dependency-free unit suite silently starts
 * requiring a live database - and conversely, a developer without Docker
 * running couldn't run unit tests at all. Two configs keep both promises
 * intact: `npm test` stays instant and DB-free, `npm run test:integration`
 * is the explicit, opt-in "yes, I have a database" command.
 */
export default defineConfig({
  test: {
    include: ['src/test/integration/**/*.integration.test.ts'],
    // Integration tests share one real Postgres connection pool and mutate
    // shared tables (users, strategies) - running test FILES in parallel
    // is safe here (each uses uniquely-generated emails, see
    // testHelpers.ts), but forcing a single fork avoids any risk of
    // Prisma connection-pool exhaustion against a small local/CI database.
    pool: 'forks',
    poolOptions: { forks: { singleFork: true } },
    testTimeout: 15_000,
    hookTimeout: 15_000,
  },
});

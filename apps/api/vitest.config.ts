import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['src/**/*.test.ts'],
    // Integration tests (src/test/integration/**) live under their own
    // *.integration.test.ts naming and their own config
    // (vitest.integration.config.ts, run via `npm run test:integration`)
    // specifically so they never get swept into the default unit-test run
    // by an `include` glob that's broader than intended - this exclude is
    // belt-and-suspenders for that same guarantee.
    exclude: ['**/node_modules/**', '**/dist/**', 'src/test/integration/**'],
  },
});

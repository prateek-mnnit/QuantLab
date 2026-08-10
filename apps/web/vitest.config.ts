import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

// Mirrors packages/domain's and apps/api's vitest.config.ts (same `include`
// glob, same "just run vitest run" story) with the two additions a browser
// UI package actually needs: the React plugin (so JSX in .test.tsx files
// compiles) and a jsdom `environment` (so `render()`/`document` exist at
// all - the other two workspaces are pure Node and need neither).
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setupTests.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
    exclude: ['**/node_modules/**', '**/dist/**'],
  },
});

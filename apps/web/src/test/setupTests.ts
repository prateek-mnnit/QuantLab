// Loaded once via vitest.config.ts's `setupFiles`, before every test file
// runs. `@testing-library/jest-dom/vitest` registers the jest-dom matchers
// (toBeInTheDocument, toHaveTextContent, ...) directly against Vitest's own
// `expect`, so any *.test.tsx file gets them for free without importing
// anything itself - the same "configure once, use everywhere" shape
// apps/api's test setup already follows for its own fakes/helpers.
import '@testing-library/jest-dom/vitest';
import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

// React Testing Library normally unmounts and cleans up the DOM after each
// test automatically - but only when it detects a global `afterEach`
// (Jest provides one; so does Vitest when `test.globals: true` is set).
// vitest.config.ts deliberately does NOT set `globals: true` (every other
// test file in this app - domain, api - explicitly imports `describe`/
// `it`/`expect` from 'vitest' rather than relying on globals, and this
// keeps that convention consistent for web too), so RTL's auto-detection
// never fires and DOM nodes from one test would otherwise still be present
// when the next test in the same file renders - this line is what makes
// cleanup happen anyway, explicitly, without turning on globals.
afterEach(() => {
  cleanup();
});

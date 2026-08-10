// Loaded once via vitest.config.ts's `setupFiles`, before every test file
// runs. `@testing-library/jest-dom/vitest` registers the jest-dom matchers
// (toBeInTheDocument, toHaveTextContent, ...) directly against Vitest's own
// `expect`, so any *.test.tsx file gets them for free without importing
// anything itself - the same "configure once, use everywhere" shape
// apps/api's test setup already follows for its own fakes/helpers.
import '@testing-library/jest-dom/vitest';

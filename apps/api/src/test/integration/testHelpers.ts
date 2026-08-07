import { randomUUID } from 'node:crypto';
import request from 'supertest';
import type { Express } from 'express';
import type { StrategyInput } from '@quantlab/shared-types';
import { prisma } from '../../infrastructure/persistence/prisma/client.js';
import { buildValidStrategyInput } from '../../application/strategies/testFakes.js';

/**
 * Every integration-test user lives under this fixed domain, so cleanup
 * (see `cleanupIntegrationTestUsers`) can find and remove exactly what
 * these tests created - and nothing else - even if a test run against a
 * shared, non-disposable database (a real risk for local runs against the
 * docker-compose Postgres, as opposed to CI's throwaway service
 * container).
 */
const TEST_EMAIL_DOMAIN = 'integration.quantlab.test';

/**
 * A fresh, collision-proof email for each call - safe to use across
 * parallel test files without two tests ever fighting over the same
 * `users.email` unique constraint.
 */
export function uniqueTestEmail(label: string): string {
  return `${label}-${randomUUID()}@${TEST_EMAIL_DOMAIN}`;
}

/** Meets `registerSchema`'s 12-character minimum with room to spare. */
export const TEST_PASSWORD = 'correct-horse-battery-staple';

/**
 * Deletes every user created under TEST_EMAIL_DOMAIN. Relies on the
 * schema's `onDelete: Cascade` on Strategy/WatchlistItem/RefreshToken's
 * `userId` relation (see prisma/schema.prisma) to clean up everything a
 * test created transitively - a strategy, a refresh token row - without
 * this helper needing to know about every table a future use case might
 * touch.
 *
 * Call from `afterAll` in each integration test file rather than
 * `afterEach`: each file's tests, taken together, should leave the
 * database exactly as they found it, but individual tests within a file
 * are free to build on state earlier tests in the same file created
 * (e.g. "login" reusing the user "register" made).
 */
export async function cleanupIntegrationTestUsers(): Promise<void> {
  await prisma.user.deleteMany({ where: { email: { endsWith: `@${TEST_EMAIL_DOMAIN}` } } });
}

export interface AuthenticatedTestUser {
  email: string;
  userId: string;
  accessToken: string;
  refreshCookie: string;
}

/**
 * Registers and logs in a brand-new user against the running app, and
 * returns exactly what a test needs to act as that user: their id, a
 * ready-to-use `Authorization: Bearer` value, and the raw `Set-Cookie`
 * header for hitting `/api/auth/refresh` or `/api/auth/logout`. Centralizing
 * this saves every protected-route test from re-deriving auth boilerplate,
 * the same reasoning as `buildValidStrategyInput` in
 * application/strategies/testFakes.ts.
 */
export async function createAuthenticatedTestUser(app: Express, label = 'user'): Promise<AuthenticatedTestUser> {
  const email = uniqueTestEmail(label);

  await request(app).post('/api/auth/register').send({ email, password: TEST_PASSWORD }).expect(201);

  const loginResponse = await request(app)
    .post('/api/auth/login')
    .send({ email, password: TEST_PASSWORD })
    .expect(200);

  const setCookieHeader = loginResponse.headers['set-cookie'];
  const refreshCookie = (Array.isArray(setCookieHeader) ? setCookieHeader[0] : setCookieHeader) ?? '';

  return {
    email,
    userId: loginResponse.body.data.user.id as string,
    accessToken: loginResponse.body.data.tokens.accessToken as string,
    refreshCookie,
  };
}

/**
 * `buildValidStrategyInput` (application/strategies/testFakes.ts, Group W)
 * is genuinely valid *TypeScript* - it satisfies the `StrategyInput` shape
 * - but it is not valid against `strategyInputSchema`'s runtime `.refine()`
 * rules, specifically `conditionNodeSchema`'s `children: z.array(...).min(1,
 * 'A group must contain at least one condition or nested group.')`
 * (packages/shared-types/src/schemas/condition-tree.schema.ts). The fixture's
 * `exitConditions` is `{ type: 'AND', id: 'exit-root', children: [] }` - an
 * empty children array, which the TypeScript `ConditionGroup` interface
 * permits but the schema's `.min(1)` rejects at runtime.
 *
 * Group W's unit tests never notice this because they call
 * `CreateStrategyUseCase.execute()` directly, bypassing
 * `validateBody(strategyInputSchema)` entirely - only requests that go
 * through the real HTTP layer (this integration suite) ever run that
 * validation. This is correct, intentional behavior on the API's part (an
 * exit-condition group with zero conditions can never fire, so rejecting it
 * is right), not a bug - so the fix belongs here, in the HTTP-level fixture,
 * not in the schema or in `buildValidStrategyInput` itself, which Group W's
 * still-passing unit tests continue to rely on unchanged.
 *
 * This gives `exitConditions` one concrete condition (RSI overbought,
 * mirroring `entryConditions`' RSI oversold entry) so the payload is valid
 * both as a TypeScript `StrategyInput` and against `strategyInputSchema` at
 * runtime - i.e. it's what an HTTP integration test should have been
 * sending all along.
 */
export function buildHttpValidStrategyInput(overrides: Partial<StrategyInput> = {}): StrategyInput {
  return buildValidStrategyInput({
    exitConditions: {
      type: 'AND',
      id: 'exit-root',
      children: [
        {
          type: 'CONDITION',
          id: 'exit-c1',
          left: { source: 'INDICATOR', indicator: 'RSI', params: { period: 14 } },
          operator: 'GREATER_THAN',
          right: { source: 'VALUE', value: 70 },
        },
      ],
    },
    ...overrides,
  });
}

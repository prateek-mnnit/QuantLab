import { afterAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import { createApp } from '../../app.js';
import { prisma } from '../../infrastructure/persistence/prisma/client.js';
import { buildHttpValidStrategyInput, cleanupIntegrationTestUsers, createAuthenticatedTestUser } from './testHelpers.js';

const app = createApp();

afterAll(async () => {
  await cleanupIntegrationTestUsers();
  await prisma.$disconnect();
});

describe('Strategies', () => {
  it('supports the full create -> list -> get -> update -> delete lifecycle for the owning user', async () => {
    const user = await createAuthenticatedTestUser(app, 'crud');
    const authHeader = `Bearer ${user.accessToken}`;

    const createResponse = await request(app)
      .post('/api/strategies')
      .set('Authorization', authHeader)
      .send(buildHttpValidStrategyInput({ name: 'Integration RSI Strategy' }))
      .expect(201);
    expect(createResponse.body.data).toMatchObject({ name: 'Integration RSI Strategy', version: 1 });
    const strategyId = createResponse.body.data.id as string;

    const listResponse = await request(app)
      .get('/api/strategies')
      .set('Authorization', authHeader)
      .expect(200);
    expect(listResponse.body.data).toEqual([expect.objectContaining({ id: strategyId })]);

    const getResponse = await request(app)
      .get(`/api/strategies/${strategyId}`)
      .set('Authorization', authHeader)
      .expect(200);
    expect(getResponse.body.data.id).toBe(strategyId);

    const updateResponse = await request(app)
      .put(`/api/strategies/${strategyId}`)
      .set('Authorization', authHeader)
      .send(buildHttpValidStrategyInput({ name: 'Renamed Strategy' }))
      .expect(200);
    expect(updateResponse.body.data).toMatchObject({ id: strategyId, name: 'Renamed Strategy', version: 2 });

    await request(app).delete(`/api/strategies/${strategyId}`).set('Authorization', authHeader).expect(204);

    await request(app).get(`/api/strategies/${strategyId}`).set('Authorization', authHeader).expect(404);
  });

  it('rejects a strategy body that fails validation with a 400 before touching the database', async () => {
    const user = await createAuthenticatedTestUser(app, 'invalid');

    // Start from a payload that is otherwise fully valid against
    // strategyInputSchema (see buildHttpValidStrategyInput's doc comment)
    // and break only `name`, so this test unambiguously exercises name
    // validation rather than tripping on some other field.
    const response = await request(app)
      .post('/api/strategies')
      .set('Authorization', `Bearer ${user.accessToken}`)
      .send({ ...buildHttpValidStrategyInput(), name: '' })
      .expect(400);

    expect(response.body).toMatchObject({ success: false, error: { code: 'VALIDATION_ERROR' } });
  });

  it('rejects a condition group with no children, since it could never fire', async () => {
    const user = await createAuthenticatedTestUser(app, 'empty-group');

    const response = await request(app)
      .post('/api/strategies')
      .set('Authorization', `Bearer ${user.accessToken}`)
      .send({
        ...buildHttpValidStrategyInput(),
        exitConditions: { type: 'AND', id: 'exit-root', children: [] },
      })
      .expect(400);

    expect(response.body).toMatchObject({ success: false, error: { code: 'VALIDATION_ERROR' } });
  });

  it("never lets one user read, update, or delete another user's strategy", async () => {
    const owner = await createAuthenticatedTestUser(app, 'owner');
    const intruder = await createAuthenticatedTestUser(app, 'intruder');

    const createResponse = await request(app)
      .post('/api/strategies')
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .send(buildHttpValidStrategyInput({ name: "Owner's Strategy" }))
      .expect(201);
    const strategyId = createResponse.body.data.id as string;
    const intruderAuthHeader = `Bearer ${intruder.accessToken}`;

    await request(app).get(`/api/strategies/${strategyId}`).set('Authorization', intruderAuthHeader).expect(404);
    await request(app)
      .put(`/api/strategies/${strategyId}`)
      .set('Authorization', intruderAuthHeader)
      .send(buildHttpValidStrategyInput({ name: 'Hijacked' }))
      .expect(404);
    await request(app).delete(`/api/strategies/${strategyId}`).set('Authorization', intruderAuthHeader).expect(404);

    // Confirm the intruder's requests didn't actually mutate anything -
    // the owner can still see their untouched strategy afterward.
    const ownerGetResponse = await request(app)
      .get(`/api/strategies/${strategyId}`)
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .expect(200);
    expect(ownerGetResponse.body.data.name).toBe("Owner's Strategy");
  });

  it('scopes the list endpoint to only the requesting user\'s strategies', async () => {
    const userA = await createAuthenticatedTestUser(app, 'list-a');
    const userB = await createAuthenticatedTestUser(app, 'list-b');
    await request(app)
      .post('/api/strategies')
      .set('Authorization', `Bearer ${userA.accessToken}`)
      .send(buildHttpValidStrategyInput({ name: "A's Strategy" }))
      .expect(201);

    const listResponse = await request(app)
      .get('/api/strategies')
      .set('Authorization', `Bearer ${userB.accessToken}`)
      .expect(200);

    expect(listResponse.body.data).toEqual([]);
  });
});

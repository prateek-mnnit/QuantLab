import { afterAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import { createApp } from '../../app.js';
import { prisma } from '../../infrastructure/persistence/prisma/client.js';

const app = createApp();

afterAll(async () => {
  await prisma.$disconnect();
});

describe('GET /api/health', () => {
  it('reports ok with a connected database', async () => {
    const response = await request(app).get('/api/health').expect(200);

    expect(response.body).toEqual({
      success: true,
      data: { status: 'ok', timestamp: expect.any(String), database: 'connected' },
    });
  });

  it('responds with valid JSON content', async () => {
    const response = await request(app).get('/api/health');

    expect(response.headers['content-type']).toMatch(/application\/json/);
  });
});

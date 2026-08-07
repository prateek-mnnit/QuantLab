import { afterAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import { createApp } from '../../app.js';
import { prisma } from '../../infrastructure/persistence/prisma/client.js';
import { TEST_PASSWORD, cleanupIntegrationTestUsers, uniqueTestEmail } from './testHelpers.js';

const app = createApp();

afterAll(async () => {
  await cleanupIntegrationTestUsers();
  await prisma.$disconnect();
});

describe('Auth', () => {
  describe('POST /api/auth/register', () => {
    it('creates a new account and never returns the password hash', async () => {
      const email = uniqueTestEmail('register');

      const response = await request(app)
        .post('/api/auth/register')
        .send({ email, password: TEST_PASSWORD })
        .expect(201);

      expect(response.body).toEqual({ success: true, data: { id: expect.any(String), email } });
      expect(response.body.data).not.toHaveProperty('passwordHash');
    });

    it('lowercases and trims the email the same way registerSchema declares', async () => {
      const rawEmail = uniqueTestEmail('CaseTest').toUpperCase();

      const response = await request(app)
        .post('/api/auth/register')
        .send({ email: `  ${rawEmail}  `, password: TEST_PASSWORD })
        .expect(201);

      expect(response.body.data.email).toBe(rawEmail.toLowerCase());
    });

    it('rejects a password shorter than the 12-character minimum with a 400', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({ email: uniqueTestEmail('shortpw'), password: 'tooshort' })
        .expect(400);

      expect(response.body).toMatchObject({ success: false, error: { code: 'VALIDATION_ERROR' } });
    });

    it('rejects a duplicate email with a 409, without creating a second row', async () => {
      const email = uniqueTestEmail('dup');
      await request(app).post('/api/auth/register').send({ email, password: TEST_PASSWORD }).expect(201);

      const response = await request(app)
        .post('/api/auth/register')
        .send({ email, password: TEST_PASSWORD })
        .expect(409);

      expect(response.body).toMatchObject({ success: false, error: { code: 'CONFLICT' } });
      const matchingUsers = await prisma.user.count({ where: { email } });
      expect(matchingUsers).toBe(1);
    });
  });

  describe('POST /api/auth/login', () => {
    it('issues an access token in the body and a refresh token as an httpOnly cookie', async () => {
      const email = uniqueTestEmail('login');
      await request(app).post('/api/auth/register').send({ email, password: TEST_PASSWORD }).expect(201);

      const response = await request(app)
        .post('/api/auth/login')
        .send({ email, password: TEST_PASSWORD })
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: { user: { id: expect.any(String), email }, tokens: { accessToken: expect.any(String) } },
      });
      const setCookieHeader = String(response.headers['set-cookie']);
      expect(setCookieHeader).toMatch(/quantlab_refresh_token=/);
      expect(setCookieHeader).toMatch(/HttpOnly/i);
    });

    it('rejects a wrong password with the same message as an unknown email (no user enumeration)', async () => {
      const email = uniqueTestEmail('wrongpw');
      await request(app).post('/api/auth/register').send({ email, password: TEST_PASSWORD }).expect(201);

      const wrongPasswordResponse = await request(app)
        .post('/api/auth/login')
        .send({ email, password: 'incorrect-password-here' })
        .expect(401);
      const unknownEmailResponse = await request(app)
        .post('/api/auth/login')
        .send({ email: uniqueTestEmail('never-registered'), password: TEST_PASSWORD })
        .expect(401);

      expect(wrongPasswordResponse.body.error.message).toBe(unknownEmailResponse.body.error.message);
    });
  });

  describe('protected routes', () => {
    it('rejects a request with no Authorization header at all', async () => {
      const response = await request(app).get('/api/strategies').expect(401);

      expect(response.body).toMatchObject({ success: false, error: { code: 'UNAUTHORIZED' } });
    });

    it('rejects a malformed/garbage bearer token', async () => {
      const response = await request(app)
        .get('/api/strategies')
        .set('Authorization', 'Bearer not-a-real-token')
        .expect(401);

      expect(response.body).toMatchObject({ success: false, error: { code: 'UNAUTHORIZED' } });
    });
  });

  describe('POST /api/auth/refresh and POST /api/auth/logout', () => {
    it('rotates the refresh token on refresh, issuing a usable new access token', async () => {
      const email = uniqueTestEmail('refresh');
      await request(app).post('/api/auth/register').send({ email, password: TEST_PASSWORD }).expect(201);
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({ email, password: TEST_PASSWORD })
        .expect(200);
      const originalCookie = loginResponse.headers['set-cookie'];

      const refreshResponse = await request(app)
        .post('/api/auth/refresh')
        .set('Cookie', originalCookie)
        .expect(200);

      // NOTE: this deliberately does NOT assert
      // `refreshResponse.body.data.accessToken !== loginResponse.body.data.tokens.accessToken`.
      // TokenService.signAccessToken (infrastructure/auth/TokenService.ts)
      // signs only `{ userId }` with a `jsonwebtoken`-assigned `iat` in
      // whole seconds - no `jti` or other per-call entropy - so two tokens
      // for the same user minted within the same wall-clock second are
      // legitimately byte-for-byte identical JWTs. Login and refresh
      // happening in the same second is normal in a fast test run, so that
      // assertion was flaky by construction, not a sign of broken
      // rotation. This is intended JWT behavior, not something to change
      // in TokenService.
      //
      // What Login/Refresh must actually guarantee - and what's worth
      // testing - is that refresh (a) returns a well-formed, *usable*
      // access token and (b) rotates the underlying refresh token (a
      // 512-bit random value with no such collision risk, see
      // `generateRefreshToken`), not that two JWTs happen to differ as
      // strings.
      expect(refreshResponse.body).toEqual({ success: true, data: { accessToken: expect.any(String) } });

      const newAccessToken = refreshResponse.body.data.accessToken as string;
      await request(app)
        .get('/api/strategies')
        .set('Authorization', `Bearer ${newAccessToken}`)
        .expect(200);

      const newSetCookieHeader = refreshResponse.headers['set-cookie'];
      expect(newSetCookieHeader).toBeDefined();
      expect(String(newSetCookieHeader)).not.toBe(String(originalCookie));
    });

    it('rejects reusing a refresh token that was already rotated away', async () => {
      const email = uniqueTestEmail('rotate-reuse');
      await request(app).post('/api/auth/register').send({ email, password: TEST_PASSWORD }).expect(201);
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({ email, password: TEST_PASSWORD })
        .expect(200);
      const originalCookie = loginResponse.headers['set-cookie'];
      await request(app).post('/api/auth/refresh').set('Cookie', originalCookie).expect(200);

      const reuseResponse = await request(app)
        .post('/api/auth/refresh')
        .set('Cookie', originalCookie)
        .expect(401);

      expect(reuseResponse.body).toMatchObject({ success: false, error: { code: 'UNAUTHORIZED' } });
    });

    it('invalidates the refresh token on logout so it can no longer be used to refresh', async () => {
      const email = uniqueTestEmail('logout');
      await request(app).post('/api/auth/register').send({ email, password: TEST_PASSWORD }).expect(201);
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({ email, password: TEST_PASSWORD })
        .expect(200);
      const cookie = loginResponse.headers['set-cookie'];

      await request(app).post('/api/auth/logout').set('Cookie', cookie).expect(200);

      const refreshAfterLogout = await request(app).post('/api/auth/refresh').set('Cookie', cookie).expect(401);
      expect(refreshAfterLogout.body).toMatchObject({ success: false, error: { code: 'UNAUTHORIZED' } });
    });
  });
});

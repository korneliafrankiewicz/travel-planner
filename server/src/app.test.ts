import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { closeTestDatabase, createTestApp, validRegistration, type TestApp } from './test-utils/testApp.js';

let t: TestApp;

afterEach(async () => {
  vi.restoreAllMocks();
  await t.close();
});

afterAll(closeTestDatabase);

type Json = Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any

const start = async (overrides: Record<string, string> = {}) => {
  t = await createTestApp(overrides);
};

describe('GET /health', () => {
  beforeEach(() => start());

  it('says the server is up when it can reach its database', async () => {
    const response = await t.app.inject({ method: 'GET', url: '/health' });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ status: 'ok' });
  });

  it('says it is unavailable when the database cannot be reached, without saying why', async () => {
    vi.spyOn(t.db, 'query').mockRejectedValue(new Error('connection refused at 10.0.0.5'));

    const response = await t.app.inject({ method: 'GET', url: '/health' });

    expect(response.statusCode).toBe(503);
    expect(response.json()).toEqual({ status: 'unavailable' });
    expect(response.body).not.toContain('10.0.0.5');
  });

  it('is not limited, so a monitor that checks often is never refused', async () => {
    for (let index = 0; index < 150; index++) {
      const response = await t.app.inject({ method: 'GET', url: '/health' });
      expect(response.statusCode).toBe(200);
    }
  });
});

describe('answers', () => {
  beforeEach(() => start());

  it('are never kept in a cache, because they hold tokens', async () => {
    for (const request of [
      { method: 'GET' as const, url: '/health' },
      { method: 'POST' as const, url: '/v1/auth/register', payload: validRegistration },
      { method: 'POST' as const, url: '/v1/auth/login', payload: { email: 'a@b.co', password: 'x' } },
      { method: 'GET' as const, url: '/nothing-here' },
    ]) {
      const response = await t.app.inject(request);
      expect(response.headers['cache-control']).toBe('no-store');
    }
  });

  it('carry the usual security headers and do not say what the server runs on', async () => {
    const response = await t.app.inject({ method: 'GET', url: '/health' });

    expect(response.headers['x-content-type-options']).toBe('nosniff');
    expect(response.headers['x-frame-options']).toBeDefined();
    expect(response.headers['strict-transport-security']).toBeDefined();
    expect(response.headers['x-powered-by']).toBeUndefined();
  });

  it('all have the same shape when something is wrong', async () => {
    const responses = await Promise.all([
      t.app.inject({ method: 'GET', url: '/nothing-here' }),
      t.app.inject({ method: 'POST', url: '/v1/auth/login', payload: {} }),
      t.app.inject({ method: 'POST', url: '/v1/auth/login', payload: { email: 'a@b.co', password: 'x' } }),
      t.app.inject({ method: 'GET', url: '/v1/auth/me' }),
    ]);

    for (const response of responses) {
      const body = response.json() as Json;
      expect(Object.keys(body)).toEqual(['error']);
      expect(body.error).toEqual(
        expect.objectContaining({ code: expect.any(String), message: expect.any(String) }),
      );
    }
  });
});

describe('a request that is not usable', () => {
  beforeEach(() => start());

  it('gets a 404 in the usual shape for a route that does not exist', async () => {
    const response = await t.app.inject({ method: 'GET', url: '/v1/nothing' });

    expect(response.statusCode).toBe(404);
    expect(response.json()).toEqual({ error: { code: 'notFound', message: 'There is nothing here' } });
  });

  it('gets a 404 for a method that a route does not have', async () => {
    const response = await t.app.inject({ method: 'GET', url: '/v1/auth/login' });
    expect(response.statusCode).toBe(404);
  });

  it('gets a 400 for JSON that is broken', async () => {
    const response = await t.app.inject({
      method: 'POST',
      url: '/v1/auth/login',
      headers: { 'content-type': 'application/json' },
      payload: '{"email": "a@b.co", ',
    });

    expect(response.statusCode).toBe(400);
    expect((response.json() as Json).error.code).toBe('validation');
  });

  it('is refused as not valid when it is plain text, which is read as text and fails the checks', async () => {
    const response = await t.app.inject({
      method: 'POST',
      url: '/v1/auth/login',
      headers: { 'content-type': 'text/plain' },
      payload: 'email=a@b.co&password=x',
    });

    expect(response.statusCode).toBe(400);
    expect((response.json() as Json).error.code).toBe('validation');
  });

  it('is refused with a 415 when it is a kind of content the server does not read', async () => {
    const response = await t.app.inject({
      method: 'POST',
      url: '/v1/auth/login',
      headers: { 'content-type': 'application/xml' },
      payload: '<login><email>a@b.co</email></login>',
    });

    expect(response.statusCode).toBe(415);
    expect(Object.keys(response.json() as Json)).toEqual(['error']);
  });

  it('is refused with a 413 when the body is bigger than 10 kB', async () => {
    const response = await t.app.inject({
      method: 'POST',
      url: '/v1/auth/register',
      payload: { ...validRegistration, name: 'a'.repeat(11 * 1024) },
    });

    expect(response.statusCode).toBe(413);
    expect((response.json() as Json).error.code).toBe('payloadTooLarge');
  });
});

describe('a failure inside the server', () => {
  beforeEach(() => start());

  it('is answered with a general message that tells nothing about the cause', async () => {
    vi.spyOn(t.db, 'query').mockRejectedValue(new Error('relation "users" is damaged: password=hunter2'));

    const response = await t.app.inject({
      method: 'POST',
      url: '/v1/auth/login',
      payload: { email: 'anna@example.com', password: 'Secret123' },
    });

    expect(response.statusCode).toBe(500);
    expect(response.json()).toEqual({
      error: { code: 'internal', message: 'Something went wrong on the server' },
    });
    expect(response.body).not.toContain('hunter2');
    expect(response.body).not.toContain('users');
  });

  it('does not leave a half-made account when registering fails', async () => {
    await t.app.inject({ method: 'POST', url: '/v1/auth/register', payload: validRegistration });
    vi.spyOn(t.db, 'query').mockRejectedValue(new Error('boom'));

    const response = await t.app.inject({
      method: 'POST',
      url: '/v1/auth/register',
      payload: { ...validRegistration, email: 'jan@example.com' },
    });
    vi.restoreAllMocks();

    expect(response.statusCode).toBe(500);
    expect(await t.db.query('SELECT 1 FROM users')).toHaveLength(1);
  });
});

describe('CORS', () => {
  const origin = 'http://localhost:8081';

  it('lets a listed web origin call the API', async () => {
    await start({ CORS_ORIGINS: `${origin},https://app.example.com` });

    const response = await t.app.inject({ method: 'GET', url: '/health', headers: { origin } });

    expect(response.headers['access-control-allow-origin']).toBe(origin);
  });

  it('answers a preflight request for a listed origin, with only the methods and headers the API uses', async () => {
    await start({ CORS_ORIGINS: origin });

    const response = await t.app.inject({
      method: 'OPTIONS',
      url: '/v1/auth/login',
      headers: {
        origin,
        'access-control-request-method': 'POST',
        'access-control-request-headers': 'content-type,authorization',
      },
    });

    expect(response.statusCode).toBe(204);
    expect(response.headers['access-control-allow-origin']).toBe(origin);
    expect(response.headers['access-control-allow-methods']).toBe('GET, POST, OPTIONS');
    expect(response.headers['access-control-allow-headers']).toBe('Authorization, Content-Type');
    expect(response.headers['access-control-allow-credentials']).toBeUndefined();
  });

  it.each(['https://evil.example.com', 'http://localhost:8082', 'null'])(
    'does not let the origin %s call the API',
    async (unlisted) => {
      await start({ CORS_ORIGINS: origin });

      const response = await t.app.inject({ method: 'GET', url: '/health', headers: { origin: unlisted } });

      expect(response.headers['access-control-allow-origin']).toBeUndefined();
    },
  );

  it('lets no web origin in when none is listed', async () => {
    await start({ CORS_ORIGINS: '' });

    const response = await t.app.inject({ method: 'GET', url: '/health', headers: { origin } });

    expect(response.headers['access-control-allow-origin']).toBeUndefined();
  });
});

describe('the limit on all requests', () => {
  it('is 100 a minute from one address, after which it asks to wait', async () => {
    await start();

    for (let index = 0; index < 100; index++) {
      const response = await t.app.inject({ method: 'GET', url: '/v1/auth/me' });
      expect(response.statusCode).toBe(401);
    }
    const response = await t.app.inject({ method: 'GET', url: '/v1/auth/me' });

    expect(response.statusCode).toBe(429);
    expect((response.json() as Json).error.code).toBe('rateLimited');
    expect(response.headers['retry-after']).toBeDefined();
  });

  it('counts each address on its own', async () => {
    await start();

    for (let index = 0; index < 100; index++) {
      await t.app.inject({ method: 'GET', url: '/v1/auth/me', remoteAddress: '10.0.0.1' });
    }

    const other = await t.app.inject({ method: 'GET', url: '/v1/auth/me', remoteAddress: '10.0.0.2' });
    expect(other.statusCode).toBe(401);
  });
});

describe('TRUST_PROXY', () => {
  const attempt = (address: string) =>
    t.app.inject({
      method: 'POST',
      url: '/v1/auth/login',
      remoteAddress: '10.0.0.1',
      headers: { 'x-forwarded-for': address },
      payload: { email: 'anna@example.com', password: 'wrong' },
    });

  it('is off by default: a client cannot choose its own address, so it cannot get around the limit', async () => {
    await start();

    const statuses: number[] = [];
    for (let index = 0; index < 11; index++) {
      statuses.push((await attempt(`203.0.113.${index}`)).statusCode);
    }

    expect(statuses.slice(0, 10)).toEqual(Array(10).fill(401));
    expect(statuses[10]).toBe(429);
  });

  it('makes the server believe the proxy about the client address when it is on', async () => {
    await start({ TRUST_PROXY: 'true' });

    for (let index = 0; index < 11; index++) {
      expect((await attempt(`203.0.113.${index}`)).statusCode).toBe(401);
    }
  });
});

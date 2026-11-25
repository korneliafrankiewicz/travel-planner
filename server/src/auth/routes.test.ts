import { createHash } from 'node:crypto';

import { afterAll, afterEach, beforeEach, describe, expect, it } from 'vitest';

import {
  closeTestDatabase,
  createTestApp,
  validRegistration,
  type TestApp,
} from '../test-utils/testApp.js';
import { hashPassword, paramsFor } from './password.js';

let t: TestApp;

beforeEach(async () => {
  t = await createTestApp();
});

afterEach(async () => {
  await t.close();
});

afterAll(closeTestDatabase);

type Json = Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any

const post = (url: string, payload?: unknown, headers: Record<string, string> = {}) =>
  t.app.inject({ method: 'POST', url, payload: payload as never, headers });
const get = (url: string, headers: Record<string, string> = {}) =>
  t.app.inject({ method: 'GET', url, headers });
const bearer = (token: string) => ({ authorization: `Bearer ${token}` });

const register = async (overrides: Record<string, unknown> = {}) => {
  const response = await post('/v1/auth/register', { ...validRegistration, ...overrides });
  return { response, body: response.json() as Json };
};

const logIn = async (email = validRegistration.email, password = validRegistration.password) => {
  const response = await post('/v1/auth/login', { email, password });
  return { response, body: response.json() as Json };
};

// A token of a user that registered.
const signedUp = async (overrides: Record<string, unknown> = {}): Promise<string> =>
  (await register(overrides)).body.token as string;

const errorOf = (response: { json: () => unknown }) => (response.json() as Json).error as Json;

describe('POST /v1/auth/register', () => {
  it('creates the account and logs the user in', async () => {
    const { response, body } = await register();

    expect(response.statusCode).toBe(201);
    expect(body.user).toEqual({
      id: expect.stringMatching(/^[0-9a-f-]{36}$/),
      name: 'Anna Nowak',
      email: 'anna@example.com',
    });
    expect(body.token).toMatch(/^[A-Za-z0-9_-]{43}$/);
  });

  it('gives back nothing but the token and the user, and never a password or a hash', async () => {
    const { response, body } = await register();

    expect(Object.keys(body).sort()).toEqual(['token', 'user']);
    expect(Object.keys(body.user).sort()).toEqual(['email', 'id', 'name']);
    expect(response.body).not.toContain('Secret123');
    expect(response.body).not.toContain('scrypt');
  });

  it('trims the name and lower-cases and trims the email', async () => {
    const { body } = await register({ name: '  Anna Nowak ', email: '  Anna.Nowak@Example.COM ' });
    expect(body.user).toMatchObject({ name: 'Anna Nowak', email: 'anna.nowak@example.com' });
  });

  it('gives a token that works straight away', async () => {
    const token = await signedUp();
    const me = await get('/v1/auth/me', bearer(token));
    expect(me.statusCode).toBe(200);
    expect(me.json()).toEqual({ user: expect.objectContaining({ email: 'anna@example.com' }) });
  });

  it('gives every account its own id and token', async () => {
    const first = await register();
    const second = await register({ email: 'jan@example.com' });

    expect(first.body.user.id).not.toBe(second.body.user.id);
    expect(first.body.token).not.toBe(second.body.token);
  });

  it('accepts names and passwords in other alphabets, with spaces and symbols', async () => {
    const { response } = await register({ name: 'Zażółć Gęślą', password: ' Zażółć gęślą 9 ✓ ' });
    expect(response.statusCode).toBe(201);
  });

  it('accepts a password of the longest allowed length', async () => {
    const { response } = await register({ password: `a1${'x'.repeat(126)}` });
    expect(response.statusCode).toBe(201);
  });

  describe('what is stored', () => {
    it('is a hash of the password, never the password', async () => {
      await register();

      const [row] = await t.db.query<{ password_hash: string }>('SELECT password_hash FROM users');

      expect(row?.password_hash).toMatch(/^scrypt\$16\$8\$1\$/);
      expect(row?.password_hash).not.toContain('Secret123');
    });

    it('is a hash of the session token, never the token', async () => {
      const token = await signedUp();

      const [row] = await t.db.query<{ token_hash: string }>('SELECT token_hash FROM sessions');

      expect(row?.token_hash).toBe(createHash('sha256').update(token).digest('hex'));
      expect(row?.token_hash).not.toContain(token);
    });

    it('does not put the password anywhere in the database', async () => {
      await register();
      const dump = JSON.stringify([
        await t.db.query('SELECT * FROM users'),
        await t.db.query('SELECT * FROM sessions'),
        await t.db.query('SELECT * FROM password_resets'),
      ]);
      expect(dump).not.toContain('Secret123');
    });
  });

  describe('an address that already has an account', () => {
    it.each(['anna@example.com', 'ANNA@EXAMPLE.COM', '  Anna@Example.com  '])(
      'is refused, whatever its case or spaces: %p',
      async (email) => {
        await register();

        const { response } = await register({ email, name: 'Someone Else' });

        expect(response.statusCode).toBe(409);
        expect(errorOf(response)).toMatchObject({ code: 'emailTaken' });
      },
    );

    it('keeps the first account as it was', async () => {
      await register();
      await register({ name: 'Intruder', password: 'Intruder999' });

      const { body } = await logIn('anna@example.com', 'Secret123');

      expect(body.user.name).toBe('Anna Nowak');
      expect((await logIn('anna@example.com', 'Intruder999')).response.statusCode).toBe(401);
    });

    it('is also caught when two requests arrive at the same moment', async () => {
      const responses = await Promise.all([
        post('/v1/auth/register', validRegistration),
        post('/v1/auth/register', validRegistration),
      ]);

      expect(responses.map((response) => response.statusCode).sort()).toEqual([201, 409]);
      expect(await t.db.query('SELECT 1 FROM users')).toHaveLength(1);
    });
  });

  describe('input that is not valid', () => {
    const fieldsOf = (response: { json: () => unknown }) =>
      ((errorOf(response).details as Json[]) ?? []).map((detail) => detail.field).sort();

    it('is refused with a 400 that names every field that is wrong', async () => {
      const { response } = await register({ name: '', email: 'nope', password: 'short' });

      expect(response.statusCode).toBe(400);
      expect(errorOf(response).code).toBe('validation');
      expect(fieldsOf(response)).toEqual(['email', 'name', 'password']);
    });

    it.each([
      ['an empty name', { name: '' }],
      ['a name of spaces', { name: '   ' }],
      ['a name that is too long', { name: 'a'.repeat(81) }],
      ['an email without @', { email: 'anna.example.com' }],
      ['an email without a domain', { email: 'anna@' }],
      ['an email with a space inside', { email: 'an na@example.com' }],
      ['an email that is too long', { email: `${'a'.repeat(250)}@example.com` }],
      ['a password that is too short', { password: 'Abc123' }],
      ['a password without numbers', { password: 'abcdefghij' }],
      ['a password without letters', { password: '1234567890' }],
      ['a password that is too long', { password: `a1${'x'.repeat(127)}` }],
      ['a name that is not text', { name: 42 }],
      ['a password that is not text', { password: 12345678 }],
      ['a name that is null', { name: null }],
    ])('refuses %s', async (_name, override) => {
      const { response } = await register(override);
      expect(response.statusCode).toBe(400);
      expect(errorOf(response).code).toBe('validation');
      expect(await t.db.query('SELECT 1 FROM users')).toHaveLength(0);
    });

    it.each(['name', 'email', 'password'])('refuses a request without the %s', async (field) => {
      const { [field]: _removed, ...rest } = validRegistration as Record<string, string>;
      const response = await post('/v1/auth/register', rest);
      expect(response.statusCode).toBe(400);
      expect(fieldsOf(response)).toEqual([field]);
    });

    it('refuses fields it does not know, so a mistake is noticed', async () => {
      const { response } = await register({ isAdmin: true });
      expect(response.statusCode).toBe(400);
      expect(await t.db.query('SELECT 1 FROM users')).toHaveLength(0);
    });

    it.each([[undefined], ['text'], [123], [[]], [null]])('refuses a body that is %p', async (payload) => {
      const response = await t.app.inject({
        method: 'POST',
        url: '/v1/auth/register',
        payload: payload as never,
        headers: payload === undefined ? {} : { 'content-type': 'application/json' },
      });
      expect(response.statusCode).toBeGreaterThanOrEqual(400);
      expect(response.statusCode).toBeLessThan(500);
    });

    it('does not repeat the password in the answer', async () => {
      const { response } = await register({ password: 'tooshort' });
      expect(response.body).not.toContain('tooshort');
    });

    it('does not let a value be treated as SQL', async () => {
      const { response } = await register({ email: "x'; DROP TABLE users; --@example.com" });
      expect(response.statusCode).toBe(400);
      expect(await t.db.query('SELECT 1 FROM users')).toHaveLength(0);
    });

    it('stores a quote or a SQL-like name as plain text', async () => {
      const name = "Robert'); DROP TABLE users;--";
      const { body } = await register({ name });
      expect(body.user.name).toBe(name);
      expect(await t.db.query('SELECT 1 FROM users')).toHaveLength(1);
    });
  });

  it('allows five accounts a minute from one address, and then asks to wait', async () => {
    for (let index = 0; index < 5; index++) {
      expect((await register({ email: `user${index}@example.com` })).response.statusCode).toBe(201);
    }

    const { response } = await register({ email: 'one-too-many@example.com' });

    expect(response.statusCode).toBe(429);
    expect(errorOf(response).code).toBe('rateLimited');
    expect(response.headers['retry-after']).toBeDefined();
  });
});

describe('POST /v1/auth/login', () => {
  beforeEach(async () => {
    await register();
  });

  it('logs in with the right email and password', async () => {
    const { response, body } = await logIn();

    expect(response.statusCode).toBe(200);
    expect(body.user).toMatchObject({ name: 'Anna Nowak', email: 'anna@example.com' });
    expect(body.token).toMatch(/^[A-Za-z0-9_-]{43}$/);
  });

  it('works with the email written in any case, with spaces around it', async () => {
    expect((await logIn('  ANNA@Example.com ')).response.statusCode).toBe(200);
  });

  it('gives a token that works, and a new one every time', async () => {
    const first = await logIn();
    const second = await logIn();

    expect(first.body.token).not.toBe(second.body.token);
    for (const { body } of [first, second]) {
      expect((await get('/v1/auth/me', bearer(body.token as string))).statusCode).toBe(200);
    }
  });

  it('does not apply the rules for a new password, so an older, weaker password still works', async () => {
    const weak = await hashPassword('1234', paramsFor(16));
    await t.db.query('UPDATE users SET password_hash = $1', [weak]);

    expect((await logIn('anna@example.com', '1234')).response.statusCode).toBe(200);
  });

  describe('when the details are wrong', () => {
    it('refuses a wrong password', async () => {
      const { response } = await logIn('anna@example.com', 'Secret124');

      expect(response.statusCode).toBe(401);
      expect(errorOf(response)).toMatchObject({ code: 'invalidCredentials' });
    });

    it('gives exactly the same answer for an email that has no account, so it does not tell who has one', async () => {
      const wrongPassword = await logIn('anna@example.com', 'Secret124');
      const unknownEmail = await logIn('nobody@example.com', 'Secret123');

      expect(unknownEmail.response.statusCode).toBe(wrongPassword.response.statusCode);
      expect(unknownEmail.response.body).toBe(wrongPassword.response.body);
    });

    it.each(['secret123', 'Secret123 ', ' Secret123', 'SECRET123'])('is strict about the password %p', async (password) => {
      expect((await logIn('anna@example.com', password)).response.statusCode).toBe(401);
    });

    it('does not give a token', async () => {
      const { body } = await logIn('anna@example.com', 'wrong');
      expect(body).not.toHaveProperty('token');
    });
  });

  describe('input that is not valid', () => {
    it.each([
      [{}],
      [{ email: 'anna@example.com' }],
      [{ password: 'Secret123' }],
      [{ email: 'not an email', password: 'x' }],
      [{ email: 'anna@example.com', password: '' }],
      [{ email: 'anna@example.com', password: 'x'.repeat(129) }],
      [{ email: 'anna@example.com', password: 'Secret123', extra: 1 }],
      [{ email: ['anna@example.com'], password: 'x' }],
    ])('is refused with a 400: %j', async (payload) => {
      const response = await post('/v1/auth/login', payload);
      expect(response.statusCode).toBe(400);
      expect(errorOf(response).code).toBe('validation');
    });

    it('does not let a value be treated as SQL', async () => {
      const response = await post('/v1/auth/login', {
        email: "anna@example.com' OR '1'='1",
        password: "' OR '1'='1",
      });
      expect(response.statusCode).toBeGreaterThanOrEqual(400);
      expect(response.json()).not.toHaveProperty('token');
    });
  });

  it('makes a hash again with the current settings when it was made with older ones', async () => {
    const older = await hashPassword('Secret123', paramsFor(32));
    await t.db.query('UPDATE users SET password_hash = $1', [older]);

    expect((await logIn()).response.statusCode).toBe(200);

    const [row] = await t.db.query<{ password_hash: string }>('SELECT password_hash FROM users');
    expect(row?.password_hash).toMatch(/^scrypt\$16\$8\$1\$/);
    expect((await logIn()).response.statusCode).toBe(200);
  });

  it('allows ten attempts a minute from one address, even when the password is right', async () => {
    for (let attempt = 0; attempt < 10; attempt++) {
      await logIn('anna@example.com', 'wrong');
    }

    const { response } = await logIn();

    expect(response.statusCode).toBe(429);
    expect(errorOf(response).code).toBe('rateLimited');
  });

  it('cannot be given more attempts by a header that claims another address', async () => {
    for (let attempt = 0; attempt < 10; attempt++) {
      await post('/v1/auth/login', { email: 'anna@example.com', password: 'wrong' }, {
        'x-forwarded-for': `203.0.113.${attempt}`,
      });
    }

    const response = await post('/v1/auth/login', validRegistration, { 'x-forwarded-for': '198.51.100.7' });

    expect(response.statusCode).toBe(429);
  });
});

describe('GET /v1/auth/me', () => {
  it('gives the user of the token', async () => {
    const token = await signedUp();
    const response = await get('/v1/auth/me', bearer(token));

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
      user: { id: expect.any(String), name: 'Anna Nowak', email: 'anna@example.com' },
    });
  });

  it('never gives the password hash', async () => {
    const token = await signedUp();
    const response = await get('/v1/auth/me', bearer(token));
    expect(response.body).not.toContain('scrypt');
    expect(response.body).not.toContain('password');
  });

  it('keeps the sessions of two users apart', async () => {
    const anna = await signedUp();
    const jan = await signedUp({ email: 'jan@example.com', name: 'Jan Kowalski' });

    expect(((await get('/v1/auth/me', bearer(anna))).json() as Json).user.name).toBe('Anna Nowak');
    expect(((await get('/v1/auth/me', bearer(jan))).json() as Json).user.name).toBe('Jan Kowalski');
  });

  describe('without a session that is valid', () => {
    it.each([
      ['no header', {}],
      ['an empty header', { authorization: '' }],
      ['a header without a token', { authorization: 'Bearer' }],
      ['a header with an empty token', { authorization: 'Bearer ' }],
      ['another scheme', { authorization: 'Basic YW5uYTpTZWNyZXQxMjM=' }],
      ['a token that is not known', { authorization: `Bearer ${'A'.repeat(43)}` }],
      ['a token with characters that are not allowed', { authorization: 'Bearer abc def' }],
      ['a token that is far too long', { authorization: `Bearer ${'a'.repeat(500)}` }],
      ['a token in SQL form', { authorization: "Bearer ' OR '1'='1" }],
    ])('is refused with %s', async (_name, headers) => {
      const response = await get('/v1/auth/me', headers);

      expect(response.statusCode).toBe(401);
      expect(errorOf(response)).toMatchObject({ code: 'invalidSession' });
    });

    it('does not accept the token of a session as a query value or a cookie', async () => {
      const token = await signedUp();
      expect((await get(`/v1/auth/me?token=${token}`)).statusCode).toBe(401);
      expect((await get('/v1/auth/me', { cookie: `token=${token}` })).statusCode).toBe(401);
    });
  });

  it('accepts the word Bearer in any case', async () => {
    const token = await signedUp();
    const response = await get('/v1/auth/me', { authorization: `bearer ${token}` });
    expect(response.statusCode).toBe(200);
  });
});

describe('sessions end', () => {
  const DAY = 24 * 60 * 60 * 1000;

  it('after the time they were given, and not before', async () => {
    const token = await signedUp();

    t.advance(30 * DAY - 1);
    expect((await get('/v1/auth/me', bearer(token))).statusCode).toBe(200);

    t.advance(1);
    const response = await get('/v1/auth/me', bearer(token));
    expect(response.statusCode).toBe(401);
    expect(errorOf(response).code).toBe('invalidSession');
  });

  it('after the time that is configured', async () => {
    await t.close();
    t = await createTestApp({ SESSION_TTL_DAYS: '1' });
    const token = await signedUp();

    t.advance(DAY);

    expect((await get('/v1/auth/me', bearer(token))).statusCode).toBe(401);
  });

  it('is removed from the database once it has expired and the server cleans up', async () => {
    await signedUp();
    t.advance(31 * DAY);

    await t.auth.purgeExpired();

    expect(await t.db.query('SELECT 1 FROM sessions')).toHaveLength(0);
  });

  it('does not remove sessions that are still alive', async () => {
    await signedUp();
    t.advance(DAY);

    await t.auth.purgeExpired();

    expect(await t.db.query('SELECT 1 FROM sessions')).toHaveLength(1);
  });
});

describe('POST /v1/auth/logout', () => {
  it('ends the session, so the token no longer works', async () => {
    const token = await signedUp();

    const response = await post('/v1/auth/logout', undefined, bearer(token));

    expect(response.statusCode).toBe(204);
    expect(response.body).toBe('');
    expect((await get('/v1/auth/me', bearer(token))).statusCode).toBe(401);
  });

  it('removes the session from the database', async () => {
    const token = await signedUp();
    await post('/v1/auth/logout', undefined, bearer(token));
    expect(await t.db.query('SELECT 1 FROM sessions')).toHaveLength(0);
  });

  it('ends only that session: the same user stays logged in elsewhere', async () => {
    const phone = await signedUp();
    const laptop = (await logIn()).body.token as string;

    await post('/v1/auth/logout', undefined, bearer(phone));

    expect((await get('/v1/auth/me', bearer(phone))).statusCode).toBe(401);
    expect((await get('/v1/auth/me', bearer(laptop))).statusCode).toBe(200);
  });

  it('does not touch the sessions of other users', async () => {
    const anna = await signedUp();
    const jan = await signedUp({ email: 'jan@example.com' });

    await post('/v1/auth/logout', undefined, bearer(anna));

    expect((await get('/v1/auth/me', bearer(jan))).statusCode).toBe(200);
  });

  it('needs a session, and a second logout with the same token is refused', async () => {
    const token = await signedUp();

    expect((await post('/v1/auth/logout')).statusCode).toBe(401);
    expect((await post('/v1/auth/logout', undefined, bearer(token))).statusCode).toBe(204);
    expect((await post('/v1/auth/logout', undefined, bearer(token))).statusCode).toBe(401);
  });
});

describe('password reset', () => {
  beforeEach(async () => {
    await register();
  });

  const requestReset = async (email = 'anna@example.com') => {
    const response = await post('/v1/auth/password-reset', { email });
    await t.auth.settled();
    return response;
  };

  const confirm = (token: string, password = 'NewSecret456') =>
    post('/v1/auth/password-reset/confirm', { token, password });

  describe('asking for a link', () => {
    it('answers 202 with an empty body and sends the link to the account', async () => {
      const response = await requestReset();

      expect(response.statusCode).toBe(202);
      expect(response.json()).toEqual({});
      expect(t.sentResets).toHaveLength(1);
      expect(t.sentResets[0]?.to).toEqual({ email: 'anna@example.com', name: 'Anna Nowak' });
      expect(t.sentResets[0]?.resetUrl).toMatch(
        /^travel-planner:\/\/reset-password\?token=[A-Za-z0-9_-]{43}$/,
      );
    });

    it('gives exactly the same answer for an email that has no account, and sends nothing', async () => {
      const known = await requestReset('anna@example.com');
      const unknown = await requestReset('nobody@example.com');

      expect(unknown.statusCode).toBe(known.statusCode);
      expect(unknown.body).toBe(known.body);
      expect(t.sentResets).toHaveLength(1);
    });

    it('answers before the email is sent, so how long it takes does not tell either', async () => {
      let release!: () => void;
      const blocked = new Promise<void>((resolve) => {
        release = resolve;
      });
      await t.close();
      t = await createTestApp(
        {},
        {
          mailer: {
            sendPasswordReset: async () => {
              await blocked;
            },
          },
        },
      );
      await register();

      const response = await post('/v1/auth/password-reset', { email: 'anna@example.com' });

      // The mailer is still waiting, and the answer is already here.
      expect(response.statusCode).toBe(202);
      release();
      await t.auth.settled();
    });

    it('still answers 202 when sending the email fails', async () => {
      await t.close();
      t = await createTestApp(
        {},
        {
          mailer: {
            sendPasswordReset: async () => {
              throw new Error('SMTP is down');
            },
          },
        },
      );
      await register();

      const response = await post('/v1/auth/password-reset', { email: 'anna@example.com' });
      await expect(t.auth.settled()).resolves.toBeUndefined();

      expect(response.statusCode).toBe(202);
      expect(response.body).not.toContain('SMTP');
    });

    it('keeps only the token\'s hash in the database', async () => {
      await requestReset();

      const [row] = await t.db.query<{ token_hash: string }>('SELECT token_hash FROM password_resets');

      expect(row?.token_hash).toBe(createHash('sha256').update(t.sentResets[0]!.token).digest('hex'));
    });

    it.each([{}, { email: '' }, { email: 'nope' }, { email: 'a@b.co', extra: true }])(
      'refuses %j with a 400',
      async (payload) => {
        const response = await post('/v1/auth/password-reset', payload);
        expect(response.statusCode).toBe(400);
        expect(t.sentResets).toHaveLength(0);
      },
    );

    it('finds the account whatever the case of the email', async () => {
      await requestReset('  ANNA@Example.com ');
      expect(t.sentResets).toHaveLength(1);
    });

    it('adds the token with & when the link already has a query', async () => {
      await t.close();
      t = await createTestApp({ PASSWORD_RESET_URL: 'https://app.example.com/reset?lang=pl' });
      await register();

      await requestReset();

      expect(t.sentResets[0]?.resetUrl).toMatch(/^https:\/\/app\.example\.com\/reset\?lang=pl&token=/);
    });

    it('allows five requests a minute from one address', async () => {
      for (let index = 0; index < 5; index++) {
        expect((await post('/v1/auth/password-reset', { email: 'anna@example.com' })).statusCode).toBe(202);
      }
      expect((await post('/v1/auth/password-reset', { email: 'anna@example.com' })).statusCode).toBe(429);
    });
  });

  describe('choosing a new password', () => {
    it('works with the link, and the new password is the one that works from then on', async () => {
      await requestReset();

      const response = await confirm(t.sentResets[0]!.token);

      expect(response.statusCode).toBe(204);
      expect((await logIn('anna@example.com', 'NewSecret456')).response.statusCode).toBe(200);
      expect((await logIn('anna@example.com', 'Secret123')).response.statusCode).toBe(401);
    });

    it('ends every session of the user, so whoever had the old password is logged out', async () => {
      const phone = (await logIn()).body.token as string;
      const laptop = (await logIn()).body.token as string;
      await requestReset();

      await confirm(t.sentResets[0]!.token);

      expect((await get('/v1/auth/me', bearer(phone))).statusCode).toBe(401);
      expect((await get('/v1/auth/me', bearer(laptop))).statusCode).toBe(401);
    });

    it('does not end the sessions of other users', async () => {
      const jan = await signedUp({ email: 'jan@example.com' });
      await requestReset();

      await confirm(t.sentResets[0]!.token);

      expect((await get('/v1/auth/me', bearer(jan))).statusCode).toBe(200);
    });

    it('works only once', async () => {
      await requestReset();
      const { token } = t.sentResets[0]!;

      expect((await confirm(token)).statusCode).toBe(204);
      const second = await confirm(token, 'Another789');

      expect(second.statusCode).toBe(400);
      expect(errorOf(second)).toMatchObject({ code: 'invalidResetToken' });
      expect((await logIn('anna@example.com', 'Another789')).response.statusCode).toBe(401);
    });

    it('lets only one of two requests with the same token through', async () => {
      await requestReset();
      const { token } = t.sentResets[0]!;

      const responses = await Promise.all([confirm(token, 'First12345'), confirm(token, 'Second12345')]);

      expect(responses.map((response) => response.statusCode).sort()).toEqual([204, 400]);
    });

    it('stops working after the time it was given', async () => {
      await requestReset();
      t.advance(60 * 60_000);

      const response = await confirm(t.sentResets[0]!.token);

      expect(response.statusCode).toBe(400);
      expect(errorOf(response).code).toBe('invalidResetToken');
    });

    it('works up to the last moment', async () => {
      await requestReset();
      t.advance(60 * 60_000 - 1);
      expect((await confirm(t.sentResets[0]!.token)).statusCode).toBe(204);
    });

    it('only works with the newest link when another was asked for', async () => {
      await requestReset();
      await requestReset();
      const [older, newer] = t.sentResets;

      expect((await confirm(older!.token)).statusCode).toBe(400);
      expect((await confirm(newer!.token)).statusCode).toBe(204);
    });

    it.each(['nonsense', 'A'.repeat(43), "' OR '1'='1"])(
      'refuses the token %p as not valid, the same way whatever is wrong with it',
      async (token) => {
        const response = await confirm(token);

        expect(response.statusCode).toBe(400);
        expect(errorOf(response).code).toBe('invalidResetToken');
      },
    );

    it('refuses an empty token as a request that is not valid', async () => {
      const response = await confirm('');
      expect(response.statusCode).toBe(400);
      expect(errorOf(response).code).toBe('validation');
    });

    it('refuses a new password that is not strong enough, and does not use up the link', async () => {
      await requestReset();
      const { token } = t.sentResets[0]!;

      for (const password of ['short1', 'onlyletters', '123456789', 'x'.repeat(129)]) {
        const response = await confirm(token, password);
        expect(response.statusCode).toBe(400);
        expect(errorOf(response).code).toBe('validation');
      }

      expect((await confirm(token, 'GoodPass123')).statusCode).toBe(204);
    });

    it('keeps the old password when the link is refused', async () => {
      await confirm('A'.repeat(43));
      expect((await logIn()).response.statusCode).toBe(200);
    });

    it('refuses fields it does not know', async () => {
      await requestReset();
      const response = await post('/v1/auth/password-reset/confirm', {
        token: t.sentResets[0]!.token,
        password: 'NewSecret456',
        email: 'jan@example.com',
      });
      expect(response.statusCode).toBe(400);
    });

    it('stores the new password as a hash too', async () => {
      await requestReset();
      await confirm(t.sentResets[0]!.token, 'NewSecret456');

      const [row] = await t.db.query<{ password_hash: string }>('SELECT password_hash FROM users');
      expect(row?.password_hash).toMatch(/^scrypt\$/);
      expect(row?.password_hash).not.toContain('NewSecret456');
    });
  });
});

describe('the log', () => {
  it('never holds a password, a session token, a reset token or the authorization header', async () => {
    await t.close();
    t = await createTestApp({}, { captureLogs: true });

    const registered = await register({ password: 'LogCheck-Secret-123' });
    const token = registered.body.token as string;
    await get('/v1/auth/me', bearer(token));
    await post('/v1/auth/login', { email: 'anna@example.com', password: 'Wrong-Secret-456' });
    await post('/v1/auth/password-reset', { email: 'anna@example.com' });
    await t.auth.settled();
    const resetToken = t.sentResets[0]!.token;
    await post('/v1/auth/password-reset/confirm', { token: resetToken, password: 'Reset-Secret-789' });
    await post('/v1/auth/logout', undefined, bearer(token));

    const everything = t.logs.join('\n');
    expect(t.logs.length).toBeGreaterThan(0);
    for (const secret of [
      'LogCheck-Secret-123',
      'Wrong-Secret-456',
      'Reset-Secret-789',
      token,
      resetToken,
      'authorization',
      'Bearer',
    ]) {
      expect(everything).not.toContain(secret);
    }
  });
});

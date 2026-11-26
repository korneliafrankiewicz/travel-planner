// The app and the server are two programs written separately. This test is what makes sure they
// agree: it runs the app's REAL auth service (src/shared/auth/httpAuthService.ts) against the
// REAL server code, and it checks that the rules the app uses for forms are the same as the ones
// the server enforces. If one side changes and the other does not, this test fails.
//
// No network port is opened: the app's `fetch` is replaced by a function that hands each request
// to the server in memory.

import type { FastifyInstance } from 'fastify';
import { afterAll, afterEach, beforeEach, describe, expect, it } from 'vitest';

import {
  validateForgotPassword,
  validateLogIn,
  validateResetPassword,
  validateSignUp,
} from '../../src/modules/auth/schema/authSchemas';
import { createHttpAuthService } from '../../src/shared/auth/httpAuthService';
import { AuthError, type AuthService } from '../../src/shared/auth/types';
import {
  loginSchema,
  passwordResetConfirmSchema,
  passwordResetSchema,
  registerSchema,
} from '../src/auth/schemas.js';
import { closeTestDatabase, createTestApp, type TestApp } from '../src/test-utils/testApp.js';

const ORIGIN = 'http://api.test';

// A `fetch` that sends the request to the server in memory and turns its answer into the answer
// of a real HTTP call.
const inMemoryFetch =
  (app: FastifyInstance, remoteAddress?: string): typeof fetch =>
  async (input, init) => {
    const url = new URL(typeof input === 'string' ? input : input instanceof URL ? input.href : input.url);
    const headers: Record<string, string> = {};
    new Headers(init?.headers).forEach((value, name) => {
      headers[name] = value;
    });
    const response = await app.inject({
      method: (init?.method ?? 'GET') as 'GET' | 'POST',
      url: `${url.pathname}${url.search}`,
      headers,
      payload: typeof init?.body === 'string' ? init.body : undefined,
      ...(remoteAddress !== undefined ? { remoteAddress } : {}),
    });
    return new Response(response.statusCode === 204 ? null : response.body, { status: response.statusCode });
  };

let t: TestApp;
let appService: AuthService;

beforeEach(async () => {
  t = await createTestApp();
  appService = createHttpAuthService({ baseUrl: ORIGIN, fetch: inMemoryFetch(t.app), timeoutMs: 5000 });
});

afterEach(async () => {
  await t.close();
});

afterAll(closeTestDatabase);

const failureOf = async (action: Promise<unknown>): Promise<unknown> => {
  try {
    await action;
  } catch (error) {
    return error;
  }
  return null;
};

const signUp = (overrides: Partial<{ name: string; email: string; password: string }> = {}) =>
  appService.signUp({ name: 'Anna Nowak', email: 'anna@example.com', password: 'Secret123', ...overrides });

describe('the app\'s service against the server', () => {
  it('sign up gives a token and the user, in the shape the app expects', async () => {
    const { token, user } = await signUp();

    expect(token).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(user).toEqual({ id: expect.any(String), name: 'Anna Nowak', email: 'anna@example.com' });
  });

  it('the token of a sign up is accepted by "who am I", and gives the same user', async () => {
    const { token, user } = await signUp();
    expect(await appService.getUser(token)).toEqual(user);
  });

  it('log in gives a working token', async () => {
    await signUp();

    const { token, user } = await appService.signIn({ email: 'anna@example.com', password: 'Secret123' });

    expect(await appService.getUser(token)).toEqual(user);
  });

  it('log out ends the session, and the app then sees "invalidSession"', async () => {
    const { token } = await signUp();

    await appService.signOut(token);

    expect(await failureOf(appService.getUser(token))).toMatchObject({ code: 'invalidSession' });
  });

  it('a token that is unknown is "invalidSession", so the app logs the user out', async () => {
    const error = await failureOf(appService.getUser('A'.repeat(43)));
    expect(error).toBeInstanceOf(AuthError);
    expect(error).toMatchObject({ code: 'invalidSession' });
  });

  it('an email that is taken is "emailTaken"', async () => {
    await signUp();
    expect(await failureOf(signUp({ name: 'Other' }))).toMatchObject({ code: 'emailTaken' });
  });

  it('a wrong password and an unknown email are both "invalidCredentials"', async () => {
    await signUp();

    expect(await failureOf(appService.signIn({ email: 'anna@example.com', password: 'Wrong123' }))).toMatchObject({
      code: 'invalidCredentials',
    });
    expect(await failureOf(appService.signIn({ email: 'nobody@example.com', password: 'Secret123' }))).toMatchObject({
      code: 'invalidCredentials',
    });
  });

  it('too many attempts are "rateLimited"', async () => {
    for (let attempt = 0; attempt < 10; attempt++) {
      await failureOf(appService.signIn({ email: 'anna@example.com', password: 'wrong' }));
    }

    expect(await failureOf(appService.signIn({ email: 'anna@example.com', password: 'wrong' }))).toMatchObject({
      code: 'rateLimited',
    });
  });

  it('a request the server finds not valid is "unknown", because the app should never send one', async () => {
    expect(await failureOf(signUp({ password: 'short' }))).toMatchObject({ code: 'unknown' });
  });

  it('a lost connection is "network"', async () => {
    const offline = createHttpAuthService({
      baseUrl: ORIGIN,
      fetch: async () => {
        throw new TypeError('Network request failed');
      },
    });
    expect(await failureOf(offline.getUser('t'))).toMatchObject({ code: 'network' });
  });

  describe('password reset', () => {
    it('asking for a link works for a known and for an unknown address, the same way', async () => {
      await signUp();

      await expect(appService.requestPasswordReset('anna@example.com')).resolves.toBeUndefined();
      await expect(appService.requestPasswordReset('nobody@example.com')).resolves.toBeUndefined();
      await t.auth.settled();

      expect(t.sentResets).toHaveLength(1);
    });

    it('the token from the link chooses a new password, and ends the old sessions', async () => {
      const { token: oldSession } = await signUp();
      await appService.requestPasswordReset('anna@example.com');
      await t.auth.settled();
      const resetToken = t.sentResets[0]!.token;

      await appService.confirmPasswordReset(resetToken, 'NewSecret456');

      expect(await failureOf(appService.getUser(oldSession))).toMatchObject({ code: 'invalidSession' });
      expect(await failureOf(appService.signIn({ email: 'anna@example.com', password: 'Secret123' }))).toMatchObject({
        code: 'invalidCredentials',
      });
      const { user } = await appService.signIn({ email: 'anna@example.com', password: 'NewSecret456' });
      expect(user.email).toBe('anna@example.com');
    });

    it('a link that was used, or is not valid, is "invalidResetToken"', async () => {
      await signUp();
      await appService.requestPasswordReset('anna@example.com');
      await t.auth.settled();
      const resetToken = t.sentResets[0]!.token;
      await appService.confirmPasswordReset(resetToken, 'NewSecret456');

      expect(await failureOf(appService.confirmPasswordReset(resetToken, 'Another789'))).toMatchObject({
        code: 'invalidResetToken',
      });
      expect(await failureOf(appService.confirmPasswordReset('nonsense', 'Another789'))).toMatchObject({
        code: 'invalidResetToken',
      });
    });

    it('a link that has expired is "invalidResetToken"', async () => {
      await signUp();
      await appService.requestPasswordReset('anna@example.com');
      await t.auth.settled();
      t.advance(60 * 60_000);

      expect(
        await failureOf(appService.confirmPasswordReset(t.sentResets[0]!.token, 'NewSecret456')),
      ).toMatchObject({ code: 'invalidResetToken' });
    });
  });
});

// ---------------------------------------------------------------------------------------------
// The app checks a form before sending it, and the server checks it again. If the app were
// stricter, it would refuse something the server accepts; if it were looser, it would send a form
// that is bound to fail. These tests give both the same input and compare the verdicts.

const repeat = (character: string, count: number) => character.repeat(count);

const emails = [
  'anna@example.com',
  'ANNA@EXAMPLE.COM',
  '  anna@example.com  ',
  'anna.nowak+tag@sub.example.co.uk',
  'a@b.cc',
  'ł@example.com',
  'anna@example',
  'anna@example.c',
  'anna@',
  '@example.com',
  'anna',
  'an na@example.com',
  'anna@exa mple.com',
  'a@@b.com',
  '',
  '   ',
  `${repeat('a', 242)}@example.com`, // 254 characters
  `${repeat('a', 243)}@example.com`, // 255 characters
];

const names = [
  'Anna',
  '  Anna Nowak  ',
  'Zażółć Gęślą',
  "Robert'); DROP TABLE users;--",
  '😀',
  repeat('a', 80),
  repeat('a', 81),
  `  ${repeat('a', 80)}  `,
  '',
  '   ',
];

const passwords = [
  'Secret123',
  'secret123',
  'SECRET123',
  'Abcdefg1', // 8 characters
  'Abcdef1', // 7 characters
  'abcdefgh', // no number
  '12345678', // no letter
  '!!!!!!!1', // no letter
  'żółćżółć1', // no English letter
  'пароль12345',
  'パスワード1234',
  ' Secret 123 ',
  'Secret123 ',
  'pass word 1',
  '        1a',
  `a1${repeat('x', 126)}`, // 128 characters
  `a1${repeat('x', 127)}`, // 129 characters
  `${repeat('a', 127)}1`, // 128
  `${repeat('a', 128)}1`, // 129
  '',
];

// Makes an address that belongs to one test case only, without becoming longer than the longest
// address that is allowed (254 characters).
const MAX_EMAIL_LENGTH = 254;
const uniqueEmail = (index: number, email: string): string => {
  const [local = '', domain = ''] = email.split('@');
  const prefix = `n${index}-`;
  const room = MAX_EMAIL_LENGTH - domain.length - 1 - prefix.length;
  return `${prefix}${local.slice(0, Math.max(room, 0))}@${domain}`;
};

describe('the rules for a form are the same in the app and on the server', () => {
  const appSignUp = (values: { name: string; email: string; password: string }) =>
    validateSignUp({ ...values, confirmPassword: values.password, acceptTerms: true });

  it.each(emails)('email %j', (email) => {
    const app = appSignUp({ name: 'Anna', email, password: 'Secret123' });
    const server = registerSchema.safeParse({ name: 'Anna', email, password: 'Secret123' });

    expect(app.success).toBe(server.success);
    if (app.success && server.success) {
      // The address is cleaned in the same way, so the same account is meant.
      expect(app.data.email).toBe(server.data.email);
    }
  });

  it.each(names)('name %j', (name) => {
    const app = appSignUp({ name, email: 'anna@example.com', password: 'Secret123' });
    const server = registerSchema.safeParse({ name, email: 'anna@example.com', password: 'Secret123' });

    expect(app.success).toBe(server.success);
    if (app.success && server.success) {
      expect(app.data.name).toBe(server.data.name);
    }
  });

  it.each(passwords)('a new password %j', (password) => {
    const app = appSignUp({ name: 'Anna', email: 'anna@example.com', password });
    const server = registerSchema.safeParse({ name: 'Anna', email: 'anna@example.com', password });

    expect(app.success).toBe(server.success);
    if (app.success && server.success) {
      // A password is never changed, not even trimmed.
      expect(app.data.password).toBe(server.data.password);
    }
  });

  it.each(passwords)('a new password %j when choosing a new one with a reset link', (password) => {
    const app = validateResetPassword({ password, confirmPassword: password });
    const server = passwordResetConfirmSchema.safeParse({ token: 'abc', password });

    expect(app.success).toBe(server.success);
  });

  it.each(emails)('email %j when logging in', (email) => {
    const app = validateLogIn({ email, password: 'whatever' });
    const server = loginSchema.safeParse({ email, password: 'whatever' });

    expect(app.success).toBe(server.success);
    if (app.success && server.success) {
      expect(app.data.email).toBe(server.data.email);
    }
  });

  it.each(passwords)('a password %j when logging in, where the rules for a new one are not applied', (password) => {
    const app = validateLogIn({ email: 'anna@example.com', password });
    const server = loginSchema.safeParse({ email: 'anna@example.com', password });

    expect(app.success).toBe(server.success);
  });

  it.each(emails)('email %j when asking for a reset link', (email) => {
    const app = validateForgotPassword({ email });
    const server = passwordResetSchema.safeParse({ email });

    expect(app.success).toBe(server.success);
    if (app.success && server.success) {
      expect(app.data.email).toBe(server.data.email);
    }
  });

  it('a form that the app accepts is never refused by the real server', async () => {
    // The strongest form of the agreement: everything the app lets through can really be
    // registered. Each sign-up comes from its own client address, so the limit on requests is not
    // what is being tested.
    const accepted = emails.flatMap((email) =>
      passwords.flatMap((password) => {
        const result = appSignUp({ name: 'Anna', email, password });
        return result.success ? [result.data] : [];
      }),
    );
    expect(accepted.length).toBeGreaterThan(50);

    for (const [index, form] of accepted.entries()) {
      const client = createHttpAuthService({
        baseUrl: ORIGIN,
        fetch: inMemoryFetch(t.app, `10.1.${Math.floor(index / 250)}.${(index % 250) + 1}`),
      });
      // A different account each time, so "email taken" is not a reason for a refusal.
      const email = uniqueEmail(index, form.email);

      const failure = await failureOf(client.signUp({ name: form.name, email, password: form.password }));

      expect(failure, `the server refused ${JSON.stringify({ email, password: form.password })}`).toBeNull();
    }
  });
});

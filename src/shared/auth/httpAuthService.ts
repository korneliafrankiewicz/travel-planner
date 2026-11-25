import { z } from 'zod';

import { AuthError, type AuthErrorCode, type AuthService } from './types';

// The auth service that talks to the back end in `server/` (see docs/api.md). It does what the
// stand-in does, over HTTP: the screens and the session store cannot tell the two apart.
//
// Every answer is checked before it is used, and a server error is turned into the same
// `AuthError` codes the screens already know. A password or a token is only ever sent in the
// body or the Authorization header of a request to the configured address, and is never logged
// or put in a URL.

const DEFAULT_TIMEOUT_MS = 15_000;

type HttpAuthOptions = {
  // The address of the server, without a trailing slash (see `resolveApiTarget`).
  baseUrl: string;
  // Replaces `fetch`; tests use it.
  fetch?: typeof fetch;
  // How long to wait for an answer before giving up.
  timeoutMs?: number;
};

const userSchema = z.object({ id: z.string().min(1), name: z.string(), email: z.string() });
const authResultSchema = z.object({ token: z.string().min(1), user: userSchema });
const meSchema = z.object({ user: userSchema });

// The codes of the server that the app has a message for. Anything else is "unknown".
const knownCodes: readonly AuthErrorCode[] = [
  'invalidCredentials',
  'emailTaken',
  'invalidSession',
  'invalidResetToken',
  'rateLimited',
];
const errorBodySchema = z.object({ error: z.object({ code: z.string() }) });

const codeFor = (status: number, body: unknown): AuthErrorCode => {
  const parsed = errorBodySchema.safeParse(body);
  const code = parsed.success ? parsed.data.error.code : undefined;
  const known = knownCodes.find((candidate) => candidate === code);
  if (known !== undefined) {
    return known;
  }
  // A limit can be hit before the server's own error body is made (for example by a proxy).
  return status === 429 ? 'rateLimited' : 'unknown';
};

type RequestOptions = {
  body?: unknown;
  // The session token, sent as `Authorization: Bearer <token>`.
  token?: string;
  // The status that means success; any other status is a failure.
  expectedStatus: number;
};

export const createHttpAuthService = ({
  baseUrl,
  fetch: fetchOverride,
  timeoutMs = DEFAULT_TIMEOUT_MS,
}: HttpAuthOptions): AuthService => {
  const send: typeof fetch = fetchOverride ?? ((input, init) => globalThis.fetch(input, init));

  // Sends a request and gives back the body of the answer. Throws an AuthError for anything that
  // is not the expected answer.
  const request = async (method: 'GET' | 'POST', path: string, options: RequestOptions): Promise<unknown> => {
    const controller = new AbortController();
    // The timer runs until the whole answer was read, so a server that sends the headers and then
    // stalls is given up on as well.
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    let status: number;
    let text: string;
    try {
      const response = await send(`${baseUrl}${path}`, {
        method,
        headers: {
          Accept: 'application/json',
          ...(options.body !== undefined ? { 'Content-Type': 'application/json' } : {}),
          ...(options.token !== undefined ? { Authorization: `Bearer ${options.token}` } : {}),
        },
        body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
        signal: controller.signal,
      });
      status = response.status;
      text = await response.text();
    } catch {
      // No connection, a refused connection, or no answer in time.
      throw new AuthError('network');
    } finally {
      clearTimeout(timer);
    }

    let body: unknown = null;
    if (text !== '') {
      try {
        body = JSON.parse(text);
      } catch {
        // Not JSON, e.g. an error page of a proxy. Handled below by the status.
      }
    }

    if (status !== options.expectedStatus) {
      throw new AuthError(codeFor(status, body));
    }
    return body;
  };

  // Checks an answer that should hold data. An answer in another shape is a mistake of the
  // server (or something in between), and the user cannot do anything about it.
  const parse = <Schema extends z.ZodType>(schema: Schema, body: unknown): z.output<Schema> => {
    const result = schema.safeParse(body);
    if (!result.success) {
      throw new AuthError('unknown');
    }
    return result.data;
  };

  return {
    signIn: async (credentials) =>
      parse(
        authResultSchema,
        await request('POST', '/v1/auth/login', { body: credentials, expectedStatus: 200 }),
      ),

    signUp: async (input) =>
      parse(
        authResultSchema,
        await request('POST', '/v1/auth/register', { body: input, expectedStatus: 201 }),
      ),

    signOut: async (token) => {
      await request('POST', '/v1/auth/logout', { token, expectedStatus: 204 });
    },

    getUser: async (token) =>
      parse(meSchema, await request('GET', '/v1/auth/me', { token, expectedStatus: 200 })).user,

    requestPasswordReset: async (email) => {
      await request('POST', '/v1/auth/password-reset', { body: { email }, expectedStatus: 202 });
    },

    confirmPasswordReset: async (token, password) => {
      await request('POST', '/v1/auth/password-reset/confirm', {
        body: { token, password },
        expectedStatus: 204,
      });
    },
  };
};

import { createHttpAuthService } from './httpAuthService';
import { AuthError, type AuthErrorCode } from './types';

const BASE = 'https://api.example.com';

const anna = { id: 'u1', name: 'Anna Nowak', email: 'anna@example.com' };

// Only what the service reads of an answer: its status and its text.
type Answer = { status: number; text: () => Promise<string> };
const answer = (status: number, body?: unknown): Answer => ({
  status,
  text: async () => (body === undefined ? '' : typeof body === 'string' ? body : JSON.stringify(body)),
});

const errorAnswer = (status: number, code: string) => answer(status, { error: { code, message: 'x' } });

// A fetch that gives the next answer and records the request it was given.
const makeFetch = (...answers: (Answer | Error)[]) => {
  const calls: { url: string; init: RequestInit }[] = [];
  const fetchMock = jest.fn(async (input: unknown, init?: RequestInit) => {
    calls.push({ url: String(input), init: init ?? {} });
    const next = answers.shift() ?? answer(500);
    if (next instanceof Error) {
      throw next;
    }
    return next as unknown as Response;
  });
  return { fetchMock: fetchMock as unknown as typeof fetch, calls };
};

const serviceWith = (...answers: (Answer | Error)[]) => {
  const { fetchMock, calls } = makeFetch(...answers);
  return { service: createHttpAuthService({ baseUrl: BASE, fetch: fetchMock }), calls };
};

const failureOf = async (action: Promise<unknown>): Promise<unknown> => {
  try {
    await action;
  } catch (error) {
    return error;
  }
  return null;
};

const headersOf = (init: RequestInit) => init.headers as Record<string, string>;

afterEach(() => {
  jest.restoreAllMocks();
  jest.useRealTimers();
});

describe('the requests', () => {
  it('log in: POST /v1/auth/login with the email and password as JSON', async () => {
    const { service, calls } = serviceWith(answer(200, { token: 't', user: anna }));

    await service.signIn({ email: 'anna@example.com', password: 'Secret123' });

    expect(calls).toHaveLength(1);
    expect(calls[0]!.url).toBe(`${BASE}/v1/auth/login`);
    expect(calls[0]!.init.method).toBe('POST');
    expect(JSON.parse(calls[0]!.init.body as string)).toEqual({
      email: 'anna@example.com',
      password: 'Secret123',
    });
    expect(headersOf(calls[0]!.init)).toEqual({
      Accept: 'application/json',
      'Content-Type': 'application/json',
    });
  });

  it('sign up: POST /v1/auth/register with the name, email and password', async () => {
    const { service, calls } = serviceWith(answer(201, { token: 't', user: anna }));

    await service.signUp({ name: 'Anna Nowak', email: 'anna@example.com', password: 'Secret123' });

    expect(calls[0]!.url).toBe(`${BASE}/v1/auth/register`);
    expect(calls[0]!.init.method).toBe('POST');
    expect(JSON.parse(calls[0]!.init.body as string)).toEqual({
      name: 'Anna Nowak',
      email: 'anna@example.com',
      password: 'Secret123',
    });
  });

  it('who am I: GET /v1/auth/me with the token in the Authorization header and no body', async () => {
    const { service, calls } = serviceWith(answer(200, { user: anna }));

    await service.getUser('the-token');

    expect(calls[0]!.url).toBe(`${BASE}/v1/auth/me`);
    expect(calls[0]!.init.method).toBe('GET');
    expect(calls[0]!.init.body).toBeUndefined();
    expect(headersOf(calls[0]!.init)).toEqual({
      Accept: 'application/json',
      Authorization: 'Bearer the-token',
    });
  });

  it('log out: POST /v1/auth/logout with the token and no body', async () => {
    const { service, calls } = serviceWith(answer(204));

    await service.signOut('the-token');

    expect(calls[0]!.url).toBe(`${BASE}/v1/auth/logout`);
    expect(calls[0]!.init.method).toBe('POST');
    expect(calls[0]!.init.body).toBeUndefined();
    expect(headersOf(calls[0]!.init).Authorization).toBe('Bearer the-token');
  });

  it('ask for a reset link: POST /v1/auth/password-reset with the email', async () => {
    const { service, calls } = serviceWith(answer(202, {}));

    await service.requestPasswordReset('anna@example.com');

    expect(calls[0]!.url).toBe(`${BASE}/v1/auth/password-reset`);
    expect(JSON.parse(calls[0]!.init.body as string)).toEqual({ email: 'anna@example.com' });
  });

  it('choose a new password: POST /v1/auth/password-reset/confirm with the token and password', async () => {
    const { service, calls } = serviceWith(answer(204));

    await service.confirmPasswordReset('reset-token', 'NewSecret456');

    expect(calls[0]!.url).toBe(`${BASE}/v1/auth/password-reset/confirm`);
    expect(JSON.parse(calls[0]!.init.body as string)).toEqual({
      token: 'reset-token',
      password: 'NewSecret456',
    });
    expect(headersOf(calls[0]!.init).Authorization).toBeUndefined();
  });

  it('never puts a password or a token in the address', async () => {
    const { service, calls } = serviceWith(
      answer(200, { token: 't', user: anna }),
      answer(200, { user: anna }),
      answer(204),
    );

    await service.signIn({ email: 'anna@example.com', password: 'Secret123' });
    await service.getUser('session-token-xyz');
    await service.confirmPasswordReset('reset-token-xyz', 'NewSecret456');

    for (const { url } of calls) {
      for (const secret of ['Secret123', 'NewSecret456', 'session-token-xyz', 'reset-token-xyz']) {
        expect(url).not.toContain(secret);
      }
      expect(url).not.toContain('?');
    }
  });

  it('only sends the token to log out and to ask who it belongs to', async () => {
    const { service, calls } = serviceWith(
      answer(200, { token: 't', user: anna }),
      answer(201, { token: 't', user: anna }),
      answer(202, {}),
      answer(204),
    );

    await service.signIn({ email: 'a@b.co', password: 'x' });
    await service.signUp({ name: 'A', email: 'a@b.co', password: 'x1x1x1x1' });
    await service.requestPasswordReset('a@b.co');
    await service.confirmPasswordReset('t', 'x1x1x1x1');

    for (const { init } of calls) {
      expect(headersOf(init).Authorization).toBeUndefined();
    }
  });

  it('keeps a path in the address', async () => {
    const { fetchMock, calls } = makeFetch(answer(200, { token: 't', user: anna }));
    const service = createHttpAuthService({ baseUrl: 'https://example.com/api', fetch: fetchMock });

    await service.signIn({ email: 'a@b.co', password: 'x' });

    expect(calls[0]!.url).toBe('https://example.com/api/v1/auth/login');
  });

  it('uses the global fetch when none is given', async () => {
    const original = globalThis.fetch;
    const globalFetch = jest.fn(async () => answer(200, { token: 't', user: anna }) as unknown as Response);
    globalThis.fetch = globalFetch as unknown as typeof fetch;
    try {
      await createHttpAuthService({ baseUrl: BASE }).signIn({ email: 'a@b.co', password: 'x' });
    } finally {
      globalThis.fetch = original;
    }
    expect(globalFetch).toHaveBeenCalledTimes(1);
  });
});

describe('the answers', () => {
  it('log in and sign up give the token and the user', async () => {
    const { service } = serviceWith(
      answer(200, { token: 'token-1', user: anna }),
      answer(201, { token: 'token-2', user: anna }),
    );

    expect(await service.signIn({ email: 'a@b.co', password: 'x' })).toEqual({ token: 'token-1', user: anna });
    expect(await service.signUp({ name: 'A', email: 'a@b.co', password: 'x1x1x1x1' })).toEqual({
      token: 'token-2',
      user: anna,
    });
  });

  it('who am I gives the user and nothing else', async () => {
    const { service } = serviceWith(answer(200, { user: anna }));
    expect(await service.getUser('t')).toEqual(anna);
  });

  it('ignores fields it does not know, so the server can add some', async () => {
    const { service } = serviceWith(
      answer(200, { token: 't', user: { ...anna, plan: 'pro' }, extra: true }),
    );

    expect(await service.signIn({ email: 'a@b.co', password: 'x' })).toEqual({ token: 't', user: anna });
  });

  it.each([
    ['nothing', undefined],
    ['text that is not JSON', 'not json'],
    ['null', 'null'],
    ['an empty object', {}],
    ['no token', { user: anna }],
    ['an empty token', { token: '', user: anna }],
    ['a token that is not text', { token: 123, user: anna }],
    ['no user', { token: 't' }],
    ['a user without an id', { token: 't', user: { name: 'A', email: 'a@b.co' } }],
    ['a user with an empty id', { token: 't', user: { id: '', name: 'A', email: 'a@b.co' } }],
    ['a user whose name is not text', { token: 't', user: { id: 'u', name: 5, email: 'a@b.co' } }],
  ])('refuses an answer to log in that holds %s', async (_name, body) => {
    const { service } = serviceWith(answer(200, body));

    const error = await failureOf(service.signIn({ email: 'a@b.co', password: 'x' }));

    expect(error).toBeInstanceOf(AuthError);
    expect(error).toMatchObject({ code: 'unknown' });
  });

  it.each([
    ['nothing', undefined],
    ['no user', {}],
    ['a user that is not an object', { user: 'anna' }],
    ['a user without an id', { user: { name: 'A', email: 'a@b.co' } }],
  ])('refuses an answer to "who am I" that holds %s', async (_name, body) => {
    const { service } = serviceWith(answer(200, body));
    expect(await failureOf(service.getUser('t'))).toMatchObject({ code: 'unknown' });
  });

  it('refuses a success with the wrong status, because it is not the answer that was expected', async () => {
    const { service } = serviceWith(answer(201, { token: 't', user: anna }), answer(200, { token: 't', user: anna }));

    expect(await failureOf(service.signIn({ email: 'a@b.co', password: 'x' }))).toMatchObject({ code: 'unknown' });
    expect(
      await failureOf(service.signUp({ name: 'A', email: 'a@b.co', password: 'x1x1x1x1' })),
    ).toMatchObject({ code: 'unknown' });
  });

  it('does not treat a redirect or an answer of an unexpected kind as success', async () => {
    const { service } = serviceWith(answer(302), answer(200, { ok: true }));

    expect(await failureOf(service.signOut('t'))).toMatchObject({ code: 'unknown' });
    expect(await failureOf(service.confirmPasswordReset('t', 'x1x1x1x1'))).toMatchObject({ code: 'unknown' });
  });
});

describe('the errors of the server', () => {
  const cases: [string, number, string, AuthErrorCode][] = [
    ['wrong email or password', 401, 'invalidCredentials', 'invalidCredentials'],
    ['an email that is taken', 409, 'emailTaken', 'emailTaken'],
    ['a session that is not valid', 401, 'invalidSession', 'invalidSession'],
    ['a reset link that is not valid', 400, 'invalidResetToken', 'invalidResetToken'],
    ['too many requests', 429, 'rateLimited', 'rateLimited'],
    ['input that is not valid', 400, 'validation', 'unknown'],
    ['a failure of the server', 500, 'internal', 'unknown'],
    ['a payload that is too large', 413, 'payloadTooLarge', 'unknown'],
    ['a route that does not exist', 404, 'notFound', 'unknown'],
    ['a code it does not know', 400, 'somethingNew', 'unknown'],
  ];

  it.each(cases)('turns %s into an AuthError', async (_name, status, serverCode, appCode) => {
    const { service } = serviceWith(errorAnswer(status, serverCode));

    const error = await failureOf(service.signIn({ email: 'a@b.co', password: 'x' }));

    expect(error).toBeInstanceOf(AuthError);
    expect((error as AuthError).code).toBe(appCode);
  });

  it('turns an answer of 429 into "wait" even when the body is not the server\'s own (a proxy)', async () => {
    const { service } = serviceWith(answer(429, '<html>Too many requests</html>'), answer(429));

    expect(await failureOf(service.signIn({ email: 'a@b.co', password: 'x' }))).toMatchObject({ code: 'rateLimited' });
    expect(await failureOf(service.signIn({ email: 'a@b.co', password: 'x' }))).toMatchObject({ code: 'rateLimited' });
  });

  it.each([
    ['an error page of a proxy', answer(502, '<html>Bad gateway</html>')],
    ['an empty answer', answer(503)],
    ['an error in another shape', answer(400, { message: 'bad' })],
    ['an error whose code is not text', answer(400, { error: { code: 42 } })],
    ['null', answer(500, 'null')],
  ])('gives "unknown" for %s', async (_name, response) => {
    const { service } = serviceWith(response);
    expect(await failureOf(service.signIn({ email: 'a@b.co', password: 'x' }))).toMatchObject({ code: 'unknown' });
  });

  it('works the same for every call', async () => {
    const { service } = serviceWith(
      errorAnswer(401, 'invalidSession'),
      errorAnswer(401, 'invalidSession'),
      errorAnswer(400, 'invalidResetToken'),
      errorAnswer(429, 'rateLimited'),
      errorAnswer(409, 'emailTaken'),
    );

    expect(await failureOf(service.getUser('t'))).toMatchObject({ code: 'invalidSession' });
    expect(await failureOf(service.signOut('t'))).toMatchObject({ code: 'invalidSession' });
    expect(await failureOf(service.confirmPasswordReset('t', 'x1x1x1x1'))).toMatchObject({ code: 'invalidResetToken' });
    expect(await failureOf(service.requestPasswordReset('a@b.co'))).toMatchObject({ code: 'rateLimited' });
    expect(
      await failureOf(service.signUp({ name: 'A', email: 'a@b.co', password: 'x1x1x1x1' })),
    ).toMatchObject({ code: 'emailTaken' });
  });

  it('does not copy anything from the answer, or from the request, into the error', async () => {
    const { service } = serviceWith(answer(401, { error: { code: 'invalidCredentials', message: 'for anna@example.com' } }));

    const error = (await failureOf(service.signIn({ email: 'anna@example.com', password: 'Secret123' }))) as Error;

    expect(error.message).toBe('invalidCredentials');
    expect(error.message).not.toContain('Secret123');
    expect(error.message).not.toContain('anna@example.com');
  });
});

describe('when the server cannot be reached', () => {
  it('gives "network" when the connection fails', async () => {
    const { service } = serviceWith(new TypeError('Network request failed'));

    const error = await failureOf(service.signIn({ email: 'a@b.co', password: 'x' }));

    expect(error).toBeInstanceOf(AuthError);
    expect(error).toMatchObject({ code: 'network' });
  });

  it('gives "network" for every call', async () => {
    const down = () => new TypeError('Network request failed');
    const { service } = serviceWith(down(), down(), down(), down(), down(), down());

    for (const call of [
      () => service.signIn({ email: 'a@b.co', password: 'x' }),
      () => service.signUp({ name: 'A', email: 'a@b.co', password: 'x1x1x1x1' }),
      () => service.getUser('t'),
      () => service.signOut('t'),
      () => service.requestPasswordReset('a@b.co'),
      () => service.confirmPasswordReset('t', 'x1x1x1x1'),
    ]) {
      expect(await failureOf(call())).toMatchObject({ code: 'network' });
    }
  });

  it('gives "network" when reading the answer fails half way', async () => {
    const broken: Answer = {
      status: 200,
      text: async () => {
        throw new TypeError('Network request failed');
      },
    };
    const { service } = serviceWith(broken);

    expect(await failureOf(service.getUser('t'))).toMatchObject({ code: 'network' });
  });

  describe('when there is no answer in time', () => {
    // A server that never answers: the request only ends when the service gives up.
    const silentFetch = (): typeof fetch =>
      ((_input: unknown, init?: RequestInit) =>
        new Promise((_resolve, reject) => {
          init?.signal?.addEventListener('abort', () => reject(new Error('aborted')));
        })) as unknown as typeof fetch;

    it('gives up after the time that was set, and says "network"', async () => {
      jest.useFakeTimers();
      const service = createHttpAuthService({ baseUrl: BASE, fetch: silentFetch(), timeoutMs: 5000 });
      let result: unknown = 'pending';
      const request = service.getUser('t').then(
        () => (result = 'resolved'),
        (error: unknown) => (result = error),
      );

      await jest.advanceTimersByTimeAsync(4999);
      expect(result).toBe('pending');

      await jest.advanceTimersByTimeAsync(1);
      await request;
      expect(result).toMatchObject({ code: 'network' });
    });

    it('waits 15 seconds by default', async () => {
      jest.useFakeTimers();
      const service = createHttpAuthService({ baseUrl: BASE, fetch: silentFetch() });
      let result: unknown = 'pending';
      const request = service.getUser('t').catch((error: unknown) => (result = error));

      await jest.advanceTimersByTimeAsync(14_999);
      expect(result).toBe('pending');
      await jest.advanceTimersByTimeAsync(1);
      await request;

      expect(result).toMatchObject({ code: 'network' });
    });

    it('also gives up on an answer that starts and then stalls', async () => {
      jest.useFakeTimers();
      const stalling: typeof fetch = ((_input: unknown, init?: RequestInit) =>
        Promise.resolve({
          status: 200,
          text: () =>
            new Promise<string>((_resolve, reject) => {
              init?.signal?.addEventListener('abort', () => reject(new Error('aborted')));
            }),
        })) as unknown as typeof fetch;
      const service = createHttpAuthService({ baseUrl: BASE, fetch: stalling, timeoutMs: 1000 });
      const request = failureOf(service.getUser('t'));

      await jest.advanceTimersByTimeAsync(1000);

      expect(await request).toMatchObject({ code: 'network' });
    });

    it('does not leave a timer behind once the answer has come', async () => {
      jest.useFakeTimers();
      const { fetchMock } = makeFetch(answer(200, { user: anna }));
      const service = createHttpAuthService({ baseUrl: BASE, fetch: fetchMock, timeoutMs: 5000 });

      await service.getUser('t');

      expect(jest.getTimerCount()).toBe(0);
    });

    it('does not leave a timer behind after a failure either', async () => {
      jest.useFakeTimers();
      const { fetchMock } = makeFetch(new TypeError('down'));
      const service = createHttpAuthService({ baseUrl: BASE, fetch: fetchMock, timeoutMs: 5000 });

      await failureOf(service.getUser('t'));

      expect(jest.getTimerCount()).toBe(0);
    });
  });
});

describe('what it logs', () => {
  it('nothing: a password or a token never reaches the console', async () => {
    const spies = (['log', 'info', 'warn', 'error', 'debug'] as const).map((method) =>
      jest.spyOn(console, method).mockImplementation(() => {}),
    );
    const { service } = serviceWith(
      answer(200, { token: 'tok', user: anna }),
      errorAnswer(401, 'invalidCredentials'),
      new TypeError('Network request failed'),
      answer(200, 'not json'),
    );

    await service.signIn({ email: 'a@b.co', password: 'Secret123' });
    await failureOf(service.signIn({ email: 'a@b.co', password: 'Secret123' }));
    await failureOf(service.getUser('session-token'));
    await failureOf(service.confirmPasswordReset('reset-token', 'NewSecret456'));

    for (const spy of spies) {
      expect(spy).not.toHaveBeenCalled();
    }
  });
});

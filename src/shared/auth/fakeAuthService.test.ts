import {
  createFakeAuthService,
  FAKE_INVALID_RESET_TOKEN,
  FAKE_TAKEN_EMAIL,
  FAKE_WRONG_PASSWORD,
  nameFromEmail,
} from './fakeAuthService';
import { AuthError } from './types';

const service = createFakeAuthService();

const failureOf = async (action: Promise<unknown>) => {
  try {
    await action;
  } catch (error) {
    return error;
  }
  return null;
};

describe('nameFromEmail', () => {
  it.each([
    ['anna.nowak@example.com', 'Anna Nowak'],
    ['ANNA_NOWAK@example.com', 'Anna Nowak'],
    ['jan-kowalski@example.com', 'Jan Kowalski'],
    ['kasia@example.com', 'Kasia'],
    ['  Kasia@example.com ', 'Kasia'],
  ])('turns %p into %p', (email, name) => {
    expect(nameFromEmail(email)).toBe(name);
  });
});

describe('fake auth service', () => {
  describe('signIn', () => {
    it('accepts any email and password, and names the user after the email', async () => {
      const { user, token } = await service.signIn({ email: 'Anna.Nowak@Example.com ', password: 'x' });

      expect(user).toEqual({
        id: 'fake-user-anna.nowak@example.com',
        name: 'Anna Nowak',
        email: 'anna.nowak@example.com',
      });
      expect(token).not.toBe('');
    });

    it('fails on purpose for the wrong password', async () => {
      const error = await failureOf(service.signIn({ email: 'a@b.pl', password: FAKE_WRONG_PASSWORD }));
      expect(error).toBeInstanceOf(AuthError);
      expect(error).toMatchObject({ code: 'invalidCredentials' });
    });

    it.each([
      ['no email', '', 'secret'],
      ['no password', 'a@b.pl', ''],
    ])('refuses %s', async (_name, email, password) => {
      expect(await failureOf(service.signIn({ email, password }))).toMatchObject({
        code: 'invalidCredentials',
      });
    });

    it('fails like a lost connection for an offline address', async () => {
      expect(await failureOf(service.signIn({ email: 'offline@example.com', password: 'x' }))).toMatchObject({
        code: 'network',
      });
    });

    it('never puts the password in the token or the user', async () => {
      const { user, token } = await service.signIn({ email: 'a@b.pl', password: 'Sup3rSecret!' });
      expect(token).not.toContain('Sup3rSecret');
      expect(JSON.stringify(user)).not.toContain('Sup3rSecret');
    });
  });

  describe('signUp', () => {
    it('creates a user with the name that was given, trimmed', async () => {
      const { user } = await service.signUp({ name: '  Anna Nowak ', email: 'ANNA@example.com', password: 'x' });
      expect(user).toMatchObject({ name: 'Anna Nowak', email: 'anna@example.com' });
    });

    it('fails on purpose for the taken address, whatever its case', async () => {
      const error = await failureOf(
        service.signUp({ name: 'A', email: FAKE_TAKEN_EMAIL.toUpperCase(), password: 'x' }),
      );
      expect(error).toMatchObject({ code: 'emailTaken' });
    });

    it('fails like a lost connection for an offline address', async () => {
      expect(
        await failureOf(service.signUp({ name: 'A', email: 'offline@example.com', password: 'x' })),
      ).toMatchObject({ code: 'network' });
    });
  });

  describe('getUser', () => {
    it('gives back the user a token was made for, so a session survives a restart', async () => {
      const { token, user } = await service.signUp({ name: 'Zażółć Gęślą', email: 'z@example.com', password: 'x' });
      expect(await service.getUser(token)).toEqual(user);
    });

    it.each(['', 'nonsense', 'fake.', 'fake.%7Bbroken', 'fake.%7B%22id%22%3A1%7D', 'other.abc'])(
      'rejects the token %p',
      async (token) => {
        expect(await failureOf(service.getUser(token))).toMatchObject({ code: 'invalidSession' });
      },
    );
  });

  describe('requestPasswordReset', () => {
    it('answers the same for every address, so it cannot be used to find out who has an account', async () => {
      await expect(service.requestPasswordReset('known@example.com')).resolves.toBeUndefined();
      await expect(service.requestPasswordReset(FAKE_TAKEN_EMAIL)).resolves.toBeUndefined();
      await expect(service.requestPasswordReset('nobody@example.com')).resolves.toBeUndefined();
    });

    it('fails like a lost connection for an offline address', async () => {
      expect(await failureOf(service.requestPasswordReset('offline@example.com'))).toMatchObject({
        code: 'network',
      });
    });
  });

  describe('confirmPasswordReset', () => {
    it('accepts any token, as there are no real links', async () => {
      await expect(service.confirmPasswordReset('any-token', 'NewSecret456')).resolves.toBeUndefined();
    });

    it.each([FAKE_INVALID_RESET_TOKEN, '', '   '])('fails on purpose for the token %p', async (token) => {
      expect(await failureOf(service.confirmPasswordReset(token, 'NewSecret456'))).toMatchObject({
        code: 'invalidResetToken',
      });
    });
  });

  describe('signOut', () => {
    it('succeeds', async () => {
      await expect(service.signOut('any-token')).resolves.toBeUndefined();
    });
  });

  describe('delay', () => {
    beforeEach(() => jest.useFakeTimers());
    afterEach(() => jest.useRealTimers());

    it('takes as long as it was told to, so loading states can be seen', async () => {
      const slow = createFakeAuthService({ delayMs: 700 });
      let done = false;
      const request = slow.signIn({ email: 'a@b.pl', password: 'x' }).then(() => {
        done = true;
      });

      await jest.advanceTimersByTimeAsync(699);
      expect(done).toBe(false);

      await jest.advanceTimersByTimeAsync(1);
      await request;
      expect(done).toBe(true);
    });
  });
});

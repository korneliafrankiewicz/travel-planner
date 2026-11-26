import { AuthError, type AuthResult, type AuthService, type User } from './types';

// A stand-in for the back end that does not exist yet. It keeps nothing: no accounts and no
// passwords. Any email and password are accepted, and the "token" simply carries the user
// (see below), so a session survives a restart. It is NOT secure and must be replaced by a
// real service before the app is released.
//
// To try the screens' error states, these values make it fail on purpose:
//   log in    password "wrong-password"            -> invalidCredentials
//   sign up   email "taken@example.com"            -> emailTaken
//   any call  an email starting with "offline@"    -> network
//   reset     the token "invalid-token"            -> invalidResetToken
//   any call  a token that was not made by this service -> invalidSession (getUser)

export const FAKE_WRONG_PASSWORD = 'wrong-password';
export const FAKE_TAKEN_EMAIL = 'taken@example.com';
export const FAKE_OFFLINE_EMAIL_PREFIX = 'offline@';
export const FAKE_INVALID_RESET_TOKEN = 'invalid-token';

const TOKEN_PREFIX = 'fake.';

type FakeAuthOptions = {
  // How long each call takes, so loading states can be seen. Use 0 in tests.
  delayMs?: number;
};

const wait = (ms: number): Promise<void> =>
  ms > 0 ? new Promise((resolve) => setTimeout(resolve, ms)) : Promise.resolve();

const normalizeEmail = (email: string): string => email.trim().toLowerCase();

// "anna.nowak@example.com" -> "Anna Nowak"
export const nameFromEmail = (email: string): string => {
  const words = normalizeEmail(email).split('@')[0].split(/[._-]+/).filter((word) => word !== '');
  return words.map((word) => word[0].toUpperCase() + word.slice(1)).join(' ') || email;
};

const makeToken = (user: User): string => `${TOKEN_PREFIX}${encodeURIComponent(JSON.stringify(user))}`;

const readToken = (token: string): User | null => {
  if (!token.startsWith(TOKEN_PREFIX)) {
    return null;
  }
  try {
    const value: unknown = JSON.parse(decodeURIComponent(token.slice(TOKEN_PREFIX.length)));
    if (typeof value !== 'object' || value === null) {
      return null;
    }
    const { id, name, email } = value as Record<string, unknown>;
    return typeof id === 'string' && typeof name === 'string' && typeof email === 'string'
      ? { id, name, email }
      : null;
  } catch {
    return null;
  }
};

const failIfOffline = (email: string) => {
  if (normalizeEmail(email).startsWith(FAKE_OFFLINE_EMAIL_PREFIX)) {
    throw new AuthError('network');
  }
};

const makeUser = (name: string, email: string): User => {
  const normalized = normalizeEmail(email);
  return { id: `fake-user-${normalized}`, name, email: normalized };
};

export const createFakeAuthService = ({ delayMs = 0 }: FakeAuthOptions = {}): AuthService => ({
  signIn: async ({ email, password }): Promise<AuthResult> => {
    await wait(delayMs);
    failIfOffline(email);
    if (normalizeEmail(email) === '' || password === '' || password === FAKE_WRONG_PASSWORD) {
      throw new AuthError('invalidCredentials');
    }
    const user = makeUser(nameFromEmail(email), email);
    return { token: makeToken(user), user };
  },

  signUp: async ({ name, email }): Promise<AuthResult> => {
    await wait(delayMs);
    failIfOffline(email);
    if (normalizeEmail(email) === FAKE_TAKEN_EMAIL) {
      throw new AuthError('emailTaken');
    }
    const user = makeUser(name.trim(), email);
    return { token: makeToken(user), user };
  },

  signOut: async (): Promise<void> => {
    await wait(delayMs);
  },

  getUser: async (token): Promise<User> => {
    await wait(delayMs);
    const user = readToken(token);
    if (user === null) {
      throw new AuthError('invalidSession');
    }
    return user;
  },

  requestPasswordReset: async (email): Promise<void> => {
    await wait(delayMs);
    failIfOffline(email);
  },

  confirmPasswordReset: async (token): Promise<void> => {
    await wait(delayMs);
    if (token.trim() === '' || token === FAKE_INVALID_RESET_TOKEN) {
      throw new AuthError('invalidResetToken');
    }
  },
});

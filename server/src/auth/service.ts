import type { Config } from '../config.js';
import type { Database } from '../db/database.js';
import { HttpError } from '../errors.js';
import type { Mailer } from '../mail/mailer.js';
import { hashPassword, needsRehash, paramsFor, verifyPassword } from './password.js';
import * as repository from './repository.js';
import type { LoginInput, PublicUser, RegisterInput } from './schemas.js';
import { generateToken, hashToken } from './tokens.js';

type Log = { error: (details: unknown, message: string) => void };

export type AuthServiceDeps = {
  db: Database;
  config: Config;
  mailer: Mailer;
  log: Log;
  // The clock, so tests can move time.
  now: () => Date;
};

const MS_PER_MINUTE = 60_000;
const MS_PER_DAY = 24 * 60 * MS_PER_MINUTE;

const toPublicUser = (user: { id: string; name: string; email: string }): PublicUser => ({
  id: user.id,
  name: user.name,
  email: user.email,
});

export type Session = { token: string; user: PublicUser };

// The rules of accounts: who may sign up and log in, how sessions start and end, and how a
// password is reset. The HTTP side (routes.ts) only turns requests into calls of this.
export const createAuthService = ({ db, config, mailer, log, now }: AuthServiceDeps) => {
  const params = paramsFor(config.SCRYPT_N);
  // A hash to compare against when the email has no account, so that a log in for an unknown
  // address takes as long as one for a known address and does not give the answer away.
  let decoyHash: Promise<string> | undefined;
  const decoy = () => (decoyHash ??= hashPassword(generateToken(), params));

  // Password reset emails are sent after the answer was given (see requestPasswordReset), so
  // the work is tracked and `settled` can wait for it.
  const pending = new Set<Promise<void>>();

  const startSession = async (user: { id: string; name: string; email: string }): Promise<Session> => {
    const token = generateToken();
    await repository.createSession(db, {
      userId: user.id,
      tokenHash: hashToken(token),
      expiresAt: new Date(now().getTime() + config.SESSION_TTL_DAYS * MS_PER_DAY),
    });
    return { token, user: toPublicUser(user) };
  };

  const emailTaken = () => new HttpError(409, 'emailTaken', 'An account with this email already exists');

  return {
    register: async (input: RegisterInput): Promise<Session> => {
      if ((await repository.findUserByEmail(db, input.email)) !== null) {
        throw emailTaken();
      }
      const passwordHash = await hashPassword(input.password, params);
      try {
        const user = await repository.createUser(db, {
          email: input.email,
          name: input.name,
          passwordHash,
        });
        return await startSession(user);
      } catch (error) {
        // Someone registered the same address between the check above and now.
        throw repository.isUniqueViolation(error) ? emailTaken() : error;
      }
    },

    login: async (input: LoginInput): Promise<Session> => {
      const user = await repository.findUserByEmail(db, input.email);
      const matches = await verifyPassword(input.password, user?.passwordHash ?? (await decoy()));
      // The same answer for an unknown address and a wrong password.
      if (user === null || !matches) {
        throw new HttpError(401, 'invalidCredentials', 'Wrong email or password');
      }
      // Raise the cost of a hash that was made with older, weaker settings.
      if (needsRehash(user.passwordHash, params)) {
        await repository.updatePasswordHash(db, user.id, await hashPassword(input.password, params), now());
      }
      return startSession(user);
    },

    // Ends the session of a token. Nothing happens for a token that is unknown.
    logout: async (token: string): Promise<void> => {
      await repository.deleteSession(db, hashToken(token));
    },

    // The user a token belongs to; rejects for a token that is unknown or has expired.
    getSessionUser: async (token: string): Promise<PublicUser> => {
      const user = await repository.findUserBySessionHash(db, hashToken(token), now());
      if (user === null) {
        throw new HttpError(401, 'invalidSession', 'The session is not valid');
      }
      return toPublicUser(user);
    },

    // Starts a password reset. It answers at once and does the work afterwards, whether or not
    // the address has an account, so neither the answer nor its timing tells.
    requestPasswordReset: (email: string): void => {
      const job = (async () => {
        const user = await repository.findUserByEmail(db, email);
        if (user === null) {
          return;
        }
        const token = generateToken();
        await repository.createPasswordReset(db, {
          userId: user.id,
          tokenHash: hashToken(token),
          expiresAt: new Date(now().getTime() + config.RESET_TTL_MINUTES * MS_PER_MINUTE),
        });
        const separator = config.PASSWORD_RESET_URL.includes('?') ? '&' : '?';
        await mailer.sendPasswordReset(
          { email: user.email, name: user.name },
          `${config.PASSWORD_RESET_URL}${separator}token=${encodeURIComponent(token)}`,
        );
      })()
        .catch((error: unknown) => log.error({ err: error }, 'Could not process a password reset request'))
        .finally(() => pending.delete(job));
      pending.add(job);
    },

    // Chooses a new password with a reset token. The token works once. Every session of the user
    // ends, so whoever had the old password is logged out.
    confirmPasswordReset: async (token: string, password: string): Promise<void> => {
      const passwordHash = await hashPassword(password, params);
      await db.transaction(async (transaction) => {
        const userId = await repository.consumePasswordReset(transaction, hashToken(token), now());
        if (userId === null) {
          throw new HttpError(400, 'invalidResetToken', 'The reset link is not valid or has expired');
        }
        await repository.updatePasswordHash(transaction, userId, passwordHash, now());
        await repository.deleteSessionsOfUser(transaction, userId);
      });
    },

    // Removes sessions and reset tokens that can no longer be used.
    purgeExpired: async (): Promise<void> => {
      await repository.deleteExpiredSessions(db, now());
      await repository.deleteExpiredPasswordResets(db, now());
    },

    // Resolves when the work that was started after an answer has finished.
    settled: async (): Promise<void> => {
      await Promise.all([...pending]);
    },
  };
};

export type AuthService = ReturnType<typeof createAuthService>;

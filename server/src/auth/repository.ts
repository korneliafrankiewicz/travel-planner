import type { Queryable } from '../db/database.js';

// All the SQL of accounts, sessions and password resets. Values always go in as parameters.

export type UserRecord = {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
};

type UserRow = { id: string; email: string; name: string; password_hash: string };

const toUser = (row: UserRow): UserRecord => ({
  id: row.id,
  email: row.email,
  name: row.name,
  passwordHash: row.password_hash,
});

const UNIQUE_VIOLATION = '23505';

export const isUniqueViolation = (error: unknown): boolean =>
  typeof error === 'object' && error !== null && (error as { code?: unknown }).code === UNIQUE_VIOLATION;

export const findUserByEmail = async (db: Queryable, email: string): Promise<UserRecord | null> => {
  const rows = await db.query<UserRow>(
    'SELECT id, email, name, password_hash FROM users WHERE email = $1',
    [email],
  );
  return rows[0] === undefined ? null : toUser(rows[0]);
};

export type NewUser = { email: string; name: string; passwordHash: string };

// Throws a database error with the code 23505 (see `isUniqueViolation`) when the email is taken.
export const createUser = async (db: Queryable, user: NewUser): Promise<UserRecord> => {
  const rows = await db.query<UserRow>(
    `INSERT INTO users (email, name, password_hash) VALUES ($1, $2, $3)
     RETURNING id, email, name, password_hash`,
    [user.email, user.name, user.passwordHash],
  );
  return toUser(rows[0]!);
};

export const updatePasswordHash = async (
  db: Queryable,
  userId: string,
  passwordHash: string,
  now: Date,
): Promise<void> => {
  await db.query('UPDATE users SET password_hash = $2, updated_at = $3 WHERE id = $1', [
    userId,
    passwordHash,
    now,
  ]);
};

export const createSession = async (
  db: Queryable,
  session: { userId: string; tokenHash: string; expiresAt: Date },
): Promise<void> => {
  await db.query('INSERT INTO sessions (user_id, token_hash, expires_at) VALUES ($1, $2, $3)', [
    session.userId,
    session.tokenHash,
    session.expiresAt,
  ]);
};

// The user a session token belongs to, or null when the token is unknown or has expired.
export const findUserBySessionHash = async (
  db: Queryable,
  tokenHash: string,
  now: Date,
): Promise<Omit<UserRecord, 'passwordHash'> | null> => {
  const rows = await db.query<Omit<UserRow, 'password_hash'>>(
    `SELECT users.id, users.email, users.name
       FROM sessions JOIN users ON users.id = sessions.user_id
      WHERE sessions.token_hash = $1 AND sessions.expires_at > $2`,
    [tokenHash, now],
  );
  const row = rows[0];
  return row === undefined ? null : { id: row.id, email: row.email, name: row.name };
};

export const deleteSession = async (db: Queryable, tokenHash: string): Promise<void> => {
  await db.query('DELETE FROM sessions WHERE token_hash = $1', [tokenHash]);
};

export const deleteSessionsOfUser = async (db: Queryable, userId: string): Promise<void> => {
  await db.query('DELETE FROM sessions WHERE user_id = $1', [userId]);
};

export const deleteExpiredSessions = async (db: Queryable, now: Date): Promise<void> => {
  await db.query('DELETE FROM sessions WHERE expires_at <= $1', [now]);
};

// Only the newest reset link of a user works: asking again cancels the one before.
export const createPasswordReset = async (
  db: Queryable,
  reset: { userId: string; tokenHash: string; expiresAt: Date },
): Promise<void> => {
  await db.query('DELETE FROM password_resets WHERE user_id = $1 AND used_at IS NULL', [reset.userId]);
  await db.query('INSERT INTO password_resets (user_id, token_hash, expires_at) VALUES ($1, $2, $3)', [
    reset.userId,
    reset.tokenHash,
    reset.expiresAt,
  ]);
};

// Uses up a reset token. Returns the user it was made for, or null when it is unknown, already
// used or expired. It is one statement, so two requests with the same token cannot both succeed.
export const consumePasswordReset = async (
  db: Queryable,
  tokenHash: string,
  now: Date,
): Promise<string | null> => {
  const rows = await db.query<{ user_id: string }>(
    `UPDATE password_resets SET used_at = $2
      WHERE token_hash = $1 AND used_at IS NULL AND expires_at > $2
      RETURNING user_id`,
    [tokenHash, now],
  );
  return rows[0]?.user_id ?? null;
};

export const deleteExpiredPasswordResets = async (db: Queryable, now: Date): Promise<void> => {
  await db.query('DELETE FROM password_resets WHERE expires_at <= $1 OR used_at IS NOT NULL', [now]);
};

import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { createPgliteDatabase, type Database } from '../db/database.js';
import { migrate } from '../db/migrate.js';
import * as repository from './repository.js';

let db: Database;

beforeAll(async () => {
  db = await createPgliteDatabase();
  await migrate(db);
});

afterAll(async () => {
  await db.close();
});

beforeEach(async () => {
  await db.query('DELETE FROM users');
});

const noon = new Date('2026-12-01T12:00:00.000Z');
const minutes = (count: number) => new Date(noon.getTime() + count * 60_000);

const newUser = (email = 'anna@example.com') =>
  repository.createUser(db, { email, name: 'Anna', passwordHash: 'scrypt$hash' });

describe('users', () => {
  it('creates a user and finds it by email', async () => {
    const created = await newUser();

    expect(created).toMatchObject({ email: 'anna@example.com', name: 'Anna', passwordHash: 'scrypt$hash' });
    expect(created.id).toMatch(/^[0-9a-f-]{36}$/);
    expect(await repository.findUserByEmail(db, 'anna@example.com')).toEqual(created);
  });

  it('finds nobody for an unknown email', async () => {
    expect(await repository.findUserByEmail(db, 'nobody@example.com')).toBeNull();
  });

  it('recognises the error of an email that is taken', async () => {
    await newUser();

    const error = await newUser().catch((caught: unknown) => caught);

    expect(repository.isUniqueViolation(error)).toBe(true);
  });

  it.each([new Error('boom'), null, undefined, 'text', { code: '12345' }])(
    'does not mistake %p for an email that is taken',
    (error) => {
      expect(repository.isUniqueViolation(error)).toBe(false);
    },
  );

  it('looks the email up with a value, never with SQL: a quote in it is just text', async () => {
    await newUser();
    expect(await repository.findUserByEmail(db, "' OR '1'='1")).toBeNull();
    expect(await repository.findUserByEmail(db, "anna@example.com' --")).toBeNull();
  });

  it('replaces the password hash', async () => {
    const user = await newUser();
    await repository.updatePasswordHash(db, user.id, 'scrypt$new', noon);
    expect((await repository.findUserByEmail(db, user.email))?.passwordHash).toBe('scrypt$new');
  });
});

describe('sessions', () => {
  it('finds the user of a live session', async () => {
    const user = await newUser();
    await repository.createSession(db, { userId: user.id, tokenHash: 'h1', expiresAt: minutes(10) });

    expect(await repository.findUserBySessionHash(db, 'h1', noon)).toEqual({
      id: user.id,
      email: user.email,
      name: user.name,
    });
  });

  it('never returns the password hash with the user of a session', async () => {
    const user = await newUser();
    await repository.createSession(db, { userId: user.id, tokenHash: 'h1', expiresAt: minutes(10) });

    const found = await repository.findUserBySessionHash(db, 'h1', noon);

    expect(found).not.toHaveProperty('passwordHash');
  });

  it('finds nobody for an unknown token', async () => {
    expect(await repository.findUserBySessionHash(db, 'unknown', noon)).toBeNull();
  });

  it('is alive up to the moment it expires, and not at that moment', async () => {
    const user = await newUser();
    await repository.createSession(db, { userId: user.id, tokenHash: 'h1', expiresAt: minutes(10) });

    expect(await repository.findUserBySessionHash(db, 'h1', new Date(minutes(10).getTime() - 1))).not.toBeNull();
    expect(await repository.findUserBySessionHash(db, 'h1', minutes(10))).toBeNull();
    expect(await repository.findUserBySessionHash(db, 'h1', minutes(11))).toBeNull();
  });

  it('deletes one session, or all the sessions of a user, or only the expired ones', async () => {
    const anna = await newUser();
    const jan = await newUser('jan@example.com');
    for (const [userId, tokenHash, expiresAt] of [
      [anna.id, 'a1', minutes(10)],
      [anna.id, 'a2', minutes(10)],
      [anna.id, 'a3', minutes(-5)],
      [jan.id, 'j1', minutes(10)],
    ] as const) {
      await repository.createSession(db, { userId, tokenHash, expiresAt });
    }
    const left = async () =>
      (await db.query<{ token_hash: string }>('SELECT token_hash FROM sessions ORDER BY token_hash')).map(
        (row) => row.token_hash,
      );

    await repository.deleteExpiredSessions(db, noon);
    expect(await left()).toEqual(['a1', 'a2', 'j1']);

    await repository.deleteSession(db, 'a1');
    expect(await left()).toEqual(['a2', 'j1']);

    await repository.deleteSessionsOfUser(db, anna.id);
    expect(await left()).toEqual(['j1']);
  });
});

describe('password resets', () => {
  it('uses a token once', async () => {
    const user = await newUser();
    await repository.createPasswordReset(db, { userId: user.id, tokenHash: 'r1', expiresAt: minutes(60) });

    expect(await repository.consumePasswordReset(db, 'r1', noon)).toBe(user.id);
    expect(await repository.consumePasswordReset(db, 'r1', noon)).toBeNull();
  });

  it('refuses an unknown token and an expired one', async () => {
    const user = await newUser();
    await repository.createPasswordReset(db, { userId: user.id, tokenHash: 'r1', expiresAt: minutes(60) });

    expect(await repository.consumePasswordReset(db, 'unknown', noon)).toBeNull();
    expect(await repository.consumePasswordReset(db, 'r1', minutes(60))).toBeNull();
  });

  it('cancels the link before when a new one is asked for', async () => {
    const user = await newUser();
    await repository.createPasswordReset(db, { userId: user.id, tokenHash: 'old', expiresAt: minutes(60) });
    await repository.createPasswordReset(db, { userId: user.id, tokenHash: 'new', expiresAt: minutes(60) });

    expect(await repository.consumePasswordReset(db, 'old', noon)).toBeNull();
    expect(await repository.consumePasswordReset(db, 'new', noon)).toBe(user.id);
  });

  it('lets two requests with the same token succeed only once', async () => {
    const user = await newUser();
    await repository.createPasswordReset(db, { userId: user.id, tokenHash: 'r1', expiresAt: minutes(60) });

    const results = await Promise.all([
      repository.consumePasswordReset(db, 'r1', noon),
      repository.consumePasswordReset(db, 'r1', noon),
    ]);

    expect(results.filter((result) => result !== null)).toHaveLength(1);
  });

  it('removes tokens that are expired or used', async () => {
    const user = await newUser();
    await repository.createPasswordReset(db, { userId: user.id, tokenHash: 'used', expiresAt: minutes(60) });
    await repository.consumePasswordReset(db, 'used', noon);
    await db.query("INSERT INTO password_resets (user_id, token_hash, expires_at) VALUES ($1, 'expired', $2)", [
      user.id,
      minutes(-1),
    ]);
    await db.query("INSERT INTO password_resets (user_id, token_hash, expires_at) VALUES ($1, 'live', $2)", [
      user.id,
      minutes(60),
    ]);

    await repository.deleteExpiredPasswordResets(db, noon);

    const rows = await db.query<{ token_hash: string }>('SELECT token_hash FROM password_resets');
    expect(rows.map((row) => row.token_hash)).toEqual(['live']);
  });
});

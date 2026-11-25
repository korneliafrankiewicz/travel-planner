import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { createPgliteDatabase, type Database } from './database.js';
import { migrate } from './migrate.js';

let db: Database;
let directory: string;

beforeEach(async () => {
  db = await createPgliteDatabase();
  directory = await mkdtemp(join(tmpdir(), 'migrations-'));
});

afterEach(async () => {
  await db.close();
  await rm(directory, { recursive: true, force: true });
});

const write = (name: string, sql: string) => writeFile(join(directory, name), sql);
const here = () => pathToFileURL(`${directory}/`);
const tables = async () =>
  (
    await db.query<{ table_name: string }>(
      "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name",
    )
  ).map((row) => row.table_name);

describe('migrate', () => {
  it('applies the real migrations to an empty database', async () => {
    const applied = await migrate(db);

    expect(applied).toEqual(['001_accounts.sql']);
    expect(await tables()).toEqual(['password_resets', 'schema_migrations', 'sessions', 'users']);
  });

  it('applies each file once, so starting the server again changes nothing', async () => {
    await migrate(db);
    expect(await migrate(db)).toEqual([]);
  });

  it('applies files in the order of their names, and only the new ones later', async () => {
    await write('002_second.sql', 'CREATE TABLE second (id int)');
    await write('001_first.sql', 'CREATE TABLE first (id int)');

    expect(await migrate(db, here())).toEqual(['001_first.sql', '002_second.sql']);

    await write('003_third.sql', 'CREATE TABLE third (id int)');
    expect(await migrate(db, here())).toEqual(['003_third.sql']);
    expect(await tables()).toEqual(['first', 'schema_migrations', 'second', 'third']);
  });

  it('records what it applied', async () => {
    await write('001_first.sql', 'CREATE TABLE first (id int)');
    await migrate(db, here());

    const rows = await db.query<{ name: string }>('SELECT name FROM schema_migrations');
    expect(rows.map((row) => row.name)).toEqual(['001_first.sql']);
  });

  it('runs a file with several statements', async () => {
    await write('001_many.sql', 'CREATE TABLE a (id int); CREATE TABLE b (id int); INSERT INTO a VALUES (1);');
    await migrate(db, here());
    expect(await tables()).toEqual(['a', 'b', 'schema_migrations']);
  });

  it('leaves nothing half done when a file fails, and does not record it', async () => {
    await write('001_ok.sql', 'CREATE TABLE ok (id int)');
    await write('002_broken.sql', 'CREATE TABLE half (id int); SELECT * FROM does_not_exist;');
    await write('003_later.sql', 'CREATE TABLE later (id int)');

    await expect(migrate(db, here())).rejects.toThrow();

    expect(await tables()).toEqual(['ok', 'schema_migrations']);
    const rows = await db.query<{ name: string }>('SELECT name FROM schema_migrations');
    expect(rows.map((row) => row.name)).toEqual(['001_ok.sql']);
  });

  it('ignores files that do not follow the naming rule', async () => {
    await write('001_ok.sql', 'CREATE TABLE ok (id int)');
    await write('notes.txt', 'not sql');
    await write('2_bad_number.sql', 'CREATE TABLE bad (id int)');
    await write('001_UPPER.sql', 'CREATE TABLE upper_case (id int)');

    expect(await migrate(db, here())).toEqual(['001_ok.sql']);
  });
});

describe('the accounts migration', () => {
  beforeEach(async () => {
    await migrate(db);
  });

  const addUser = (email = 'anna@example.com', name = 'Anna') =>
    db.query<{ id: string }>(
      'INSERT INTO users (email, name, password_hash) VALUES ($1, $2, $3) RETURNING id',
      [email, name, 'hash'],
    );

  it('keeps one account per address', async () => {
    await addUser();
    await expect(addUser()).rejects.toMatchObject({ code: '23505' });
  });

  it.each(['Anna@Example.com', ' anna@example.com', 'anna@example.com ', ''])(
    'refuses an address that is not trimmed and lower-case: %p',
    async (email) => {
      await expect(addUser(email)).rejects.toThrow();
    },
  );

  it.each(['', '   ', 'x'.repeat(81)])('refuses a name of the wrong length: %p', async (name) => {
    await expect(addUser('b@example.com', name)).rejects.toThrow();
  });

  it('removes the sessions and reset tokens of a deleted user', async () => {
    const [user] = await addUser();
    await db.query(
      "INSERT INTO sessions (user_id, token_hash, expires_at) VALUES ($1, 'h1', now() + interval '1 day')",
      [user!.id],
    );
    await db.query(
      "INSERT INTO password_resets (user_id, token_hash, expires_at) VALUES ($1, 'h2', now() + interval '1 day')",
      [user!.id],
    );

    await db.query('DELETE FROM users WHERE id = $1', [user!.id]);

    expect(await db.query('SELECT 1 FROM sessions')).toHaveLength(0);
    expect(await db.query('SELECT 1 FROM password_resets')).toHaveLength(0);
  });

  it('keeps one row per token hash', async () => {
    const [user] = await addUser();
    const insert = () =>
      db.query(
        "INSERT INTO sessions (user_id, token_hash, expires_at) VALUES ($1, 'same', now() + interval '1 day')",
        [user!.id],
      );
    await insert();
    await expect(insert()).rejects.toMatchObject({ code: '23505' });
  });
});

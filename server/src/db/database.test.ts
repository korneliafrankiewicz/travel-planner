import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { createPgliteDatabase } from './database.js';

let root: string;

beforeEach(async () => {
  root = await mkdtemp(join(tmpdir(), 'pglite-'));
});

afterEach(async () => {
  await rm(root, { recursive: true, force: true });
});

describe('createPgliteDatabase', () => {
  it('keeps data in memory when no folder is given', async () => {
    const db = await createPgliteDatabase();
    await db.exec('CREATE TABLE note (text text)');
    await db.query('INSERT INTO note VALUES ($1)', ['hello']);

    expect(await db.query('SELECT text FROM note')).toEqual([{ text: 'hello' }]);
    await db.close();
  });

  it('creates the folders above the database folder when they are missing, as on a fresh checkout', async () => {
    // Neither `.data` nor `pglite` exists yet.
    const directory = join(root, '.data', 'pglite');

    const db = await createPgliteDatabase(directory);

    expect(await db.query('SELECT 1 AS one')).toEqual([{ one: 1 }]);
    await db.close();
  });

  it('works with a folder that is nested several levels deep', async () => {
    const db = await createPgliteDatabase(join(root, 'a', 'b', 'c', 'pglite'));
    expect(await db.query('SELECT 1 AS one')).toEqual([{ one: 1 }]);
    await db.close();
  });

  it('keeps the data when the database is closed and opened again', async () => {
    const directory = join(root, '.data', 'pglite');
    const first = await createPgliteDatabase(directory);
    await first.exec('CREATE TABLE note (text text)');
    await first.query('INSERT INTO note VALUES ($1)', ['kept']);
    await first.close();

    const second = await createPgliteDatabase(directory);

    expect(await second.query('SELECT text FROM note')).toEqual([{ text: 'kept' }]);
    await second.close();
  });

  it('works when the folder already exists', async () => {
    const directory = join(root, 'pglite');
    await (await createPgliteDatabase(directory)).close();

    const db = await createPgliteDatabase(directory);

    expect(await db.query('SELECT 1 AS one')).toEqual([{ one: 1 }]);
    await db.close();
  });

  it('rolls a transaction back when it throws', async () => {
    const db = await createPgliteDatabase();
    await db.exec('CREATE TABLE note (text text)');

    await expect(
      db.transaction(async (transaction) => {
        await transaction.query('INSERT INTO note VALUES ($1)', ['lost']);
        throw new Error('stop');
      }),
    ).rejects.toThrow('stop');

    expect(await db.query('SELECT text FROM note')).toEqual([]);
    await db.close();
  });
});

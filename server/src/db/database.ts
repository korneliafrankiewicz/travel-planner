import { mkdir } from 'node:fs/promises';
import { dirname } from 'node:path';

import { PGlite } from '@electric-sql/pglite';
import pg from 'pg';

// A very small view of a SQL database, so the rest of the server does not depend on one driver.
// There are two implementations: PGlite (a real PostgreSQL that runs inside Node, for
// development and tests) and `pg` (a PostgreSQL server, for production). Queries always take
// their values as parameters ($1, $2, ...), never by building the SQL text from them.

export type Row = Record<string, unknown>;

export interface Queryable {
  query<T extends Row = Row>(sql: string, params?: readonly unknown[]): Promise<T[]>;
  // Runs several statements at once, without parameters. Used by the migrations.
  exec(sql: string): Promise<void>;
}

export interface Database extends Queryable {
  // Runs `work` in a transaction: it is committed when `work` resolves and rolled back when it
  // throws.
  transaction<T>(work: (transaction: Queryable) => Promise<T>): Promise<T>;
  close(): Promise<void>;
}

// A development and test database. Without a directory it lives in memory and is gone when the
// process ends.
export const createPgliteDatabase = async (directory?: string): Promise<Database> => {
  // PGlite creates the database folder itself but not the folders above it, and fails if they
  // are missing (on a fresh checkout there is no `.data` yet).
  if (directory !== undefined) {
    await mkdir(dirname(directory), { recursive: true });
  }
  const client = directory === undefined ? new PGlite() : new PGlite(directory);
  await client.waitReady;

  return {
    query: async <T extends Row>(sql: string, params: readonly unknown[] = []) =>
      (await client.query<T>(sql, [...params])).rows,
    exec: async (sql) => {
      await client.exec(sql);
    },
    transaction: (work) =>
      client.transaction((transaction) =>
        work({
          query: async <T extends Row>(sql: string, params: readonly unknown[] = []) =>
            (await transaction.query<T>(sql, [...params])).rows,
          exec: async (sql) => {
            await transaction.exec(sql);
          },
        }),
      ),
    close: () => client.close(),
  };
};

// A PostgreSQL server.
export const createPgDatabase = (connectionString: string): Database => {
  const pool = new pg.Pool({ connectionString });

  const queryable = (target: pg.Pool | pg.PoolClient): Queryable => ({
    query: async <T extends Row>(sql: string, params: readonly unknown[] = []) =>
      (await target.query<T>(sql, [...params])).rows,
    exec: async (sql) => {
      await target.query(sql);
    },
  });

  return {
    ...queryable(pool),
    transaction: async (work) => {
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        const result = await work(queryable(client));
        await client.query('COMMIT');
        return result;
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    },
    close: () => pool.end(),
  };
};

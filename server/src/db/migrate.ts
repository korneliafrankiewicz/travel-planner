import { readdir, readFile } from 'node:fs/promises';

import type { Database } from './database.js';

// Where the SQL files are: next to this file, both when run from `src` and from `dist`.
export const MIGRATIONS_DIRECTORY = new URL('./migrations/', import.meta.url);

const MIGRATION_FILE = /^\d{3}_[a-z0-9_]+\.sql$/;

// Applies the SQL files in `migrations/` in the order of their names, each one once. The names of
// the files that were applied are kept in the `schema_migrations` table. A file runs in a
// transaction, so a failing one leaves nothing half done. Returns the names that were applied now.
// A migration that was applied must never be edited: add a new file instead.
export const migrate = async (
  database: Database,
  directory: URL = MIGRATIONS_DIRECTORY,
): Promise<string[]> => {
  await database.exec(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      name text PRIMARY KEY,
      applied_at timestamptz NOT NULL DEFAULT now()
    )
  `);

  const applied = new Set(
    (await database.query<{ name: string }>('SELECT name FROM schema_migrations')).map(
      (row) => row.name,
    ),
  );
  const files = (await readdir(directory)).filter((file) => MIGRATION_FILE.test(file)).sort();

  const appliedNow: string[] = [];
  for (const file of files) {
    if (applied.has(file)) {
      continue;
    }
    const sql = await readFile(new URL(file, directory), 'utf8');
    await database.transaction(async (transaction) => {
      await transaction.exec(sql);
      await transaction.query('INSERT INTO schema_migrations (name) VALUES ($1)', [file]);
    });
    appliedNow.push(file);
  }
  return appliedNow;
};

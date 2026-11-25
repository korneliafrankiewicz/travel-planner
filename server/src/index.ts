import { buildApp } from './app.js';
import { loadConfig } from './config.js';
import { createPgDatabase, createPgliteDatabase } from './db/database.js';
import { migrate } from './db/migrate.js';

const PURGE_INTERVAL_MS = 60 * 60 * 1000;

const config = loadConfig();

const db =
  config.DATABASE_URL !== undefined
    ? createPgDatabase(config.DATABASE_URL)
    : await createPgliteDatabase(config.PGLITE_DIR);

const applied = await migrate(db);

const { app, auth } = await buildApp({ config, db });
if (config.DATABASE_URL === undefined) {
  app.log.warn(`Using the development database in "${config.PGLITE_DIR}". It is not for production.`);
}
if (applied.length > 0) {
  app.log.info(`Applied migrations: ${applied.join(', ')}`);
}

// Sessions and reset tokens that ran out are of no use; remove them now and then.
const purge = setInterval(() => {
  auth.purgeExpired().catch((error: unknown) => app.log.error({ err: error }, 'Purge failed'));
}, PURGE_INTERVAL_MS);
purge.unref();

const shutdown = async (signal: string) => {
  app.log.info(`${signal} received, shutting down`);
  clearInterval(purge);
  await app.close();
  await auth.settled();
  await db.close();
  process.exit(0);
};
process.on('SIGINT', () => void shutdown('SIGINT'));
process.on('SIGTERM', () => void shutdown('SIGTERM'));

await app.listen({ host: config.HOST, port: config.PORT });

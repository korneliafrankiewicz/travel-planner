import { buildApp, type BuiltApp } from '../app.js';
import { loadConfig, type Config } from '../config.js';
import { createPgliteDatabase, type Database } from '../db/database.js';
import { migrate } from '../db/migrate.js';
import type { Mailer, Recipient } from '../mail/mailer.js';

// A server for tests: an in-memory database with the real migrations, a mailer that records what
// it was asked to send, and a clock the test can move. No network port is opened; requests go
// through `app.inject`.

export type SentReset = { to: Recipient; resetUrl: string; token: string };

export type TestApp = BuiltApp & {
  config: Config;
  db: Database;
  sentResets: SentReset[];
  // Every line the server logged, when the test asked to capture the log.
  logs: string[];
  // Moves the test clock forward.
  advance: (milliseconds: number) => void;
  clock: { now: Date };
  close: () => Promise<void>;
};

type Overrides = Record<string, string>;

// Starting a database takes a moment, so a test file shares one and each test starts from empty
// tables. Call `closeTestDatabase` after the last test of the file.
let sharedDatabase: Promise<Database> | undefined;

const getTestDatabase = (): Promise<Database> => {
  sharedDatabase ??= (async () => {
    const database = await createPgliteDatabase();
    await migrate(database);
    return database;
  })();
  return sharedDatabase;
};

export const closeTestDatabase = async (): Promise<void> => {
  if (sharedDatabase !== undefined) {
    const database = await sharedDatabase;
    sharedDatabase = undefined;
    await database.close();
  }
};

export const testConfig = (overrides: Overrides = {}): Config =>
  loadConfig({ NODE_ENV: 'test', SCRYPT_N: '16', LOG_LEVEL: 'silent', ...overrides });

type TestAppOptions = {
  // Turns the log on and collects it in `logs`.
  captureLogs?: boolean;
  // Replaces the mailer that records the emails.
  mailer?: Mailer;
};

export const createTestApp = async (
  overrides: Overrides = {},
  { captureLogs = false, mailer: customMailer }: TestAppOptions = {},
): Promise<TestApp> => {
  const config = testConfig(captureLogs ? { LOG_LEVEL: 'info', ...overrides } : overrides);
  const db = await getTestDatabase();
  // Sessions and resets go with their users.
  await db.query('TRUNCATE users CASCADE');

  const clock = { now: new Date('2026-12-01T12:00:00.000Z') };
  const sentResets: SentReset[] = [];
  const logs: string[] = [];
  const recordingMailer: Mailer = {
    sendPasswordReset: async (to, resetUrl) => {
      const token = new URL(resetUrl).searchParams.get('token') ?? '';
      sentResets.push({ to, resetUrl, token });
    },
  };

  const built = await buildApp({
    config,
    db,
    mailer: customMailer ?? recordingMailer,
    now: () => new Date(clock.now),
    logger: captureLogs,
    logStream: { write: (line) => void logs.push(line) },
  });
  await built.app.ready();

  return {
    ...built,
    config,
    db,
    sentResets,
    logs,
    clock,
    advance: (milliseconds) => {
      clock.now = new Date(clock.now.getTime() + milliseconds);
    },
    close: async () => {
      await built.app.close();
      await built.auth.settled();
    },
  };
};

export const validRegistration = {
  name: 'Anna Nowak',
  email: 'anna@example.com',
  password: 'Secret123',
};

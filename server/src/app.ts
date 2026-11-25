import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import Fastify, { type FastifyInstance } from 'fastify';

import { registerAuthRoutes } from './auth/routes.js';
import { createAuthService, type AuthService } from './auth/service.js';
import type { Config } from './config.js';
import type { Database } from './db/database.js';
import { HttpError, toErrorBody, type ErrorCode } from './errors.js';
import { createConsoleMailer, type Mailer } from './mail/mailer.js';

const MAX_BODY_BYTES = 10 * 1024;
// A request limit for everything; the routes that matter most have stricter ones.
const GLOBAL_LIMIT = { max: 100, timeWindow: '1 minute' };

export type AppOptions = {
  config: Config;
  db: Database;
  // Without one, development uses the console mailer.
  mailer?: Mailer;
  // The clock, so tests can move time.
  now?: () => Date;
  // Tests turn the log off.
  logger?: boolean;
  // Where the log goes instead of the standard output; tests use it to look at what is logged.
  logStream?: { write: (line: string) => void };
};

// The server and the account rules it uses. A plain object, because a Fastify instance has a
// `then` method: returning one from an async function would unwrap it and lose anything added.
export type BuiltApp = { app: FastifyInstance; auth: AuthService };

const codeForStatus = (statusCode: number): ErrorCode => {
  switch (statusCode) {
    case 404:
      return 'notFound';
    case 413:
      return 'payloadTooLarge';
    case 429:
      return 'rateLimited';
    default:
      return 'validation';
  }
};

// Builds the server without starting it, so tests can call it directly.
export const buildApp = async ({
  config,
  db,
  mailer,
  now = () => new Date(),
  logger = true,
  logStream,
}: AppOptions): Promise<BuiltApp> => {
  const app = Fastify({
    // The log never contains credentials: the headers that carry them are removed, and request
    // bodies (which hold passwords) are not logged at all.
    logger: logger
      ? {
          level: config.LOG_LEVEL,
          redact: { paths: ['req.headers.authorization', 'req.headers.cookie'], remove: true },
          ...(logStream !== undefined ? { stream: logStream } : {}),
        }
      : false,
    trustProxy: config.TRUST_PROXY,
    bodyLimit: MAX_BODY_BYTES,
  });

  await app.register(helmet);
  await app.register(cors, {
    // Phones and simulators do not use CORS. Only the listed web origins may call the API.
    origin: config.CORS_ORIGINS.length > 0 ? config.CORS_ORIGINS : false,
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Authorization', 'Content-Type'],
  });
  await app.register(rateLimit, { global: true, ...GLOBAL_LIMIT });

  // Answers hold tokens, so nothing may be kept in a cache.
  app.addHook('onSend', async (_request, reply) => {
    reply.header('Cache-Control', 'no-store');
  });

  app.setNotFoundHandler((_request, reply) => {
    reply.code(404).send(toErrorBody(new HttpError(404, 'notFound', 'There is nothing here')));
  });

  app.setErrorHandler((error, request, reply) => {
    if (error instanceof HttpError) {
      return reply.code(error.statusCode).send(toErrorBody(error));
    }
    const statusCode = (error as { statusCode?: number }).statusCode;
    // Problems with the request itself that Fastify and its plugins found (invalid JSON, a body
    // that is too large, too many requests).
    if (statusCode !== undefined && statusCode >= 400 && statusCode < 500) {
      const message =
        statusCode === 429
          ? 'Too many requests. Try again later.'
          : statusCode === 413
            ? 'The request is too large'
            : statusCode === 404
              ? 'There is nothing here'
              : 'The request is not valid';
      return reply
        .code(statusCode)
        .send(toErrorBody(new HttpError(statusCode, codeForStatus(statusCode), message)));
    }
    // A bug or a failure of the database. Log it, but tell the caller nothing about it.
    request.log.error({ err: error }, 'Unhandled error');
    return reply
      .code(500)
      .send(toErrorBody(new HttpError(500, 'internal', 'Something went wrong on the server')));
  });

  const auth = createAuthService({
    db,
    config,
    mailer: mailer ?? createConsoleMailer(app.log),
    log: app.log,
    now,
  });
  registerAuthRoutes(app, auth);

  // For load balancers: is the server up, and can it reach its database?
  app.get('/health', { config: { rateLimit: false } }, async (_request, reply) => {
    try {
      await db.query('SELECT 1');
      return { status: 'ok' };
    } catch {
      return reply.code(503).send({ status: 'unavailable' });
    }
  });

  return { app, auth };
};

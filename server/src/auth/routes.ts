import type { FastifyInstance, FastifyRequest } from 'fastify';
import type { z } from 'zod';

import { HttpError, type FieldProblem } from '../errors.js';
import {
  loginSchema,
  passwordResetConfirmSchema,
  passwordResetSchema,
  registerSchema,
  type PublicUser,
} from './schemas.js';
import type { AuthService } from './service.js';

declare module 'fastify' {
  interface FastifyRequest {
    // Set by `requireSession` on the routes that need a logged-in user.
    user: PublicUser | null;
    // The token of the session, set together with `user`.
    sessionToken: string | null;
  }
}

const BEARER = /^Bearer ([A-Za-z0-9_-]{1,200})$/i;

// Checks a request body, and answers with a 400 that names each field that is wrong.
const parseBody = <Schema extends z.ZodType>(schema: Schema, body: unknown): z.output<Schema> => {
  const result = schema.safeParse(body);
  if (result.success) {
    return result.data;
  }
  // One problem per field is enough to fix it; the first one found is the most basic.
  const problems = new Map<string, FieldProblem>();
  for (const issue of result.error.issues) {
    const field = issue.path.join('.') || 'body';
    if (!problems.has(field)) {
      problems.set(field, { field, message: issue.message });
    }
  }
  const details = [...problems.values()];
  throw new HttpError(400, 'validation', 'The request is not valid', details);
};

// Limits per client address and per minute. Guessing passwords and creating accounts are the
// things worth slowing down.
const limits = {
  register: { max: 5, timeWindow: '1 minute' },
  login: { max: 10, timeWindow: '1 minute' },
  passwordReset: { max: 5, timeWindow: '1 minute' },
  passwordResetConfirm: { max: 10, timeWindow: '1 minute' },
};

export const registerAuthRoutes = (app: FastifyInstance, service: AuthService): void => {
  app.decorateRequest('user', null);
  app.decorateRequest('sessionToken', null);

  // Needs `Authorization: Bearer <token>` with a token that belongs to a live session.
  const requireSession = async (request: FastifyRequest): Promise<void> => {
    const match = BEARER.exec(request.headers.authorization ?? '');
    if (match === null) {
      throw new HttpError(401, 'invalidSession', 'The session is not valid');
    }
    const token = match[1]!;
    request.user = await service.getSessionUser(token);
    request.sessionToken = token;
  };

  app.post('/v1/auth/register', { config: { rateLimit: limits.register } }, async (request, reply) => {
    const session = await service.register(parseBody(registerSchema, request.body));
    return reply.code(201).send(session);
  });

  app.post('/v1/auth/login', { config: { rateLimit: limits.login } }, async (request) =>
    service.login(parseBody(loginSchema, request.body)),
  );

  app.post('/v1/auth/logout', { preHandler: requireSession }, async (request, reply) => {
    await service.logout(request.sessionToken!);
    return reply.code(204).send();
  });

  app.get('/v1/auth/me', { preHandler: requireSession }, async (request) => ({ user: request.user }));

  // Always 202 with an empty body, whether or not the address has an account.
  app.post(
    '/v1/auth/password-reset',
    { config: { rateLimit: limits.passwordReset } },
    async (request, reply) => {
      service.requestPasswordReset(parseBody(passwordResetSchema, request.body).email);
      return reply.code(202).send({});
    },
  );

  app.post(
    '/v1/auth/password-reset/confirm',
    { config: { rateLimit: limits.passwordResetConfirm } },
    async (request, reply) => {
      const { token, password } = parseBody(passwordResetConfirmSchema, request.body);
      await service.confirmPasswordReset(token, password);
      return reply.code(204).send();
    },
  );
};

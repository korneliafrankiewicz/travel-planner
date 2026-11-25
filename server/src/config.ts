import { z } from 'zod';

// Everything the server reads from the environment, checked once at start-up. A wrong value
// stops the server with a clear message instead of failing later.

const MIN_PRODUCTION_SCRYPT_N = 2 ** 17;
const MIN_SCRYPT_N = 2 ** 14;

const booleanFromText = z
  .enum(['true', 'false'])
  .transform((value) => value === 'true');

const isPowerOfTwo = (value: number): boolean => Number.isInteger(Math.log2(value));

const envSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    HOST: z.string().min(1).default('127.0.0.1'),
    PORT: z.coerce.number().int().min(0).max(65535).default(3000),
    DATABASE_URL: z
      .string()
      .optional()
      .transform((value) => (value === undefined || value.trim() === '' ? undefined : value.trim())),
    PGLITE_DIR: z.string().min(1).default('.data/pglite'),
    CORS_ORIGINS: z
      .string()
      .default('')
      .transform((value) =>
        value
          .split(',')
          .map((origin) => origin.trim())
          .filter((origin) => origin !== ''),
      ),
    TRUST_PROXY: booleanFromText.default(false),
    SESSION_TTL_DAYS: z.coerce.number().int().min(1).max(365).default(30),
    RESET_TTL_MINUTES: z.coerce.number().int().min(5).max(1440).default(60),
    SCRYPT_N: z.coerce.number().int().default(MIN_PRODUCTION_SCRYPT_N),
    PASSWORD_RESET_URL: z.string().min(1).default('travel-planner://reset-password'),
    MAIL_TRANSPORT: z.enum(['console']).default('console'),
    LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']).default('info'),
  })
  .superRefine((env, context) => {
    if (!isPowerOfTwo(env.SCRYPT_N)) {
      context.addIssue({ code: 'custom', path: ['SCRYPT_N'], message: 'must be a power of two' });
    }
    // A cheap hash is only acceptable in tests, where hundreds of passwords are hashed.
    const minimum = env.NODE_ENV === 'test' ? 2 ** 4 : MIN_SCRYPT_N;
    if (env.SCRYPT_N < minimum) {
      context.addIssue({ code: 'custom', path: ['SCRYPT_N'], message: `must be at least ${minimum}` });
    }
    if (env.NODE_ENV === 'production') {
      if (env.SCRYPT_N < MIN_PRODUCTION_SCRYPT_N) {
        context.addIssue({
          code: 'custom',
          path: ['SCRYPT_N'],
          message: `must be at least ${MIN_PRODUCTION_SCRYPT_N} in production`,
        });
      }
      if (env.DATABASE_URL === undefined) {
        context.addIssue({
          code: 'custom',
          path: ['DATABASE_URL'],
          message: 'is required in production (the development database must not be used)',
        });
      }
      if (env.MAIL_TRANSPORT === 'console') {
        context.addIssue({
          code: 'custom',
          path: ['MAIL_TRANSPORT'],
          message:
            '"console" only prints reset links to the log and must not be used in production; no real mail transport is connected yet',
        });
      }
      if (env.CORS_ORIGINS.some((origin) => origin === '*')) {
        context.addIssue({
          code: 'custom',
          path: ['CORS_ORIGINS'],
          message: 'must list the allowed origins, not "*"',
        });
      }
    }
  });

export type Config = z.output<typeof envSchema>;

export class ConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ConfigError';
  }
}

// Reads and checks the environment. Throws a ConfigError that lists every problem; it never
// includes the value of a setting, because some (a database URL) contain a password.
export const loadConfig = (env: Record<string, string | undefined> = process.env): Config => {
  const result = envSchema.safeParse(env);
  if (!result.success) {
    const problems = result.error.issues.map(
      (issue) => `  - ${issue.path.join('.') || 'environment'}: ${issue.message}`,
    );
    throw new ConfigError(`Invalid configuration:\n${problems.join('\n')}`);
  }
  return result.data;
};

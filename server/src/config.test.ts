import { describe, expect, it } from 'vitest';

import { ConfigError, loadConfig } from './config.js';

const production = {
  NODE_ENV: 'production',
  DATABASE_URL: 'postgres://user:secret@db.example.com:5432/app',
  MAIL_TRANSPORT: 'console',
};

const problemsOf = (env: Record<string, string>): string => {
  try {
    loadConfig(env);
  } catch (error) {
    expect(error).toBeInstanceOf(ConfigError);
    return (error as Error).message;
  }
  return '';
};

describe('loadConfig', () => {
  it('has a working default for everything', () => {
    expect(loadConfig({})).toEqual({
      NODE_ENV: 'development',
      HOST: '127.0.0.1',
      PORT: 3000,
      DATABASE_URL: undefined,
      PGLITE_DIR: '.data/pglite',
      CORS_ORIGINS: [],
      TRUST_PROXY: false,
      SESSION_TTL_DAYS: 30,
      RESET_TTL_MINUTES: 60,
      SCRYPT_N: 131072,
      PASSWORD_RESET_URL: 'travel-planner://reset-password',
      MAIL_TRANSPORT: 'console',
      LOG_LEVEL: 'info',
    });
  });

  it('listens on the local machine only unless told otherwise', () => {
    expect(loadConfig({}).HOST).toBe('127.0.0.1');
  });

  it('reads numbers and booleans from text', () => {
    const config = loadConfig({ PORT: '8080', SESSION_TTL_DAYS: '7', TRUST_PROXY: 'true' });
    expect(config).toMatchObject({ PORT: 8080, SESSION_TTL_DAYS: 7, TRUST_PROXY: true });
  });

  it('splits the allowed origins and drops empty ones', () => {
    expect(loadConfig({ CORS_ORIGINS: ' http://localhost:8081 , https://app.example.com ,,' }).CORS_ORIGINS).toEqual([
      'http://localhost:8081',
      'https://app.example.com',
    ]);
  });

  it('treats an empty DATABASE_URL as not set', () => {
    expect(loadConfig({ DATABASE_URL: '   ' }).DATABASE_URL).toBeUndefined();
  });

  it.each([
    ['PORT', 'abc'],
    ['PORT', '70000'],
    ['PORT', '-1'],
    ['NODE_ENV', 'staging'],
    ['TRUST_PROXY', 'yes'],
    ['SESSION_TTL_DAYS', '0'],
    ['SESSION_TTL_DAYS', '400'],
    ['RESET_TTL_MINUTES', '1'],
    ['LOG_LEVEL', 'loud'],
    ['MAIL_TRANSPORT', 'smtp'],
    ['SCRYPT_N', '100000'],
    ['SCRYPT_N', '1024'],
  ])('refuses %s=%s', (name, value) => {
    expect(problemsOf({ [name]: value })).toContain(name);
  });

  it('lists every problem at once', () => {
    const message = problemsOf({ PORT: 'abc', LOG_LEVEL: 'loud' });
    expect(message).toContain('PORT');
    expect(message).toContain('LOG_LEVEL');
  });

  it('never repeats a value, because a database URL holds a password', () => {
    const message = problemsOf({
      DATABASE_URL: 'postgres://user:topsecret@db.example.com/app',
      PORT: 'abc',
    });
    expect(message).toContain('PORT');
    expect(message).not.toContain('topsecret');
    expect(message).not.toContain('abc');
  });

  describe('SCRYPT_N', () => {
    it('allows a cheap hash only in tests, where many passwords are hashed', () => {
      expect(loadConfig({ NODE_ENV: 'test', SCRYPT_N: '16' }).SCRYPT_N).toBe(16);
      expect(problemsOf({ NODE_ENV: 'development', SCRYPT_N: '16' })).toContain('SCRYPT_N');
    });

    it('must be a power of two', () => {
      expect(problemsOf({ NODE_ENV: 'test', SCRYPT_N: '48' })).toContain('power of two');
    });
  });

  describe('in production', () => {
    it('cannot start yet, and the only reason is that no real mail transport exists', () => {
      // Everything else in `production` is valid, so the one problem listed is the mailer.
      const message = problemsOf(production);
      expect(message).toContain('MAIL_TRANSPORT');
      expect(message.split('\n').filter((line) => line.startsWith('  - '))).toHaveLength(1);
    });

    it('requires a database, so the development one is never used', () => {
      const { DATABASE_URL: _removed, ...withoutDatabase } = production;
      expect(problemsOf(withoutDatabase)).toContain('DATABASE_URL');
    });

    it('refuses the console mailer, which prints reset links to the log', () => {
      expect(problemsOf(production)).toContain('MAIL_TRANSPORT');
    });

    it('requires the full password hashing cost', () => {
      expect(problemsOf({ ...production, SCRYPT_N: '32768' })).toContain('SCRYPT_N');
    });

    it('refuses to allow every origin', () => {
      expect(problemsOf({ ...production, CORS_ORIGINS: '*' })).toContain('CORS_ORIGINS');
    });
  });
});

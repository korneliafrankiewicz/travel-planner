import { describe, expect, it } from 'vitest';

import { hashPassword, needsRehash, paramsFor, verifyPassword } from './password.js';

const cheap = paramsFor(16);

describe('hashPassword', () => {
  it('makes a text that carries its settings, a salt and a hash, and not the password', async () => {
    const hash = await hashPassword('Secret123', cheap);

    const parts = hash.split('$');
    expect(parts).toHaveLength(6);
    expect(parts.slice(0, 4)).toEqual(['scrypt', '16', '8', '1']);
    expect(hash).not.toContain('Secret123');
  });

  it('gives a different hash every time, because the salt is random', async () => {
    const [first, second] = await Promise.all([
      hashPassword('Secret123', cheap),
      hashPassword('Secret123', cheap),
    ]);
    expect(first).not.toBe(second);
  });

  it('works with the cost that production uses (it needs more memory than Node allows by default)', async () => {
    const hash = await hashPassword('Secret123', paramsFor(2 ** 17));
    expect(await verifyPassword('Secret123', hash)).toBe(true);
    expect(await verifyPassword('secret123', hash)).toBe(false);
  });
});

describe('verifyPassword', () => {
  it('accepts the right password and refuses any other', async () => {
    const hash = await hashPassword('Secret123', cheap);

    expect(await verifyPassword('Secret123', hash)).toBe(true);
    expect(await verifyPassword('Secret124', hash)).toBe(false);
    expect(await verifyPassword('secret123', hash)).toBe(false);
    expect(await verifyPassword('Secret123 ', hash)).toBe(false);
    expect(await verifyPassword('', hash)).toBe(false);
  });

  it('uses the settings stored in the hash, not the current ones', async () => {
    const old = await hashPassword('Secret123', paramsFor(32));
    expect(await verifyPassword('Secret123', old)).toBe(true);
  });

  it('treats the same text written in different Unicode forms as the same password', async () => {
    const composed = 'café-Secret1';
    const decomposed = 'café-Secret1';
    const hash = await hashPassword(composed, cheap);

    expect(await verifyPassword(decomposed, hash)).toBe(true);
  });

  it('copes with spaces, symbols and letters from other alphabets', async () => {
    const password = ' Zażółć gęślą jaźń 9 ✓ ';
    const hash = await hashPassword(password, cheap);

    expect(await verifyPassword(password, hash)).toBe(true);
    expect(await verifyPassword(password.trim(), hash)).toBe(false);
  });

  it.each([
    '',
    'plain-text-password',
    'scrypt$16$8$1$salt',
    'scrypt$16$8$1$c2FsdA==$short',
    'bcrypt$16$8$1$c2FsdA==$' + 'A'.repeat(88),
    'scrypt$abc$8$1$c2FsdA==$' + 'A'.repeat(88),
    'scrypt$0$8$1$c2FsdA==$' + 'A'.repeat(88),
    'scrypt$16$8$1$$' + 'A'.repeat(88),
  ])('never matches a stored value that is not a valid hash: %p', async (stored) => {
    expect(await verifyPassword('Secret123', stored)).toBe(false);
  });
});

describe('needsRehash', () => {
  it('is false for a hash made with the current settings', async () => {
    expect(needsRehash(await hashPassword('x1', cheap), cheap)).toBe(false);
  });

  it.each([
    ['a different N', paramsFor(32)],
    ['a different r', { N: 16, r: 4, p: 1 }],
    ['a different p', { N: 16, r: 8, p: 2 }],
  ])('is true for a hash made with %s', async (_name, current) => {
    expect(needsRehash(await hashPassword('x1', cheap), current)).toBe(true);
  });

  it('is true for a value that cannot be read, so it gets replaced', () => {
    expect(needsRehash('garbage', cheap)).toBe(true);
  });
});

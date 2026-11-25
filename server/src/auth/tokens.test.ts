import { describe, expect, it } from 'vitest';

import { generateToken, hashToken } from './tokens.js';

describe('generateToken', () => {
  it('is 32 random bytes written in a form that is safe in a header and a link', () => {
    const token = generateToken();
    expect(token).toMatch(/^[A-Za-z0-9_-]{43}$/);
  });

  it('is never the same twice', () => {
    const tokens = new Set(Array.from({ length: 2000 }, generateToken));
    expect(tokens.size).toBe(2000);
  });
});

describe('hashToken', () => {
  it('is the SHA-256 of the token, in hexadecimal', () => {
    // A known test value of the algorithm.
    expect(hashToken('abc')).toBe('ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
  });

  it('is always the same for the same token, and different for another', () => {
    expect(hashToken('one')).toBe(hashToken('one'));
    expect(hashToken('one')).not.toBe(hashToken('two'));
  });

  it('does not contain the token', () => {
    const token = generateToken();
    expect(hashToken(token)).not.toContain(token);
    expect(hashToken(token)).toHaveLength(64);
  });
});

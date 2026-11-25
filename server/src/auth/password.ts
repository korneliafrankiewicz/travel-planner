import { randomBytes, scrypt, timingSafeEqual } from 'node:crypto';

// Passwords are never stored. What is stored is a hash made with scrypt, a hash that is slow and
// needs a lot of memory on purpose, so guessing passwords from a stolen copy is expensive.
//
// The stored text is `scrypt$N$r$p$salt$hash` (salt and hash in base64). It carries its own
// settings, so the cost can be raised later and old hashes still work; `needsRehash` tells when
// a hash should be made again with the current settings.

export type ScryptParams = { N: number; r: number; p: number };

const KEY_LENGTH = 64;
const SALT_LENGTH = 16;
const PREFIX = 'scrypt';

// Memory needed is 128 * N * r bytes. Node refuses more than 32 MiB unless it is told, so
// allow what the settings need (with some room).
const maxMemory = ({ N, r }: ScryptParams): number => 128 * N * r * 2;

export const paramsFor = (N: number): ScryptParams => ({ N, r: 8, p: 1 });

const derive = (password: string, salt: Buffer, params: ScryptParams): Promise<Buffer> =>
  new Promise((resolve, reject) => {
    scrypt(
      password.normalize('NFKC'),
      salt,
      KEY_LENGTH,
      { N: params.N, r: params.r, p: params.p, maxmem: maxMemory(params) },
      (error, key) => (error ? reject(error) : resolve(key)),
    );
  });

export const hashPassword = async (password: string, params: ScryptParams): Promise<string> => {
  const salt = randomBytes(SALT_LENGTH);
  const key = await derive(password, salt, params);
  return [PREFIX, params.N, params.r, params.p, salt.toString('base64'), key.toString('base64')].join('$');
};

type ParsedHash = { params: ScryptParams; salt: Buffer; key: Buffer };

const parseHash = (stored: string): ParsedHash | null => {
  const parts = stored.split('$');
  if (parts.length !== 6 || parts[0] !== PREFIX) {
    return null;
  }
  const [, N, r, p, salt, key] = parts as [string, string, string, string, string, string];
  const params = { N: Number(N), r: Number(r), p: Number(p) };
  const valid = [params.N, params.r, params.p].every((value) => Number.isInteger(value) && value > 0);
  const saltBytes = Buffer.from(salt, 'base64');
  const keyBytes = Buffer.from(key, 'base64');
  if (!valid || saltBytes.length === 0 || keyBytes.length !== KEY_LENGTH) {
    return null;
  }
  return { params, salt: saltBytes, key: keyBytes };
};

// True when the password matches the stored hash. A stored value that is not a valid hash never
// matches. The comparison takes the same time whatever part of the hash is wrong.
export const verifyPassword = async (password: string, stored: string): Promise<boolean> => {
  const parsed = parseHash(stored);
  if (parsed === null) {
    return false;
  }
  const key = await derive(password, parsed.salt, parsed.params);
  return timingSafeEqual(key, parsed.key);
};

// True when a hash was made with weaker settings than the current ones (or cannot be read).
export const needsRehash = (stored: string, params: ScryptParams): boolean => {
  const parsed = parseHash(stored);
  return (
    parsed === null ||
    parsed.params.N !== params.N ||
    parsed.params.r !== params.r ||
    parsed.params.p !== params.p
  );
};

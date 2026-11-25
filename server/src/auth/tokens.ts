import { createHash, randomBytes } from 'node:crypto';

// Session tokens and password reset tokens are random: 32 bytes (256 bits) from the system's
// secure generator, so they cannot be guessed. They are shown once (to the app or in an email)
// and only a hash is stored, so a copy of the database cannot be used to act as a user. A fast
// hash is right here, unlike for passwords, because the token is not something a person chose.

export const generateToken = (): string => randomBytes(32).toString('base64url');

export const hashToken = (token: string): string => createHash('sha256').update(token).digest('hex');

import { z } from 'zod';

// What the API accepts. The rules are the same as in the app (`authSchemas.ts` there), so a
// form that the app accepts is accepted here; the server checks again because it cannot trust
// the app. Unknown fields are refused, so a typo is noticed instead of being ignored.

const MAX_NAME_LENGTH = 80;
const MAX_EMAIL_LENGTH = 254;
export const MIN_PASSWORD_LENGTH = 8;
// A limit, because hashing a password costs time and memory, and a huge one would be a way to
// make the server busy.
export const MAX_PASSWORD_LENGTH = 128;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const MAX_TOKEN_LENGTH = 200;

// Trimmed and lower-case, so one address is one account.
const email = z
  .string()
  .trim()
  .toLowerCase()
  .min(1, 'is required')
  .max(MAX_EMAIL_LENGTH, 'is too long')
  .regex(EMAIL_PATTERN, 'must be an email address');

// The rules for a new password. Passwords are never trimmed: spaces can be part of one.
const newPassword = z
  .string()
  .min(MIN_PASSWORD_LENGTH, `must be at least ${MIN_PASSWORD_LENGTH} characters`)
  .max(MAX_PASSWORD_LENGTH, `must be at most ${MAX_PASSWORD_LENGTH} characters`)
  .refine((value) => /[\p{L}]/u.test(value) && /\d/.test(value), 'must have letters and numbers');

export const registerSchema = z.strictObject({
  name: z.string().trim().min(1, 'is required').max(MAX_NAME_LENGTH, 'is too long'),
  email,
  password: newPassword,
});

// A log in does not apply the rules for a new password, so an older, weaker password keeps
// working. It still has a length limit.
export const loginSchema = z.strictObject({
  email,
  password: z.string().min(1, 'is required').max(MAX_PASSWORD_LENGTH, 'is too long'),
});

export const passwordResetSchema = z.strictObject({ email });

export const passwordResetConfirmSchema = z.strictObject({
  token: z.string().min(1, 'is required').max(MAX_TOKEN_LENGTH, 'is too long'),
  password: newPassword,
});

export type RegisterInput = z.output<typeof registerSchema>;
export type LoginInput = z.output<typeof loginSchema>;

// The part of a user the app may see. The password hash never leaves the server.
export type PublicUser = { id: string; name: string; email: string };

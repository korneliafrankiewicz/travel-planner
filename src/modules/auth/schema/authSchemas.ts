import { z } from 'zod';

import { MIN_PASSWORD_LENGTH } from '../utils/passwordStrength';

// Error messages are translation keys (in the `auth` namespace), not user-facing text.
const NAME_REQUIRED = 'errors.nameRequired';
const EMAIL_REQUIRED = 'errors.emailRequired';
const EMAIL_INVALID = 'errors.emailInvalid';
const PASSWORD_REQUIRED = 'errors.passwordRequired';
const PASSWORD_TOO_SHORT = 'errors.passwordTooShort';
const PASSWORD_TOO_WEAK = 'errors.passwordTooWeak';
const PASSWORDS_DO_NOT_MATCH = 'errors.passwordsDoNotMatch';
const TERMS_REQUIRED = 'errors.termsRequired';

export type AuthErrorKey =
  | typeof NAME_REQUIRED
  | typeof EMAIL_REQUIRED
  | typeof EMAIL_INVALID
  | typeof PASSWORD_REQUIRED
  | typeof PASSWORD_TOO_SHORT
  | typeof PASSWORD_TOO_WEAK
  | typeof PASSWORDS_DO_NOT_MATCH
  | typeof TERMS_REQUIRED;

const errorKeys: readonly string[] = [
  NAME_REQUIRED,
  EMAIL_REQUIRED,
  EMAIL_INVALID,
  PASSWORD_REQUIRED,
  PASSWORD_TOO_SHORT,
  PASSWORD_TOO_WEAK,
  PASSWORDS_DO_NOT_MATCH,
  TERMS_REQUIRED,
];

const isErrorKey = (message: string): message is AuthErrorKey => errorKeys.includes(message);

const MAX_NAME_LENGTH = 80;
const MAX_EMAIL_LENGTH = 254;
// Something, an @, something, a dot and something: enough to catch typos. Only the service can
// tell whether an address really exists.
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

// The email is trimmed and lower-cased, so "Anna@Example.com " and "anna@example.com" are the
// same address. Passwords are never trimmed or changed: spaces can be part of one.
const emailSchema = z
  .string()
  .trim()
  .min(1, { error: EMAIL_REQUIRED })
  .max(MAX_EMAIL_LENGTH, { error: EMAIL_INVALID })
  .regex(EMAIL_PATTERN, { error: EMAIL_INVALID })
  .transform((email) => email.toLowerCase());

// The rules for a new password. A log in does not apply them, because an existing password
// has to keep working even if the rules change.
const newPasswordSchema = z
  .string()
  .min(MIN_PASSWORD_LENGTH, { error: PASSWORD_TOO_SHORT })
  .refine((password) => /[A-Za-z]/.test(password) && /\d/.test(password), {
    error: PASSWORD_TOO_WEAK,
  });

const logInSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, { error: PASSWORD_REQUIRED }),
});

const signUpSchema = z
  .object({
    name: z.string().trim().min(1, { error: NAME_REQUIRED }).max(MAX_NAME_LENGTH, { error: NAME_REQUIRED }),
    email: emailSchema,
    password: newPasswordSchema,
    confirmPassword: z.string(),
    acceptTerms: z.boolean().refine((accepted) => accepted, { error: TERMS_REQUIRED }),
  })
  .superRefine((values, context) => {
    if (values.confirmPassword !== values.password) {
      context.addIssue({ code: 'custom', path: ['confirmPassword'], message: PASSWORDS_DO_NOT_MATCH });
    }
  });

const forgotPasswordSchema = z.object({ email: emailSchema });

export type LogInValues = { email: string; password: string };
export type SignUpValues = {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  acceptTerms: boolean;
};
export type ForgotPasswordValues = { email: string };

export const emptyLogInValues: LogInValues = { email: '', password: '' };
export const emptySignUpValues: SignUpValues = {
  name: '',
  email: '',
  password: '',
  confirmPassword: '',
  acceptTerms: false,
};
export const emptyForgotPasswordValues: ForgotPasswordValues = { email: '' };

export type FormResult<Data, Field extends string> =
  | { success: true; data: Data }
  | { success: false; errors: Partial<Record<Field, AuthErrorKey>> };

// Runs a schema and returns at most one error per field.
const validate = <Schema extends z.ZodType, Field extends string>(
  schema: Schema,
  values: unknown,
  fields: readonly Field[],
): FormResult<z.output<Schema>, Field> => {
  const result = schema.safeParse(values);
  if (result.success) {
    return { success: true, data: result.data };
  }
  const errors: Partial<Record<Field, AuthErrorKey>> = {};
  for (const issue of result.error.issues) {
    const field = issue.path[0];
    if (fields.includes(field as Field) && isErrorKey(issue.message)) {
      errors[field as Field] ??= issue.message;
    }
  }
  return { success: false, errors };
};

export const validateLogIn = (values: LogInValues) =>
  validate(logInSchema, values, ['email', 'password'] as const);

export const validateSignUp = (values: SignUpValues) =>
  validate(signUpSchema, values, ['name', 'email', 'password', 'confirmPassword', 'acceptTerms'] as const);

export const validateForgotPassword = (values: ForgotPasswordValues) =>
  validate(forgotPasswordSchema, values, ['email'] as const);

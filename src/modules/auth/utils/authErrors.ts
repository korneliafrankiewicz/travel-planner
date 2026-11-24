import { AuthError, type AuthErrorCode } from '@/shared/auth/types';

// Translation keys (in the `auth` namespace) for what can go wrong when the service is asked.
export type AuthFormErrorKey =
  | 'formErrors.invalidCredentials'
  | 'formErrors.emailTaken'
  | 'formErrors.network'
  | 'formErrors.unknown';

const keys: Record<AuthErrorCode, AuthFormErrorKey> = {
  invalidCredentials: 'formErrors.invalidCredentials',
  emailTaken: 'formErrors.emailTaken',
  network: 'formErrors.network',
  // A session that stopped being valid has no meaning on a log in or sign up screen.
  invalidSession: 'formErrors.unknown',
  unknown: 'formErrors.unknown',
};

// What to tell the user about a failure of the auth service. Anything that is not an
// AuthError (a bug, or a failure of the device) gets the general message.
export const toFormErrorKey = (error: unknown): AuthFormErrorKey =>
  error instanceof AuthError ? keys[error.code] : 'formErrors.unknown';

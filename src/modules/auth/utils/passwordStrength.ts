export type PasswordStrength = 'weak' | 'fair' | 'strong';

export const MIN_PASSWORD_LENGTH = 8;
const LONG_PASSWORD_LENGTH = 12;

// How strong a password looks to the user, for the meter on the sign-up screen. It is only a
// hint: whether a password is accepted is decided by the rules in `authSchemas`. Returns null
// for an empty password, when there is nothing to rate yet.
export const getPasswordStrength = (password: string): PasswordStrength | null => {
  if (password === '') {
    return null;
  }
  // A password that is too short is weak, however varied it is.
  if (password.length < MIN_PASSWORD_LENGTH) {
    return 'weak';
  }
  const points = [
    true, // long enough
    password.length >= LONG_PASSWORD_LENGTH,
    /[a-z]/.test(password) && /[A-Z]/.test(password),
    /\d/.test(password),
    /[^A-Za-z0-9]/.test(password),
  ].filter(Boolean).length;

  return points <= 2 ? 'weak' : points === 3 ? 'fair' : 'strong';
};

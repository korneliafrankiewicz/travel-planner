export type User = {
  id: string;
  name: string;
  email: string;
};

export type Credentials = {
  email: string;
  password: string;
};

export type SignUpInput = Credentials & {
  name: string;
};

// What a successful log in or sign up gives back: a token that proves the session, and the user.
export type AuthResult = {
  token: string;
  user: User;
};

export type AuthErrorCode =
  | 'invalidCredentials'
  | 'emailTaken'
  // The saved token is no longer accepted (expired, revoked or unknown).
  | 'invalidSession'
  // A password reset link that is unknown, already used or expired.
  | 'invalidResetToken'
  // Too many requests in a short time; the user has to wait.
  | 'rateLimited'
  | 'network'
  | 'unknown';

// Every failure of the auth service. Screens turn the `code` into a text for the user, so
// the message here is only for developers and never shown.
export class AuthError extends Error {
  readonly code: AuthErrorCode;

  constructor(code: AuthErrorCode, message = code) {
    super(message);
    this.name = 'AuthError';
    this.code = code;
  }
}

// What the app needs from a back end. The app only talks to this interface, so the stand-in
// can be replaced by a real service without touching a screen.
export type AuthService = {
  signIn: (credentials: Credentials) => Promise<AuthResult>;
  signUp: (input: SignUpInput) => Promise<AuthResult>;
  // Ends the session on the server. The app signs out locally even when this fails.
  signOut: (token: string) => Promise<void>;
  // Checks a saved token and gives back the user it belongs to.
  getUser: (token: string) => Promise<User>;
  // Starts a password reset. Resolves in the same way whether or not the address has an
  // account, so the answer cannot be used to find out who has one.
  requestPasswordReset: (email: string) => Promise<void>;
  // Chooses a new password with the token from the link in the reset email. The token works
  // once. Rejects with `invalidResetToken` when it is unknown, used or expired.
  confirmPasswordReset: (token: string, password: string) => Promise<void>;
};

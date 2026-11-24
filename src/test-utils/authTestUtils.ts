import { authService } from '@/shared/auth/authService';
import { useSessionStore } from '@/shared/auth/sessionStore';
import type { AuthResult, User } from '@/shared/auth/types';

// For screen tests of the auth flow. The test file must mock the service module first:
//
//   jest.mock('@/shared/auth/authService', () => ({
//     authService: { signIn: jest.fn(), signUp: jest.fn(), signOut: jest.fn(), getUser: jest.fn(), requestPasswordReset: jest.fn() },
//   }));
export const mockedAuthService = jest.mocked(authService);

export const anna: User = { id: 'u1', name: 'Anna Nowak', email: 'anna@example.com' };
export const annaResult: AuthResult = { token: 'token-1', user: anna };

// Puts the service stand-in and the session back to how an app starts when nobody is logged in.
export const resetAuth = () => {
  for (const method of Object.values(mockedAuthService)) {
    (method as jest.Mock).mockReset();
  }
  useSessionStore.setState({ status: 'signedOut', user: null });
};

// A promise the test settles by hand, to look at the screen while a request is still running.
export const deferred = <Value = void>() => {
  let resolve!: (value: Value) => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<Value>((promiseResolve, promiseReject) => {
    resolve = promiseResolve;
    reject = promiseReject;
  });
  return { promise, resolve, reject };
};

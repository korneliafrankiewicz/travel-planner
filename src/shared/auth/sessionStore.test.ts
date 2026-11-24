import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';

import { flushStorage } from '@/test-utils/storeTestUtils';

import { authService } from './authService';
import { useSessionStore } from './sessionStore';
import { clearToken, loadToken, saveToken } from './tokenStorage';
import { AuthError, type User } from './types';

jest.mock('./authService', () => ({
  authService: {
    signIn: jest.fn(),
    signUp: jest.fn(),
    signOut: jest.fn(),
    getUser: jest.fn(),
    requestPasswordReset: jest.fn(),
  },
}));

const service = jest.mocked(authService);
const secureStore = (SecureStore as unknown as { __store: Map<string, string> }).__store;

const anna: User = { id: 'u1', name: 'Anna Nowak', email: 'anna@example.com' };

const state = () => useSessionStore.getState();

const savedSession = async () => {
  const raw = await AsyncStorage.getItem('session');
  return raw === null ? null : JSON.parse(raw);
};

beforeEach(async () => {
  jest.clearAllMocks();
  secureStore.clear();
  await clearToken();
  await AsyncStorage.clear();
  useSessionStore.setState({ status: 'loading', user: null });
});

describe('restore', () => {
  it('is signed out when no session was saved, without asking the service', async () => {
    await state().restore();

    expect(state()).toMatchObject({ status: 'signedOut', user: null });
    expect(service.getUser).not.toHaveBeenCalled();
  });

  it('signs in the user that the saved token belongs to', async () => {
    await saveToken('token-1');
    service.getUser.mockResolvedValue(anna);

    await state().restore();

    expect(service.getUser).toHaveBeenCalledWith('token-1');
    expect(state()).toMatchObject({ status: 'signedIn', user: anna });
  });

  it('forgets a token that the service no longer accepts', async () => {
    await saveToken('stale');
    useSessionStore.setState({ user: anna });
    service.getUser.mockRejectedValue(new AuthError('invalidSession'));

    await state().restore();

    expect(state()).toMatchObject({ status: 'signedOut', user: null });
    expect(await loadToken()).toBeNull();
  });

  it.each([['network'], ['unknown']] as const)(
    'keeps a user that was saved on this device signed in when the service fails (%s), so the app opens offline',
    async (code) => {
      await saveToken('token-1');
      useSessionStore.setState({ user: anna });
      service.getUser.mockRejectedValue(new AuthError(code));

      await state().restore();

      expect(state()).toMatchObject({ status: 'signedIn', user: anna });
      // The token stays, so the session is checked again at the next start.
      expect(await loadToken()).toBe('token-1');
    },
  );

  it('treats an error that is not an AuthError like a failure of the service', async () => {
    await saveToken('token-1');
    useSessionStore.setState({ user: anna });
    service.getUser.mockRejectedValue(new TypeError('Network request failed'));

    await state().restore();

    expect(state().status).toBe('signedIn');
  });

  it('stays signed out, and keeps the token, when the service fails and no user was saved', async () => {
    await saveToken('token-1');
    service.getUser.mockRejectedValue(new AuthError('network'));

    await state().restore();

    expect(state()).toMatchObject({ status: 'signedOut', user: null });
    expect(await loadToken()).toBe('token-1');
  });
});

describe('signIn', () => {
  it('asks the service, keeps the token in secure storage and signs the user in', async () => {
    service.signIn.mockResolvedValue({ token: 'token-1', user: anna });

    await state().signIn({ email: 'anna@example.com', password: 'Secret123' });

    expect(service.signIn).toHaveBeenCalledWith({ email: 'anna@example.com', password: 'Secret123' });
    expect(state()).toMatchObject({ status: 'signedIn', user: anna });
    expect(await loadToken()).toBe('token-1');
  });

  it('stays signed out and keeps no token when the service refuses', async () => {
    useSessionStore.setState({ status: 'signedOut' });
    service.signIn.mockRejectedValue(new AuthError('invalidCredentials'));

    await expect(state().signIn({ email: 'a@b.pl', password: 'x' })).rejects.toMatchObject({
      code: 'invalidCredentials',
    });

    expect(state()).toMatchObject({ status: 'signedOut', user: null });
    expect(await loadToken()).toBeNull();
  });
});

describe('signUp', () => {
  it('asks the service, keeps the token and signs the new user in', async () => {
    service.signUp.mockResolvedValue({ token: 'token-2', user: anna });

    await state().signUp({ name: 'Anna Nowak', email: 'anna@example.com', password: 'Secret123' });

    expect(service.signUp).toHaveBeenCalledWith({
      name: 'Anna Nowak',
      email: 'anna@example.com',
      password: 'Secret123',
    });
    expect(state()).toMatchObject({ status: 'signedIn', user: anna });
    expect(await loadToken()).toBe('token-2');
  });

  it('stays signed out when the address is taken', async () => {
    useSessionStore.setState({ status: 'signedOut' });
    service.signUp.mockRejectedValue(new AuthError('emailTaken'));

    await expect(
      state().signUp({ name: 'A', email: 'taken@example.com', password: 'Secret123' }),
    ).rejects.toMatchObject({ code: 'emailTaken' });

    expect(state().status).toBe('signedOut');
    expect(await loadToken()).toBeNull();
  });
});

describe('signOut', () => {
  beforeEach(async () => {
    await saveToken('token-1');
    useSessionStore.setState({ status: 'signedIn', user: anna });
  });

  it('tells the service, forgets the token and the user', async () => {
    service.signOut.mockResolvedValue();

    await state().signOut();

    expect(service.signOut).toHaveBeenCalledWith('token-1');
    expect(state()).toMatchObject({ status: 'signedOut', user: null });
    expect(await loadToken()).toBeNull();
  });

  it('signs out on this device even when the service cannot be reached', async () => {
    service.signOut.mockRejectedValue(new AuthError('network'));

    await state().signOut();

    expect(state()).toMatchObject({ status: 'signedOut', user: null });
    expect(await loadToken()).toBeNull();
  });

  it('does not bother the service when there is no token', async () => {
    await clearToken();

    await state().signOut();

    expect(service.signOut).not.toHaveBeenCalled();
    expect(state().status).toBe('signedOut');
  });
});

describe('what is saved on the device', () => {
  it('is the user (for starting offline) in the app storage, and the token in secure storage', async () => {
    service.signIn.mockResolvedValue({ token: 'token-1', user: anna });

    await state().signIn({ email: 'anna@example.com', password: 'Secret123' });
    await flushStorage();

    expect(secureStore.get('auth.token')).toBe('token-1');
    expect((await savedSession()).state).toEqual({ user: anna });
  });

  it('never includes a password anywhere', async () => {
    service.signIn.mockResolvedValue({ token: 'token-1', user: anna });

    await state().signIn({ email: 'anna@example.com', password: 'Secret123' });
    await flushStorage();

    const everything = JSON.stringify([...secureStore.entries()]) + JSON.stringify(await savedSession());
    expect(everything).not.toContain('Secret123');
  });

  it('does not save the token with the user', async () => {
    service.signIn.mockResolvedValue({ token: 'token-1', user: anna });

    await state().signIn({ email: 'anna@example.com', password: 'Secret123' });
    await flushStorage();

    expect(JSON.stringify(await savedSession())).not.toContain('token-1');
  });

  it('does not save whether the user is signed in: that is checked again at every start', async () => {
    service.signIn.mockResolvedValue({ token: 'token-1', user: anna });

    await state().signIn({ email: 'anna@example.com', password: 'Secret123' });
    await flushStorage();

    expect((await savedSession()).state).not.toHaveProperty('status');
  });

  it('removes the saved user when the user signs out', async () => {
    service.signIn.mockResolvedValue({ token: 'token-1', user: anna });
    await state().signIn({ email: 'anna@example.com', password: 'Secret123' });

    await state().signOut();
    await flushStorage();

    expect((await savedSession()).state).toEqual({ user: null });
  });

  it('ignores a saved user that is not valid, instead of trusting it', async () => {
    await AsyncStorage.setItem('session', JSON.stringify({ state: { user: { id: 7 } }, version: 1 }));

    await useSessionStore.persist.rehydrate();

    expect(state().user).toBeNull();
  });

  it('reads a valid saved user back', async () => {
    await AsyncStorage.setItem('session', JSON.stringify({ state: { user: anna }, version: 1 }));

    await useSessionStore.persist.rehydrate();

    expect(state().user).toEqual(anna);
    // Reading the user does not sign anyone in; the saved session is still to be checked.
    expect(state().status).toBe('loading');
  });
});

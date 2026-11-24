import * as SecureStore from 'expo-secure-store';

import { clearToken, loadToken, saveToken } from './tokenStorage';

const store = (SecureStore as unknown as { __store: Map<string, string> }).__store;
const isAvailable = jest.mocked(SecureStore.isAvailableAsync);

beforeEach(async () => {
  store.clear();
  isAvailable.mockResolvedValue(true);
  await clearToken();
  jest.clearAllMocks();
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe('on a phone', () => {
  it('saves the token in secure storage and reads it back', async () => {
    await saveToken('token-1');

    expect(await loadToken()).toBe('token-1');
    expect(store.get('auth.token')).toBe('token-1');
  });

  it('keeps nothing but the token, and keeps it on this device only', async () => {
    await saveToken('token-1');

    expect([...store.keys()]).toEqual(['auth.token']);
    expect(SecureStore.setItemAsync).toHaveBeenCalledWith('auth.token', 'token-1', {
      keychainAccessible: 'WHEN_UNLOCKED_THIS_DEVICE_ONLY',
    });
  });

  it('replaces an earlier token', async () => {
    await saveToken('old');
    await saveToken('new');
    expect(await loadToken()).toBe('new');
  });

  it('reads nothing when no token was saved', async () => {
    expect(await loadToken()).toBeNull();
  });

  it('forgets the token', async () => {
    await saveToken('token-1');
    await clearToken();

    expect(await loadToken()).toBeNull();
    expect(store.size).toBe(0);
  });

  it('never throws: a token that cannot be read is no token', async () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    jest.mocked(SecureStore.getItemAsync).mockRejectedValueOnce(new Error('Keychain error'));

    expect(await loadToken()).toBeNull();
    expect(warn).toHaveBeenCalledTimes(1);
  });

  it('never throws when the token cannot be saved or removed', async () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    jest.mocked(SecureStore.setItemAsync).mockRejectedValueOnce(new Error('Keychain error'));
    jest.mocked(SecureStore.deleteItemAsync).mockRejectedValueOnce(new Error('Keychain error'));

    await expect(saveToken('token-1')).resolves.toBeUndefined();
    await expect(clearToken()).resolves.toBeUndefined();
    expect(warn).toHaveBeenCalledTimes(2);
  });

  it('does not put the token in the warning it logs', async () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    jest.mocked(SecureStore.setItemAsync).mockRejectedValueOnce(new Error('Keychain error'));

    await saveToken('super-secret-token');

    expect(JSON.stringify(warn.mock.calls)).not.toContain('super-secret-token');
  });

  it('copes with a platform that fails when asked whether secure storage exists', async () => {
    isAvailable.mockRejectedValue(new Error('Unavailable'));

    await saveToken('token-1');

    expect(SecureStore.setItemAsync).not.toHaveBeenCalled();
    expect(await loadToken()).toBe('token-1');
  });
});

describe('on the web, where there is no secure storage', () => {
  beforeEach(() => {
    isAvailable.mockResolvedValue(false);
  });

  it('keeps the token in memory only', async () => {
    await saveToken('token-1');

    expect(await loadToken()).toBe('token-1');
    expect(SecureStore.setItemAsync).not.toHaveBeenCalled();
    expect(store.size).toBe(0);
  });

  it('forgets the token', async () => {
    await saveToken('token-1');
    await clearToken();

    expect(await loadToken()).toBeNull();
    expect(SecureStore.deleteItemAsync).not.toHaveBeenCalled();
  });
});

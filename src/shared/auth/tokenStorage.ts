import * as SecureStore from 'expo-secure-store';

// The token that proves a session is the only thing kept in secure storage. A password is
// never stored, not even here.
//
// On Android and iOS it goes to the system's secure storage (Keystore and Keychain). The web
// has no such storage, and a token in the browser's own storage would be readable by any
// script on the page, so on the web the token only lives in memory and a page reload logs
// the user out.
const TOKEN_KEY = 'auth.token';

let memoryToken: string | null = null;

const warn = (message: string, error: unknown) => {
  if (__DEV__) {
    console.warn(message, error);
  }
};

const isSecureStorageAvailable = async (): Promise<boolean> => {
  try {
    return await SecureStore.isAvailableAsync();
  } catch {
    return false;
  }
};

// Reads the saved token, or null when there is none. Never throws: a token that cannot be
// read is the same as no token, and the user logs in again.
export const loadToken = async (): Promise<string | null> => {
  if (!(await isSecureStorageAvailable())) {
    return memoryToken;
  }
  try {
    return await SecureStore.getItemAsync(TOKEN_KEY);
  } catch (error) {
    warn('Could not read the session token from secure storage.', error);
    return null;
  }
};

// Saves the token. Never throws: when it cannot be saved the session lasts until the app
// closes.
export const saveToken = async (token: string): Promise<void> => {
  if (!(await isSecureStorageAvailable())) {
    memoryToken = token;
    return;
  }
  try {
    await SecureStore.setItemAsync(TOKEN_KEY, token, {
      // Not copied to a new device by a backup.
      keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
    });
  } catch (error) {
    warn('Could not save the session token to secure storage.', error);
  }
};

// Forgets the token. Never throws.
export const clearToken = async (): Promise<void> => {
  memoryToken = null;
  if (!(await isSecureStorageAvailable())) {
    return;
  }
  try {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
  } catch (error) {
    warn('Could not remove the session token from secure storage.', error);
  }
};

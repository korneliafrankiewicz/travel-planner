import AsyncStorage from '@react-native-async-storage/async-storage';

import { createSafeJsonStorage } from './safeStorage';

type State = { value: number };

describe('createSafeJsonStorage', () => {
  const storage = createSafeJsonStorage<State>();

  beforeEach(async () => {
    await AsyncStorage.clear();
    // Failures are logged in development; keep the test output clean and check the log.
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('saves and reads a value back', async () => {
    await storage.setItem('key', { state: { value: 1 }, version: 3 });
    expect(await storage.getItem('key')).toEqual({ state: { value: 1 }, version: 3 });
  });

  it('stores the value as JSON text', async () => {
    await storage.setItem('key', { state: { value: 1 }, version: 0 });
    expect(JSON.parse((await AsyncStorage.getItem('key')) as string)).toEqual({
      state: { value: 1 },
      version: 0,
    });
  });

  it('returns null when nothing is stored', async () => {
    expect(await storage.getItem('missing')).toBeNull();
  });

  it('removes a value', async () => {
    await storage.setItem('key', { state: { value: 1 }, version: 0 });
    await storage.removeItem('key');
    expect(await storage.getItem('key')).toBeNull();
  });

  describe('when storage misbehaves it never throws', () => {
    it('treats corrupt JSON as "nothing stored"', async () => {
      await AsyncStorage.setItem('key', '{not valid json');
      await expect(storage.getItem('key')).resolves.toBeNull();
      expect(console.warn).toHaveBeenCalled();
    });

    it('treats a failed read as "nothing stored"', async () => {
      jest.spyOn(AsyncStorage, 'getItem').mockRejectedValueOnce(new Error('read failed'));
      await expect(storage.getItem('key')).resolves.toBeNull();
      expect(console.warn).toHaveBeenCalled();
    });

    it('swallows a failed write', async () => {
      jest.spyOn(AsyncStorage, 'setItem').mockRejectedValueOnce(new Error('disk full'));
      await expect(
        storage.setItem('key', { state: { value: 1 }, version: 0 }),
      ).resolves.toBeUndefined();
      expect(console.warn).toHaveBeenCalled();
    });

    it('swallows a failed remove', async () => {
      jest.spyOn(AsyncStorage, 'removeItem').mockRejectedValueOnce(new Error('nope'));
      await expect(storage.removeItem('key')).resolves.toBeUndefined();
      expect(console.warn).toHaveBeenCalled();
    });
  });
});

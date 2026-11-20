import AsyncStorage from '@react-native-async-storage/async-storage';
import type { PersistStorage } from 'zustand/middleware';

const warn = (message: string, error: unknown) => {
  if (__DEV__) {
    console.warn(message, error);
  }
};

// AsyncStorage-backed JSON storage for persisted Zustand stores that never throws.
//
// With zustand's built-in `createJSONStorage`, a failed read or corrupt JSON leaves the store
// "not hydrated" forever, which would keep the splash screen up indefinitely. Here a bad read
// is treated as "nothing stored", so the store falls back to its initial state, and a failed
// write keeps the data in memory only.
export const createSafeJsonStorage = <State>(): PersistStorage<State> => ({
  getItem: async (name) => {
    try {
      const raw = await AsyncStorage.getItem(name);
      return raw === null ? null : JSON.parse(raw);
    } catch (error) {
      warn(`Could not read "${name}" from storage, using defaults.`, error);
      return null;
    }
  },
  setItem: async (name, value) => {
    try {
      await AsyncStorage.setItem(name, JSON.stringify(value));
    } catch (error) {
      warn(`Could not save "${name}" to storage.`, error);
    }
  },
  removeItem: async (name) => {
    try {
      await AsyncStorage.removeItem(name);
    } catch (error) {
      warn(`Could not remove "${name}" from storage.`, error);
    }
  },
});

import AsyncStorage from '@react-native-async-storage/async-storage';

type Persisted = { persist: { hasHydrated: () => boolean } };

// Waits until a persisted Zustand store has finished loading from storage.
export const waitForHydration = async (store: Persisted): Promise<void> => {
  for (let attempt = 0; attempt < 100 && !store.persist.hasHydrated(); attempt++) {
    await new Promise<void>((resolve) => setTimeout(resolve, 0));
  }
  if (!store.persist.hasHydrated()) {
    throw new Error('The store did not finish hydrating');
  }
};

// Lets pending (fire-and-forget) storage writes finish.
export const flushStorage = () => new Promise<void>((resolve) => setTimeout(resolve, 0));

// Simulates an app launch: loads the modules `load` requires from scratch (so stores start
// from their initial state and read what is in storage), while sharing the one in-memory
// AsyncStorage with the other launches in the same test.
// `setup` runs first, inside the same isolation, for per-launch mocks (e.g. the device language).
export const launchApp = <Modules>(load: () => Modules, setup?: () => void): Modules => {
  let modules!: Modules;
  jest.isolateModules(() => {
    jest.doMock('@react-native-async-storage/async-storage', () => ({
      __esModule: true,
      default: AsyncStorage,
    }));
    setup?.();
    modules = load();
  });
  return modules;
};

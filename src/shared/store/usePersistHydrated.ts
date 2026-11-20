import { useSyncExternalStore } from 'react';

type PersistApi<State> = {
  hasHydrated: () => boolean;
  onFinishHydration: (listener: (state: State) => void) => () => void;
};

// True once a persisted Zustand store has been read from storage.
// Pass the store's `persist` API, e.g. `usePersistHydrated(useMyStore.persist)`.
export const usePersistHydrated = <State>(persist: PersistApi<State>): boolean =>
  useSyncExternalStore(
    (onChange) => persist.onFinishHydration(onChange),
    () => persist.hasHydrated(),
    () => false,
  );

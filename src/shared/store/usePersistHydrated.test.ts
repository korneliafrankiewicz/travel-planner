import { act, renderHook } from '@testing-library/react-native';

import { usePersistHydrated } from './usePersistHydrated';

// A stand-in for a Zustand store's `persist` API that the test controls.
const createFakePersist = (hydrated: boolean) => {
  let isHydrated = hydrated;
  const listeners = new Set<(state: unknown) => void>();
  return {
    api: {
      hasHydrated: () => isHydrated,
      onFinishHydration: (listener: (state: unknown) => void) => {
        listeners.add(listener);
        return () => listeners.delete(listener);
      },
    },
    finishHydration: () => {
      isHydrated = true;
      listeners.forEach((listener) => listener({}));
    },
    listenerCount: () => listeners.size,
  };
};

describe('usePersistHydrated', () => {
  it('is false until the store has loaded', async () => {
    const persist = createFakePersist(false);
    const { result } = await renderHook(() => usePersistHydrated(persist.api));
    expect(result.current).toBe(false);
  });

  it('becomes true when loading finishes', async () => {
    const persist = createFakePersist(false);
    const { result } = await renderHook(() => usePersistHydrated(persist.api));

    await act(() => persist.finishHydration());

    expect(result.current).toBe(true);
  });

  it('is true straight away for a store that already loaded', async () => {
    const persist = createFakePersist(true);
    const { result } = await renderHook(() => usePersistHydrated(persist.api));
    expect(result.current).toBe(true);
  });

  it('stops listening when the component goes away', async () => {
    const persist = createFakePersist(false);
    const { unmount } = await renderHook(() => usePersistHydrated(persist.api));
    expect(persist.listenerCount()).toBe(1);

    await unmount();

    expect(persist.listenerCount()).toBe(0);
  });
});

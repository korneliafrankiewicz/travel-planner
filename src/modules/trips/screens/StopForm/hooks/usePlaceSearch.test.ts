import { act, renderHook } from '@testing-library/react-native';

import { SEARCH_DEBOUNCE_MS, usePlaceSearch } from './usePlaceSearch';

const feature = (id: number, name: string) => ({
  type: 'Feature',
  properties: { osm_type: 'N', osm_id: id, name },
  geometry: { type: 'Point', coordinates: [-9.2, 38.7] },
});

type Answer = { features: unknown[] } | Error;

// Every call of fetch waits until the test answers it, so the order of the answers is in the
// test's hands.
const mockFetch = () => {
  const calls: { url: string; signal: AbortSignal | undefined; answer: (value: Answer) => void }[] = [];
  jest.spyOn(globalThis, 'fetch').mockImplementation(
    (input, init) =>
      new Promise((resolve, reject) => {
        calls.push({
          url: String(input),
          signal: init?.signal ?? undefined,
          answer: (value) =>
            value instanceof Error
              ? reject(value)
              : resolve({ ok: true, status: 200, json: async () => value } as Response),
        });
      }),
  );
  return calls;
};

const renderSearch = (initial: { query: string; language?: string; near?: { latitude: number; longitude: number } | null }) =>
  renderHook(
    (props: typeof initial) => usePlaceSearch(props.query, props.language ?? 'en', props.near ?? null),
    { initialProps: initial },
  );

const wait = async (ms: number) => {
  await act(async () => {
    jest.advanceTimersByTime(ms);
  });
};

beforeEach(() => {
  jest.useFakeTimers();
});

afterEach(() => {
  jest.useRealTimers();
  jest.restoreAllMocks();
});

describe('usePlaceSearch', () => {
  it('does nothing for an empty or too short query', async () => {
    const calls = mockFetch();
    const { result, rerender } = await renderSearch({ query: '' });
    expect(result.current).toEqual({ status: 'idle', results: [] });

    await rerender({ query: 'be' });
    await wait(SEARCH_DEBOUNCE_MS * 2);

    expect(result.current).toEqual({ status: 'idle', results: [] });
    expect(calls).toHaveLength(0);
  });

  it('waits for the user to stop typing before searching', async () => {
    const calls = mockFetch();
    const { result, rerender } = await renderSearch({ query: 'bel' });

    await wait(SEARCH_DEBOUNCE_MS - 1);
    expect(calls).toHaveLength(0);
    expect(result.current.status).toBe('loading');

    // Typing again restarts the wait, so nothing has been sent yet.
    await rerender({ query: 'belem' });
    await wait(SEARCH_DEBOUNCE_MS - 1);
    expect(calls).toHaveLength(0);

    await wait(1);
    expect(calls).toHaveLength(1);
    expect(calls[0].url).toContain('q=belem');
  });

  it('shows the places once the answer arrives', async () => {
    const calls = mockFetch();
    const { result } = await renderSearch({ query: 'belem' });
    await wait(SEARCH_DEBOUNCE_MS);
    expect(result.current.status).toBe('loading');

    await act(async () => calls[0].answer({ features: [feature(1, 'Tower of Belém')] }));

    expect(result.current.status).toBe('success');
    expect(result.current.results.map((place) => place.name)).toEqual(['Tower of Belém']);
  });

  it('reports an empty answer as a success without places', async () => {
    const calls = mockFetch();
    const { result } = await renderSearch({ query: 'qqqqq' });
    await wait(SEARCH_DEBOUNCE_MS);

    await act(async () => calls[0].answer({ features: [] }));

    expect(result.current).toEqual({ status: 'success', results: [] });
  });

  it('reports an error when the search fails', async () => {
    const calls = mockFetch();
    const { result } = await renderSearch({ query: 'belem' });
    await wait(SEARCH_DEBOUNCE_MS);

    await act(async () => calls[0].answer(new TypeError('Network request failed')));

    expect(result.current).toEqual({ status: 'error', results: [] });
  });

  it('cancels a search that is replaced, and ignores its late answer', async () => {
    const calls = mockFetch();
    const { result, rerender } = await renderSearch({ query: 'belem' });
    await wait(SEARCH_DEBOUNCE_MS);

    await rerender({ query: 'belem tower' });
    expect(calls[0].signal?.aborted).toBe(true);
    await wait(SEARCH_DEBOUNCE_MS);
    expect(calls).toHaveLength(2);

    // The old search answers after the new one was sent; its places must not appear.
    await act(async () => calls[0].answer({ features: [feature(1, 'Old result')] }));
    expect(result.current.status).toBe('loading');

    await act(async () => calls[1].answer({ features: [feature(2, 'Tower of Belém')] }));
    expect(result.current.results.map((place) => place.name)).toEqual(['Tower of Belém']);
  });

  it('does not show the places of an earlier query while the next one loads', async () => {
    const calls = mockFetch();
    const { result, rerender } = await renderSearch({ query: 'belem' });
    await wait(SEARCH_DEBOUNCE_MS);
    await act(async () => calls[0].answer({ features: [feature(1, 'Tower of Belém')] }));
    expect(result.current.results).toHaveLength(1);

    await rerender({ query: 'belem tower' });

    expect(result.current).toEqual({ status: 'loading', results: [] });
  });

  it('goes back to idle when the text is cleared', async () => {
    const calls = mockFetch();
    const { result, rerender } = await renderSearch({ query: 'belem' });
    await wait(SEARCH_DEBOUNCE_MS);
    await act(async () => calls[0].answer({ features: [feature(1, 'Tower of Belém')] }));

    await rerender({ query: '' });

    expect(result.current).toEqual({ status: 'idle', results: [] });
  });

  it('searches again for the same text when it comes back after being cleared', async () => {
    const calls = mockFetch();
    const { result, rerender } = await renderSearch({ query: 'belem' });
    await wait(SEARCH_DEBOUNCE_MS);
    await act(async () => calls[0].answer({ features: [feature(1, 'Tower of Belém')] }));

    await rerender({ query: '' });
    await rerender({ query: 'belem' });

    // The earlier answer is still on hand for this same query, so it shows straight away.
    expect(result.current.status).toBe('success');
  });

  it('cancels the search when the user leaves', async () => {
    const calls = mockFetch();
    const { unmount } = await renderSearch({ query: 'belem' });
    await wait(SEARCH_DEBOUNCE_MS);

    await unmount();

    expect(calls[0].signal?.aborted).toBe(true);
  });

  it('does not search at all when the user leaves before the pause is over', async () => {
    const calls = mockFetch();
    const { unmount } = await renderSearch({ query: 'belem' });

    await unmount();
    await wait(SEARCH_DEBOUNCE_MS * 2);

    expect(calls).toHaveLength(0);
  });

  it('searches again when the language changes', async () => {
    const calls = mockFetch();
    const { rerender } = await renderSearch({ query: 'belem', language: 'en' });
    await wait(SEARCH_DEBOUNCE_MS);

    await rerender({ query: 'belem', language: 'pl' });
    await wait(SEARCH_DEBOUNCE_MS);

    expect(calls).toHaveLength(2);
    expect(calls[0].url).toContain('lang=en');
    expect(calls[1].url).not.toContain('lang=');
  });

  it('passes the point to favour on to the search', async () => {
    const calls = mockFetch();
    await renderSearch({ query: 'hotel', near: { latitude: 38.7, longitude: -9.1 } });
    await wait(SEARCH_DEBOUNCE_MS);

    expect(calls[0].url).toContain('lat=38.7&lon=-9.1');
  });
});

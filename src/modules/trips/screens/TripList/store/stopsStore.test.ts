import AsyncStorage from '@react-native-async-storage/async-storage';

import { flushStorage, launchApp, waitForHydration } from '@/test-utils/storeTestUtils';

import type { StopInput } from '../schema/stopSchema';

const launch = async () => {
  const { stops } = launchApp(() => ({
    stops: jest.requireActual<typeof import('./stopsStore')>('./stopsStore'),
  }));
  await waitForHydration(stops.useStopsStore);
  return stops.useStopsStore;
};

const input: StopInput = {
  type: 'meal',
  title: 'Lunch',
  date: '2026-12-14',
  startTime: '13:00',
  durationMin: 60,
  notes: '',
  url: '',
};

const countFor = (store: Awaited<ReturnType<typeof launch>>, tripId: string) =>
  store.getState().stops.filter((stop) => stop.tripId === tripId).length;

beforeEach(async () => {
  await AsyncStorage.clear();
  jest.spyOn(console, 'warn').mockImplementation(() => {});
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe('first launch', () => {
  it('starts with the sample stops (5 for Lisbon, 4 for Tatra)', async () => {
    const store = await launch();
    expect(countFor(store, 'sample-lisbon')).toBe(5);
    expect(countFor(store, 'sample-tatra')).toBe(4);
  });
});

describe('addStop', () => {
  it('adds the stop to the right trip with a new id', async () => {
    const store = await launch();
    store.getState().addStop('sample-lisbon', input);
    const added = store.getState().stops.at(-1);
    expect(added).toMatchObject({ ...input, tripId: 'sample-lisbon' });
    expect(added?.id).toMatch(/^stop-/);
    expect(countFor(store, 'sample-lisbon')).toBe(6);
  });

  // KNOWN BUG: ids are `stop-<timestamp>`, so two stops added in the same millisecond get the
  // same id. This test describes the intended behaviour and is expected to fail until ids are
  // made unique (then switch to `it`).
  it.failing('gives two stops added at once different ids', async () => {
    const store = await launch();
    jest.spyOn(Date, 'now').mockReturnValue(1_700_000_000_000);
    store.getState().addStop('sample-lisbon', input);
    store.getState().addStop('sample-lisbon', input);
    const [first, second] = store.getState().stops.slice(-2);
    expect(first.id).not.toBe(second.id);
  });

  it('survives an app restart', async () => {
    let store = await launch();
    store.getState().addStop('sample-lisbon', input);
    await flushStorage();

    store = await launch();
    expect(countFor(store, 'sample-lisbon')).toBe(6);
    expect(store.getState().stops.some((stop) => stop.title === 'Lunch')).toBe(true);
  });
});

describe('updateStop', () => {
  it('changes the stop but keeps its id and trip, and survives a restart', async () => {
    let store = await launch();
    store.getState().updateStop('sample-stop-1', { ...input, title: 'Late check-in' });
    await flushStorage();

    store = await launch();
    const stop = store.getState().stops.find((item) => item.id === 'sample-stop-1');
    expect(stop).toMatchObject({ title: 'Late check-in', tripId: 'sample-lisbon' });
  });

  it('changes only the chosen stop', async () => {
    const store = await launch();
    const before = store.getState().stops.find((stop) => stop.id === 'sample-stop-2');
    store.getState().updateStop('sample-stop-1', input);
    expect(store.getState().stops.find((stop) => stop.id === 'sample-stop-2')).toEqual(before);
  });
});

describe('deleteStop', () => {
  it('removes only that stop and keeps it deleted after a restart', async () => {
    let store = await launch();
    store.getState().deleteStop('sample-stop-1');
    await flushStorage();

    store = await launch();
    expect(store.getState().stops.some((stop) => stop.id === 'sample-stop-1')).toBe(false);
    expect(store.getState().stops).toHaveLength(8);
  });
});

describe('deleteTripStops', () => {
  it('removes every stop of the trip and no other', async () => {
    const store = await launch();
    store.getState().deleteTripStops('sample-lisbon');
    expect(countFor(store, 'sample-lisbon')).toBe(0);
    expect(countFor(store, 'sample-tatra')).toBe(4);
  });
});

describe('persistence edge cases', () => {
  it('does not bring the sample stops back when every stop was deleted', async () => {
    let store = await launch();
    for (const stop of [...store.getState().stops]) {
      store.getState().deleteStop(stop.id);
    }
    await flushStorage();

    store = await launch();
    expect(store.getState().stops).toEqual([]);
  });

  it('survives corrupt JSON and a failing read, falling back to the samples', async () => {
    await AsyncStorage.setItem('stops', '{broken');
    expect((await launch()).getState().stops).toHaveLength(9);

    // A one-time failure: a permanent one would also break the tests that run after this one.
    jest.spyOn(AsyncStorage, 'getItem').mockRejectedValueOnce(new Error('read failed'));
    expect((await launch()).getState().stops).toHaveLength(9);
  });

  it('drops malformed stored stops and keeps the valid ones', async () => {
    const valid = {
      id: 'ok',
      tripId: 't',
      date: '2026-12-13',
      type: 'meal',
      title: 'A',
      startTime: '09:00',
      durationMin: 30,
      notes: '',
      url: '',
    };
    await AsyncStorage.setItem(
      'stops',
      JSON.stringify({
        state: { stops: [valid, null, { ...valid, id: 'bad', startTime: '25:00' }] },
        version: 1,
      }),
    );
    const store = await launch();
    expect(store.getState().stops.map((stop) => stop.id)).toEqual(['ok']);
  });
});

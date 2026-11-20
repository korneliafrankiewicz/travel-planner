import AsyncStorage from '@react-native-async-storage/async-storage';

import { flushStorage, launchApp, waitForHydration } from '@/test-utils/storeTestUtils';

import type { NewTripInput } from './tripsStore';

// Each call is one app launch: fresh stores that read whatever is in storage.
const launch = async () => {
  const { trips, stops } = launchApp(() => ({
    trips: jest.requireActual<typeof import('./tripsStore')>('./tripsStore'),
    stops: jest.requireActual<typeof import('./stopsStore')>('./stopsStore'),
  }));
  await waitForHydration(trips.useTripsStore);
  await waitForHydration(stops.useStopsStore);
  return { trips: trips.useTripsStore, stops: stops.useStopsStore };
};

const input: NewTripInput = {
  title: 'Rome',
  destination: 'Rome, Italy',
  notes: '',
  startDate: '2027-01-02',
  endDate: '2027-01-04',
};

const tripIds = (state: { trips: { id: string }[] }) => state.trips.map((trip) => trip.id);

beforeEach(async () => {
  await AsyncStorage.clear();
  jest.spyOn(console, 'warn').mockImplementation(() => {});
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe('first launch', () => {
  it('starts with the two sample trips', async () => {
    const app = await launch();
    expect(tripIds(app.trips.getState())).toEqual(['sample-lisbon', 'sample-tatra']);
  });
});

describe('addTrip', () => {
  it('adds the trip with a new id, after the existing ones', async () => {
    const app = await launch();
    app.trips.getState().addTrip(input);
    const trips = app.trips.getState().trips;
    expect(trips).toHaveLength(3);
    expect(trips[2]).toMatchObject(input);
    expect(trips[2].id).toMatch(/^trip-/);
  });

  // KNOWN BUG: ids are `trip-<timestamp>`, so two trips added in the same millisecond get the
  // same id. This test describes the intended behaviour and is expected to fail until ids are
  // made unique (then switch to `it`).
  it.failing('gives two trips added at once different ids', async () => {
    const app = await launch();
    jest.spyOn(Date, 'now').mockReturnValue(1_700_000_000_000);
    app.trips.getState().addTrip(input);
    app.trips.getState().addTrip(input);
    const [, , first, second] = app.trips.getState().trips;
    expect(first.id).not.toBe(second.id);
  });

  it('survives an app restart', async () => {
    let app = await launch();
    app.trips.getState().addTrip(input);
    await flushStorage();

    app = await launch();
    expect(app.trips.getState().trips.map((trip) => trip.title)).toContain('Rome');
    expect(app.trips.getState().trips).toHaveLength(3);
  });
});

describe('updateTrip', () => {
  it('changes only the chosen trip and survives a restart', async () => {
    let app = await launch();
    app.trips.getState().updateTrip('sample-lisbon', { ...input, title: 'Renamed' });
    await flushStorage();

    app = await launch();
    const { trips } = app.trips.getState();
    expect(trips.find((trip) => trip.id === 'sample-lisbon')?.title).toBe('Renamed');
    expect(trips.find((trip) => trip.id === 'sample-tatra')?.title).toBe('Tatra Mountains');
  });

  it('keeps the trip id', async () => {
    const app = await launch();
    app.trips.getState().updateTrip('sample-lisbon', input);
    expect(tripIds(app.trips.getState())).toEqual(['sample-lisbon', 'sample-tatra']);
  });
});

describe('deleteTrip', () => {
  it('removes the trip and its stops, and nothing else', async () => {
    const app = await launch();
    const stopsOf = (tripId: string) =>
      app.stops.getState().stops.filter((stop) => stop.tripId === tripId).length;
    expect(stopsOf('sample-lisbon')).toBeGreaterThan(0);

    app.trips.getState().deleteTrip('sample-lisbon');

    expect(tripIds(app.trips.getState())).toEqual(['sample-tatra']);
    expect(stopsOf('sample-lisbon')).toBe(0);
    expect(stopsOf('sample-tatra')).toBeGreaterThan(0);
  });

  it('keeps the deletion after a restart', async () => {
    let app = await launch();
    app.trips.getState().deleteTrip('sample-lisbon');
    await flushStorage();

    app = await launch();
    expect(tripIds(app.trips.getState())).toEqual(['sample-tatra']);
    expect(app.stops.getState().stops.some((stop) => stop.tripId === 'sample-lisbon')).toBe(false);
  });

  it('does not bring the sample trips back when every trip was deleted', async () => {
    let app = await launch();
    for (const id of tripIds(app.trips.getState())) {
      app.trips.getState().deleteTrip(id);
    }
    await flushStorage();

    app = await launch();
    expect(app.trips.getState().trips).toEqual([]);
  });

  it('does nothing for an unknown id', async () => {
    const app = await launch();
    app.trips.getState().deleteTrip('nope');
    expect(app.trips.getState().trips).toHaveLength(2);
    expect(app.stops.getState().stops).toHaveLength(9);
  });
});

describe('bad stored data never blocks startup', () => {
  it('survives corrupt JSON and falls back to the sample trips', async () => {
    await AsyncStorage.setItem('trips', '{broken');
    const app = await launch();
    expect(tripIds(app.trips.getState())).toEqual(['sample-lisbon', 'sample-tatra']);
  });

  it('survives a failing storage read', async () => {
    // Both stores (trips and stops) read storage on launch. One-time failures, because a
    // permanent one would also break the tests that run after this one.
    jest
      .spyOn(AsyncStorage, 'getItem')
      .mockRejectedValueOnce(new Error('read failed'))
      .mockRejectedValueOnce(new Error('read failed'));
    const app = await launch();
    expect(tripIds(app.trips.getState())).toEqual(['sample-lisbon', 'sample-tatra']);
  });

  it('falls back to the samples when the stored trips are not a list', async () => {
    await AsyncStorage.setItem('trips', JSON.stringify({ state: { trips: 'oops' }, version: 1 }));
    const app = await launch();
    expect(tripIds(app.trips.getState())).toEqual(['sample-lisbon', 'sample-tatra']);
  });

  it('drops malformed trips and keeps the valid ones', async () => {
    const valid = {
      id: 'ok',
      title: 'A',
      destination: '',
      notes: '',
      startDate: '2026-12-13',
      endDate: '2026-12-14',
    };
    await AsyncStorage.setItem(
      'trips',
      JSON.stringify({
        state: { trips: [valid, null, { ...valid, id: 'bad', startDate: 'tomorrow' }] },
        version: 1,
      }),
    );
    const app = await launch();
    expect(tripIds(app.trips.getState())).toEqual(['ok']);
  });

  it('loads trips saved by the previous app version (old stopsCount is dropped)', async () => {
    await AsyncStorage.setItem(
      'trips',
      JSON.stringify({
        state: {
          trips: [
            {
              id: 'old',
              title: 'Old',
              destination: '',
              notes: '',
              startDate: '2026-12-13',
              endDate: '2026-12-14',
              stopsCount: 7,
            },
          ],
        },
        version: 1,
      }),
    );
    const app = await launch();
    const [trip] = app.trips.getState().trips;
    expect(trip.id).toBe('old');
    expect(trip).not.toHaveProperty('stopsCount');
  });

  it('keeps working when saving fails', async () => {
    const app = await launch();
    jest.spyOn(AsyncStorage, 'setItem').mockRejectedValueOnce(new Error('disk full'));
    app.trips.getState().addTrip(input);
    await flushStorage();
    expect(app.trips.getState().trips).toHaveLength(3);
  });
});

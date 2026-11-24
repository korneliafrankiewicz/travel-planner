import AsyncStorage from '@react-native-async-storage/async-storage';

import { flushStorage } from '@/test-utils/storeTestUtils';

import type { Stop } from '../schema/stopSchema';
import { resetSampleData } from './resetSampleData';
import { useStopsStore } from './stopsStore';
import { useTripsStore } from './tripsStore';

const ownStop: Stop = {
  id: 'my-stop',
  tripId: 'my-trip',
  date: '2027-01-10',
  type: 'meal',
  title: 'My dinner',
  startTime: '19:00',
  durationMin: 60,
  notes: '',
  url: '',
  coordinates: null,
};

const savedUnderKey = async (key: string) => {
  const raw = await AsyncStorage.getItem(key);
  return raw === null ? null : JSON.parse(raw);
};

beforeEach(() => {
  useTripsStore.setState({
    trips: [
      { id: 'my-trip', title: 'My trip', destination: '', notes: '', startDate: '2027-01-10', endDate: '2027-01-12' },
    ],
  });
  useStopsStore.setState({ stops: [ownStop] });
});

describe('resetSampleData', () => {
  it('replaces the saved trips with the sample trips', () => {
    resetSampleData();

    expect(useTripsStore.getState().trips.map((trip) => trip.id)).toEqual([
      'sample-lisbon',
      'sample-tatra',
    ]);
  });

  it('replaces the saved stops with the sample stops, which have places on the map', () => {
    resetSampleData();

    const { stops } = useStopsStore.getState();
    expect(stops.length).toBeGreaterThan(0);
    expect(stops.find((stop) => stop.id === 'my-stop')).toBeUndefined();
    // Most sample stops have a place, so the map and the day route can be tried out.
    expect(stops.filter((stop) => stop.coordinates !== null).length).toBeGreaterThanOrEqual(2);
    expect(stops.some((stop) => stop.tripId === 'sample-lisbon' && stop.coordinates !== null)).toBe(true);
  });

  it('leaves no stop pointing at a trip that does not exist', () => {
    resetSampleData();

    const tripIds = new Set(useTripsStore.getState().trips.map((trip) => trip.id));
    for (const stop of useStopsStore.getState().stops) {
      expect(tripIds.has(stop.tripId)).toBe(true);
    }
  });

  it('brings the samples back after everything was deleted', () => {
    useTripsStore.setState({ trips: [] });
    useStopsStore.setState({ stops: [] });

    resetSampleData();

    expect(useTripsStore.getState().trips).toHaveLength(2);
    expect(useStopsStore.getState().stops.length).toBeGreaterThan(0);
  });

  it('can be done twice, and gives the same result each time', () => {
    resetSampleData();
    const first = useStopsStore.getState().stops;
    useStopsStore.getState().deleteStop(first[0].id);

    resetSampleData();

    expect(useStopsStore.getState().stops).toEqual(first);
  });

  it('saves the sample data, so it is still there after the app restarts', async () => {
    resetSampleData();
    await flushStorage();

    const trips = await savedUnderKey('trips');
    const stops = await savedUnderKey('stops');
    expect(trips.state.trips.map((trip: { id: string }) => trip.id)).toEqual([
      'sample-lisbon',
      'sample-tatra',
    ]);
    expect(stops.state.stops.some((stop: { id: string }) => stop.id === 'my-stop')).toBe(false);
    expect(stops.state.stops.length).toBeGreaterThan(0);
  });
});

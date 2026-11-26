import { renderHook } from '@testing-library/react-native';

import type { Stop } from '../../TripList/schema/stopSchema';
import { useStopsStore } from '../../TripList/store/stopsStore';
import { useTripPlaces } from './useTripPlaces';

const stop = (id: string, tripId: string, coordinates: Stop['coordinates']): Stop => ({
  id,
  tripId,
  date: '2026-12-13',
  type: 'attraction',
  title: id,
  startTime: '10:00',
  durationMin: 60,
  notes: '',
  url: '',
  coordinates,
});

const belem = { latitude: 38.6916, longitude: -9.216 };
const alfama = { latitude: 38.711, longitude: -9.1303 };
const tatra = { latitude: 49.2992, longitude: 19.9496 };

beforeEach(() => {
  useStopsStore.setState({
    stops: [
      stop('a', 'lisbon', belem),
      stop('b', 'lisbon', alfama),
      stop('c', 'lisbon', null),
      stop('d', 'tatra', tatra),
    ],
  });
});

describe('useTripPlaces', () => {
  it('returns the places of the trip’s stops only, leaving out stops without a place', async () => {
    const { result } = await renderHook(() => useTripPlaces('lisbon'));
    expect(result.current).toEqual([belem, alfama]);
  });

  it('leaves out the stop being edited', async () => {
    const { result } = await renderHook(() => useTripPlaces('lisbon', 'a'));
    expect(result.current).toEqual([alfama]);
  });

  it('returns nothing for a trip without places', async () => {
    const { result } = await renderHook(() => useTripPlaces('unknown'));
    expect(result.current).toEqual([]);
  });
});

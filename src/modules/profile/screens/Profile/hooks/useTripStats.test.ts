import { renderHook } from '@testing-library/react-native';

import type { Trip } from '@/modules/trips/screens/TripList/schema/tripSchema';
import { useTripsStore } from '@/modules/trips/screens/TripList/store/tripsStore';

import { useTripStats } from './useTripStats';

const makeTrip = (id: string, startDate: string, endDate: string): Trip => ({
  id,
  title: id,
  destination: '',
  notes: '',
  startDate,
  endDate,
});

beforeEach(() => {
  // "Today" is 20 November 2026.
  jest.useFakeTimers({ now: new Date(2026, 10, 20, 12, 0), advanceTimers: true });
});

afterEach(() => {
  jest.useRealTimers();
});

describe('useTripStats', () => {
  it('is all zeros without trips', async () => {
    useTripsStore.setState({ trips: [] });
    const { result } = await renderHook(() => useTripStats());
    expect(result.current).toEqual({ total: 0, upcoming: 0, past: 0 });
  });

  it('counts upcoming (including ongoing) and past trips', async () => {
    useTripsStore.setState({
      trips: [
        makeTrip('a', '2027-01-01', '2027-01-03'),
        makeTrip('b', '2026-11-18', '2026-11-22'),
        makeTrip('c', '2026-11-20', '2026-11-20'),
        makeTrip('d', '2026-01-01', '2026-01-03'),
        makeTrip('e', '2026-11-19', '2026-11-19'),
      ],
    });
    const { result } = await renderHook(() => useTripStats());
    expect(result.current).toEqual({ total: 5, upcoming: 3, past: 2 });
  });

  it('always adds up: upcoming + past = total', async () => {
    const { result } = await renderHook(() => useTripStats());
    const { total, upcoming, past } = result.current;
    expect(upcoming + past).toBe(total);
  });
});

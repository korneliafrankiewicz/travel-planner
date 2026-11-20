import { act, renderHook } from '@testing-library/react-native';

import type { Trip } from '../schema/tripSchema';
import { useTripsStore } from '../store/tripsStore';
import { useTripList } from './useTripList';

const makeTrip = (id: string, startDate: string, endDate: string): Trip => ({
  id,
  title: id,
  destination: '',
  notes: '',
  startDate,
  endDate,
});

const ids = (trips: Trip[]) => trips.map((trip) => trip.id);

beforeEach(() => {
  // "Today" is 20 November 2026.
  jest.useFakeTimers({ now: new Date(2026, 10, 20, 12, 0), advanceTimers: true });
  useTripsStore.setState({
    trips: [
      makeTrip('upcoming-later', '2027-02-01', '2027-02-05'),
      makeTrip('past-old', '2026-03-01', '2026-03-05'),
      makeTrip('upcoming-soon', '2026-12-13', '2026-12-15'),
      makeTrip('ongoing', '2026-11-18', '2026-11-22'),
      makeTrip('past-recent', '2026-10-01', '2026-10-05'),
      makeTrip('ends-today', '2026-11-15', '2026-11-20'),
      makeTrip('ended-yesterday', '2026-11-15', '2026-11-19'),
    ],
  });
});

afterEach(() => {
  jest.useRealTimers();
});

describe('useTripList', () => {
  it('starts on the Upcoming tab', async () => {
    const { result } = await renderHook(() => useTripList());
    expect(result.current.tab).toBe('upcoming');
  });

  it('Upcoming shows upcoming and ongoing trips, soonest first', async () => {
    const { result } = await renderHook(() => useTripList());
    expect(ids(result.current.visibleTrips)).toEqual([
      'ends-today',
      'ongoing',
      'upcoming-soon',
      'upcoming-later',
    ]);
  });

  it('counts a trip that ends today as still going on', async () => {
    const { result } = await renderHook(() => useTripList());
    expect(ids(result.current.visibleTrips)).toContain('ends-today');
    expect(ids(result.current.visibleTrips)).not.toContain('ended-yesterday');
  });

  it('Past shows finished trips, most recent first', async () => {
    const { result } = await renderHook(() => useTripList());

    await act(() => result.current.setTab('past'));

    expect(result.current.tab).toBe('past');
    expect(ids(result.current.visibleTrips)).toEqual([
      'ended-yesterday',
      'past-recent',
      'past-old',
    ]);
  });

  it('every trip is on exactly one of the two tabs', async () => {
    const { result } = await renderHook(() => useTripList());
    const upcoming = ids(result.current.visibleTrips);
    await act(() => result.current.setTab('past'));
    const past = ids(result.current.visibleTrips);

    expect([...upcoming, ...past].sort()).toEqual(
      ids(useTripsStore.getState().trips).sort(),
    );
  });

  it('shows nothing when there are no trips', async () => {
    useTripsStore.setState({ trips: [] });
    const { result } = await renderHook(() => useTripList());
    expect(result.current.visibleTrips).toEqual([]);
  });

  it('does not reorder the stored trips', async () => {
    const before = ids(useTripsStore.getState().trips);
    await renderHook(() => useTripList());
    expect(ids(useTripsStore.getState().trips)).toEqual(before);
  });

  it('exposes today at midnight', async () => {
    const { result } = await renderHook(() => useTripList());
    const { today } = result.current;
    expect([today.getFullYear(), today.getMonth(), today.getDate(), today.getHours()]).toEqual([
      2026, 10, 20, 0,
    ]);
  });
});

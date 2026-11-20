import type { Stop } from '../../TripList/schema/stopSchema';
import { buildItinerary, compareStops, findOverlappingStopIds } from './itinerary';

const stop = (
  id: string,
  date: string,
  startTime: string,
  durationMin: number,
  extra: Partial<Stop> = {},
): Stop => ({
  id,
  tripId: 't',
  date,
  type: 'attraction',
  title: id,
  startTime,
  durationMin,
  notes: '',
  url: '',
  ...extra,
});

const ids = (stops: Stop[]) => stops.map((item) => item.id);

describe('compareStops', () => {
  it('orders by start time, then by id', () => {
    const sorted = [
      stop('c', 'd', '12:00', 30),
      stop('b', 'd', '09:00', 30),
      stop('a', 'd', '09:00', 30),
    ].sort(compareStops);
    expect(ids(sorted)).toEqual(['a', 'b', 'c']);
  });

  it('compares times as numbers, not text', () => {
    // "9:30" would sort after "10:00" as text; both are valid HH:mm here.
    const sorted = [stop('late', 'd', '10:00', 30), stop('early', 'd', '09:30', 30)].sort(
      compareStops,
    );
    expect(ids(sorted)).toEqual(['early', 'late']);
  });
});

describe('buildItinerary', () => {
  const trip = { startDate: '2026-12-13', endDate: '2026-12-15' };

  it('has one entry per trip day, numbered from 1', () => {
    const days = buildItinerary(trip, []);
    expect(days.map((day) => day.date)).toEqual(['2026-12-13', '2026-12-14', '2026-12-15']);
    expect(days.map((day) => day.dayNumber)).toEqual([1, 2, 3]);
  });

  it('keeps empty days', () => {
    const days = buildItinerary(trip, [stop('a', '2026-12-13', '09:00', 30)]);
    expect(days[1].stops).toEqual([]);
    expect(days[2].stops).toEqual([]);
  });

  it('groups stops by day and orders them by start time', () => {
    const days = buildItinerary(trip, [
      stop('c', '2026-12-14', '12:00', 30),
      stop('a', '2026-12-14', '09:00', 30),
      stop('z', '2026-12-13', '08:00', 0),
    ]);
    expect(ids(days[0].stops)).toEqual(['z']);
    expect(ids(days[1].stops)).toEqual(['a', 'c']);
  });

  it('still shows a stop outside the trip dates, without a day number', () => {
    const days = buildItinerary(trip, [stop('o', '2026-12-20', '10:00', 30)]);
    expect(days).toHaveLength(4);
    expect(days[3]).toMatchObject({ date: '2026-12-20', dayNumber: null });
    expect(ids(days[3].stops)).toEqual(['o']);
  });

  it('places days outside the trip in date order', () => {
    const days = buildItinerary(trip, [stop('before', '2026-12-10', '10:00', 30)]);
    expect(days.map((day) => day.date)).toEqual([
      '2026-12-10',
      '2026-12-13',
      '2026-12-14',
      '2026-12-15',
    ]);
    expect(days.map((day) => day.dayNumber)).toEqual([null, 1, 2, 3]);
  });

  it('does not change the stops it is given', () => {
    const stops = [stop('b', '2026-12-13', '10:00', 30), stop('a', '2026-12-13', '09:00', 30)];
    buildItinerary(trip, stops);
    expect(ids(stops)).toEqual(['b', 'a']);
  });
});

describe('findOverlappingStopIds', () => {
  const overlaps = (stops: Stop[]) => [...findOverlappingStopIds(stops)].sort();

  it('finds nothing for an empty or single-stop day', () => {
    expect(overlaps([])).toEqual([]);
    expect(overlaps([stop('a', 'd', '09:00', 60)])).toEqual([]);
  });

  it('does not flag back-to-back stops', () => {
    expect(overlaps([stop('a', 'd', '09:00', 60), stop('b', 'd', '10:00', 30)])).toEqual([]);
  });

  it('flags both stops for even one minute of overlap', () => {
    expect(overlaps([stop('a', 'd', '09:00', 61), stop('b', 'd', '10:00', 30)])).toEqual([
      'a',
      'b',
    ]);
  });

  it('flags every stop covered by a long one', () => {
    expect(
      overlaps([
        stop('a', 'd', '09:00', 300),
        stop('b', 'd', '10:00', 30),
        stop('c', 'd', '12:00', 30),
        stop('d', 'd', '15:00', 30),
      ]),
    ).toEqual(['a', 'b', 'c']);
  });

  it('does not flag stops without duration, even at the same time', () => {
    expect(overlaps([stop('a', 'd', '09:00', 0), stop('b', 'd', '09:00', 0)])).toEqual([]);
  });

  it('flags two stops that start together and have a duration', () => {
    expect(overlaps([stop('a', 'd', '09:00', 30), stop('b', 'd', '09:00', 30)])).toEqual([
      'a',
      'b',
    ]);
  });

  it('works on unsorted input without changing it', () => {
    const stops = [stop('b', 'd', '10:00', 30), stop('a', 'd', '09:30', 60)];
    expect(overlaps(stops)).toEqual(['a', 'b']);
    expect(ids(stops)).toEqual(['b', 'a']);
  });
});

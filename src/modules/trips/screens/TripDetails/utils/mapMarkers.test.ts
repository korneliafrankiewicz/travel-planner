import type { Stop } from '../../TripList/schema/stopSchema';
import { getMapRegion, getStopMarkers, type StopMarker } from './mapMarkers';

const trip = { startDate: '2026-12-13', endDate: '2026-12-15' };

const makeStop = (override: Partial<Stop> & Pick<Stop, 'id'>): Stop => ({
  tripId: 't',
  date: '2026-12-13',
  type: 'attraction',
  title: override.id,
  startTime: '09:00',
  durationMin: 60,
  notes: '',
  url: '',
  coordinates: { latitude: 38.7, longitude: -9.1 },
  ...override,
});

const makeMarker = (latitude: number, longitude: number): StopMarker => ({
  stopId: `${latitude}:${longitude}`,
  title: 'Stop',
  coordinates: { latitude, longitude },
  dayNumber: 1,
  startTime: '09:00',
});

describe('getStopMarkers', () => {
  it('leaves out stops without a place', () => {
    const markers = getStopMarkers(trip, [
      makeStop({ id: 'with' }),
      makeStop({ id: 'without', coordinates: null }),
    ]);
    expect(markers.map((marker) => marker.stopId)).toEqual(['with']);
  });

  it('orders the markers by day, then by start time', () => {
    const markers = getStopMarkers(trip, [
      makeStop({ id: 'day2', date: '2026-12-14', startTime: '08:00' }),
      makeStop({ id: 'day1-late', startTime: '18:00' }),
      makeStop({ id: 'day1-early', startTime: '09:00' }),
    ]);
    expect(markers.map((marker) => marker.stopId)).toEqual(['day1-early', 'day1-late', 'day2']);
  });

  it('numbers the day of each marker, or gives null outside the trip', () => {
    const markers = getStopMarkers(trip, [
      makeStop({ id: 'first' }),
      makeStop({ id: 'third', date: '2026-12-15' }),
      makeStop({ id: 'outside', date: '2026-12-20' }),
    ]);
    expect(markers.map((marker) => marker.dayNumber)).toEqual([1, 3, null]);
  });

  it('does not change the order of the stops it is given', () => {
    const stops = [makeStop({ id: 'b', startTime: '10:00' }), makeStop({ id: 'a', startTime: '08:00' })];
    getStopMarkers(trip, stops);
    expect(stops.map((stop) => stop.id)).toEqual(['b', 'a']);
  });
});

describe('getMapRegion', () => {
  it('returns null when there are no markers', () => {
    expect(getMapRegion([])).toBeNull();
  });

  it('centres on a single marker and does not zoom in too far', () => {
    expect(getMapRegion([makeMarker(38.7, -9.1)])).toEqual({
      latitude: 38.7,
      longitude: -9.1,
      latitudeDelta: 0.02,
      longitudeDelta: 0.02,
    });
  });

  it('centres between the outermost markers and leaves room around them', () => {
    const region = getMapRegion([makeMarker(38, -10), makeMarker(40, -8), makeMarker(39, -9)]);
    expect(region).toEqual({
      latitude: 39,
      longitude: -9,
      latitudeDelta: 3,
      longitudeDelta: 3,
    });
  });
});

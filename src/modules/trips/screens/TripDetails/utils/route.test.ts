import type { Stop } from '../../TripList/schema/stopSchema';
import {
  buildDayRoute,
  getDistanceMeters,
  getMidpoint,
  toFormattedDistance,
} from './route';

const lisbon = { latitude: 38.7223, longitude: -9.1393 };
const porto = { latitude: 41.1579, longitude: -8.6291 };
const belem = { latitude: 38.6916, longitude: -9.216 };

describe('getDistanceMeters', () => {
  it('is zero for the same place', () => {
    expect(getDistanceMeters(lisbon, lisbon)).toBe(0);
  });

  it('matches the known straight-line distance between Lisbon and Porto (about 274 km)', () => {
    expect(getDistanceMeters(lisbon, porto) / 1000).toBeCloseTo(274, 0);
  });

  it('is the same in both directions', () => {
    expect(getDistanceMeters(lisbon, belem)).toBeCloseTo(getDistanceMeters(belem, lisbon), 6);
  });

  it('measures one degree of latitude as about 111 km', () => {
    const meters = getDistanceMeters({ latitude: 0, longitude: 0 }, { latitude: 1, longitude: 0 });
    expect(meters / 1000).toBeCloseTo(111.2, 1);
  });

  it('takes the short way round the date line', () => {
    const meters = getDistanceMeters({ latitude: 0, longitude: 179.5 }, { latitude: 0, longitude: -179.5 });
    expect(meters / 1000).toBeCloseTo(111.2, 1);
  });

  it('copes with opposite points on the globe without returning NaN', () => {
    const meters = getDistanceMeters({ latitude: 0, longitude: 0 }, { latitude: 0, longitude: 180 });
    expect(meters / 1000).toBeCloseTo(20015, 0);
  });
});

describe('getMidpoint', () => {
  it('lies halfway along a line on the equator', () => {
    const midpoint = getMidpoint({ latitude: 0, longitude: 0 }, { latitude: 0, longitude: 10 });
    expect(midpoint.latitude).toBeCloseTo(0, 6);
    expect(midpoint.longitude).toBeCloseTo(5, 6);
  });

  it('is equally far from both ends', () => {
    const midpoint = getMidpoint(lisbon, porto);
    expect(getDistanceMeters(lisbon, midpoint)).toBeCloseTo(getDistanceMeters(midpoint, porto), 0);
  });

  it('stays within -180..180 when the line crosses the date line', () => {
    const midpoint = getMidpoint({ latitude: 0, longitude: 170 }, { latitude: 0, longitude: -170 });
    expect(Math.abs(midpoint.longitude)).toBeCloseTo(180, 6);
  });
});

const makeStop = (id: string, coordinates: Stop['coordinates']): Stop => ({
  id,
  tripId: 't',
  date: '2026-12-13',
  type: 'attraction',
  title: `Stop ${id}`,
  startTime: '09:00',
  durationMin: 30,
  notes: '',
  url: '',
  coordinates,
});

describe('buildDayRoute', () => {
  it('is null without stops, and with fewer than two places', () => {
    expect(buildDayRoute([])).toBeNull();
    expect(buildDayRoute([makeStop('a', lisbon)])).toBeNull();
    expect(buildDayRoute([makeStop('a', lisbon), makeStop('b', null)])).toBeNull();
  });

  it('joins the places in the order given and numbers them', () => {
    const route = buildDayRoute([makeStop('a', lisbon), makeStop('b', belem), makeStop('c', porto)]);

    expect(route?.points.map((point) => [point.stopId, point.order])).toEqual([
      ['a', 1],
      ['b', 2],
      ['c', 3],
    ]);
    expect(route?.legs.map((leg) => [leg.from.stopId, leg.to.stopId])).toEqual([
      ['a', 'b'],
      ['b', 'c'],
    ]);
  });

  it('skips stops without a place and numbers only the ones that have one', () => {
    const route = buildDayRoute([makeStop('a', lisbon), makeStop('x', null), makeStop('b', belem)]);

    expect(route?.points.map((point) => point.order)).toEqual([1, 2]);
    expect(route?.legs).toHaveLength(1);
    expect(route?.legs[0].from.stopId).toBe('a');
    expect(route?.legs[0].to.stopId).toBe('b');
  });

  it('measures each leg and adds them up', () => {
    const route = buildDayRoute([makeStop('a', lisbon), makeStop('b', belem), makeStop('c', porto)]);

    expect(route?.legs[0].distanceMeters).toBeCloseTo(getDistanceMeters(lisbon, belem), 6);
    expect(route?.legs[1].distanceMeters).toBeCloseTo(getDistanceMeters(belem, porto), 6);
    expect(route?.totalMeters).toBeCloseTo(
      getDistanceMeters(lisbon, belem) + getDistanceMeters(belem, porto),
      6,
    );
  });

  it('puts the label of a leg halfway between its ends', () => {
    const route = buildDayRoute([makeStop('a', lisbon), makeStop('b', belem)]);
    expect(route?.legs[0].midpoint).toEqual(getMidpoint(lisbon, belem));
  });
});

describe('toFormattedDistance', () => {
  it.each([
    [0, 'meters', 0],
    [4, 'meters', 0],
    [5, 'meters', 10],
    [420, 'meters', 420],
    [423, 'meters', 420],
    [994, 'meters', 990],
  ] as const)('shows %p m as %p %p', (meters, unit, value) => {
    expect(toFormattedDistance(meters)).toEqual({ unit, value });
  });

  it.each([
    [995, 1],
    [1000, 1],
    [1240, 1.2],
    [1250, 1.3],
    [12_340, 12.3],
    [274_000, 274],
  ])('shows %p m as %p km', (meters, value) => {
    expect(toFormattedDistance(meters)).toEqual({ unit: 'kilometers', value });
  });
});

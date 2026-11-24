import type { Coordinates, Stop } from '../../TripList/schema/stopSchema';

const EARTH_RADIUS_METERS = 6_371_000;
const METERS_PER_KILOMETER = 1000;
// Below this a distance is shown in metres, from here on in kilometres.
const KILOMETER_THRESHOLD_METERS = 1000;
// Metres are rounded to this step, because "1 234 m" suggests a precision that a straight
// line between two stops does not have.
const METER_STEP = 10;

const toRadians = (degrees: number): number => (degrees * Math.PI) / 180;
const toDegrees = (radians: number): number => (radians * 180) / Math.PI;

// The distance along the earth's surface in a straight line (great circle), in metres.
// It is not the length of a walking or driving route.
export const getDistanceMeters = (from: Coordinates, to: Coordinates): number => {
  const latitudeFrom = toRadians(from.latitude);
  const latitudeTo = toRadians(to.latitude);
  const deltaLatitude = latitudeTo - latitudeFrom;
  const deltaLongitude = toRadians(to.longitude - from.longitude);

  const a =
    Math.sin(deltaLatitude / 2) ** 2 +
    Math.cos(latitudeFrom) * Math.cos(latitudeTo) * Math.sin(deltaLongitude / 2) ** 2;
  return 2 * EARTH_RADIUS_METERS * Math.asin(Math.min(1, Math.sqrt(a)));
};

// The point halfway between two places along the great circle, where a distance label goes.
export const getMidpoint = (from: Coordinates, to: Coordinates): Coordinates => {
  const latitudeFrom = toRadians(from.latitude);
  const latitudeTo = toRadians(to.latitude);
  const longitudeFrom = toRadians(from.longitude);
  const deltaLongitude = toRadians(to.longitude - from.longitude);

  const x = Math.cos(latitudeTo) * Math.cos(deltaLongitude);
  const y = Math.cos(latitudeTo) * Math.sin(deltaLongitude);
  const latitude = Math.atan2(
    Math.sin(latitudeFrom) + Math.sin(latitudeTo),
    Math.hypot(Math.cos(latitudeFrom) + x, y),
  );
  const longitude = longitudeFrom + Math.atan2(y, Math.cos(latitudeFrom) + x);

  return {
    latitude: toDegrees(latitude),
    // Keep the longitude within -180..180 when the line crosses the date line.
    longitude: ((((toDegrees(longitude) + 180) % 360) + 360) % 360) - 180,
  };
};

export type RoutePoint = {
  stopId: string;
  title: string;
  // 1-based position among the day's stops that have a place.
  order: number;
  coordinates: Coordinates;
};

export type RouteLeg = {
  from: RoutePoint;
  to: RoutePoint;
  distanceMeters: number;
  // Where the distance label is drawn.
  midpoint: Coordinates;
};

export type DayRoute = {
  points: RoutePoint[];
  legs: RouteLeg[];
  totalMeters: number;
};

// The day's stops that have a place, joined in the order of the day (the stops must already
// be in that order). Returns null when fewer than two stops have a place, because a single
// point has nothing to be joined to.
export const buildDayRoute = (dayStops: Stop[]): DayRoute | null => {
  const points = dayStops.flatMap((stop) =>
    stop.coordinates === null
      ? []
      : [{ stopId: stop.id, title: stop.title, coordinates: stop.coordinates }],
  );
  if (points.length < 2) {
    return null;
  }

  const numbered = points.map((point, index): RoutePoint => ({ ...point, order: index + 1 }));
  const legs = numbered.slice(1).map((to, index): RouteLeg => {
    const from = numbered[index];
    return {
      from,
      to,
      distanceMeters: getDistanceMeters(from.coordinates, to.coordinates),
      midpoint: getMidpoint(from.coordinates, to.coordinates),
    };
  });

  return {
    points: numbered,
    legs,
    totalMeters: legs.reduce((total, leg) => total + leg.distanceMeters, 0),
  };
};

export type FormattedDistance =
  | { unit: 'meters'; value: number }
  | { unit: 'kilometers'; value: number };

// Splits a distance into a unit and a number: 420 m, 1.2 km. Short distances are rounded to
// 10 m and long ones to 0.1 km (100 m); both are kept consistent so 996 m is "1 km", not
// "1000 m".
export const toFormattedDistance = (meters: number): FormattedDistance => {
  const roundedMeters = Math.round(meters / METER_STEP) * METER_STEP;
  if (roundedMeters < KILOMETER_THRESHOLD_METERS) {
    return { unit: 'meters', value: roundedMeters };
  }
  return {
    unit: 'kilometers',
    value: Math.round(meters / (METERS_PER_KILOMETER / 10)) / 10,
  };
};

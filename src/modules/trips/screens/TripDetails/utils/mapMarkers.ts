import type { Coordinates, Stop } from '../../TripList/schema/stopSchema';
import { getTripDays, type DateRange } from '../../TripList/utils/tripDates';

export type StopMarker = {
  stopId: string;
  title: string;
  coordinates: Coordinates;
  // 1-based day of the trip, or null for a stop on a day outside the trip's dates.
  dayNumber: number | null;
  startTime: string;
};

export type MapRegion = Coordinates & {
  latitudeDelta: number;
  longitudeDelta: number;
};

// Never zoom closer than roughly a neighbourhood, even for a single stop.
const MIN_DELTA = 0.02;
// Extra space around the outermost markers, as a factor of their spread.
const PADDING_FACTOR = 1.5;

// The stops that have a known place, in itinerary order (by day, then start time).
export const getStopMarkers = (trip: DateRange, stops: Stop[]): StopMarker[] => {
  const tripDays = getTripDays(trip);
  return [...stops]
    .sort((a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime))
    .flatMap((stop) =>
      stop.coordinates === null
        ? []
        : [
            {
              stopId: stop.id,
              title: stop.title,
              coordinates: stop.coordinates,
              dayNumber: tripDays.includes(stop.date) ? tripDays.indexOf(stop.date) + 1 : null,
              startTime: stop.startTime,
            },
          ],
    );
};

// The map area that shows all the points with some room around them. Returns null when
// there is nothing to show.
export const getRegionForCoordinates = (points: Coordinates[]): MapRegion | null => {
  if (points.length === 0) {
    return null;
  }
  const latitudes = points.map((point) => point.latitude);
  const longitudes = points.map((point) => point.longitude);
  const minLatitude = Math.min(...latitudes);
  const maxLatitude = Math.max(...latitudes);
  const minLongitude = Math.min(...longitudes);
  const maxLongitude = Math.max(...longitudes);

  return {
    latitude: (minLatitude + maxLatitude) / 2,
    longitude: (minLongitude + maxLongitude) / 2,
    latitudeDelta: Math.max((maxLatitude - minLatitude) * PADDING_FACTOR, MIN_DELTA),
    longitudeDelta: Math.max((maxLongitude - minLongitude) * PADDING_FACTOR, MIN_DELTA),
  };
};

// The map area that shows all the markers. Returns null when there are none.
export const getMapRegion = (markers: StopMarker[]): MapRegion | null =>
  getRegionForCoordinates(markers.map((marker) => marker.coordinates));

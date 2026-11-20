import type { Stop } from '../../TripList/schema/stopSchema';
import { getStopEndMinutes, timeToMinutes } from '../../TripList/utils/stopTime';
import { getTripDays, type DateRange } from '../../TripList/utils/tripDates';

// Stops of a day are ordered by start time; ties are broken by id so the order is stable.
export const compareStops = (a: Stop, b: Stop): number =>
  timeToMinutes(a.startTime) - timeToMinutes(b.startTime) || a.id.localeCompare(b.id);

export type ItineraryDay = {
  date: string;
  // 1-based position within the trip, or null for a day outside the trip's dates
  // (possible when the trip's dates were edited after stops were added).
  dayNumber: number | null;
  stops: Stop[];
};

// Every day of the trip, plus any extra day that still has stops, in date order.
export const buildItinerary = (trip: DateRange, stops: Stop[]): ItineraryDay[] => {
  const tripDays = getTripDays(trip);
  const dates = [...new Set([...tripDays, ...stops.map((stop) => stop.date)])].sort();

  return dates.map((date) => {
    const index = tripDays.indexOf(date);
    return {
      date,
      dayNumber: index === -1 ? null : index + 1,
      stops: stops.filter((stop) => stop.date === date).sort(compareStops),
    };
  });
};

// Ids of stops that overlap another stop of the same day. A stop ending exactly when the
// next one starts is not an overlap.
export const findOverlappingStopIds = (dayStops: Stop[]): Set<string> => {
  const sorted = [...dayStops].sort(compareStops);
  const overlapping = new Set<string>();

  for (let i = 0; i < sorted.length; i++) {
    const end = getStopEndMinutes(sorted[i]);
    // Stops are sorted by start time, so stop looking once one starts after this one ends.
    for (let j = i + 1; j < sorted.length && timeToMinutes(sorted[j].startTime) < end; j++) {
      overlapping.add(sorted[i].id);
      overlapping.add(sorted[j].id);
    }
  }
  return overlapping;
};

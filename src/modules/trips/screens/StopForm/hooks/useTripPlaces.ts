import type { Coordinates } from '../../TripList/schema/stopSchema';
import { useStopsStore } from '../../TripList/store/stopsStore';

// The places of the trip's stops, so the location picker can open near the trip. Leaves out
// the stop being edited, because its own place is already the picker's starting point.
export const useTripPlaces = (tripId: string, excludeStopId: string | null = null): Coordinates[] => {
  const stops = useStopsStore((state) => state.stops);
  return stops.flatMap((stop) =>
    stop.tripId === tripId && stop.id !== excludeStopId && stop.coordinates !== null
      ? [stop.coordinates]
      : [],
  );
};

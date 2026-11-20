import { useTripsStore } from '@/modules/trips/screens/TripList/store/tripsStore';
import { getTripStatus, startOfDay } from '@/modules/trips/screens/TripList/utils/tripDates';

// Counts of the user's trips. "Upcoming" includes a trip that is happening right now,
// matching the Upcoming tab on the Trips screen.
export const useTripStats = () => {
  const trips = useTripsStore((state) => state.trips);
  const today = startOfDay(new Date());

  const past = trips.filter((trip) => getTripStatus(trip, today) === 'past').length;

  return { total: trips.length, upcoming: trips.length - past, past };
};

import { useState } from 'react';

import { useTripsStore, type Trip } from '../store/tripsStore';
import { getTripStatus, parseLocalDate, startOfDay } from '../utils/tripDates';

export type TripListTab = 'upcoming' | 'past';

export const useTripList = () => {
  const trips = useTripsStore((state) => state.trips);
  const [tab, setTab] = useState<TripListTab>('upcoming');

  const today = startOfDay(new Date());
  const isPastTab = tab === 'past';

  const visibleTrips: Trip[] = trips
    .filter((trip) => (getTripStatus(trip, today) === 'past') === isPastTab)
    .sort((a, b) => {
      const byStart = parseLocalDate(a.startDate).getTime() - parseLocalDate(b.startDate).getTime();
      // Upcoming trips: soonest first. Past trips: most recent first.
      return isPastTab ? -byStart : byStart;
    });

  return { tab, setTab, visibleTrips, today };
};

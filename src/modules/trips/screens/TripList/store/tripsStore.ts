import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { createSafeJsonStorage } from '@/shared/store/safeStorage';
import { usePersistHydrated } from '@/shared/store/usePersistHydrated';

import { parseStoredTrips, type Trip } from '../schema/tripSchema';

export type { Trip };

export type NewTripInput = Pick<
  Trip,
  'title' | 'destination' | 'notes' | 'startDate' | 'endDate'
>;

type TripsState = {
  trips: Trip[];
  addTrip: (input: NewTripInput) => void;
  updateTrip: (id: string, input: NewTripInput) => void;
  deleteTrip: (id: string) => void;
};

// TODO: replace the hard-coded sample trips with real data once the backend exists.
const sampleTrips: Trip[] = [
  {
    id: 'sample-lisbon',
    title: 'Lisbon city break',
    destination: 'Lisbon, Portugal',
    notes: '',
    startDate: '2026-12-13',
    endDate: '2026-12-15',
    stopsCount: 9,
  },
  {
    id: 'sample-tatra',
    title: 'Tatra Mountains',
    destination: 'Zakopane, Poland',
    notes: '',
    startDate: '2026-08-14',
    endDate: '2026-08-17',
    stopsCount: 12,
  },
];

export const useTripsStore = create<TripsState>()(
  persist(
    (set) => ({
      // Used on the very first launch; once trips are saved they replace these.
      trips: sampleTrips,
      // TODO: send the new trip to the backend instead of only keeping it on the device.
      addTrip: (input) =>
        set((state) => ({
          trips: [
            ...state.trips,
            { ...input, id: `trip-${Date.now().toString(36)}`, stopsCount: 0 },
          ],
        })),
      // TODO: persist the change through the backend as well.
      updateTrip: (id, input) =>
        set((state) => ({
          trips: state.trips.map((trip) => (trip.id === id ? { ...trip, ...input } : trip)),
        })),
      // TODO: delete the trip on the backend as well.
      deleteTrip: (id) =>
        set((state) => ({ trips: state.trips.filter((trip) => trip.id !== id) })),
    }),
    {
      name: 'trips',
      version: 1,
      storage: createSafeJsonStorage<Pick<TripsState, 'trips'>>(),
      partialize: ({ trips }) => ({ trips }),
      // An empty saved list is valid (the user deleted every trip) and must not bring the
      // sample trips back. Only a missing or unreadable value falls back to the defaults.
      merge: (persisted, current) => {
        const stored = parseStoredTrips((persisted as Partial<TripsState> | undefined)?.trips);
        return { ...current, trips: stored ?? current.trips };
      },
    },
  ),
);

// True once the saved trips have been read from storage.
export const useTripsHydrated = (): boolean => usePersistHydrated(useTripsStore.persist);

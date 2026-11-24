import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { createSafeJsonStorage } from '@/shared/store/safeStorage';
import { usePersistHydrated } from '@/shared/store/usePersistHydrated';

import { parseStoredStops, type Stop, type StopInput } from '../schema/stopSchema';

type StopsState = {
  stops: Stop[];
  addStop: (tripId: string, input: StopInput) => void;
  updateStop: (id: string, input: StopInput) => void;
  deleteStop: (id: string) => void;
  deleteTripStops: (tripId: string) => void;
  // Replaces every saved stop with the sample stops. Used by the development reset.
  resetToSamples: () => void;
};

// TODO: replace the hard-coded sample stops with real data once the backend exists.
const sampleStops: Stop[] = [
  {
    id: 'sample-stop-1',
    tripId: 'sample-lisbon',
    date: '2026-12-13',
    type: 'lodging',
    title: 'Hotel check-in',
    startTime: '15:00',
    durationMin: 30,
    notes: 'Alfama district',
    url: '',
    coordinates: { latitude: 38.711, longitude: -9.1303 },
  },
  {
    id: 'sample-stop-2',
    tripId: 'sample-lisbon',
    date: '2026-12-13',
    type: 'meal',
    title: 'Dinner at Time Out Market',
    startTime: '19:30',
    durationMin: 90,
    notes: '',
    url: '',
    coordinates: { latitude: 38.7071, longitude: -9.1457 },
  },
  {
    id: 'sample-stop-3',
    tripId: 'sample-lisbon',
    date: '2026-12-14',
    type: 'attraction',
    title: 'Belém Tower',
    startTime: '10:00',
    durationMin: 90,
    notes: '',
    url: '',
    coordinates: { latitude: 38.6916, longitude: -9.216 },
  },
  {
    id: 'sample-stop-4',
    tripId: 'sample-lisbon',
    date: '2026-12-14',
    type: 'meal',
    title: 'Pastéis de Belém',
    startTime: '12:00',
    durationMin: 45,
    notes: '',
    url: '',
    coordinates: { latitude: 38.6975, longitude: -9.2032 },
  },
  {
    id: 'sample-stop-5',
    tripId: 'sample-lisbon',
    date: '2026-12-15',
    type: 'attraction',
    title: 'Sintra day trip',
    startTime: '09:00',
    durationMin: 480,
    notes: '',
    url: '',
    coordinates: { latitude: 38.7876, longitude: -9.3906 },
  },
  {
    id: 'sample-stop-6',
    tripId: 'sample-tatra',
    date: '2026-08-14',
    type: 'lodging',
    title: 'Check in',
    startTime: '16:00',
    durationMin: 30,
    notes: '',
    url: '',
    coordinates: { latitude: 49.2992, longitude: 19.9496 },
  },
  {
    id: 'sample-stop-7',
    tripId: 'sample-tatra',
    date: '2026-08-15',
    type: 'attraction',
    title: 'Morskie Oko hike',
    startTime: '08:00',
    durationMin: 360,
    notes: '',
    url: '',
    coordinates: { latitude: 49.1988, longitude: 20.0708 },
  },
  {
    id: 'sample-stop-8',
    tripId: 'sample-tatra',
    date: '2026-08-16',
    type: 'meal',
    title: 'Lunch at the shelter',
    startTime: '13:00',
    durationMin: 60,
    notes: '',
    url: '',
    coordinates: { latitude: 49.2005, longitude: 20.0705 },
  },
  {
    id: 'sample-stop-9',
    tripId: 'sample-tatra',
    date: '2026-08-17',
    type: 'other',
    title: 'Drive home',
    startTime: '10:00',
    durationMin: 240,
    notes: '',
    url: '',
    coordinates: null,
  },
];

export const useStopsStore = create<StopsState>()(
  persist(
    (set) => ({
      // Used on the very first launch; once stops are saved they replace these.
      stops: sampleStops,
      // TODO: send changes to the backend instead of only keeping them on the device.
      addStop: (tripId, input) =>
        set((state) => ({
          stops: [...state.stops, { ...input, tripId, id: `stop-${Date.now().toString(36)}` }],
        })),
      updateStop: (id, input) =>
        set((state) => ({
          stops: state.stops.map((stop) => (stop.id === id ? { ...stop, ...input } : stop)),
        })),
      deleteStop: (id) => set((state) => ({ stops: state.stops.filter((stop) => stop.id !== id) })),
      deleteTripStops: (tripId) =>
        set((state) => ({ stops: state.stops.filter((stop) => stop.tripId !== tripId) })),
      resetToSamples: () => set({ stops: sampleStops }),
    }),
    {
      name: 'stops',
      version: 1,
      storage: createSafeJsonStorage<Pick<StopsState, 'stops'>>(),
      partialize: ({ stops }) => ({ stops }),
      // An empty saved list is valid and must not bring the sample stops back.
      merge: (persisted, current) => {
        const stored = parseStoredStops((persisted as Partial<StopsState> | undefined)?.stops);
        return { ...current, stops: stored ?? current.stops };
      },
    },
  ),
);

// Number of stops planned for a trip.
export const useStopCount = (tripId: string): number =>
  useStopsStore((state) => state.stops.filter((stop) => stop.tripId === tripId).length);

// True once the saved stops have been read from storage.
export const useStopsHydrated = (): boolean => usePersistHydrated(useStopsStore.persist);

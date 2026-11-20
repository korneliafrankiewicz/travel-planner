import { create } from 'zustand';

export type Trip = {
  id: string;
  title: string;
  destination: string;
  notes: string;
  // Local calendar dates in ISO format (YYYY-MM-DD).
  startDate: string;
  endDate: string;
  stopsCount: number;
};

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

export const useTripsStore = create<TripsState>()((set) => ({
  trips: sampleTrips,
  // TODO: send the new trip to the backend instead of only keeping it in memory.
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
}));

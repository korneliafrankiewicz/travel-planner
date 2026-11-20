import { create } from 'zustand';

export type Trip = {
  id: string;
  title: string;
  // Local calendar dates in ISO format (YYYY-MM-DD).
  startDate: string;
  endDate: string;
  stopsCount: number;
};

type TripsState = {
  trips: Trip[];
};

// TODO: replace the hard-coded sample trips with real data once the backend exists.
const sampleTrips: Trip[] = [
  {
    id: 'sample-lisbon',
    title: 'Lisbon city break',
    startDate: '2026-12-13',
    endDate: '2026-12-15',
    stopsCount: 9,
  },
  {
    id: 'sample-tatra',
    title: 'Tatra Mountains',
    startDate: '2026-08-14',
    endDate: '2026-08-17',
    stopsCount: 12,
  },
];

export const useTripsStore = create<TripsState>()(() => ({
  trips: sampleTrips,
}));

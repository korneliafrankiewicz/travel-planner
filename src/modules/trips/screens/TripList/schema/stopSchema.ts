import { z } from 'zod';

import { createIsoDateSchema } from './tripSchema';

export const stopTypes = ['lodging', 'meal', 'attraction', 'other'] as const;
export type StopType = (typeof stopTypes)[number];

// 24-hour time, HH:mm.
export const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;
// Links are only ever https, so they can be opened safely.
export const HTTPS_URL_PATTERN = /^https:\/\/[^\s/$.?#][^\s]*$/i;
// A stop lasts at most one day.
export const MAX_DURATION_MINUTES = 1440;

// A stop is one planned item (hotel, meal, sight, ...) on one day of a trip.
// Stops of a day are ordered by `startTime`.
export const stopSchema = z.object({
  id: z.string().min(1),
  tripId: z.string().min(1),
  // The day of the trip, as YYYY-MM-DD.
  date: createIsoDateSchema(),
  type: z.enum(stopTypes),
  title: z.string(),
  startTime: z.string().regex(TIME_PATTERN),
  durationMin: z.number().int().min(0).max(MAX_DURATION_MINUTES),
  notes: z.string(),
  // Empty, or an https link.
  url: z.string().refine((value) => value === '' || HTTPS_URL_PATTERN.test(value)),
});

export type Stop = z.infer<typeof stopSchema>;

// What the user fills in; the id and trip are assigned by the store.
export type StopInput = Omit<Stop, 'id' | 'tripId'>;

// Reads stops back from storage. Returns null when the stored value is not a list at all,
// and drops individual entries that are malformed, so bad data can never crash the app.
export const parseStoredStops = (value: unknown): Stop[] | null => {
  if (!Array.isArray(value)) {
    return null;
  }
  return value.flatMap((item) => {
    const result = stopSchema.safeParse(item);
    return result.success ? [result.data] : [];
  });
};

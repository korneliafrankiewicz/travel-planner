import { z } from 'zod';

import { parseLocalDate, toIsoDate } from '../utils/tripDates';

// A calendar date as YYYY-MM-DD that really exists (rejects e.g. 2026-02-31).
// `error` is the message used for any failure (missing, wrong format or impossible date).
export const createIsoDateSchema = (error?: string) =>
  z
    .string({ error })
    .regex(/^\d{4}-\d{2}-\d{2}$/, { error })
    .refine((value) => toIsoDate(parseLocalDate(value)) === value, { error });

const isoDateSchema = createIsoDateSchema();

// The trip entity, as it is kept in the store and in persisted storage.
// Past dates are valid here: a trip that was planned in advance becomes a past trip later.
export const tripSchema = z
  .object({
    id: z.string().min(1),
    title: z.string(),
    destination: z.string(),
    notes: z.string(),
    startDate: isoDateSchema,
    endDate: isoDateSchema,
  })
  .refine((trip) => trip.endDate >= trip.startDate);

export type Trip = z.infer<typeof tripSchema>;

// Reads trips back from storage. Returns null when the stored value is not a list at all,
// and drops individual entries that are malformed, so bad data can never crash the app.
export const parseStoredTrips = (value: unknown): Trip[] | null => {
  if (!Array.isArray(value)) {
    return null;
  }
  return value.flatMap((item) => {
    const result = tripSchema.safeParse(item);
    return result.success ? [result.data] : [];
  });
};

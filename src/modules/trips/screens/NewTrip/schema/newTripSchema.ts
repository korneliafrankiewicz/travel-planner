import { z } from 'zod';

import { createIsoDateSchema } from '../../TripList/schema/tripSchema';
import type { NewTripInput } from '../../TripList/store/tripsStore';

export type NewTripValues = {
  title: string;
  destination: string;
  notes: string;
  // Local calendar dates in ISO format (YYYY-MM-DD), or null until selected.
  startDate: string | null;
  endDate: string | null;
};

export const emptyNewTripValues: NewTripValues = {
  title: '',
  destination: '',
  notes: '',
  startDate: null,
  endDate: null,
};

// Error messages are translation keys (in the `trips` namespace), not user-facing text.
const TITLE_REQUIRED = 'form.errors.titleRequired';
const DATES_REQUIRED = 'form.errors.datesRequired';
const PAST_DATE = 'form.errors.pastDate';
const END_BEFORE_START = 'form.errors.endBeforeStart';

type DateErrorKey = typeof DATES_REQUIRED | typeof PAST_DATE | typeof END_BEFORE_START;
const dateErrorKeys: readonly string[] = [DATES_REQUIRED, PAST_DATE, END_BEFORE_START];

export type NewTripErrors = {
  title?: typeof TITLE_REQUIRED;
  dates?: DateErrorKey;
};

type NewTripSchemaOptions = {
  // Today as YYYY-MM-DD. Trips can only be planned in advance, so earlier dates are rejected.
  today: string;
  // A start date that is allowed even though it is in the past. Used when editing a trip
  // that has already started, so its other details can still be changed.
  keepStartDate?: string | null;
};

export const createNewTripSchema = ({ today, keepStartDate = null }: NewTripSchemaOptions) =>
  z
    .object({
      title: z.string().trim().min(1, { error: TITLE_REQUIRED }),
      destination: z.string().trim(),
      notes: z.string().trim(),
      startDate: createIsoDateSchema(DATES_REQUIRED),
      endDate: createIsoDateSchema(DATES_REQUIRED),
    })
    .superRefine((values, context) => {
      if (values.endDate < values.startDate) {
        context.addIssue({ code: 'custom', path: ['endDate'], message: END_BEFORE_START });
      }
      if (values.startDate < today && values.startDate !== keepStartDate) {
        context.addIssue({ code: 'custom', path: ['startDate'], message: PAST_DATE });
      }
    });

export type NewTripResult =
  | { success: true; data: NewTripInput }
  | { success: false; errors: NewTripErrors };

const isDateErrorKey = (message: string): message is DateErrorKey =>
  dateErrorKeys.includes(message);

// Validates the form values. On success returns the cleaned values (text is trimmed);
// otherwise returns at most one error per form field.
export const validateNewTrip = (
  values: NewTripValues,
  options: NewTripSchemaOptions,
): NewTripResult => {
  const result = createNewTripSchema(options).safeParse(values);
  if (result.success) {
    return { success: true, data: result.data };
  }

  const errors: NewTripErrors = {};
  for (const issue of result.error.issues) {
    const field = issue.path[0];
    if (field === 'title' && issue.message === TITLE_REQUIRED) {
      errors.title ??= TITLE_REQUIRED;
    } else if ((field === 'startDate' || field === 'endDate') && isDateErrorKey(issue.message)) {
      errors.dates ??= issue.message;
    }
  }
  return { success: false, errors };
};

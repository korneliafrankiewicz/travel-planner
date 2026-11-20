import { z } from 'zod';

import {
  HTTPS_URL_PATTERN,
  MAX_DURATION_MINUTES,
  stopTypes,
  TIME_PATTERN,
  type StopInput,
  type StopType,
} from '../../TripList/schema/stopSchema';
import { createIsoDateSchema } from '../../TripList/schema/tripSchema';
import { timeToMinutes } from '../../TripList/utils/stopTime';

// What the form holds while the user types. Everything the user types is a string.
export type StopFormValues = {
  type: StopType;
  title: string;
  date: string;
  startTime: string;
  duration: string;
  notes: string;
  url: string;
};

// Error messages are translation keys (in the `trips` namespace), not user-facing text.
const TITLE_REQUIRED = 'stop.errors.titleRequired';
const DATE_INVALID = 'stop.errors.dateInvalid';
const DAY_OUT_OF_RANGE = 'stop.errors.dayOutOfRange';
const PAST_DATE = 'stop.errors.pastDate';
const TIME_INVALID = 'stop.errors.timeInvalid';
const DURATION_INVALID = 'stop.errors.durationInvalid';
const ENDS_AFTER_MIDNIGHT = 'stop.errors.endsAfterMidnight';
const URL_INVALID = 'stop.errors.urlInvalid';

const errorKeys = [
  TITLE_REQUIRED,
  DATE_INVALID,
  DAY_OUT_OF_RANGE,
  PAST_DATE,
  TIME_INVALID,
  DURATION_INVALID,
  ENDS_AFTER_MIDNIGHT,
  URL_INVALID,
] as const;
export type StopErrorKey = (typeof errorKeys)[number];

const isErrorKey = (message: string): message is StopErrorKey =>
  (errorKeys as readonly string[]).includes(message);

const errorFields = ['title', 'date', 'startTime', 'duration', 'url'] as const;
type ErrorField = (typeof errorFields)[number];
export type StopFormErrors = Partial<Record<ErrorField, StopErrorKey>>;

const isErrorField = (field: unknown): field is ErrorField =>
  (errorFields as readonly unknown[]).includes(field);

type StopFormSchemaOptions = {
  // Today as YYYY-MM-DD. Stops can only be planned for today or later.
  today: string;
  // The trip's first and last day. A stop must be on one of the trip's days.
  tripStart: string;
  tripEnd: string;
  // A day that stays valid even if it is in the past or outside the trip. Used when editing
  // a stop that is already on such a day, so its other details can still be changed.
  keepDate: string | null;
};

export const createStopFormSchema = ({
  today,
  tripStart,
  tripEnd,
  keepDate,
}: StopFormSchemaOptions) =>
  z
    .object({
      type: z.enum(stopTypes),
      title: z.string().trim().min(1, { error: TITLE_REQUIRED }),
      date: createIsoDateSchema(DATE_INVALID),
      startTime: z.string().trim().regex(TIME_PATTERN, { error: TIME_INVALID }),
      duration: z
        .string()
        .trim()
        .regex(/^\d{1,4}$/, { error: DURATION_INVALID })
        .transform(Number)
        .pipe(z.number().max(MAX_DURATION_MINUTES, { error: DURATION_INVALID })),
      notes: z.string().trim(),
      url: z
        .string()
        .trim()
        .refine((value) => value === '' || HTTPS_URL_PATTERN.test(value), { error: URL_INVALID }),
    })
    .superRefine((values, context) => {
      if (values.date !== keepDate) {
        if (values.date < tripStart || values.date > tripEnd) {
          context.addIssue({ code: 'custom', path: ['date'], message: DAY_OUT_OF_RANGE });
        } else if (values.date < today) {
          context.addIssue({ code: 'custom', path: ['date'], message: PAST_DATE });
        }
      }
      if (timeToMinutes(values.startTime) + values.duration > MAX_DURATION_MINUTES) {
        context.addIssue({ code: 'custom', path: ['duration'], message: ENDS_AFTER_MIDNIGHT });
      }
    })
    .transform(({ duration, ...rest }): StopInput => ({ ...rest, durationMin: duration }));

export type StopFormResult =
  | { success: true; data: StopInput }
  | { success: false; errors: StopFormErrors };

// Validates the form values. On success returns the cleaned values (text trimmed, duration
// as a number); otherwise returns at most one error per form field.
export const validateStopForm = (
  values: StopFormValues,
  options: StopFormSchemaOptions,
): StopFormResult => {
  const result = createStopFormSchema(options).safeParse(values);
  if (result.success) {
    return { success: true, data: result.data };
  }

  const errors: StopFormErrors = {};
  for (const issue of result.error.issues) {
    const field = issue.path[0];
    if (isErrorField(field) && isErrorKey(issue.message)) {
      errors[field] ??= issue.message;
    }
  }
  return { success: false, errors };
};

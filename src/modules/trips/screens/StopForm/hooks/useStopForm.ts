import { useRouter } from 'expo-router';
import { useState } from 'react';

import type { StopInput } from '../../TripList/schema/stopSchema';
import { getTripDays, toIsoDate, type DateRange } from '../../TripList/utils/tripDates';
import { validateStopForm, type StopFormValues } from '../schema/stopFormSchema';

type UseStopFormOptions = {
  // The trip the stop belongs to; the stop must be on one of its days.
  trip: DateRange;
  initialValues: StopFormValues;
  // A day that stays valid even if it is in the past or outside the trip. Used when editing
  // a stop that is already on such a day.
  keepDate: string | null;
  onSave: (input: StopInput) => void;
};

export type DayOption = {
  date: string;
  // 1-based position within the trip, or null for a day outside the trip's dates.
  dayNumber: number | null;
  disabled: boolean;
};

// Shared by the "new stop" and "edit stop" screens.
export const useStopForm = ({ trip, initialValues, keepDate, onSave }: UseStopFormOptions) => {
  const router = useRouter();

  const [values, setValues] = useState<StopFormValues>(initialValues);
  // Errors only show after the first save attempt, so the form does not start out red.
  const [submitted, setSubmitted] = useState(false);
  // Stops can only be planned in advance: no day before today can be chosen.
  const [today] = useState(() => toIsoDate(new Date()));

  const validation = validateStopForm(values, {
    today,
    tripStart: trip.startDate,
    tripEnd: trip.endDate,
    keepDate,
  });
  const errors = submitted && !validation.success ? validation.errors : {};

  const tripDays = getTripDays(trip);
  const dates =
    keepDate !== null && !tripDays.includes(keepDate) ? [...tripDays, keepDate].sort() : tripDays;
  const days: DayOption[] = dates.map((date) => {
    const index = tripDays.indexOf(date);
    return {
      date,
      dayNumber: index === -1 ? null : index + 1,
      disabled: date < today && date !== keepDate,
    };
  });

  const setField = <Field extends keyof StopFormValues>(
    field: Field,
    value: StopFormValues[Field],
  ) => setValues((current) => ({ ...current, [field]: value }));

  const close = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/');
    }
  };

  const submit = () => {
    setSubmitted(true);
    if (!validation.success) {
      return;
    }
    onSave(validation.data);
    close();
  };

  return { values, errors, days, setField, submit, close };
};

export type StopFormState = ReturnType<typeof useStopForm>;

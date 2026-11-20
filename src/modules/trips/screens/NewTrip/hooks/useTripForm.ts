import { useRouter } from 'expo-router';
import { useState } from 'react';

import type { NewTripInput } from '../../TripList/store/tripsStore';
import { toIsoDate } from '../../TripList/utils/tripDates';
import { validateNewTrip, type NewTripValues } from '../schema/newTripSchema';
import { selectDateInRange } from '../utils/calendar';

// Shared by the "new trip" and "edit trip" screens.
export const useTripForm = (
  initialValues: NewTripValues,
  onSave: (input: NewTripInput) => void,
) => {
  const router = useRouter();

  const [values, setValues] = useState<NewTripValues>(initialValues);
  // Errors only show after the first save attempt, so the form does not start out red.
  const [submitted, setSubmitted] = useState(false);
  // Trips can only be planned in advance: no date before today can be chosen.
  const [today] = useState(() => toIsoDate(new Date()));

  const validation = validateNewTrip(values, {
    today,
    // Editing a trip that already started keeps its original start date valid until changed.
    keepStartDate: initialValues.startDate,
  });
  const errors = submitted && !validation.success ? validation.errors : {};

  const setField = (field: 'title' | 'destination' | 'notes', value: string) =>
    setValues((current) => ({ ...current, [field]: value }));

  const selectDate = (date: string) => {
    if (date < today) {
      return;
    }
    setValues((current) => ({ ...current, ...selectDateInRange(current, date) }));
  };

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

  return { values, errors, today, setField, selectDate, submit, close };
};

export type TripFormState = ReturnType<typeof useTripForm>;

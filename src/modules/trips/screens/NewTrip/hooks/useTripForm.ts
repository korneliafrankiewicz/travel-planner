import { useRouter } from 'expo-router';
import { useState } from 'react';

import type { NewTripInput } from '../../TripList/store/tripsStore';
import {
  hasErrors,
  validateNewTrip,
  type NewTripErrors,
  type NewTripValues,
} from '../schema/newTripSchema';
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

  const errors: NewTripErrors = submitted ? validateNewTrip(values) : {};

  const setField = (field: 'title' | 'destination' | 'notes', value: string) =>
    setValues((current) => ({ ...current, [field]: value }));

  const selectDate = (date: string) =>
    setValues((current) => ({ ...current, ...selectDateInRange(current, date) }));

  const close = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/');
    }
  };

  const submit = () => {
    setSubmitted(true);
    const { startDate, endDate } = values;
    if (hasErrors(validateNewTrip(values)) || startDate === null || endDate === null) {
      return;
    }

    onSave({
      title: values.title.trim(),
      destination: values.destination.trim(),
      notes: values.notes.trim(),
      startDate,
      endDate,
    });
    close();
  };

  return { values, errors, setField, selectDate, submit, close };
};

export type TripFormState = ReturnType<typeof useTripForm>;

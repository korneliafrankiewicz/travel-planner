export type NewTripValues = {
  title: string;
  destination: string;
  notes: string;
  // Local calendar dates in ISO format (YYYY-MM-DD), or null until selected.
  startDate: string | null;
  endDate: string | null;
};

// Errors are translation keys (in the `trips` namespace), not user-facing text.
export type NewTripErrors = {
  title?: 'form.errors.titleRequired';
  dates?: 'form.errors.datesRequired';
};

export const emptyNewTripValues: NewTripValues = {
  title: '',
  destination: '',
  notes: '',
  startDate: null,
  endDate: null,
};

export const validateNewTrip = (values: NewTripValues): NewTripErrors => {
  const errors: NewTripErrors = {};

  if (values.title.trim() === '') {
    errors.title = 'form.errors.titleRequired';
  }
  if (values.startDate === null || values.endDate === null) {
    errors.dates = 'form.errors.datesRequired';
  }

  return errors;
};

export const hasErrors = (errors: NewTripErrors): boolean => Object.keys(errors).length > 0;

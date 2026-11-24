import { useState } from 'react';

import { useSessionStore } from '@/shared/auth/sessionStore';

import { useAuthSubmit } from '../../../hooks/useAuthSubmit';
import { emptyLogInValues, validateLogIn, type LogInValues } from '../../../schema/authSchemas';

export const useLoginForm = () => {
  const signIn = useSessionStore((state) => state.signIn);
  const [values, setValues] = useState<LogInValues>(emptyLogInValues);
  // Errors only show after the first attempt, so the form does not start out red.
  const [submitted, setSubmitted] = useState(false);
  const { submitting, errorKey, run, clearError } = useAuthSubmit();

  const validation = validateLogIn(values);
  const errors = submitted && !validation.success ? validation.errors : {};

  const setField = (field: keyof LogInValues, value: string) => {
    setValues((current) => ({ ...current, [field]: value }));
    // What was wrong may be fixed by this edit, so the old message goes.
    clearError();
  };

  // On success the session changes and the navigation moves the user into the app, so there
  // is nothing to do here afterwards.
  const submit = () => {
    setSubmitted(true);
    if (validation.success) {
      void run(() => signIn(validation.data));
    }
  };

  return { values, errors, formErrorKey: errorKey, submitting, setField, submit };
};

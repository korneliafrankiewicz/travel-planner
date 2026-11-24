import { useState } from 'react';

import { useSessionStore } from '@/shared/auth/sessionStore';

import { useAuthSubmit } from '../../../hooks/useAuthSubmit';
import { emptySignUpValues, validateSignUp, type SignUpValues } from '../../../schema/authSchemas';

export const useSignUpForm = () => {
  const signUp = useSessionStore((state) => state.signUp);
  const [values, setValues] = useState<SignUpValues>(emptySignUpValues);
  // Errors only show after the first attempt, so the form does not start out red.
  const [submitted, setSubmitted] = useState(false);
  const { submitting, errorKey, run, clearError } = useAuthSubmit();

  const validation = validateSignUp(values);
  const errors = submitted && !validation.success ? validation.errors : {};

  const setField = <Field extends keyof SignUpValues>(field: Field, value: SignUpValues[Field]) => {
    setValues((current) => ({ ...current, [field]: value }));
    clearError();
  };

  // On success the session changes and the navigation moves the user into the app.
  const submit = () => {
    setSubmitted(true);
    if (validation.success) {
      const { name, email, password } = validation.data;
      void run(() => signUp({ name, email, password }));
    }
  };

  return { values, errors, formErrorKey: errorKey, submitting, setField, submit };
};

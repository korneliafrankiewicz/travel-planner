import { useState } from 'react';

import { authService } from '@/shared/auth/authService';

import { useAuthSubmit } from '../../../hooks/useAuthSubmit';
import {
  emptyForgotPasswordValues,
  validateForgotPassword,
  type ForgotPasswordValues,
} from '../../../schema/authSchemas';

export const useForgotPasswordForm = () => {
  const [values, setValues] = useState<ForgotPasswordValues>(emptyForgotPasswordValues);
  const [submitted, setSubmitted] = useState(false);
  // The address a reset link was asked for; set once the request went through.
  const [sentTo, setSentTo] = useState<string | null>(null);
  const { submitting, errorKey, run, clearError } = useAuthSubmit();

  const validation = validateForgotPassword(values);
  const errors = submitted && !validation.success ? validation.errors : {};

  const setEmail = (email: string) => {
    setValues({ email });
    clearError();
  };

  const submit = async () => {
    setSubmitted(true);
    if (!validation.success) {
      return;
    }
    const { email } = validation.data;
    if (await run(() => authService.requestPasswordReset(email))) {
      setSentTo(email);
    }
  };

  return { values, errors, formErrorKey: errorKey, submitting, sentTo, setEmail, submit };
};

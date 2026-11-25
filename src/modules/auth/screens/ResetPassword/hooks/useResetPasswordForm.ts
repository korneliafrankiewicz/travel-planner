import { useState } from 'react';

import { authService } from '@/shared/auth/authService';

import { useAuthSubmit } from '../../../hooks/useAuthSubmit';
import {
  emptyResetPasswordValues,
  validateResetPassword,
  type ResetPasswordValues,
} from '../../../schema/authSchemas';

// The form for choosing a new password with the token from the link in the reset email.
export const useResetPasswordForm = (token: string) => {
  const [values, setValues] = useState<ResetPasswordValues>(emptyResetPasswordValues);
  const [submitted, setSubmitted] = useState(false);
  // True once the server accepted the new password.
  const [done, setDone] = useState(false);
  const { submitting, errorKey, run, clearError } = useAuthSubmit();

  const validation = validateResetPassword(values);
  const errors = submitted && !validation.success ? validation.errors : {};

  const setField = (field: keyof ResetPasswordValues, value: string) => {
    setValues((current) => ({ ...current, [field]: value }));
    clearError();
  };

  const submit = async () => {
    setSubmitted(true);
    if (!validation.success) {
      return;
    }
    const { password } = validation.data;
    if (await run(() => authService.confirmPasswordReset(token, password))) {
      setDone(true);
    }
  };

  return { values, errors, formErrorKey: errorKey, submitting, done, setField, submit };
};

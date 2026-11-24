import { useRef, useState } from 'react';

import { toFormErrorKey, type AuthFormErrorKey } from '../utils/authErrors';

// Runs a request of a log in, sign up or password reset form: tells the screen while it is
// running, refuses a second request meanwhile, and turns a failure into a message.
export const useAuthSubmit = () => {
  const [submitting, setSubmitting] = useState(false);
  const [errorKey, setErrorKey] = useState<AuthFormErrorKey | null>(null);
  // A state value would still be stale between two quick taps, so a ref guards the request.
  const inFlight = useRef(false);

  // Resolves to true when the request succeeded, false when it failed or was refused.
  const run = async (request: () => Promise<void>): Promise<boolean> => {
    if (inFlight.current) {
      return false;
    }
    inFlight.current = true;
    setSubmitting(true);
    setErrorKey(null);
    try {
      await request();
      return true;
    } catch (error) {
      setErrorKey(toFormErrorKey(error));
      return false;
    } finally {
      inFlight.current = false;
      setSubmitting(false);
    }
  };

  const clearError = () => setErrorKey(null);

  return { submitting, errorKey, run, clearError };
};

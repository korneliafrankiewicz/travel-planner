// The error codes the API answers with. The first five are the ones the app's `AuthError` knows,
// with the same names, so the app can turn them into its own messages.
export type ErrorCode =
  | 'invalidCredentials'
  | 'emailTaken'
  | 'invalidSession'
  | 'validation'
  | 'invalidResetToken'
  | 'rateLimited'
  | 'notFound'
  | 'payloadTooLarge'
  | 'internal';

export type FieldProblem = { field: string; message: string };

// A failure that is the caller's to know about. Anything else that is thrown is a bug and is
// answered with a general message (see the error handler in app.ts).
export class HttpError extends Error {
  readonly statusCode: number;
  readonly code: ErrorCode;
  readonly details: FieldProblem[] | undefined;

  constructor(statusCode: number, code: ErrorCode, message: string, details?: FieldProblem[]) {
    super(message);
    this.name = 'HttpError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}

export type ErrorBody = {
  error: { code: ErrorCode; message: string; details?: FieldProblem[] };
};

export const toErrorBody = (error: HttpError): ErrorBody => ({
  error: {
    code: error.code,
    message: error.message,
    ...(error.details !== undefined ? { details: error.details } : {}),
  },
});

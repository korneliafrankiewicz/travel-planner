import type { ApiTarget } from './apiUrl';
import { createFakeAuthService } from './fakeAuthService';
import { createHttpAuthService } from './httpAuthService';
import type { AuthService } from './types';

// How long the stand-in takes to answer, so the loading states can be seen on a device.
const FAKE_DELAY_MS = 700;

export const selectAuthService = (target: ApiTarget): AuthService =>
  target.kind === 'http'
    ? createHttpAuthService({ baseUrl: target.baseUrl })
    : createFakeAuthService({ delayMs: FAKE_DELAY_MS });

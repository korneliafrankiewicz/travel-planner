import { createFakeAuthService } from './fakeAuthService';
import type { AuthService } from './types';

// How long the stand-in takes to answer, so the loading states can be seen on a device.
const FAKE_DELAY_MS = 700;

// The auth service the app uses. Everything goes through this one export, so connecting a
// real back end means replacing this line.
// TODO: replace the stand-in with the real service once the back end exists. It accepts any
// password and is not secure, so the app must not be released with it.
export const authService: AuthService = createFakeAuthService({ delayMs: FAKE_DELAY_MS });

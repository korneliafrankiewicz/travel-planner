import Constants from 'expo-constants';

import { resolveApiTarget } from './apiUrl';
import { selectAuthService } from './selectAuthService';
import type { AuthService } from './types';

// The auth service the app uses. Everything goes through this one export.
//
// With `EXPO_PUBLIC_API_URL` set (see `env.example`) it is the real back end in `server/`.
// Without it, it is a stand-in that runs inside the app, accepts any password and keeps no
// accounts. That makes the app easy to try, but it is not secure, so a release must always set
// the address of the server (and it must be https).
const target = resolveApiTarget({
  // Must be written exactly like this: Expo only replaces `process.env.EXPO_PUBLIC_...` when it
  // is spelled out in full.
  configured: process.env.EXPO_PUBLIC_API_URL,
  hostUri: Constants.expoConfig?.hostUri,
  isDev: __DEV__,
});

if (__DEV__) {
  console.info(
    target.kind === 'http'
      ? `[auth] Using the back end at ${target.baseUrl}`
      : '[auth] Using the built-in stand-in service (no server). Set EXPO_PUBLIC_API_URL to use the server.',
  );
}

export const authService: AuthService = selectAuthService(target);

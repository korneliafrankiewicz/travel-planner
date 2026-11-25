// Which back end the app talks to. It is chosen by one setting, `EXPO_PUBLIC_API_URL`, put in a
// `.env.local` file (see `env.example`):
//
//   not set        the stand-in service that runs inside the app (no server needed)
//   "auto"         development only: the server on the computer that runs the Expo dev server,
//                  port 3000. Works on a phone, because the computer's address is read from Expo
//   an https URL   that server. A plain http URL is only accepted in development
//
// Anything with the `EXPO_PUBLIC_` prefix is visible in the built app, so it must be an address
// and never a secret.

export type ApiTarget = { kind: 'fake' } | { kind: 'http'; baseUrl: string };

export class ApiConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ApiConfigError';
  }
}

export const AUTO = 'auto';
// The port the back end listens on by default.
export const DEV_SERVER_PORT = 3000;

type ResolveOptions = {
  // The value of `process.env.EXPO_PUBLIC_API_URL`.
  configured: string | undefined;
  // `Constants.expoConfig.hostUri`: where the Expo dev server is, like "192.168.1.20:8081".
  hostUri: string | undefined;
  isDev: boolean;
};

// "192.168.1.20:8081" -> "192.168.1.20"; "[fe80::1]:8081" -> "[fe80::1]"; "localhost" -> "localhost"
const hostOf = (hostUri: string): string | null => {
  const text = hostUri.trim().replace(/^[a-z][a-z0-9+.-]*:\/\//i, '').split('/')[0] ?? '';
  const host = text.startsWith('[') ? text.slice(0, text.indexOf(']') + 1) : text.split(':')[0] ?? '';
  return host === '' || host === '[' ? null : host;
};

export const resolveApiTarget = ({ configured, hostUri, isDev }: ResolveOptions): ApiTarget => {
  const value = configured?.trim() ?? '';
  if (value === '') {
    return { kind: 'fake' };
  }

  if (value === AUTO) {
    if (!isDev) {
      throw new ApiConfigError(
        'EXPO_PUBLIC_API_URL="auto" only works in development. Set the address of the server.',
      );
    }
    const host = hostUri === undefined ? null : hostOf(hostUri);
    return { kind: 'http', baseUrl: `http://${host ?? 'localhost'}:${DEV_SERVER_PORT}` };
  }

  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new ApiConfigError('EXPO_PUBLIC_API_URL is not a valid address.');
  }
  if (url.protocol !== 'https:' && url.protocol !== 'http:') {
    throw new ApiConfigError('EXPO_PUBLIC_API_URL must start with https:// (or http:// in development).');
  }
  // Passwords and tokens travel to this address, so a plain connection is only for development.
  if (url.protocol === 'http:' && !isDev) {
    throw new ApiConfigError('EXPO_PUBLIC_API_URL must use https:// outside development.');
  }
  if (url.username !== '' || url.password !== '') {
    throw new ApiConfigError('EXPO_PUBLIC_API_URL must not contain a user name or password.');
  }
  if (url.search !== '' || url.hash !== '') {
    throw new ApiConfigError('EXPO_PUBLIC_API_URL must not contain a query or a fragment.');
  }

  return { kind: 'http', baseUrl: `${url.origin}${url.pathname.replace(/\/+$/, '')}` };
};

import path from 'node:path';

import { defineConfig, devices } from '@playwright/test';

import { API_URL, APP_URL, LOG_FILE, STATE_DIR } from './e2e/support/environment';

// End-to-end tests: the real app (Expo web build) talking to the real back end in `server/`.
// Both are started here, on their own ports and with a throwaway database, so the tests never
// touch the development setup. See docs/testing.md.
export default defineConfig({
  testDir: './e2e',
  // Tests are independent (each one creates its own account), so they can share the servers.
  fullyParallel: true,
  workers: process.env.CI ? 2 : 3,
  retries: process.env.CI ? 1 : 0,
  reporter: [['list'], ['html', { open: 'never' }]],
  timeout: 45_000,
  expect: { timeout: 10_000 },
  use: {
    baseURL: APP_URL,
    // Same time zone and language as the unit tests, so dates read the same everywhere.
    timezoneId: 'Europe/Warsaw',
    locale: 'en-US',
    // E2E_SLOW_MO=600 npm run e2e -- --headed: pause between actions, to watch a test.
    launchOptions: { slowMo: Number(process.env.E2E_SLOW_MO ?? 0) },
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: [
    {
      // The back end, with a fresh development database. Its log is kept in a file because that
      // is where the "email" with the password reset link is printed.
      command: `sh -c "rm -rf ${STATE_DIR} && mkdir -p ${STATE_DIR} && cd server && npx tsx src/index.ts 2>&1 | tee ../${LOG_FILE}"`,
      url: `${API_URL}/health`,
      reuseExistingServer: false,
      timeout: 60_000,
      env: {
        NODE_ENV: 'development',
        HOST: '127.0.0.1',
        PORT: new URL(API_URL).port,
        // Never a real database, whatever the shell has set.
        DATABASE_URL: '',
        PGLITE_DIR: `../${STATE_DIR}/pglite`,
        CORS_ORIGINS: APP_URL,
        // Lets a test give each browser its own address, so the request limits of the server
        // (5 sign-ups a minute per address) do not depend on how many tests run.
        TRUST_PROXY: 'true',
        // The lowest cost the server accepts in development: passwords hash quickly.
        SCRYPT_N: '16384',
        MAIL_TRANSPORT: 'console',
        PASSWORD_RESET_URL: `${APP_URL}/reset-password`,
      },
    },
    {
      command: `npx expo start --web --port ${new URL(APP_URL).port}`,
      url: APP_URL,
      reuseExistingServer: false,
      timeout: 240_000,
      // The dev server prints a warning for every page it renders on the server ("window is not
      // defined" from the storage). To see what it says, run the command above by hand.
      stdout: 'ignore',
      stderr: 'ignore',
      env: {
        // Do not read the developer's .env files: the test setup must be the same everywhere.
        // (metro.config.js hides them from the app bundle too, which reads them by itself.)
        EXPO_NO_DOTENV: '1',
        E2E_TEST: '1',
        EXPO_NO_TELEMETRY: '1',
        CI: '1',
        EXPO_PUBLIC_API_URL: API_URL,
        // The app's own transform cache, not the one a normal `expo start` uses and writes to.
        EXPO_METRO_CACHE_OUTPUT_DIR: path.resolve(STATE_DIR, 'metro-cache'),
      },
    },
  ],
});

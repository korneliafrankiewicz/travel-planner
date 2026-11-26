import { randomUUID } from 'node:crypto';
import { readFile } from 'node:fs/promises';

import { test as base, expect, type Locator, type Page } from '@playwright/test';

import { API_URL, LOG_FILE } from './environment';

export { expect };

// On the web the app does not tell the browser which radio button is chosen (there is no
// aria-checked or aria-selected), so a chosen one is recognised by its look: its background
// differs from the one next to it. Returns the background colour of an element.
export const backgroundOf = (locator: Locator) =>
  locator.evaluate((element) => getComputedStyle(element).backgroundColor);

export const PASSWORD = 'Secret123';
export const NAME = 'Anna Nowak';

// "Today" in every test: 20 November 2026, so the sample trips (Lisbon on 13 December, the Tatra
// Mountains in January) are upcoming and the dates in the tests never go stale.
const TODAY = new Date('2026-11-20T12:00:00+01:00');

export type Account = { name: string; email: string; password: string };

// A made-up address for one test, so the server's request limits are counted per test.
const randomAddress = () =>
  `10.${randomInt()}.${randomInt()}.${randomInt()}`;
const randomInt = () => 1 + Math.floor(Math.random() * 253);

type Fixtures = {
  // A new account, already registered on the server.
  account: Account;
  // The page, logged in as `account`, on the trip list.
  signedInPage: Page;
};

export const test = base.extend<Fixtures>({
  page: async ({ page, context }, provide) => {
    const address = randomAddress();
    // The server counts requests per address (and trusts this header in the test setup).
    await context.route(`${API_URL}/**`, (route) =>
      route.continue({ headers: { ...route.request().headers(), 'x-forwarded-for': address } }),
    );
    await page.clock.install({ time: TODAY });
    await provide(page);
  },

  account: async ({ request }, provide) => {
    const account: Account = {
      name: NAME,
      email: `e2e-${randomUUID().slice(0, 8)}@example.com`,
      password: PASSWORD,
    };
    const response = await request.post(`${API_URL}/v1/auth/register`, {
      data: account,
      headers: { 'x-forwarded-for': randomAddress() },
    });
    expect(response.status()).toBe(201);
    await provide(account);
  },

  signedInPage: async ({ page, account }, provide) => {
    await logIn(page, account);
    await provide(page);
  },
});

export const logIn = async (page: Page, { email, password }: Pick<Account, 'email' | 'password'>) => {
  await page.goto('/login');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password', { exact: true }).fill(password);
  await page.getByRole('button', { name: 'Log in' }).click();
  await expect(page.getByRole('heading', { name: 'Your trips' })).toBeVisible();
};

// The back end has no email provider yet: it prints the reset link in its log. Waits until the
// link for `email` is there, and returns the newest one.
export const readResetLink = async (email: string): Promise<string> => {
  const pattern = new RegExp(`Password reset for ${email.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}: ([^\\s"]+)`, 'g');
  let link: string | undefined;
  await expect
    .poll(async () => {
      const log = await readFile(LOG_FILE, 'utf8').catch(() => '');
      link = [...log.matchAll(pattern)].at(-1)?.[1];
      return link;
    }, { message: `the reset link for ${email} in the server log` })
    .toBeDefined();
  return link!;
};

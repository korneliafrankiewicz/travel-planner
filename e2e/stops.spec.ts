import type { Page } from '@playwright/test';

import { backgroundOf, expect, test } from './support/fixtures';

// Works on the Lisbon city break (13 to 15 December 2026), which starts with five stops.
// "Today" is 20 November 2026, so every day of the trip can still be planned.

// The trip list stays mounted (hidden) under the trip, so only look at what is on screen.
const tripSummary = (page: Page, text: string) =>
  page.getByText(text).filter({ visible: true }).first();

const TITLE_PLACEHOLDER = 'e.g. Dinner at Time Out Market';

test.beforeEach(async ({ signedInPage: page }) => {
  await page.getByRole('button', { name: 'Lisbon city break' }).click();
  await expect(page.getByRole('heading', { name: 'Itinerary' })).toBeVisible();
});

test.describe('add a stop', () => {
  test('adds a stop to a day, and the trip counts it', async ({ signedInPage: page }) => {
    await page.getByRole('button', { name: 'Add stop, Tue, Dec 15' }).click();
    await expect(page.getByRole('heading', { name: 'New stop' })).toBeVisible();
    // The form starts on the day that was chosen.
    const chosen = await backgroundOf(page.getByRole('radio', { name: /Tuesday, December 15, 2026$/ }));
    expect(await backgroundOf(page.getByRole('radio', { name: /Monday, December 14, 2026$/ }))).not.toBe(chosen);

    await page.getByRole('radio', { name: 'Meal' }).click();
    await page.getByPlaceholder(TITLE_PLACEHOLDER).fill('Farewell lunch');
    await page.getByLabel('Start time').fill('1330');
    await expect(page.getByLabel('Start time')).toHaveValue('13:30');
    await page.getByLabel('Duration (minutes)').fill('90');
    await page.getByRole('button', { name: 'Save stop' }).click();

    await expect(page.getByRole('heading', { name: 'Itinerary' })).toBeVisible();
    const stop = page.getByRole('button', { name: /^Farewell lunch/ });
    await expect(stop).toBeVisible();
    await expect(stop).toContainText('1:30 PM – 3:00 PM · 1 h 30 min');
    await expect(tripSummary(page, '6 stops')).toBeVisible();
  });

  test('says what is wrong with the form, and saves nothing', async ({ signedInPage: page }) => {
    await page.getByRole('button', { name: 'Add stop, Mon, Dec 14' }).click();
    await page.getByLabel('Start time').fill('2599');
    await page.getByRole('button', { name: 'Save stop' }).click();

    await expect(page.getByText('Enter a title')).toBeVisible();
    await expect(page.getByText('Enter a time as HH:mm, e.g. 09:30')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'New stop' })).toBeVisible();
  });

  test('saves coordinates that are typed in, and a link', async ({ signedInPage: page }) => {
    await page.getByRole('button', { name: 'Add stop, Mon, Dec 14' }).click();
    await page.getByPlaceholder(TITLE_PLACEHOLDER).fill('Miradouro da Senhora do Monte');
    await page.getByLabel('Latitude').fill('38.7197');
    await page.getByLabel('Longitude').fill('-9.1328');
    await page.getByLabel('Link').fill('https://example.com/miradouro');
    await page.getByRole('button', { name: 'Save stop' }).click();

    await page.getByRole('button', { name: /^Miradouro da Senhora do Monte/ }).click();
    await expect(page.getByRole('heading', { name: 'Edit stop' })).toBeVisible();
    await expect(page.getByLabel('Latitude')).toHaveValue('38.7197');
    await expect(page.getByLabel('Longitude')).toHaveValue('-9.1328');
    await expect(page.getByLabel('Link')).toHaveValue('https://example.com/miradouro');
  });

  test('closes without saving with Cancel', async ({ signedInPage: page }) => {
    await page.getByRole('button', { name: 'Add stop, Mon, Dec 14' }).click();
    await page.getByPlaceholder(TITLE_PLACEHOLDER).fill('Never saved');
    await page.getByRole('button', { name: 'Cancel' }).click();

    await expect(page.getByRole('heading', { name: 'Itinerary' })).toBeVisible();
    await expect(page.getByRole('button', { name: /^Never saved/ })).toHaveCount(0);
  });

  test('warns when two stops overlap', async ({ signedInPage: page }) => {
    await page.getByRole('button', { name: 'Add stop, Sun, Dec 13' }).click();
    await page.getByPlaceholder(TITLE_PLACEHOLDER).fill('Early snack');
    // The hotel check-in is 15:00 for 30 minutes.
    await page.getByLabel('Start time').fill('1515');
    await page.getByLabel('Duration (minutes)').fill('30');
    await page.getByRole('button', { name: 'Save stop' }).click();

    await expect(page.getByRole('button', { name: /^Early snack.*Overlaps with another stop/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /^Hotel check-in.*Overlaps with another stop/ })).toBeVisible();
  });
});

test.describe('edit a stop', () => {
  test('shows the stop in the form and saves the changes', async ({ signedInPage: page }) => {
    await page.getByRole('button', { name: /^Belém Tower/ }).click();
    await expect(page.getByRole('heading', { name: 'Edit stop' })).toBeVisible();
    await expect(page.getByPlaceholder(TITLE_PLACEHOLDER)).toHaveValue('Belém Tower');

    await page.getByPlaceholder(TITLE_PLACEHOLDER).fill('Belém Tower at sunset');
    await page.getByRole('button', { name: 'Save changes' }).click();

    await expect(page.getByRole('button', { name: /^Belém Tower at sunset/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /^Belém Tower,/ })).toHaveCount(0);
    await expect(tripSummary(page, '5 stops')).toBeVisible();
  });

  test('moves a stop to another day', async ({ signedInPage: page }) => {
    await page.getByRole('button', { name: /^Belém Tower/ }).click();
    await page.getByRole('radio', { name: /Sunday, December 13, 2026$/ }).click();
    await page.getByRole('button', { name: 'Save changes' }).click();

    // Day 1 now holds three stops.
    const dayOne = page.getByRole('heading', { name: 'Day 1' });
    await expect(dayOne).toBeVisible();
    await expect(page.getByRole('button', { name: /^Belém Tower/ })).toBeVisible();
  });
});

test.describe('delete a stop', () => {
  test('keeps the stop when deleting is cancelled', async ({ signedInPage: page }) => {
    await page.getByRole('button', { name: /^Sintra day trip/ }).click();
    await page.getByRole('button', { name: 'Delete stop' }).click();
    await expect(page.getByRole('heading', { name: 'Delete this stop?' })).toBeVisible();
    await page.getByRole('button', { name: 'Cancel' }).last().click();

    await expect(page.getByRole('heading', { name: 'Delete this stop?' })).toHaveCount(0);
    await expect(page.getByRole('heading', { name: 'Edit stop' })).toBeVisible();
  });

  test('removes the stop after confirming', async ({ signedInPage: page }) => {
    await page.getByRole('button', { name: /^Sintra day trip/ }).click();
    await page.getByRole('button', { name: 'Delete stop' }).click();
    await page.getByRole('button', { name: 'Delete', exact: true }).click();

    await expect(page.getByRole('heading', { name: 'Itinerary' })).toBeVisible();
    await expect(page.getByRole('button', { name: /^Sintra day trip/ })).toHaveCount(0);
    await expect(tripSummary(page, '4 stops')).toBeVisible();
  });
});

test('deleting a trip takes its stops with it', async ({ signedInPage: page }) => {
  await page.getByRole('button', { name: 'Delete trip' }).click();
  await page.getByRole('button', { name: 'Delete', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Your trips' })).toBeVisible();

  // A new trip with the same dates starts empty.
  await page.getByRole('button', { name: 'New trip' }).click();
  await page.getByLabel('Trip title').fill('Lisbon again');
  await page.getByRole('button', { name: 'Next month' }).click();
  await page.getByRole('button', { name: /December 13, 2026$/ }).click();
  await page.getByRole('button', { name: /December 15, 2026$/ }).click();
  await page.getByRole('button', { name: 'Save trip' }).click();

  await expect(page.getByRole('button', { name: 'Lisbon again' })).toContainText('0 stops');
});

import { expect, logIn, test } from './support/fixtures';

// "Today" is 20 November 2026 (see support/fixtures.ts). The app starts with two sample trips:
// Lisbon city break (13 to 15 December, 5 stops, upcoming) and Tatra Mountains (August, past).

test.describe('trip list', () => {
  test('shows the upcoming trips with their dates, length, stops and how soon they start', async ({
    signedInPage: page,
  }) => {
    await expect(page.getByRole('heading', { name: 'Your trips' })).toBeVisible();

    const lisbon = page.getByRole('button', { name: 'Lisbon city break' });
    await expect(lisbon).toBeVisible();
    await expect(lisbon).toContainText('In 23 days');
    await expect(lisbon).toContainText('Dec 13 – 15, 2026');
    await expect(lisbon).toContainText('3 days · 5 stops');
    await expect(page.getByRole('button', { name: 'Tatra Mountains' })).toHaveCount(0);
  });

  test('has a Past filter for trips that are over', async ({ signedInPage: page }) => {
    await page.getByRole('radio', { name: 'Past' }).click();

    await expect(page.getByRole('button', { name: 'Tatra Mountains' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Lisbon city break' })).toHaveCount(0);

    await page.getByRole('radio', { name: 'Upcoming' }).click();
    await expect(page.getByRole('button', { name: 'Lisbon city break' })).toBeVisible();
  });
});

test.describe('new trip', () => {
  const openForm = async (page: import('@playwright/test').Page) => {
    await page.getByRole('button', { name: 'New trip' }).click();
    await expect(page.getByRole('heading', { name: 'New trip' })).toBeVisible();
  };

  test('creates a trip that shows in the list, and in its own screen', async ({ signedInPage: page }) => {
    await openForm(page);
    await page.getByLabel('Trip title').fill('Weekend in Porto');
    await page.getByLabel('Destination').fill('Porto, Portugal');
    await page.getByLabel('Notes').fill('Try the francesinha');

    // Pick 19 to 20 December on the calendar.
    await page.getByRole('button', { name: 'Next month' }).click();
    await page.getByRole('button', { name: /December 19, 2026$/ }).click();
    await page.getByRole('button', { name: /December 20, 2026$/ }).click();
    await expect(page.getByText('2 days')).toBeVisible();

    await page.getByRole('button', { name: 'Save trip' }).click();

    const porto = page.getByRole('button', { name: 'Weekend in Porto' });
    await expect(porto).toBeVisible();
    await expect(porto).toContainText('In 29 days');
    await expect(porto).toContainText('2 days · 0 stops');

    await porto.click();
    await expect(page.getByRole('heading', { name: 'Weekend in Porto' })).toBeVisible();
    await expect(page.getByText('Porto, Portugal').filter({ visible: true }).first()).toBeVisible();
    await expect(page.getByText('Try the francesinha')).toBeVisible();
    await expect(page.getByText('No stops planned yet').filter({ visible: true }).first()).toBeVisible();
  });

  test('says what is missing, and saves nothing', async ({ signedInPage: page }) => {
    await openForm(page);
    await page.getByRole('button', { name: 'Save trip' }).click();

    await expect(page.getByText('Enter a trip title')).toBeVisible();
    await expect(page.getByText('Select a start and an end date')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'New trip' })).toBeVisible();
  });

  test('does not let a day in the past be chosen', async ({ signedInPage: page }) => {
    await openForm(page);

    await expect(page.getByRole('button', { name: /November 19, 2026$/ })).toBeDisabled();
    await expect(page.getByRole('button', { name: /November 20, 2026$/ })).toBeEnabled();
  });

  test('closes without saving with Cancel', async ({ signedInPage: page }) => {
    await openForm(page);
    await page.getByLabel('Trip title').fill('Never saved');
    await page.getByRole('button', { name: 'Cancel' }).click();

    await expect(page.getByRole('heading', { name: 'Your trips' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Never saved' })).toHaveCount(0);
  });
});

test.describe('trip details', () => {
  test('shows the summary and the itinerary by day', async ({ signedInPage: page }) => {
    await page.getByRole('button', { name: 'Lisbon city break' }).click();

    await expect(page.getByRole('heading', { name: 'Lisbon city break' })).toBeVisible();
    await expect(page.getByText('3 days').filter({ visible: true }).first()).toBeVisible();
    await expect(page.getByText('5 stops').filter({ visible: true }).first()).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Itinerary' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Day 1' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Day 3' })).toBeVisible();
    await expect(page.getByRole('button', { name: /^Hotel check-in/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /^Sintra day trip/ })).toBeVisible();
  });

  test('goes back to the list', async ({ signedInPage: page }) => {
    await page.getByRole('button', { name: 'Lisbon city break' }).click();
    await page.getByRole('button', { name: 'Back' }).click();

    await expect(page.getByRole('heading', { name: 'Your trips' })).toBeVisible();
  });

  test('edits the trip', async ({ signedInPage: page }) => {
    await page.getByRole('button', { name: 'Lisbon city break' }).click();
    await page.getByRole('button', { name: 'Edit trip' }).click();
    await expect(page.getByRole('heading', { name: 'Edit trip' })).toBeVisible();
    await expect(page.getByLabel('Trip title')).toHaveValue('Lisbon city break');

    await page.getByLabel('Trip title').fill('Lisbon in winter');
    await page.getByRole('button', { name: 'Save changes' }).click();

    await expect(page.getByRole('heading', { name: 'Lisbon in winter' })).toBeVisible();
    await expect(page.getByText('5 stops').filter({ visible: true }).first()).toBeVisible();
    await page.getByRole('button', { name: 'Back' }).click();
    await expect(page.getByRole('button', { name: 'Lisbon in winter' })).toBeVisible();
  });

  test('keeps the trip when deleting is cancelled', async ({ signedInPage: page }) => {
    await page.getByRole('button', { name: 'Lisbon city break' }).click();
    await page.getByRole('button', { name: 'Delete trip' }).click();
    await expect(page.getByRole('heading', { name: 'Delete this trip?' })).toBeVisible();
    await page.getByRole('button', { name: 'Cancel' }).last().click();

    await expect(page.getByRole('heading', { name: 'Delete this trip?' })).toHaveCount(0);
    await expect(page.getByRole('heading', { name: 'Lisbon city break' })).toBeVisible();
  });

  test('deletes the trip after confirming', async ({ signedInPage: page }) => {
    await page.getByRole('button', { name: 'Lisbon city break' }).click();
    await page.getByRole('button', { name: 'Delete trip' }).click();
    await page.getByRole('button', { name: 'Delete', exact: true }).click();

    await expect(page.getByRole('heading', { name: 'Your trips' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Lisbon city break' })).toHaveCount(0);
    await expect(page.getByText('You have no trips yet')).toBeVisible();
  });
});

test.describe('trips on the device', () => {
  test('stay after logging out and in again', async ({ signedInPage: page, account }) => {
    await page.getByRole('button', { name: 'New trip' }).click();
    await page.getByLabel('Trip title').fill('Weekend in Porto');
    await page.getByRole('button', { name: 'Next month' }).click();
    await page.getByRole('button', { name: /December 19, 2026$/ }).click();
    await page.getByRole('button', { name: /December 20, 2026$/ }).click();
    await page.getByRole('button', { name: 'Save trip' }).click();
    await expect(page.getByRole('button', { name: 'Weekend in Porto' })).toBeVisible();

    // The token of the session lives in memory on the web, so a reload is a log out.
    await page.reload();
    await expect(page.getByRole('heading', { name: 'Your trips' })).toHaveCount(0);
    await logIn(page, account);

    await expect(page.getByRole('button', { name: 'Weekend in Porto' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Lisbon city break' })).toBeVisible();
  });
});

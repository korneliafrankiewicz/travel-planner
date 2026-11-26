import { expect, test } from './support/fixtures';

test.describe('settings', () => {
  test.beforeEach(async ({ signedInPage: page }) => {
    await page.getByRole('link', { name: 'Settings' }).click();
    await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible();
  });

  test('shows the sections', async ({ signedInPage: page }) => {
    for (const section of ['Appearance', 'Security', 'Account']) {
      await expect(page.getByRole('heading', { name: section })).toBeVisible();
    }
  });

  test('switches the language to Polish and back, everywhere in the app', async ({
    signedInPage: page,
  }) => {
    await page.getByRole('radio', { name: 'Polski' }).click();

    await expect(page.getByRole('heading', { name: 'Ustawienia' })).toBeVisible();
    await page.getByRole('link', { name: 'Podróże' }).click();
    await expect(page.getByRole('heading', { name: 'Twoje podróże' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Lisbon city break' })).toContainText('Za 23 dni');

    await page.getByRole('link', { name: 'Ustawienia' }).click();
    await page.getByRole('radio', { name: 'English' }).click();
    await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible();
  });

  test('switches between the light and the dark theme', async ({ signedInPage: page }) => {
    const background = () =>
      page.getByRole('heading', { name: 'Settings' }).evaluate((element) => {
        // The screen's own background is on an ancestor of the title.
        let node: HTMLElement | null = element as HTMLElement;
        while (node !== null) {
          const color = getComputedStyle(node).backgroundColor;
          if (color !== 'rgba(0, 0, 0, 0)') return color;
          node = node.parentElement;
        }
        return 'none';
      });
    const light = await background();

    await page.getByRole('radio', { name: 'Dark' }).click();

    await expect.poll(background).not.toBe(light);
  });

  test('restores the sample trips after the development reset', async ({ signedInPage: page }) => {
    // Delete the Lisbon trip, then bring it back.
    await page.getByRole('link', { name: 'Trips' }).click();
    await page.getByRole('button', { name: 'Lisbon city break' }).click();
    await page.getByRole('button', { name: 'Delete trip' }).click();
    await page.getByRole('button', { name: 'Delete', exact: true }).click();
    await expect(page.getByText('You have no trips yet')).toBeVisible();

    await page.getByRole('link', { name: 'Settings' }).click();
    await page.getByRole('button', { name: 'Reset sample data' }).click();
    await expect(page.getByRole('heading', { name: 'Reset sample data?' })).toBeVisible();
    await page.getByRole('button', { name: 'Reset', exact: true }).click();

    await page.getByRole('link', { name: 'Trips' }).click();
    await expect(page.getByRole('button', { name: 'Lisbon city break' })).toBeVisible();
  });

  test('keeps the data when the reset is cancelled', async ({ signedInPage: page }) => {
    await page.getByRole('button', { name: 'Reset sample data' }).click();
    await page.getByRole('button', { name: 'Cancel' }).last().click();

    await expect(page.getByRole('heading', { name: 'Reset sample data?' })).toHaveCount(0);
  });
});

test.describe('profile', () => {
  test('shows who is logged in and the trip numbers', async ({ signedInPage: page, account }) => {
    await page.getByRole('button', { name: 'Profile' }).click();

    await expect(page.getByRole('heading', { name: account.name })).toBeVisible();
    await expect(page.getByText(account.email)).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Your travel' })).toBeVisible();
    // The two sample trips: one upcoming, one past.
    await expect(page.getByLabel('Trips: 2')).toBeVisible();
    await expect(page.getByLabel('Upcoming: 1')).toBeVisible();
    await expect(page.getByLabel('Past: 1')).toBeVisible();

    await page.getByRole('button', { name: 'Back' }).click();
    await expect(page.getByRole('heading', { name: 'Your trips' })).toBeVisible();
  });
});

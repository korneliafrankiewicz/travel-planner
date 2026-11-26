import { expect, logIn, NAME, PASSWORD, readResetLink, test } from './support/fixtures';

test.describe('welcome', () => {
  test('is the first screen when logged out, with a way to log in or sign up', async ({ page }) => {
    await page.goto('/welcome');

    await expect(page.getByRole('heading', { name: 'Plan trips, day by day' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Log in' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Create account' })).toBeVisible();
  });

  test('leads to log in and to sign up', async ({ page }) => {
    await page.goto('/welcome');
    await page.getByRole('button', { name: 'Log in' }).click();
    await expect(page.getByRole('heading', { name: 'Welcome back' })).toBeVisible();

    await page.goto('/welcome');
    await page.getByRole('button', { name: 'Create account' }).click();
    await expect(page.getByRole('heading', { name: 'Create your account' })).toBeVisible();
  });

  test('a logged out visitor who opens the app is sent to a screen where they can log in', async ({
    page,
  }) => {
    await page.goto('/');

    await expect(page.getByRole('heading', { name: /Plan trips, day by day|Welcome back/ })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Your trips' })).toHaveCount(0);
  });
});

test.describe('log in', () => {
  test('logs in with the right password and shows the trips', async ({ page, account }) => {
    await logIn(page, account);

    await expect(page.getByRole('button', { name: `Profile` })).toBeVisible();
  });

  test('says so when the password is wrong, and stays on the screen', async ({ page, account }) => {
    await page.goto('/login');
    await page.getByLabel('Email').fill(account.email);
    await page.getByLabel('Password', { exact: true }).fill('Wrong-Pass1');
    await page.getByRole('button', { name: 'Log in' }).click();

    await expect(page.getByText('Wrong email or password')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Welcome back' })).toBeVisible();
  });

  test('checks the form before asking the server', async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('button', { name: 'Log in' }).click();

    await expect(page.getByText('Enter your email address')).toBeVisible();
    await expect(page.getByText('Enter your password')).toBeVisible();
  });
});

test.describe('sign up', () => {
  const fillSignUp = async (
    page: import('@playwright/test').Page,
    values: { email: string; password?: string; confirm?: string },
  ) => {
    await page.goto('/sign-up');
    await page.getByLabel('Name').fill(NAME);
    await page.getByLabel('Email').fill(values.email);
    await page.getByLabel('Password', { exact: true }).fill(values.password ?? PASSWORD);
    await page.getByLabel('Confirm password').fill(values.confirm ?? values.password ?? PASSWORD);
    await page.getByRole('checkbox').click();
    await page.getByRole('button', { name: 'Create account' }).click();
  };

  test('creates an account and logs in', async ({ page }) => {
    await fillSignUp(page, { email: `new-${Date.now()}@example.com` });

    await expect(page.getByRole('heading', { name: 'Your trips' })).toBeVisible();
  });

  test('refuses an email that already has an account', async ({ page, account }) => {
    await fillSignUp(page, { email: account.email });

    await expect(page.getByText('An account with this email already exists')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Create your account' })).toBeVisible();
  });

  test('asks for the terms and matching passwords', async ({ page }) => {
    await page.goto('/sign-up');
    await page.getByLabel('Name').fill(NAME);
    await page.getByLabel('Email').fill('someone@example.com');
    await page.getByLabel('Password', { exact: true }).fill(PASSWORD);
    await page.getByLabel('Confirm password').fill('Different123');
    await page.getByRole('button', { name: 'Create account' }).click();

    await expect(page.getByText('The passwords do not match')).toBeVisible();
    await expect(page.getByText('Accept the terms to create an account')).toBeVisible();
  });
});

test.describe('password reset', () => {
  test('sets a new password from the link in the email, and the old one stops working', async ({
    page,
    account,
  }) => {
    await page.goto('/login');
    await page.getByRole('link', { name: 'Forgot password?' }).click();
    await expect(page.getByRole('heading', { name: 'Reset your password' })).toBeVisible();
    // The log in screen stays mounted (hidden) underneath, so look at the visible field only.
    const email = page.getByLabel('Email').filter({ visible: true });
    await email.fill(account.email);
    await expect(email).toHaveValue(account.email);
    await page.getByRole('button', { name: 'Send reset link' }).click();
    await expect(page.getByRole('heading', { name: 'Check your email' })).toBeVisible();

    await page.goto(await readResetLink(account.email));
    await expect(page.getByRole('heading', { name: 'Choose a new password' })).toBeVisible();
    await page.getByLabel('New password').fill('Brand-new-pass9');
    await page.getByLabel('Confirm password').fill('Brand-new-pass9');
    await page.getByRole('button', { name: 'Save password' }).click();
    await expect(page.getByRole('heading', { name: 'Password changed' })).toBeVisible();

    // The old password no longer works; the new one does.
    await page.getByRole('button', { name: 'Log in' }).click();
    await page.getByLabel('Email').fill(account.email);
    await page.getByLabel('Password', { exact: true }).fill(account.password);
    await page.getByRole('button', { name: 'Log in' }).click();
    await expect(page.getByText('Wrong email or password')).toBeVisible();

    await page.getByLabel('Password', { exact: true }).fill('Brand-new-pass9');
    await page.getByRole('button', { name: 'Log in' }).click();
    await expect(page.getByRole('heading', { name: 'Your trips' })).toBeVisible();
  });

  test('a reset link works only once', async ({ page, account }) => {
    await page.goto('/forgot-password');
    await page.getByLabel('Email').fill(account.email);
    await page.getByRole('button', { name: 'Send reset link' }).click();
    const link = await readResetLink(account.email);

    await page.goto(link);
    await page.getByLabel('New password').fill('Brand-new-pass9');
    await page.getByLabel('Confirm password').fill('Brand-new-pass9');
    await page.getByRole('button', { name: 'Save password' }).click();
    await expect(page.getByRole('heading', { name: 'Password changed' })).toBeVisible();

    await page.goto(link);
    await page.getByLabel('New password').fill('Another-pass8');
    await page.getByLabel('Confirm password').fill('Another-pass8');
    await page.getByRole('button', { name: 'Save password' }).click();
    await expect(page.getByText(/expired or was already used/)).toBeVisible();
  });

  test('a link without a token is not valid', async ({ page }) => {
    await page.goto('/reset-password');

    await expect(page.getByRole('heading', { name: 'This link is not valid' })).toBeVisible();
  });
});

test.describe('log out', () => {
  test('goes back to the welcome screen, and the account can log in again', async ({
    signedInPage: page,
    account,
  }) => {
    await page.getByRole('link', { name: 'Settings' }).click();
    await page.getByRole('button', { name: 'Log out' }).click();
    await page.getByRole('button', { name: 'Log out' }).last().click();

    await expect(page.getByRole('heading', { name: 'Your trips' })).toHaveCount(0);
    await expect(page.getByRole('heading', { name: /Plan trips, day by day|Welcome back/ })).toBeVisible();

    await logIn(page, account);
  });
});

import { screen } from '@testing-library/react-native';

import { renderWithProviders } from '@/test-utils/renderWithProviders';

import { LoadingScreen } from './LoadingScreen';
import { Spinner } from './Spinner';

describe('Spinner', () => {
  it('is a progress indicator that screen readers can name', async () => {
    await renderWithProviders(<Spinner label="Logging in…" />);
    expect(screen.getByRole('progressbar', { name: 'Logging in…' })).toBeVisible();
  });
});

describe('LoadingScreen', () => {
  it('shows a spinner with the same text written under it', async () => {
    await renderWithProviders(<LoadingScreen label="Checking your session…" />);

    expect(screen.getByRole('progressbar', { name: 'Checking your session…' })).toBeVisible();
    expect(screen.getByText('Checking your session…')).toBeVisible();
  });
});

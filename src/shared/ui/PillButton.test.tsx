import { screen, userEvent } from '@testing-library/react-native';

import { renderWithProviders } from '@/test-utils/renderWithProviders';

import { PillButton } from './PillButton';

describe('PillButton', () => {
  it('shows its label and works as a button', async () => {
    await renderWithProviders(<PillButton label="New trip" onPress={jest.fn()} />);
    expect(screen.getByRole('button', { name: 'New trip' })).toBeVisible();
  });

  it('calls onPress when pressed', async () => {
    const onPress = jest.fn();
    const user = userEvent.setup();
    await renderWithProviders(<PillButton label="New trip" onPress={onPress} />);

    await user.press(screen.getByRole('button', { name: 'New trip' }));

    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it.each(['primary', 'secondary'] as const)('renders the %s variant', async (variant) => {
    await renderWithProviders(<PillButton label="Go" variant={variant} onPress={jest.fn()} />);
    expect(screen.getByRole('button', { name: 'Go' })).toBeVisible();
  });

  describe('while loading', () => {
    it('shows a spinner, names the button by its loading text, and is marked busy', async () => {
      await renderWithProviders(
        <PillButton label="Log in" loadingLabel="Logging in…" loading onPress={jest.fn()} />,
      );

      const button = screen.getByRole('button', { name: 'Logging in…' });
      expect(button).toBeBusy();
      expect(button).toBeDisabled();
    });

    it('ignores presses, so a request cannot be sent twice', async () => {
      const onPress = jest.fn();
      const user = userEvent.setup();
      await renderWithProviders(<PillButton label="Log in" loading onPress={onPress} />);

      await user.press(screen.getByRole('button', { name: 'Log in' }));

      expect(onPress).not.toHaveBeenCalled();
    });

    it('keeps the label in place, hidden, so the button does not change its width', async () => {
      await renderWithProviders(<PillButton label="Log in" loading onPress={jest.fn()} />);
      expect(screen.getByText('Log in', { includeHiddenElements: true })).toHaveStyle({ opacity: 0 });
    });

    it('shows no spinner when it is not loading', async () => {
      await renderWithProviders(<PillButton label="Log in" onPress={jest.fn()} />);
      expect(screen.queryByRole('progressbar')).toBeNull();
      expect(screen.getByRole('button', { name: 'Log in' })).not.toBeBusy();
    });
  });

  describe('when disabled', () => {
    it('ignores presses and is marked disabled, without a spinner', async () => {
      const onPress = jest.fn();
      const user = userEvent.setup();
      await renderWithProviders(<PillButton label="Save" disabled onPress={onPress} />);

      await user.press(screen.getByRole('button', { name: 'Save' }));

      expect(onPress).not.toHaveBeenCalled();
      expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled();
      expect(screen.queryByRole('progressbar')).toBeNull();
    });
  });
});

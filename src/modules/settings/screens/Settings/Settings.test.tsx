import { screen, userEvent } from '@testing-library/react-native';

import { i18n } from '@/shared/i18n';
import { renderWithProviders } from '@/test-utils/renderWithProviders';

import Settings from './Settings';
import { useSettingsStore } from './store/settingsStore';

const mockPush = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush }),
}));

beforeEach(async () => {
  useSettingsStore.setState({ theme: 'light', language: 'en' });
  await i18n.changeLanguage('en');
  mockPush.mockClear();
});

describe('Settings screen', () => {
  it('shows the title and the three sections', async () => {
    await renderWithProviders(<Settings />);

    expect(screen.getByRole('header', { name: 'Settings' })).toBeVisible();
    expect(screen.getByRole('header', { name: 'Appearance' })).toBeVisible();
    expect(screen.getByRole('header', { name: 'Security' })).toBeVisible();
    expect(screen.getByRole('header', { name: 'Account' })).toBeVisible();
  });

  describe('theme', () => {
    it('shows the current theme as selected', async () => {
      await renderWithProviders(<Settings />);
      expect(screen.getByRole('radio', { name: 'Light' })).toBeSelected();
      expect(screen.getByRole('radio', { name: 'Dark' })).not.toBeSelected();
    });

    it('switches to dark and back, saving the choice in the store', async () => {
      const user = userEvent.setup();
      await renderWithProviders(<Settings />);

      await user.press(screen.getByRole('radio', { name: 'Dark' }));
      expect(useSettingsStore.getState().theme).toBe('dark');
      expect(screen.getByRole('radio', { name: 'Dark' })).toBeSelected();

      await user.press(screen.getByRole('radio', { name: 'Light' }));
      expect(useSettingsStore.getState().theme).toBe('light');
    });

    it('offers only light and dark (there is no "system" option)', async () => {
      await renderWithProviders(<Settings />);
      expect(screen.queryByRole('radio', { name: /system/i })).toBeNull();
    });
  });

  describe('language', () => {
    it('shows the current language as selected, with each language in its own name', async () => {
      await renderWithProviders(<Settings />);
      expect(screen.getByRole('radio', { name: 'English' })).toBeSelected();
      expect(screen.getByRole('radio', { name: 'Polski' })).not.toBeSelected();
    });

    it('switches the whole screen to Polish and back', async () => {
      const user = userEvent.setup();
      await renderWithProviders(<Settings />);

      await user.press(screen.getByRole('radio', { name: 'Polski' }));

      expect(useSettingsStore.getState().language).toBe('pl');
      expect(screen.getByRole('header', { name: 'Ustawienia' })).toBeVisible();
      expect(screen.getByRole('header', { name: 'Wygląd' })).toBeVisible();
      expect(screen.getByRole('radio', { name: 'Ciemny' })).toBeVisible();
      // The language names stay the same in every language.
      expect(screen.getByRole('radio', { name: 'Polski' })).toBeSelected();

      await user.press(screen.getByRole('radio', { name: 'English' }));
      expect(screen.getByRole('header', { name: 'Settings' })).toBeVisible();
    });
  });

  describe('profile card', () => {
    it('shows the name and email', async () => {
      await renderWithProviders(<Settings />);
      expect(screen.getByText('Alex Traveler')).toBeVisible();
      expect(screen.getByText('alex.traveler@example.com')).toBeVisible();
    });

    it('opens the Profile screen when pressed', async () => {
      const user = userEvent.setup();
      await renderWithProviders(<Settings />);

      await user.press(screen.getByRole('button', { name: 'Profile: Alex Traveler' }));

      expect(mockPush).toHaveBeenCalledWith('/profile');
    });
  });

  describe('placeholder rows', () => {
    it.each([
      'Change PIN',
      'Lock after',
      'Log out',
      'Delete account and data',
    ])('"%s" is shown but disabled until the feature exists', async (name) => {
      await renderWithProviders(<Settings />);
      expect(screen.getByRole('button', { name })).toBeDisabled();
    });

    it('the biometric switch is shown off and disabled', async () => {
      await renderWithProviders(<Settings />);
      const row = screen.getByRole('switch', { name: 'Biometric unlock' });
      expect(row).toBeDisabled();
      expect(row).not.toBeChecked();
    });

    it('says they are coming soon', async () => {
      await renderWithProviders(<Settings />);
      expect(screen.getAllByText('Coming soon').length).toBeGreaterThan(0);
    });
  });
});

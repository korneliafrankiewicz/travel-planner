import { screen, userEvent } from '@testing-library/react-native';

import { useSessionStore } from '@/shared/auth/sessionStore';
import { useStopsStore } from '@/modules/trips/screens/TripList/store/stopsStore';
import { useTripsStore } from '@/modules/trips/screens/TripList/store/tripsStore';
import { i18n } from '@/shared/i18n';
import { renderWithProviders } from '@/test-utils/renderWithProviders';

import Settings from './Settings';
import { useSettingsStore } from './store/settingsStore';

const mockPush = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush }),
}));

// A stand-in for logging out, so the tests do not depend on the auth service. Every test starts
// with it in place again.
const signOut = jest.fn(async () => {});

beforeEach(async () => {
  signOut.mockClear();
  useSessionStore.setState({
    status: 'signedIn',
    user: { id: 'u1', name: 'Anna Nowak', email: 'anna.nowak@example.com' },
    signOut,
  });
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
    it('shows the name and email of the person who is logged in', async () => {
      await renderWithProviders(<Settings />);
      expect(screen.getByText('Anna Nowak')).toBeVisible();
      expect(screen.getByText('anna.nowak@example.com')).toBeVisible();
    });

    it('opens the Profile screen when pressed', async () => {
      const user = userEvent.setup();
      await renderWithProviders(<Settings />);

      await user.press(screen.getByRole('button', { name: 'Profile: Anna Nowak' }));

      expect(mockPush).toHaveBeenCalledWith('/profile');
    });
  });

  describe('placeholder rows', () => {
    it.each([
      'Change PIN',
      'Lock after',
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

describe('developer section', () => {
  const myTrip = {
    id: 'my-trip',
    title: 'My trip',
    destination: '',
    notes: '',
    startDate: '2027-01-10',
    endDate: '2027-01-12',
  };

  beforeEach(() => {
    useTripsStore.setState({ trips: [myTrip] });
    useStopsStore.setState({ stops: [] });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('is shown during development', async () => {
    await renderWithProviders(<Settings />);

    expect(screen.getByRole('header', { name: 'Developer' })).toBeVisible();
    expect(screen.getByRole('button', { name: 'Reset sample data' })).toBeVisible();
  });

  it('is never shown to users of a release build', async () => {
    jest.replaceProperty(globalThis as unknown as { __DEV__: boolean }, '__DEV__', false);
    await renderWithProviders(<Settings />);

    expect(screen.queryByRole('header', { name: 'Developer' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Reset sample data' })).toBeNull();
  });

  it('asks for confirmation first and does not change anything yet', async () => {
    const user = userEvent.setup();
    await renderWithProviders(<Settings />);

    await user.press(screen.getByRole('button', { name: 'Reset sample data' }));

    expect(screen.getByRole('header', { name: 'Reset sample data?' })).toBeVisible();
    expect(screen.getByText(/All trips and stops on this device will be replaced/)).toBeVisible();
    expect(useTripsStore.getState().trips).toEqual([myTrip]);
  });

  it('keeps the data when the reset is cancelled', async () => {
    const user = userEvent.setup();
    await renderWithProviders(<Settings />);

    await user.press(screen.getByRole('button', { name: 'Reset sample data' }));
    await user.press(screen.getByRole('button', { name: 'Cancel' }));

    expect(useTripsStore.getState().trips).toEqual([myTrip]);
    expect(screen.queryByText('Reset sample data?')).toBeNull();
    expect(screen.queryByText('Sample data restored')).toBeNull();
  });

  it('replaces the trips and stops with the sample data when confirmed, and says so', async () => {
    const user = userEvent.setup();
    await renderWithProviders(<Settings />);

    await user.press(screen.getByRole('button', { name: 'Reset sample data' }));
    await user.press(screen.getByRole('button', { name: 'Reset' }));

    expect(useTripsStore.getState().trips.map((trip) => trip.id)).toEqual([
      'sample-lisbon',
      'sample-tatra',
    ]);
    expect(useStopsStore.getState().stops.length).toBeGreaterThan(0);
    expect(screen.queryByText('Reset sample data?')).toBeNull();
    expect(screen.getByText('Sample data restored')).toBeVisible();
  });

  it('does not touch the theme or the language', async () => {
    useSettingsStore.setState({ theme: 'dark', language: 'en' });
    const user = userEvent.setup();
    await renderWithProviders(<Settings />, { scheme: 'dark' });

    await user.press(screen.getByRole('button', { name: 'Reset sample data' }));
    await user.press(screen.getByRole('button', { name: 'Reset' }));

    expect(useSettingsStore.getState()).toMatchObject({ theme: 'dark', language: 'en' });
  });

  it('is in Polish when the app is', async () => {
    useSettingsStore.setState({ language: 'pl' });
    await i18n.changeLanguage('pl');
    const user = userEvent.setup();
    await renderWithProviders(<Settings />, { language: 'pl' });

    expect(screen.getByRole('header', { name: 'Deweloper' })).toBeVisible();
    await user.press(screen.getByRole('button', { name: 'Przywróć dane przykładowe' }));

    expect(screen.getByRole('header', { name: 'Przywrócić dane przykładowe?' })).toBeVisible();
    expect(screen.getByText(/Wszystkie podróże i punkty na tym urządzeniu/)).toBeVisible();
  });

  it('leaves the placeholder rows in the other sections disabled', async () => {
    await renderWithProviders(<Settings />);

    expect(screen.getByRole('button', { name: 'Change PIN' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Delete account and data' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Reset sample data' })).toBeEnabled();
  });
});

describe('log out', () => {
  it('is a row that can be used', async () => {
    await renderWithProviders(<Settings />);
    expect(screen.getByRole('button', { name: 'Log out' })).toBeEnabled();
  });

  it('asks for confirmation first and does not log out yet', async () => {
    const user = userEvent.setup();
    await renderWithProviders(<Settings />);

    await user.press(screen.getByRole('button', { name: 'Log out' }));

    expect(screen.getByRole('header', { name: 'Log out?' })).toBeVisible();
    expect(screen.getByText(/Your trips stay on this device/)).toBeVisible();
    expect(signOut).not.toHaveBeenCalled();
  });

  it('keeps the user logged in when cancelled', async () => {
    const user = userEvent.setup();
    await renderWithProviders(<Settings />);

    await user.press(screen.getByRole('button', { name: 'Log out' }));
    await user.press(screen.getByRole('button', { name: 'Cancel' }));

    expect(signOut).not.toHaveBeenCalled();
    expect(screen.queryByText('Log out?')).toBeNull();
  });

  it('logs out when confirmed', async () => {
    const user = userEvent.setup();
    await renderWithProviders(<Settings />);

    await user.press(screen.getByRole('button', { name: 'Log out' }));
    // The dialog has its own "Log out" button; the row behind it is hidden from the dialog.
    await user.press(screen.getAllByRole('button', { name: 'Log out' }).at(-1)!);

    expect(signOut).toHaveBeenCalledTimes(1);
    expect(screen.queryByText('Log out?')).toBeNull();
  });

  it('is in Polish when the app is', async () => {
    useSettingsStore.setState({ language: 'pl' });
    await i18n.changeLanguage('pl');
    const user = userEvent.setup();
    await renderWithProviders(<Settings />, { language: 'pl' });

    await user.press(screen.getByRole('button', { name: 'Wyloguj się' }));

    expect(screen.getByRole('header', { name: 'Wylogować się?' })).toBeVisible();
    expect(screen.getByText(/Twoje podróże zostają na tym urządzeniu/)).toBeVisible();
  });
});

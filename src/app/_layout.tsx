import { Stack, ThemeProvider as NavigationThemeProvider, type Theme } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import {
  useSettingsHydrated,
  useSettingsStore,
} from '@/modules/settings/screens/Settings/store/settingsStore';
import { useStopsHydrated } from '@/modules/trips/screens/TripList/store/stopsStore';
import { useTripsHydrated } from '@/modules/trips/screens/TripList/store/tripsStore';
import {
  useSessionHydrated,
  useSessionStatus,
  useSessionStore,
} from '@/shared/auth/sessionStore';
import '@/shared/i18n';
import { navigationFonts, ThemeProvider, useTheme } from '@/shared/theme';
import { LoadingScreen } from '@/shared/ui/LoadingScreen';

// Keep the native splash screen visible until the persisted settings (theme, language), trips
// and the saved user are loaded and applied, so the app never flashes the wrong theme, language
// or data.
SplashScreen.preventAutoHideAsync();

const NavigationShell = () => {
  const { colors, scheme } = useTheme();
  const status = useSessionStatus();

  const navigationTheme = useMemo<Theme>(
    () => ({
      dark: scheme === 'dark',
      colors: {
        primary: colors.accent,
        background: colors.background,
        card: colors.surface,
        text: colors.textPrimary,
        border: colors.border,
        notification: colors.danger,
      },
      fonts: navigationFonts,
    }),
    [colors, scheme],
  );

  return (
    <NavigationThemeProvider value={navigationTheme}>
      <Stack screenOptions={{ headerShown: false }}>
        {/* The app is only reachable when logged in; the router sends everyone else to the
            first screen below that is available to them. When the session changes (log in,
            log out) the router moves the user by itself. */}
        <Stack.Protected guard={status === 'signedIn'}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="profile" />
          <Stack.Screen name="new-trip" options={{ presentation: 'modal' }} />
          <Stack.Screen name="trip/[id]/index" />
          <Stack.Screen name="trip/[id]/edit" options={{ presentation: 'modal' }} />
          <Stack.Screen name="trip/[id]/stops/new" options={{ presentation: 'modal' }} />
          <Stack.Screen name="trip/[id]/stops/[stopId]" options={{ presentation: 'modal' }} />
        </Stack.Protected>

        <Stack.Protected guard={status === 'signedOut'}>
          <Stack.Screen name="welcome" />
          <Stack.Screen name="login" />
          <Stack.Screen name="sign-up" />
          <Stack.Screen name="forgot-password" />
        </Stack.Protected>
      </Stack>
    </NavigationThemeProvider>
  );
};

// What the user sees once everything is loaded: a spinner while the saved session is checked,
// then the app (or the log in screens).
const AppRoot = () => {
  const { t } = useTranslation('auth');
  const status = useSessionStatus();

  // The themed tree has rendered, so the splash screen can go away.
  useEffect(() => {
    void SplashScreen.hideAsync();
  }, []);

  return status === 'loading' ? <LoadingScreen label={t('checkingSession')} /> : <NavigationShell />;
};

const RootLayout = () => {
  // Wait for every persisted store, so no screen flashes default data before saved data loads.
  const settingsHydrated = useSettingsHydrated();
  const tripsHydrated = useTripsHydrated();
  const stopsHydrated = useStopsHydrated();
  const sessionHydrated = useSessionHydrated();
  const theme = useSettingsStore((state) => state.theme);
  const restoreSession = useSessionStore((state) => state.restore);

  // Check the saved session once the saved user has been read, as an offline start needs it.
  useEffect(() => {
    if (sessionHydrated) {
      void restoreSession();
    }
  }, [sessionHydrated, restoreSession]);

  if (!settingsHydrated || !tripsHydrated || !stopsHydrated || !sessionHydrated) {
    return null;
  }

  return (
    <ThemeProvider scheme={theme}>
      <AppRoot />
    </ThemeProvider>
  );
};

export default RootLayout;

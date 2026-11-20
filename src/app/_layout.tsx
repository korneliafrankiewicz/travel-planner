import { Stack, ThemeProvider as NavigationThemeProvider, type Theme } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useMemo } from 'react';

import {
  useSettingsHydrated,
  useSettingsStore,
} from '@/modules/settings/screens/Settings/store/settingsStore';
import { useStopsHydrated } from '@/modules/trips/screens/TripList/store/stopsStore';
import { useTripsHydrated } from '@/modules/trips/screens/TripList/store/tripsStore';
import '@/shared/i18n';
import { navigationFonts, ThemeProvider, useTheme } from '@/shared/theme';

// Keep the native splash screen visible until the persisted settings (theme, language) and
// trips are loaded and applied, so the app never flashes the wrong theme, language or data.
SplashScreen.preventAutoHideAsync();

const NavigationShell = () => {
  const { colors, scheme } = useTheme();

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

  // The themed tree has rendered, so the splash screen can go away.
  useEffect(() => {
    void SplashScreen.hideAsync();
  }, []);

  return (
    <NavigationThemeProvider value={navigationTheme}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="profile" />
        <Stack.Screen name="new-trip" options={{ presentation: 'modal' }} />
        <Stack.Screen name="trip/[id]/index" />
        <Stack.Screen name="trip/[id]/edit" options={{ presentation: 'modal' }} />
        <Stack.Screen name="trip/[id]/stops/new" options={{ presentation: 'modal' }} />
        <Stack.Screen name="trip/[id]/stops/[stopId]" options={{ presentation: 'modal' }} />
      </Stack>
    </NavigationThemeProvider>
  );
};

const RootLayout = () => {
  // Wait for every persisted store, so no screen flashes default data before saved data loads.
  const settingsHydrated = useSettingsHydrated();
  const tripsHydrated = useTripsHydrated();
  const stopsHydrated = useStopsHydrated();
  const theme = useSettingsStore((state) => state.theme);

  if (!settingsHydrated || !tripsHydrated || !stopsHydrated) {
    return null;
  }

  return (
    <ThemeProvider scheme={theme}>
      <NavigationShell />
    </ThemeProvider>
  );
};

export default RootLayout;

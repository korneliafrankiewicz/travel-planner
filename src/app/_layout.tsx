import { Stack, ThemeProvider as NavigationThemeProvider, type Theme } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import {
  useSettingsHydrated,
  useSettingsStore,
} from '@/modules/settings/screens/Settings/store/settingsStore';
import '@/shared/i18n';
import { ThemeProvider, useTheme } from '@/shared/theme';

// Keep the native splash screen visible until the persisted settings (theme, language)
// are loaded and applied, so the app never flashes the wrong theme or language.
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
      fonts: {
        regular: { fontFamily: 'System', fontWeight: '400' },
        medium: { fontFamily: 'System', fontWeight: '500' },
        bold: { fontFamily: 'System', fontWeight: '700' },
        heavy: { fontFamily: 'System', fontWeight: '800' },
      },
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
        <Stack.Screen name="new-trip" options={{ presentation: 'modal' }} />
        <Stack.Screen name="trip/[id]/index" />
        <Stack.Screen name="trip/[id]/edit" options={{ presentation: 'modal' }} />
      </Stack>
    </NavigationThemeProvider>
  );
};

const RootLayout = () => {
  const { i18n } = useTranslation();
  const hydrated = useSettingsHydrated();
  const theme = useSettingsStore((state) => state.theme);
  const language = useSettingsStore((state) => state.language);

  // Keep i18next in sync with the persisted language once settings are loaded.
  useEffect(() => {
    if (hydrated && i18n.language !== language) {
      void i18n.changeLanguage(language);
    }
  }, [hydrated, language, i18n]);

  if (!hydrated || i18n.language !== language) {
    return null;
  }

  return (
    <ThemeProvider scheme={theme}>
      <NavigationShell />
    </ThemeProvider>
  );
};

export default RootLayout;

import { createContext, useLayoutEffect, useMemo, type ReactNode } from 'react';
import { Appearance } from 'react-native';

import { themeColors } from './tokens';
import type { ThemeColors, ThemeScheme } from './types';

export type ThemeContextValue = {
  colors: ThemeColors;
  scheme: ThemeScheme;
};

export const ThemeContext = createContext<ThemeContextValue | null>(null);

type ThemeProviderProps = {
  scheme: ThemeScheme;
  children: ReactNode;
};

// The app only has two themes and never follows the device color scheme.
export const ThemeProvider = ({ scheme, children }: ThemeProviderProps) => {
  // Force native components (status bar, keyboard, alerts, native tabs) to the chosen scheme.
  // Runs in a layout effect so it is applied before the splash screen is hidden.
  // `react-native-web` does not implement `setColorScheme`, hence the optional call.
  useLayoutEffect(() => {
    Appearance.setColorScheme?.(scheme);
  }, [scheme]);

  const value = useMemo<ThemeContextValue>(
    () => ({ colors: themeColors[scheme], scheme }),
    [scheme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

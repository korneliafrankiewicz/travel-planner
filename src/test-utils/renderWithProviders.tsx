import { render } from '@testing-library/react-native';
import type { ReactElement } from 'react';

import { i18n } from '@/shared/i18n';
import { ThemeProvider, type ThemeScheme } from '@/shared/theme';

type Options = {
  scheme?: ThemeScheme;
  language?: 'en' | 'pl';
};

// Renders a component the way the app does: inside the theme, with translations loaded.
export const renderWithProviders = async (
  ui: ReactElement,
  { scheme = 'light', language = 'en' }: Options = {},
) => {
  await i18n.changeLanguage(language);
  return render(<ThemeProvider scheme={scheme}>{ui}</ThemeProvider>);
};

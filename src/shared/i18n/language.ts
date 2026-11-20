import { getLocales } from 'expo-localization';

import type { AppLanguage } from './types';

export const DEFAULT_LANGUAGE: AppLanguage = 'en';

export const SUPPORTED_LANGUAGES: readonly AppLanguage[] = ['en', 'pl'];

export const isAppLanguage = (value: string | null | undefined): value is AppLanguage =>
  SUPPORTED_LANGUAGES.some((language) => language === value);

// Picks the first device language we support, falling back to English.
export const detectDeviceLanguage = (): AppLanguage => {
  const match = getLocales().find((locale) => isAppLanguage(locale.languageCode));
  return match !== undefined && isAppLanguage(match.languageCode)
    ? match.languageCode
    : DEFAULT_LANGUAGE;
};

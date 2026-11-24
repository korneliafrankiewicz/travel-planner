import { createInstance } from 'i18next';
import { initReactI18next } from 'react-i18next';

import { DEFAULT_LANGUAGE, detectDeviceLanguage } from './language';
import { auth as authEn } from './locales/en/auth';
import { common as commonEn } from './locales/en/common';
import { profile as profileEn } from './locales/en/profile';
import { settings as settingsEn } from './locales/en/settings';
import { trips as tripsEn } from './locales/en/trips';
import { auth as authPl } from './locales/pl/auth';
import { common as commonPl } from './locales/pl/common';
import { profile as profilePl } from './locales/pl/profile';
import { settings as settingsPl } from './locales/pl/settings';
import { trips as tripsPl } from './locales/pl/trips';
import type { Resources } from './types';

export const defaultNamespace = 'common';

export const resources = {
  en: { common: commonEn, auth: authEn, profile: profileEn, settings: settingsEn, trips: tripsEn },
  pl: { common: commonPl, auth: authPl, profile: profilePl, settings: settingsPl, trips: tripsPl },
};

const i18n = createInstance();

i18n.use(initReactI18next).init({
  resources,
  lng: detectDeviceLanguage(),
  fallbackLng: DEFAULT_LANGUAGE,
  defaultNS: defaultNamespace,
  ns: Object.keys(resources.en),
  interpolation: { escapeValue: false },
  initAsync: false,
  react: { useSuspense: false },
});

declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: typeof defaultNamespace;
    resources: Resources;
  }
}

export { i18n };
export { DEFAULT_LANGUAGE, SUPPORTED_LANGUAGES, detectDeviceLanguage, isAppLanguage } from './language';
export type { AppLanguage } from './types';

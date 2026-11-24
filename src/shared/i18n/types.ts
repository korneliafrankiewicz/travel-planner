import type { auth } from './locales/en/auth';
import type { common } from './locales/en/common';
import type { profile } from './locales/en/profile';
import type { settings } from './locales/en/settings';
import type { trips } from './locales/en/trips';

export type AppLanguage = 'en' | 'pl';

// English only needs `_one` and `_other` plural forms, but other languages (e.g. Polish)
// need more. These extra plural suffixes are allowed in non-English locales.
type ExtraPluralForms = {
  [Key in `${string}_${'zero' | 'two' | 'few' | 'many'}`]?: string;
};

// Turns the literal English strings into plain `string`s, so other locales must have
// the same keys as English but can have different values.
export type Translations<T> = {
  [K in keyof T]: T[K] extends string ? string : Translations<T[K]>;
} & ExtraPluralForms;

// English is the source of truth for the translation keys.
export type Resources = {
  common: typeof common;
  auth: typeof auth;
  profile: typeof profile;
  settings: typeof settings;
  trips: typeof trips;
};

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

const namespaces = {
  common: { en: commonEn, pl: commonPl },
  auth: { en: authEn, pl: authPl },
  profile: { en: profileEn, pl: profilePl },
  settings: { en: settingsEn, pl: settingsPl },
  trips: { en: tripsEn, pl: tripsPl },
};

type Tree = { [key: string]: string | Tree };

// "stop.errors.titleRequired" -> "Enter a title"
const flatten = (tree: Tree, prefix = ''): Record<string, string> =>
  Object.entries(tree).reduce<Record<string, string>>((flat, [key, value]) => {
    const path = prefix === '' ? key : `${prefix}.${key}`;
    return typeof value === 'string'
      ? { ...flat, [path]: value }
      : { ...flat, ...flatten(value, path) };
  }, {});

const placeholdersOf = (text: string): string[] =>
  [...text.matchAll(/{{\s*(\w+)\s*}}/g)].map((match) => match[1]).sort();

const PLURAL_SUFFIX = /_(zero|one|two|few|many|other)$/;
const POLISH_PLURAL_FORMS = ['one', 'few', 'many', 'other'];

describe.each(Object.entries(namespaces))('%s translations', (_name, { en, pl }) => {
  const english = flatten(en as unknown as Tree);
  const polish = flatten(pl as unknown as Tree);

  it('has no empty text', () => {
    for (const [key, text] of [...Object.entries(english), ...Object.entries(polish)]) {
      expect([key, text.trim() === '']).toEqual([key, false]);
    }
  });

  it('has a Polish text for every English key', () => {
    const missing = Object.keys(english).filter((key) => !(key in polish));
    expect(missing).toEqual([]);
  });

  it('has no Polish key that English does not have, except extra plural forms', () => {
    const unexpected = Object.keys(polish).filter((key) => {
      if (key in english) {
        return false;
      }
      const base = key.replace(PLURAL_SUFFIX, '');
      return !(`${base}_one` in english || `${base}_other` in english);
    });
    expect(unexpected).toEqual([]);
  });

  it('gives every Polish plural all four forms (one, few, many, other)', () => {
    const bases = new Set(
      Object.keys(polish)
        .filter((key) => PLURAL_SUFFIX.test(key))
        .map((key) => key.replace(PLURAL_SUFFIX, '')),
    );
    for (const base of bases) {
      const forms = POLISH_PLURAL_FORMS.filter((form) => `${base}_${form}` in polish);
      expect([base, forms]).toEqual([base, POLISH_PLURAL_FORMS]);
    }
  });

  it('uses the same {{placeholders}} in both languages', () => {
    for (const [key, text] of Object.entries(polish)) {
      // An extra Polish plural form is compared with the English "other" form.
      const englishText = english[key] ?? english[`${key.replace(PLURAL_SUFFIX, '')}_other`];
      expect([key, placeholdersOf(text)]).toEqual([key, placeholdersOf(englishText)]);
    }
  });

  it('keeps the English plural forms in pairs (one and other)', () => {
    const bases = new Set(
      Object.keys(english)
        .filter((key) => PLURAL_SUFFIX.test(key))
        .map((key) => key.replace(PLURAL_SUFFIX, '')),
    );
    for (const base of bases) {
      expect([base, `${base}_one` in english, `${base}_other` in english]).toEqual([
        base,
        true,
        true,
      ]);
    }
  });
});

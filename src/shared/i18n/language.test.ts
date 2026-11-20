import { getLocales } from 'expo-localization';

import { DEFAULT_LANGUAGE, detectDeviceLanguage, isAppLanguage } from './language';

jest.mock('expo-localization', () => ({ getLocales: jest.fn() }));

const mockLocales = (...languageCodes: (string | null)[]) => {
  jest.mocked(getLocales).mockReturnValue(
    languageCodes.map((languageCode) => ({ languageCode })) as ReturnType<typeof getLocales>,
  );
};

describe('isAppLanguage', () => {
  it.each(['en', 'pl'])('accepts %s', (value) => {
    expect(isAppLanguage(value)).toBe(true);
  });

  it.each(['de', 'EN', 'pl-PL', '', null, undefined])('rejects %p', (value) => {
    expect(isAppLanguage(value)).toBe(false);
  });
});

describe('detectDeviceLanguage', () => {
  it('falls back to English by default', () => {
    expect(DEFAULT_LANGUAGE).toBe('en');
  });

  it('uses Polish when the device is set to Polish', () => {
    mockLocales('pl');
    expect(detectDeviceLanguage()).toBe('pl');
  });

  it('uses English when the device is set to English', () => {
    mockLocales('en');
    expect(detectDeviceLanguage()).toBe('en');
  });

  it('falls back to English for an unsupported language', () => {
    mockLocales('de');
    expect(detectDeviceLanguage()).toBe('en');
  });

  it('picks the first supported language from the device list', () => {
    mockLocales('de', 'pl', 'en');
    expect(detectDeviceLanguage()).toBe('pl');
  });

  it('copes with a locale that has no language code', () => {
    mockLocales(null, 'pl');
    expect(detectDeviceLanguage()).toBe('pl');
  });
});

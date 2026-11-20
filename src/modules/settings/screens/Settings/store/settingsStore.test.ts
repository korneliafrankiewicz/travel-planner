import AsyncStorage from '@react-native-async-storage/async-storage';

import { flushStorage, launchApp, waitForHydration } from '@/test-utils/storeTestUtils';

// Each call is one app launch, on a device set to `deviceLanguage`.
const launch = async (deviceLanguage = 'en') => {
  const { settings, i18n } = launchApp(
    () => ({
      settings: jest.requireActual<typeof import('./settingsStore')>('./settingsStore'),
      i18n: jest.requireActual<typeof import('@/shared/i18n')>('@/shared/i18n').i18n,
    }),
    () => {
      jest.doMock('expo-localization', () => ({
        getLocales: () => [{ languageCode: deviceLanguage }],
      }));
    },
  );
  await waitForHydration(settings.useSettingsStore);
  return { store: settings.useSettingsStore, i18n };
};

beforeEach(async () => {
  await AsyncStorage.clear();
  jest.spyOn(console, 'warn').mockImplementation(() => {});
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe('defaults', () => {
  it('uses the light theme', async () => {
    const { store } = await launch();
    expect(store.getState().theme).toBe('light');
  });

  it.each([
    ['pl', 'pl'],
    ['en', 'en'],
    ['de', 'en'],
  ])('on a device set to %s uses %s', async (device, expected) => {
    const { store } = await launch(device);
    expect(store.getState().language).toBe(expected);
  });
});

describe('changing settings', () => {
  it('saves the theme and restores it after a restart', async () => {
    let app = await launch();
    app.store.getState().setTheme('dark');
    await flushStorage();

    app = await launch();
    expect(app.store.getState().theme).toBe('dark');
  });

  it('saves the language and restores it after a restart, even on a device in another language', async () => {
    let app = await launch('en');
    app.store.getState().setLanguage('pl');
    await flushStorage();

    app = await launch('en');
    expect(app.store.getState().language).toBe('pl');
  });

  it('stores only the two settings, not the functions', async () => {
    const { store } = await launch();
    store.getState().setTheme('dark');
    await flushStorage();
    const saved = JSON.parse((await AsyncStorage.getItem('settings')) as string);
    expect(Object.keys(saved.state).sort()).toEqual(['language', 'theme']);
  });
});

describe('the app language follows the setting', () => {
  it('switches the translations as soon as the language changes', async () => {
    const { store, i18n } = await launch('en');
    expect(i18n.t('screenTitle', { ns: 'settings' })).toBe('Settings');

    store.getState().setLanguage('pl');
    expect(i18n.language).toBe('pl');
    expect(i18n.t('screenTitle', { ns: 'settings' })).toBe('Ustawienia');

    store.getState().setLanguage('en');
    expect(i18n.t('screenTitle', { ns: 'settings' })).toBe('Settings');
  });

  it('applies a saved language that differs from the device language on startup', async () => {
    let app = await launch('en');
    app.store.getState().setLanguage('pl');
    await flushStorage();

    app = await launch('en');
    expect(app.i18n.language).toBe('pl');
  });
});

describe('bad stored data never blocks startup', () => {
  it('ignores a theme that no longer exists (the old "system" option)', async () => {
    await AsyncStorage.setItem(
      'settings',
      JSON.stringify({ state: { theme: 'system', language: 'pl' }, version: 1 }),
    );
    const { store } = await launch();
    expect(store.getState().theme).toBe('light');
    expect(store.getState().language).toBe('pl');
  });

  it('ignores an unsupported language and uses the device language', async () => {
    await AsyncStorage.setItem(
      'settings',
      JSON.stringify({ state: { theme: 'dark', language: 'de' }, version: 1 }),
    );
    const { store } = await launch('pl');
    expect(store.getState().theme).toBe('dark');
    expect(store.getState().language).toBe('pl');
  });

  it('survives corrupt JSON and a failing read', async () => {
    await AsyncStorage.setItem('settings', '{broken');
    expect((await launch()).store.getState().theme).toBe('light');

    // A one-time failure: a permanent one would also break the tests that run after this one.
    jest.spyOn(AsyncStorage, 'getItem').mockRejectedValueOnce(new Error('read failed'));
    expect((await launch()).store.getState().theme).toBe('light');
  });
});

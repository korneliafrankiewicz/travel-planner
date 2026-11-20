// AsyncStorage needs its native module, which does not exist in tests. Use the in-memory
// mock that ships with the package.
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

// The device language comes from a native module. Tests run on an "English" device unless a
// test sets up something else.
jest.mock('expo-localization', () => ({
  getLocales: () => [{ languageCode: 'en' }],
}));

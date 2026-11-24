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

// The map is a native view. In tests it is a plain view; tests tap it with
// `fireEvent(map, 'press', { nativeEvent: { coordinate } })`. Every marker is a button that
// calls `onCalloutPress`, so tests can check which pins are shown and what a tap does.
// A marker without a title (the location picker's pin) is found by its test id.
jest.mock('react-native-maps', () => {
  const { createElement } = require('react');
  const { Pressable, View } = require('react-native');
  const MapView = ({ children, accessibilityLabel }) =>
    createElement(View, { testID: 'map-view', accessibilityLabel }, children);
  const Marker = ({ title, description, coordinate, onCalloutPress }) =>
    createElement(Pressable, {
      testID: 'map-pin',
      accessibilityRole: 'button',
      accessibilityLabel:
        title !== undefined
          ? `pin: ${title}, ${description}`
          : `pin at ${coordinate.latitude}, ${coordinate.longitude}`,
      onPress: onCalloutPress,
    });
  return { __esModule: true, default: MapView, Marker };
});

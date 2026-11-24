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

// The map is a native view. In tests it is a plain view, and every marker is a button that
// calls `onCalloutPress`, so tests can check which pins are shown and what a tap does.
jest.mock('react-native-maps', () => {
  const { createElement } = require('react');
  const { Pressable, View } = require('react-native');
  const MapView = ({ children, accessibilityLabel }) =>
    createElement(View, { testID: 'map-view', accessibilityLabel }, children);
  const Marker = ({ title, description, onCalloutPress }) =>
    createElement(Pressable, {
      accessibilityRole: 'button',
      accessibilityLabel: `pin: ${title}, ${description}`,
      onPress: onCalloutPress,
    });
  return { __esModule: true, default: MapView, Marker };
});

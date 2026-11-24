import type { LocationPickerProps } from './LocationPicker.types';

// react-native-maps does not support the web. The form hides the "Choose on map" button
// there, so coordinates are typed in instead.
export const LocationPicker = (_props: LocationPickerProps) => null;

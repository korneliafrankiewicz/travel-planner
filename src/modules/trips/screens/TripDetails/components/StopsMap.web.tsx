import type { StopsMapProps } from './StopsMap.types';

// react-native-maps does not support the web, so the map section shows its fallback card
// (with the "Open in Google Maps" link) instead of a map.
export const StopsMap = (_props: StopsMapProps) => null;

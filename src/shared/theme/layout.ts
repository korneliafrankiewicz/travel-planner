import { Platform } from 'react-native';

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  pill: 999,
} as const;

export const maxContentWidth = 800;

// Space reserved for the floating tab bar at the top of the web layout.
export const webTabBarInset = Platform.OS === 'web' ? 80 : 0;

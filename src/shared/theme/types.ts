export type ThemeScheme = 'light' | 'dark';

export type ThemeColors = {
  background: string;
  surface: string;
  surfaceSelected: string;
  textPrimary: string;
  textSecondary: string;
  accent: string;
  // Text and icons drawn on top of `accent`.
  onAccent: string;
  accentSecondary: string;
  border: string;
  danger: string;
};

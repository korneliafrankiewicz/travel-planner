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
  // Light in both themes, so it is used as a fill with `onAccentSecondary` text on top.
  accentSecondary: string;
  onAccentSecondary: string;
  border: string;
  danger: string;
  // Backdrop color behind dialogs, used with partial opacity.
  scrim: string;
};

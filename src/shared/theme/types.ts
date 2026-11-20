export type ThemeScheme = 'light' | 'dark';

export type ThemeColors = {
  background: string;
  surface: string;
  surfaceSelected: string;
  textPrimary: string;
  textSecondary: string;
  accent: string;
  onAccent: string;
  border: string;
  danger: string;
};

export type ThemeColorName = keyof ThemeColors;

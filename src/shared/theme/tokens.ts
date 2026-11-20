import type { ThemeColors, ThemeScheme } from './types';

export const lightColors: ThemeColors = {
  background: '#F6F5FB',
  surface: '#FFFFFF',
  surfaceSelected: '#E6E3F8',
  textPrimary: '#16152A',
  textSecondary: '#606060',
  accent: '#5A4FCF',
  onAccent: '#FFFFFF',
  accentSecondary: '#C4CF4F',
  onAccentSecondary: '#16152A',
  border: '#DAD8EC',
  danger: '#D1324A',
  scrim: '#16152A',
};

export const darkColors: ThemeColors = {
  background: '#0F0E17',
  surface: '#181725',
  surfaceSelected: '#262440',
  textPrimary: '#EFEEF8',
  textSecondary: '#A9A8B8',
  accent: '#9C94F2',
  onAccent: '#0F0C2B',
  accentSecondary: '#C4CF4F',
  onAccentSecondary: '#16152A',
  border: '#2C2B3F',
  danger: '#FF6B7F',
  scrim: '#000000',
};

export const themeColors: Record<ThemeScheme, ThemeColors> = {
  light: lightColors,
  dark: darkColors,
};

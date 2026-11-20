import type { ThemeColors, ThemeScheme } from './types';

export const lightColors: ThemeColors = {
  background: '#F5F6F8',
  surface: '#FFFFFF',
  surfaceSelected: '#E3E6EB',
  textPrimary: '#111418',
  textSecondary: '#5B6169',
  accent: '#2F6FED',
  onAccent: '#FFFFFF',
  border: '#D9DCE1',
  danger: '#D1324A',
};

export const darkColors: ThemeColors = {
  background: '#0B0C0E',
  surface: '#17191C',
  surfaceSelected: '#2A2D32',
  textPrimary: '#F2F3F5',
  textSecondary: '#A0A6AE',
  accent: '#6B9BFF',
  onAccent: '#0B0C0E',
  border: '#2C2F34',
  danger: '#FF6B7F',
};

export const themeColors: Record<ThemeScheme, ThemeColors> = {
  light: lightColors,
  dark: darkColors,
};

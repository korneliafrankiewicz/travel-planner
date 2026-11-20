import type { Theme } from 'expo-router';
import type { TextStyle } from 'react-native';

// Font weights. Prefer the text styles in `typography` below; use these only when a
// component needs a one-off weight on top of a text style.
export const fontWeight = {
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
  heavy: '800',
} as const;

// Text styles, named by role (titles) or by size and weight (everything else).
// Components spread them into their styles and add only the color, e.g.
//   title: { ...typography.screenTitle }
//   <Text style={[styles.title, { color: colors.textPrimary }]} />
export const typography = {
  // Titles
  screenTitle: { fontSize: 32, fontWeight: fontWeight.bold },
  modalTitle: { fontSize: 28, fontWeight: fontWeight.bold },
  dialogTitle: { fontSize: 20, fontWeight: fontWeight.bold },
  cardTitle: { fontSize: 18, fontWeight: fontWeight.bold },

  // 16 pt: inputs, rows, buttons
  large: { fontSize: 16, fontWeight: fontWeight.regular },
  largeMedium: { fontSize: 16, fontWeight: fontWeight.medium },
  largeSemibold: { fontSize: 16, fontWeight: fontWeight.semibold },
  largeBold: { fontSize: 16, fontWeight: fontWeight.bold },

  // 15 pt: labels and running text
  body: { fontSize: 15, fontWeight: fontWeight.regular, lineHeight: 22 },
  bodyMedium: { fontSize: 15, fontWeight: fontWeight.medium },
  bodySemibold: { fontSize: 15, fontWeight: fontWeight.semibold },
  bodyBold: { fontSize: 15, fontWeight: fontWeight.bold },

  // 14 pt: secondary text
  small: { fontSize: 14, fontWeight: fontWeight.regular },
  smallSemibold: { fontSize: 14, fontWeight: fontWeight.semibold },

  // 13 pt: hints and errors, and section headers in settings
  footnote: { fontSize: 13, fontWeight: fontWeight.regular },
  sectionHeader: {
    fontSize: 13,
    fontWeight: fontWeight.semibold,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },

  // 12 pt: badges, chips and calendar weekdays
  captionSemibold: { fontSize: 12, fontWeight: fontWeight.semibold },
  captionBold: { fontSize: 12, fontWeight: fontWeight.bold },
} as const satisfies Record<string, TextStyle>;

// Fonts for the React Navigation theme (used for native headers and tab labels).
export const navigationFonts = {
  regular: { fontFamily: 'System', fontWeight: fontWeight.regular },
  medium: { fontFamily: 'System', fontWeight: fontWeight.medium },
  bold: { fontFamily: 'System', fontWeight: fontWeight.bold },
  heavy: { fontFamily: 'System', fontWeight: fontWeight.heavy },
} as const satisfies Theme['fonts'];

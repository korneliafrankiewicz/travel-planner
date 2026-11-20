export const settings = {
  screenTitle: 'Settings',
  sections: {
    appearance: 'Appearance',
  },
  theme: {
    title: 'Theme',
    options: {
      light: 'Light',
      dark: 'Dark',
    },
  },
  language: {
    title: 'Language',
    // Language names are always shown in their own language, in every locale.
    options: {
      pl: 'Polski',
      en: 'English',
    },
  },
} as const;

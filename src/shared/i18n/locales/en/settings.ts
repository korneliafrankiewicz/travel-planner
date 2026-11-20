export const settings = {
  screenTitle: 'Settings',
  comingSoon: 'Coming soon',
  sections: {
    appearance: 'Appearance',
    security: 'Security',
    account: 'Account',
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
  security: {
    biometric: {
      title: 'Biometric unlock',
    },
    changePin: {
      title: 'Change PIN',
    },
    lockAfter: {
      title: 'Lock after',
    },
  },
  account: {
    logOut: {
      title: 'Log out',
    },
    deleteAccount: {
      title: 'Delete account and data',
    },
  },
} as const;

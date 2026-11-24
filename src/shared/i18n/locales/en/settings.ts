export const settings = {
  screenTitle: 'Settings',
  comingSoon: 'Coming soon',
  sections: {
    appearance: 'Appearance',
    security: 'Security',
    account: 'Account',
    developer: 'Developer',
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
      confirm: {
        title: 'Log out?',
        message: 'You will need to log in again to use the app. Your trips stay on this device.',
        confirm: 'Log out',
        cancel: 'Cancel',
      },
    },
    deleteAccount: {
      title: 'Delete account and data',
    },
  },
  developer: {
    resetSampleData: {
      title: 'Reset sample data',
      hint: 'Restore the sample trips',
      done: 'Sample data restored',
      confirm: {
        title: 'Reset sample data?',
        message: 'All trips and stops on this device will be replaced by the sample trips (Lisbon and the Tatra Mountains). This cannot be undone.',
        confirm: 'Reset',
        cancel: 'Cancel',
      },
    },
  },
} as const;

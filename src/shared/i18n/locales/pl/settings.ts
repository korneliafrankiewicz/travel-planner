import type { settings as en } from '../en/settings';
import type { Translations } from '../../types';

export const settings: Translations<typeof en> = {
  screenTitle: 'Ustawienia',
  comingSoon: 'Wkrótce',
  sections: {
    appearance: 'Wygląd',
    security: 'Zabezpieczenia',
    account: 'Konto',
  },
  theme: {
    title: 'Motyw',
    options: {
      light: 'Jasny',
      dark: 'Ciemny',
    },
  },
  language: {
    title: 'Język',
    options: {
      pl: 'Polski',
      en: 'English',
    },
  },
  security: {
    biometric: {
      title: 'Odblokowanie biometryczne',
    },
    changePin: {
      title: 'Zmień PIN',
    },
    lockAfter: {
      title: 'Blokuj po',
    },
  },
  account: {
    logOut: {
      title: 'Wyloguj się',
    },
    deleteAccount: {
      title: 'Usuń konto i dane',
    },
  },
};

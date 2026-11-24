import type { settings as en } from '../en/settings';
import type { Translations } from '../../types';

export const settings: Translations<typeof en> = {
  screenTitle: 'Ustawienia',
  comingSoon: 'Wkrótce',
  sections: {
    appearance: 'Wygląd',
    security: 'Zabezpieczenia',
    account: 'Konto',
    developer: 'Deweloper',
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
  developer: {
    resetSampleData: {
      title: 'Przywróć dane przykładowe',
      hint: 'Przywróć przykładowe podróże',
      done: 'Przywrócono dane przykładowe',
      confirm: {
        title: 'Przywrócić dane przykładowe?',
        message: 'Wszystkie podróże i punkty na tym urządzeniu zostaną zastąpione przykładowymi podróżami (Lizbona i Tatry). Tej operacji nie można cofnąć.',
        confirm: 'Przywróć',
        cancel: 'Anuluj',
      },
    },
  },
};

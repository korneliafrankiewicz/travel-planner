import type { settings as en } from '../en/settings';
import type { Translations } from '../../types';

export const settings: Translations<typeof en> = {
  screenTitle: 'Ustawienia',
  sections: {
    appearance: 'Wygląd',
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
};

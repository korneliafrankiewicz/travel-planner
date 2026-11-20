import type { trips as en } from '../en/trips';
import type { Translations } from '../../types';

export const trips: Translations<typeof en> = {
  title: 'Twoje podróże',
  newTrip: 'Nowa podróż',
  header: {
    avatarLabel: 'Profil',
  },
  tabs: {
    label: 'Filtr podróży',
    upcoming: 'Nadchodzące',
    past: 'Minione',
  },
  badge: {
    today: 'Dzisiaj',
    ongoing: 'W trakcie',
    inDays_one: 'Za {{count}} dzień',
    inDays_few: 'Za {{count}} dni',
    inDays_many: 'Za {{count}} dni',
    inDays_other: 'Za {{count}} dnia',
  },
  summary: {
    days_one: '{{count}} dzień',
    days_few: '{{count}} dni',
    days_many: '{{count}} dni',
    days_other: '{{count}} dnia',
    stops_one: '{{count}} punkt',
    stops_few: '{{count}} punkty',
    stops_many: '{{count}} punktów',
    stops_other: '{{count}} punktu',
    joined: '{{days}} · {{stops}}',
  },
  empty: {
    upcoming: 'Nie masz jeszcze żadnych podróży',
    past: 'Nie masz minionych podróży',
  },
};

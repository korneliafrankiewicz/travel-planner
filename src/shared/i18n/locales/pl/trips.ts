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
  details: {
    back: 'Wstecz',
    edit: 'Edytuj podróż',
    delete: 'Usuń podróż',
    noDestination: 'Nie ustawiono celu podróży',
    map: {
      title: 'Mapa',
      empty: 'Dodaj współrzędne do punktu, aby zobaczyć go na mapie',
      markerDescription: 'Dzień {{day}} · {{time}}',
      open: 'Otwórz w Mapach Google',
    },
  },
  delete: {
    title: 'Usunąć tę podróż?',
    message: '„{{title}}” i wszystkie jej dane zostaną usunięte. Tej operacji nie można cofnąć.',
    confirm: 'Usuń',
  },
  distance: {
    meters: '{{value}} m',
    kilometers: '{{value}} km',
  },
  itinerary: {
    title: 'Plan podróży',
    day: 'Dzień {{number}}',
    outsideTrip: 'Poza datami podróży',
    addStop: 'Dodaj punkt',
    empty: 'Nie zaplanowano jeszcze żadnych punktów',
    overlap: 'Nakłada się na inny punkt',
    route: {
      show: 'Pokaż trasę na mapie',
      hide: 'Ukryj trasę',
      summary: '{{stops}} · {{distance}}',
      mapLabel: 'Mapa trasy z danego dnia',
      leg: '{{fromOrder}}. {{from}} → {{toOrder}}. {{to}}',
      legAccessible: 'Z punktu {{from}} do punktu {{to}}, {{distance}}',
      straightLine: 'Odległości są liczone w linii prostej między punktami, a nie jako długość trasy pieszej lub samochodowej.',
    },
  },
  stop: {
    locationPreview: 'Mapa pokazująca, gdzie jest ten punkt',
    newTitle: 'Nowy punkt',
    editTitle: 'Edytuj punkt',
    save: 'Zapisz punkt',
    delete: 'Usuń punkt',
    duration: {
      minutes: '{{value}} min',
      hours: '{{value}} godz.',
      hoursMinutes: '{{hours}} godz. {{minutes}} min',
    },
    types: {
      lodging: 'Nocleg',
      meal: 'Posiłek',
      attraction: 'Atrakcja',
      other: 'Inne',
    },
    fields: {
      type: {
        label: 'Rodzaj',
      },
      title: {
        label: 'Nazwa',
        placeholder: 'np. Kolacja w Time Out Market',
      },
      day: {
        label: 'Dzień',
      },
      startTime: {
        label: 'Godzina rozpoczęcia',
        placeholder: '09:00',
      },
      duration: {
        label: 'Czas trwania (minuty)',
        placeholder: '60',
      },
      search: {
        label: 'Wyszukaj miejsce',
        placeholder: 'np. Wieża Belém, Lizbona',
      },
      location: {
        label: 'Lokalizacja',
        hint: 'Opcjonalne. Wybierz miejsce na mapie lub podaj obie współrzędne.',
        choose: 'Wybierz na mapie',
        change: 'Zmień na mapie',
        clear: 'Usuń lokalizację',
      },
      latitude: {
        label: 'Szerokość geograficzna',
        placeholder: '38.7223',
      },
      longitude: {
        label: 'Długość geograficzna',
        placeholder: '-9.1393',
      },
      url: {
        label: 'Link',
        placeholder: 'https://…',
      },
    },
    search: {
      searching: 'Szukam…',
      noResults: 'Nie znaleziono miejsc. Spróbuj innej nazwy.',
      error: 'Wyszukiwanie miejsc jest teraz niedostępne. Sprawdź połączenie.',
      attribution: 'Wyniki wyszukiwania © współtwórcy OpenStreetMap',
    },
    locationPicker: {
      title: 'Wybierz lokalizację',
      hint: 'Dotknij mapy, aby umieścić pinezkę',
      hintPlaced: 'Przeciągnij pinezkę lub dotknij innego miejsca, aby ją przenieść',
      confirm: 'Użyj tej lokalizacji',
      mapLabel: 'Mapa do wyboru lokalizacji',
    },
    deleteConfirm: {
      title: 'Usunąć ten punkt?',
      message: '„{{title}}” zostanie usunięty z planu.',
    },
    errors: {
      titleRequired: 'Podaj nazwę',
      dateInvalid: 'Wybierz dzień',
      dayOutOfRange: 'Wybierz dzień podróży',
      pastDate: 'Nie można planować punktów na dni z przeszłości',
      timeInvalid: 'Podaj godzinę w formacie GG:MM, np. 09:30',
      durationInvalid: 'Podaj czas trwania w minutach (0–1440)',
      endsAfterMidnight: 'Punkt musi kończyć się do północy',
      urlInvalid: 'Podaj link zaczynający się od https://',
      latitudeInvalid: 'Podaj szerokość geograficzną od -90 do 90, np. 38.7223',
      longitudeInvalid: 'Podaj długość geograficzną od -180 do 180, np. -9.1393',
    },
  },
  form: {
    editTitle: 'Edytuj podróż',
    saveChanges: 'Zapisz zmiany',
    cancel: 'Anuluj',
    save: 'Zapisz podróż',
    optional: 'Opcjonalne',
    fields: {
      title: {
        label: 'Nazwa podróży',
        placeholder: 'np. Weekend w Lizbonie',
      },
      destination: {
        label: 'Cel podróży',
        placeholder: 'Miasto lub kraj',
      },
      dates: {
        label: 'Daty',
        hint: 'Wybierz datę początku, a potem datę końca',
      },
      notes: {
        label: 'Notatki',
        placeholder: 'Wszystko, co warto zapamiętać',
      },
    },
    errors: {
      titleRequired: 'Podaj nazwę podróży',
      datesRequired: 'Wybierz datę początku i końca',
      pastDate: 'Daty nie mogą być z przeszłości',
      endBeforeStart: 'Data końca nie może być wcześniejsza niż data początku',
    },
    calendar: {
      previousMonth: 'Poprzedni miesiąc',
      nextMonth: 'Następny miesiąc',
    },
  },
};

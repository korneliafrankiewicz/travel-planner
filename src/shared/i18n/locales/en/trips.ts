export const trips = {
  title: 'Your trips',
  newTrip: 'New trip',
  header: {
    avatarLabel: 'Profile',
  },
  tabs: {
    label: 'Trip filter',
    upcoming: 'Upcoming',
    past: 'Past',
  },
  badge: {
    today: 'Today',
    ongoing: 'Ongoing',
    inDays_one: 'In {{count}} day',
    inDays_other: 'In {{count}} days',
  },
  summary: {
    days_one: '{{count}} day',
    days_other: '{{count}} days',
    stops_one: '{{count}} stop',
    stops_other: '{{count}} stops',
    // Joins the day count and the stop count, e.g. "3 days · 9 stops".
    joined: '{{days}} · {{stops}}',
  },
  empty: {
    upcoming: 'You have no trips yet',
    past: 'You have no past trips',
  },
  form: {
    cancel: 'Cancel',
    save: 'Save trip',
    optional: 'Optional',
    fields: {
      title: {
        label: 'Trip title',
        placeholder: 'e.g. Weekend in Lisbon',
      },
      destination: {
        label: 'Destination',
        placeholder: 'City or country',
      },
      dates: {
        label: 'Dates',
        hint: 'Tap a start date, then an end date',
      },
      notes: {
        label: 'Notes',
        placeholder: 'Anything worth remembering',
      },
    },
    errors: {
      titleRequired: 'Enter a trip title',
      datesRequired: 'Select a start and an end date',
    },
    calendar: {
      previousMonth: 'Previous month',
      nextMonth: 'Next month',
    },
  },
} as const;

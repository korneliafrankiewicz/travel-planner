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
  details: {
    back: 'Back',
    edit: 'Edit trip',
    delete: 'Delete trip',
    noDestination: 'No destination set',
    map: {
      title: 'Map',
      empty: 'Add coordinates to a stop to see it on the map',
      markerDescription: 'Day {{day}} · {{time}}',
      open: 'Open in Google Maps',
    },
  },
  delete: {
    title: 'Delete this trip?',
    message: '"{{title}}" and all its details will be removed. This cannot be undone.',
    confirm: 'Delete',
  },
  distance: {
    meters: '{{value}} m',
    kilometers: '{{value}} km',
  },
  itinerary: {
    title: 'Itinerary',
    day: 'Day {{number}}',
    outsideTrip: 'Outside the trip dates',
    addStop: 'Add stop',
    empty: 'No stops planned yet',
    overlap: 'Overlaps with another stop',
    route: {
      show: 'Show route on map',
      hide: 'Hide route',
      summary: '{{stops}} · {{distance}}',
      mapLabel: 'Map of the day’s route',
      leg: '{{fromOrder}}. {{from}} → {{toOrder}}. {{to}}',
      legAccessible: 'From {{from}} to {{to}}, {{distance}}',
      straightLine: 'Distances are in a straight line between stops, not the length of a walking or driving route.',
    },
  },
  stop: {
    locationPreview: 'Map showing where the stop is',
    newTitle: 'New stop',
    editTitle: 'Edit stop',
    save: 'Save stop',
    delete: 'Delete stop',
    duration: {
      minutes: '{{value}} min',
      hours: '{{value}} h',
      hoursMinutes: '{{hours}} h {{minutes}} min',
    },
    types: {
      lodging: 'Lodging',
      meal: 'Meal',
      attraction: 'Attraction',
      other: 'Other',
    },
    fields: {
      type: {
        label: 'Type',
      },
      title: {
        label: 'Title',
        placeholder: 'e.g. Dinner at Time Out Market',
      },
      day: {
        label: 'Day',
      },
      startTime: {
        label: 'Start time',
        placeholder: '09:00',
      },
      duration: {
        label: 'Duration (minutes)',
        placeholder: '60',
      },
      search: {
        label: 'Search for a place',
        placeholder: 'e.g. Belém Tower, Lisbon',
      },
      location: {
        label: 'Location',
        hint: 'Optional. Choose a place on the map, or enter both coordinates.',
        choose: 'Choose on map',
        change: 'Change on map',
        clear: 'Clear location',
      },
      latitude: {
        label: 'Latitude',
        placeholder: '38.7223',
      },
      longitude: {
        label: 'Longitude',
        placeholder: '-9.1393',
      },
      url: {
        label: 'Link',
        placeholder: 'https://…',
      },
    },
    search: {
      searching: 'Searching…',
      noResults: 'No places found. Try another name.',
      error: 'Place search is unavailable right now. Check your connection.',
      attribution: 'Search results © OpenStreetMap contributors',
    },
    locationPicker: {
      title: 'Choose location',
      hint: 'Tap the map to place the pin',
      hintPlaced: 'Drag the pin or tap elsewhere to move it',
      confirm: 'Use this location',
      mapLabel: 'Map for choosing a location',
    },
    deleteConfirm: {
      title: 'Delete this stop?',
      message: '"{{title}}" will be removed from the itinerary.',
    },
    errors: {
      titleRequired: 'Enter a title',
      dateInvalid: 'Choose a day',
      dayOutOfRange: 'Choose a day of the trip',
      pastDate: "Stops can't be planned for days in the past",
      timeInvalid: 'Enter a time as HH:mm, e.g. 09:30',
      durationInvalid: 'Enter the duration in minutes (0–1440)',
      endsAfterMidnight: 'The stop must end by midnight',
      urlInvalid: 'Enter a link starting with https://',
      latitudeInvalid: 'Enter a latitude between -90 and 90, e.g. 38.7223',
      longitudeInvalid: 'Enter a longitude between -180 and 180, e.g. -9.1393',
    },
  },
  form: {
    editTitle: 'Edit trip',
    saveChanges: 'Save changes',
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
      pastDate: "Dates can't be in the past",
      endBeforeStart: 'The end date must not be before the start date',
    },
    calendar: {
      previousMonth: 'Previous month',
      nextMonth: 'Next month',
    },
  },
} as const;

# Architecture

## Stack

- **Expo SDK 58** with React Native, TypeScript (strict) and the **React Compiler** enabled
  (`app.json`, `experiments.reactCompiler`), so manual memoization (`useMemo`, `useCallback`)
  is rarely needed.
- **Expo Router** for navigation (file-based, typed routes).
- **Zustand** for state, saved with **AsyncStorage**; the login token goes to **SecureStore**.
- **Zod** to check data read from storage, forms and responses from outside.
- **i18next** with `react-i18next` for texts, in English and Polish.
- **Jest** with React Testing Library for tests.

## Folders

```
server/             The back end (a separate Node.js project; see Back end)
src/
  app/              Routes. Thin: each file only re-exports a screen.
  components/       The tab bar (app-tabs, with a .web.tsx variant).
  modules/
    auth/           Welcome, Login, SignUp, ForgotPassword (and components shared by them)
    trips/screens/  TripList, NewTrip, EditTrip, TripDetails, NewStop, EditStop, StopForm
    settings/screens/Settings
    profile/screens/Profile
  shared/
    i18n/           Translations (locales/en, locales/pl) and the i18next setup
    theme/          Colors, typography, spacing, ThemeProvider
    store/          Storage helpers shared by the stores
    ui/             Components used by several screens (buttons, FormField, Spinner, ...)
    auth/           The session, the token storage and the auth service (see Authentication)
    geocoding/      Place search (the only code that talks to the search service)
  test-utils/       Helpers for tests
```

A screen lives in `src/modules/<module>/screens/<Screen>/`. Next to the screen file it can
have `components/`, `hooks/`, `schema/`, `store/` and `utils/`, **created only when needed**.
Tests sit next to the file they test (`Thing.tsx` and `Thing.test.tsx`).

Some screens reuse code of another screen of the same module. For example `StopForm` is used
by `NewStop` and `EditStop`, and the trip and stop stores live under `TripList/store`. When
code is needed by several modules, it moves to `src/shared`.

## Routes

Every file in `src/app/` is a screen, and each one is a one-line re-export:

| Route | Screen | Opens as | Available when |
| --- | --- | --- | --- |
| `welcome` | `Welcome` | First screen | logged out |
| `login` | `Login` | Pushed screen | logged out |
| `sign-up` | `SignUp` | Pushed screen | logged out |
| `forgot-password` | `ForgotPassword` | Pushed screen | logged out |
| `(tabs)/index` | `TripList` | Home tab | logged in |
| `(tabs)/settings` | `Settings` | Settings tab | logged in |
| `profile` | `Profile` | Pushed screen | logged in |
| `new-trip` | `NewTrip` | Modal | logged in |
| `trip/[id]/index` | `TripDetails` | Pushed screen | logged in |
| `trip/[id]/edit` | `EditTrip` | Modal | logged in |
| `trip/[id]/stops/new` | `NewStop` (accepts a `date` parameter) | Modal | logged in |
| `trip/[id]/stops/[stopId]` | `EditStop` | Modal | logged in |

The root layout (`src/app/_layout.tsx`) keeps the splash screen visible until every saved
store has been read, so the app never flashes the wrong theme, language or data. It then shows a
spinner while the saved session is checked, and it only lets a logged-in user reach the app
screens and a logged-out user reach the auth screens (`Stack.Protected`). See
[Authentication](auth.md).

## Data

There are two kinds of records, both saved on the device.

**Trip**: `id`, `title`, `destination`, `notes`, `startDate`, `endDate`.

**Stop**: `id`, `tripId`, `date`, `type` (`lodging`, `meal`, `attraction`, `other`), `title`,
`startTime`, `durationMin`, `notes`, `url`, and `coordinates` (a latitude and longitude, or
`null` when the stop has no place).

Dates are plain local dates as text (`YYYY-MM-DD`), and times are 24-hour `HH:mm`. They are
never converted to UTC, so a trip on 13 December is on 13 December in every time zone.

Rules the forms enforce (see the `schema/` folders):

- A stop must be on one of the trip's days, and not on a day before today. When you edit a
  stop that is already on such a day, that one day stays allowed, so its other details can
  still be changed.
- A stop must end by midnight (start time plus duration).
- A link must start with `https://`.
- Coordinates are both empty or both valid (latitude -90 to 90, longitude -180 to 180). A
  decimal comma is accepted.
- Stops that overlap in time are allowed, but are marked in the itinerary.

### Saving

The `trips`, `stops` and `settings` stores are Zustand stores with the `persist` middleware and
`createSafeJsonStorage` (`src/shared/store/safeStorage.ts`). That storage **never throws**: an
unreadable or corrupt value counts as "nothing saved", so the app starts with defaults instead
of staying on the splash screen forever, and a failed write keeps the data in memory only.

When saved data is read back it is checked with Zod. A malformed entry is **dropped** instead
of crashing the app. This is also how data changes over time: a new field must be optional or
have a default in the schema, so entries saved by an older version still load. Stops saved
before coordinates existed load with `coordinates: null` for that reason.

The profile screen, the profile card in Settings and the avatar in the Trips header show the
**logged-in user** (`useProfileIdentity`, which reads the session). The session saves the user's
name and email in app storage (so the app can start offline) and the login token in secure
storage; a password is never saved. See [Authentication](auth.md#what-is-saved-and-where).

Deleting a trip also deletes its stops (`tripsStore.deleteTrip` calls
`stopsStore.deleteTripStops`).

### Sample data

On the very first launch the trips and stops stores start with sample data (a Lisbon city
break and the Tatra Mountains). Once anything is saved, the saved data **replaces** the
samples, even an empty list. The samples are never merged into saved data, so a change to the
samples in code is not visible on a device that already has saved data.

To get the samples back, development builds have **Settings > Developer > Reset sample
data**. It calls `resetSampleData` (`TripList/store/resetSampleData.ts`), which resets the
trips and the stops **together** so no stop is left without its trip. The section is shown
only when `__DEV__` is true, so it never reaches users of a release build. It does not touch
the theme or the language.

## Forms

Forms follow one pattern (`NewTrip`, `StopForm`):

- The form holds **strings** while the user types (`StopFormValues`).
- A Zod schema checks them and turns them into the real record (numbers, trimmed text).
- Schema errors are **translation keys** such as `stop.errors.titleRequired`, not text.
  Components translate them.
- Errors only show after the first save attempt, so a new form does not start out red.

## Theme and language

- There are two themes, `light` and `dark`, chosen in Settings. The app **ignores** the
  device's color scheme on purpose. Colors come from `useTheme()`; no component has a color
  written in it.
- Font sizes and weights come from `typography` in `src/shared/theme/typography.ts`. A
  component spreads a text style and adds only the color.
- Texts live in `src/shared/i18n/locales/{en,pl}/<namespace>.ts` (namespaces: `common`,
  `profile`, `settings`, `trips`). Keys are in English. Polish needs the plural forms `one`,
  `few`, `many` and `other`. A test checks that both languages have the same keys and the same
  placeholders.

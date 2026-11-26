# Testing

This page is about the **app**. The back end in `server/` has its own tests (Vitest); see
[Back end](backend.md#run-it). The one test that covers both is described
[below](#the-contract-test). The [end-to-end tests](#end-to-end-tests) run the whole thing in a
browser.

Tests use **Jest** (`jest-expo` preset) and **React Testing Library** for React Native
(version 14). Test files sit next to the code they test: `Thing.tsx` and `Thing.test.tsx`.

## Running tests

```bash
npm test                # everything, once
npm run test:watch      # re-run on change
npm run test:coverage   # coverage summary, HTML report in coverage/index.html
npm run test:report     # HTML test report in report/index.html, opens in the browser
npm run e2e             # end-to-end tests in a browser (see below)
```

Run one file or folder with `npx jest <path>`, and one test with `-t "part of the name"`.
`coverage/` and `report/` are git-ignored.

## What is set up for you

`jest.config.js` and `jest.setup.js` do this for every test:

- **The time zone is pinned to `Europe/Warsaw`**, so date logic gives the same result
  everywhere. Poland changes clocks for daylight saving time, which lets tests cover those
  days.
- **AsyncStorage** uses the in-memory mock that ships with the package.
- **`expo-localization`** reports an English device.
- **`expo-secure-store`** is an in-memory store. Tests can read it with
  `(require('expo-secure-store') as { __store: Map<string, string> }).__store`.
- **`react-native-maps`** is replaced by a simple stand-in, because the real map is a native
  view. In tests:
  - the map is a view with `testID="map-view"` and its `accessibilityLabel`;
  - every marker is a button with `testID="map-pin"`. A marker **with a title** is named
    `pin: <title>[, <description>]`, and one **without** (the picker's pin) is named
    `pin at <latitude>, <longitude>`. A marker shows its children, so the numbers and distance
    labels of the day route are readable;
  - a polyline is a view named `line: <lat,lng> <lat,lng> ...`;
  - tap the map with
    `fireEvent(map, 'press', { nativeEvent: { coordinate: { latitude, longitude } } })`.

## Helpers

- `renderWithProviders(ui, { scheme, language })` (`src/test-utils`) renders inside the theme
  with translations loaded. It is **async**: `await` it.
- `expoRouterMock` (`src/test-utils`) stands in for `expo-router` in screen tests. It records
  `router.push`, `back` and `replace`, and lets a test choose the route parameters with
  `setParams`. Use it like this in the test file:

  ```ts
  jest.mock('expo-router', () => jest.requireActual('@/test-utils/expoRouterMock').expoRouterModule);
  ```

- `authTestUtils` (`src/test-utils`) is for the auth screens. A test file first mocks the service
  module (`jest.mock('@/shared/auth/authService', () => ({ authService: { signIn: jest.fn(), ... } }))`,
  see an existing auth screen test). Then `mockedAuthService` gives the stand-in,
  `resetAuth()` puts the session back to "logged out", and `deferred()` makes a promise the test
  settles by hand, to look at the screen while a request is still running.

## End-to-end tests

`e2e/` holds [Playwright](https://playwright.dev) tests. They open the **web build** of the app in
Chromium, with the **real back end** from `server/`, and use it like a person: sign up, log in,
reset a password, plan a trip with stops, change the settings.

```bash
npx playwright install chromium   # once, downloads the browser
npm run e2e                       # run everything (about a minute)
npm run e2e:ui                    # pick and watch tests in Playwright's UI
npx playwright test e2e/stops.spec.ts -g "overlap"   # one file, one test
E2E_SLOW_MO=600 npm run e2e -- --headed --workers=1   # watch the browser, slowed down
npx playwright show-report        # the HTML report of the last run
```

`playwright.config.ts` starts both servers itself and stops them afterwards, so nothing has to
be running. They use **other ports than development** (back end 3100, app 8099), so a running
`npx expo start` and `npm run dev` are not disturbed:

- The **back end** gets a **fresh throwaway database** (`e2e/.tmp/`, git-ignored) and a low
  password hashing cost, so tests are quick. Its log is read by the tests, because that is where
  the password reset link is printed (there is no email provider yet).
- The **app** runs with `EXPO_PUBLIC_API_URL` pointing at that back end. `E2E_TEST=1` makes
  `metro.config.js` hide the `.env*` files from the app bundle. In development the bundle reads
  them by itself and lets them **win over the environment**, so a developer's `.env.local` would
  otherwise send the tests to their own server (and their own database).

What the tests rely on:

- **Every test starts clean.** `e2e/support/fixtures.ts` registers a new account for each one and
  (for `signedInPage`) logs in as it. A new browser context also means empty browser storage, so
  the app starts from its sample trips.
- **"Today" is 20 November 2026**, the same idea as in the unit tests, so the sample Lisbon trip is
  always "In 23 days" and no date goes stale. The time zone is `Europe/Warsaw` and the language
  English.
- **Request limits are per test.** The back end allows 5 sign-ups and 10 log-ins a minute per
  address. In the test setup it trusts a header, and each browser sends its own made-up address,
  so tests can run in parallel without hitting the limits. (The limit itself is not tested here.)
- **Tests share nothing**, so they can run in any order and in parallel.

### What the web build cannot show

The tests cover what works in a browser. Not covered, because it does not exist on the web or
needs a phone:

- **Maps, pins, routes and choosing a place on a map.** `react-native-maps` has no web version
  (see [Maps and place search](maps-and-search.md#what-works-where)). Typing coordinates is tested.
- **Place search.** It calls an external service, and tests never do.
- **Secure storage and staying logged in.** On the web the token only lives in memory, so a reload
  is a log out (a test uses that on purpose).
- **Native navigation** (swipe back, modals as sheets) and keyboard behaviour on a phone.

### Writing an end-to-end test

- **Find things the way a user does** (`getByRole`, `getByLabel`), as in the unit tests. On the web
  a link is a link: the tabs and "Forgot password?" are `link`s, not `button`s.
- **The previous screen stays mounted, hidden.** After opening a screen from another one, a query
  can also match the hidden one underneath. Use `.filter({ visible: true })`.
- **The app does not say which radio button is chosen** (no `aria-checked`), so a chosen one is
  recognised by its look; see `backgroundOf` in `e2e/support/fixtures.ts`.
- **A reload is a log out**, so go to another screen by clicking, or log in again with `logIn`.
- **Do not add `sleep`s.** Playwright waits for what the test asks for.

## The contract test

The app and the server are written separately, so a test makes sure they agree:
`server/contract/app-contract.test.ts`. It runs in the **server's** tests (`npm test` in `server/`),
because that is where both can be loaded. It does two things:

- It runs the app's real `httpAuthService` against the real server code, in memory (no network
  port), through every call and every error code.
- It gives the form rules of the app (`authSchemas.ts`) and of the server (`schemas.ts`) the same
  inputs, many emails, names and passwords, and compares the verdicts. It also registers every
  form that the app accepts on the real server.

If you change a rule, a message code or an endpoint on one side, this test fails until the other
side follows. When it finds a mismatch, fix the side that is wrong; do not loosen the test.

In the app's own tests the auth service is **never real**: `jest.setup.js` replaces
`@/shared/auth/authService` with methods that fail loudly, so a test that needs the service has to
mock it (see `authTestUtils`).

## Patterns that matter

- **Everything from React Testing Library 14 is async.** `await render`, `await
  user.press(...)`, and `await fireEvent(...)`. Forgetting an `await` shows up as "overlapping
  act() calls" or as an element that is missing.
- **Settle every pending request inside `act`** (`await act(async () => request.resolve())`).
  A promise that is resolved at the end of a test, without waiting for the screen to settle,
  causes a warning that a state update was not wrapped in `act(...)`.
- **Press the keyboard's submit key** with `user.type(field, 'text', { submitEditing: true })`;
  `{enter}` is not understood.
- **Fix "today".** Screens compare dates with today, so tests pin it:

  ```ts
  jest.useFakeTimers({ now: new Date(2026, 10, 20, 12, 0), advanceTimers: true });
  ```

  Restore it in `afterEach` with `jest.useRealTimers()`.
- **Test the web branch** by replacing the platform and restoring it afterwards:

  ```ts
  jest.replaceProperty(Platform, 'OS', 'web');   // and jest.restoreAllMocks() in afterEach
  ```

- **Stub the network** with `jest.spyOn(globalThis, 'fetch')`. Tests never call the real
  search service. For code with a delay (the search), use fake timers and advance them, and
  control when each request is answered, so tests can check cancelling and late answers.
- **Find things the way a user does**: by role and name (`getByRole('button', { name: ... })`),
  label or text, and check what is visible. Avoid reaching into component internals.
- **Put logic in pure functions** and test those with plain inputs and outputs. A good test
  checks a result against a value worked out **independently** (a known distance, a value
  calculated by hand), not against the code's own output.
- Dates, plural forms and decimal separators differ by language. Test the Polish text where
  the output changes (for example `1,2 km`).

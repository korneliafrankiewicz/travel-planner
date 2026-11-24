# Testing

Tests use **Jest** (`jest-expo` preset) and **React Testing Library** for React Native
(version 14). Test files sit next to the code they test: `Thing.tsx` and `Thing.test.tsx`.

## Running tests

```bash
npm test                # everything, once
npm run test:watch      # re-run on change
npm run test:coverage   # coverage summary, HTML report in coverage/index.html
npm run test:report     # HTML test report in report/index.html, opens in the browser
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

## Patterns that matter

- **Everything from React Testing Library 14 is async.** `await render`, `await
  user.press(...)`, and `await fireEvent(...)`. Forgetting an `await` shows up as "overlapping
  act() calls" or as an element that is missing.
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

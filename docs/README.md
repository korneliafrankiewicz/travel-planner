# travel-planner documentation

A mobile app to plan trips day by day: trips, a day-by-day itinerary of stops, a map of the
stops, a route with distances for each day, and place search.

| Read this | When you want to |
| --- | --- |
| [Getting started](getting-started.md) | Run the app, the tests, lint and typecheck |
| [Architecture](architecture.md) | Understand the folders, the data and how screens fit together |
| [Conventions](conventions.md) | Write code that matches the project's rules |
| [Back end](backend.md) | Run and understand the server, or prepare it for production |
| [API](api.md) | See what the app can ask the server |
| [Authentication](auth.md) | Understand log in and sign up, or connect a real back end |
| [Maps and place search](maps-and-search.md) | Work on maps, routes or search, or prepare a release |
| [Testing](testing.md) | Write or run tests, including the end-to-end tests in a browser |
| [Troubleshooting](troubleshooting.md) | Find out why something does not show up or work |

The short rules live in [`CLAUDE.md`](../CLAUDE.md) and the Expo-specific ones in
[`AGENTS.md`](../AGENTS.md). These pages explain the reasons behind them and how the parts fit
together.

## Status

- The app keeps trips and stops **on the device**. The back end so far only handles accounts.
  Places in the code that will change once trips move to the server are marked `TODO` (for example
  in `tripsStore.ts`).
- Trips and stops start from **sample data** on the very first launch. To get it back while
  testing, use **Settings > Developer > Reset sample data** (development only). See
  [Troubleshooting](troubleshooting.md#i-do-not-see-the-maps-or-the-route).
- **Log in, sign up and password reset can use the real back end** in `server/` (set
  `EXPO_PUBLIC_API_URL`), or a stand-in that accepts any password when it is not set. See
  [Authentication](auth.md), [Back end](backend.md) and [API](api.md). A release must use a real
  server.
- Not done yet: trips and stops on the server, the Security section and "Delete account and data" in Settings, walking or
  driving routes (distances are straight lines), and the Google Maps API key that Android
  release builds need.

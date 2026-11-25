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
| [Testing](testing.md) | Write or run tests |
| [Troubleshooting](troubleshooting.md) | Find out why something does not show up or work |

The short rules live in [`CLAUDE.md`](../CLAUDE.md) and the Expo-specific ones in
[`AGENTS.md`](../AGENTS.md). These pages explain the reasons behind them and how the parts fit
together.

## Status

- The app keeps everything **on the device**. There is no backend yet. Places in the code that
  will change when it exists are marked `TODO` (for example in `tripsStore.ts`).
- Trips and stops start from **sample data** on the very first launch. To get it back while
  testing, use **Settings > Developer > Reset sample data** (development only). See
  [Troubleshooting](troubleshooting.md#i-do-not-see-the-maps-or-the-route).
- **Log in and sign up work with a stand-in for the back end** that accepts any password. See
  [Authentication](auth.md). It must be replaced before a release.
- **The real back end has been started** in `server/` (accounts only). The app does not use it
  yet. See [Back end](backend.md) and [API](api.md).
- Not done yet: the Security section and "Delete account and data" in Settings, walking or
  driving routes (distances are straight lines), and the Google Maps API key that Android
  release builds need.

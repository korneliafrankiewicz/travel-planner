# Maps and place search

How the map features work, what is native-only, and what is still needed before a release.

## What the user sees

1. **Trip details, "Map".** A map with a pin for every stop of the trip that has a place.
   Tapping the label of a pin opens that stop. Below it is a link that opens the destination
   in Google Maps.
2. **Trip details, "Itinerary".** Under each day with at least two stops that have a place:
   a **Show route on map** row. Open, it shows a map with numbered pins, a line through them
   in the order of the day, and the distance written on each line. Under the map is the list
   of the legs and a note that the distances are straight lines.
3. **Stop screen (new and edit), "Location".** A search field, a small map preview of the
   place, **Choose on map**, the latitude and longitude fields, and **Clear location**.
4. **The map picker** (from **Choose on map**). A full-screen map with a search field on top.
   Tap the map, drag the pin, or search; then confirm with **Use this location**.

A stop's place is saved as `coordinates` on the stop (see [Architecture](architecture.md#data)).

## What works where

| Feature | iOS | Android | Web |
| --- | --- | --- | --- |
| Trip map, day route map, stop preview, map picker | yes | yes | **no** |
| Distances in the route (as a list) | yes | yes | yes |
| Place search, typing coordinates | yes | yes | yes |

On the web the map components render nothing and the screens show a fallback (the route
section still lists the distances).

## Where the code is

| Part | Files |
| --- | --- |
| Pins on the trip | `TripDetails/components/MapSection.tsx`, `StopsMap.tsx`, `utils/mapMarkers.ts` |
| Day route | `TripDetails/components/DayRoute.tsx`, `DayRouteMap.tsx`, `utils/route.ts`, `utils/formatDistance.ts` |
| Stop preview and picker | `StopForm/components/StopLocationPreview.tsx`, `LocationPicker.tsx`, `utils/pickedLocation.ts` |
| Search UI | `StopForm/components/PlaceSearch.tsx`, `StopForm/hooks/usePlaceSearch.ts` |
| Search service | `src/shared/geocoding/searchPlaces.ts` |

(Paths under `src/modules/trips/screens/`.) Components that use `react-native-maps` have a
`.web.tsx` partner; see [Conventions](conventions.md#platform-specific-code).

## Day route and distances

The route joins the day's stops **that have a place**, in the order of the day (by start
time). A stop without a place is skipped and not numbered. A day with fewer than two places
has no route.

The distances are **straight lines** over the earth's surface (the haversine formula), **not**
the length of a walking or driving route. The screen says so. They are rounded: to 10 m below
1 km, and to 0.1 km above. The label of a leg sits at the midpoint of its great circle.

Real route distances and travel times would need a routing service. That is not built; see
[Known limits](#known-limits).

## Place search

Place search uses **Photon** (`https://photon.komoot.io`), a search service built on
OpenStreetMap data. It needs **no account and no key**.

How it behaves:

- It searches after the user **stops typing for 500 ms** and only for **3 or more
  characters**. A search that has been replaced is **cancelled**, and its late answer is
  ignored.
- It asks for results **near** the stop, or else near the trip's other places.
- Up to five places are shown. Repeats and malformed entries are dropped.
- Choosing a result fills in the coordinates, and the title if it is still empty. In the
  picker it moves the pin and the map instead.
- If nothing is found, or the service cannot be reached, a message says so. Choosing a place
  on the map and typing coordinates keep working.
- The screen shows "© OpenStreetMap contributors" while results are listed. The data's
  license requires that credit; keep it if you change the UI.

Things to know:

- **Fair use.** The public server is meant for light use. The delay and the cancelling above
  are part of that deal, so do not remove them.
- **Privacy.** What the user types in the search field is sent to `photon.komoot.io`. Nothing
  else is sent (no account, no device information).
- **Language.** Photon accepts `en`, `de` and `fr` as a language and answers an error for
  anything else, so `searchPlaces` sends a language only for those. Polish searches return the
  names as OpenStreetMap stores them.

### Switching the provider

`src/shared/geocoding/searchPlaces.ts` is the only file that knows about Photon. To use
another service (for example Google Places), change this file so `searchPlaces(query,
options)` still returns `PlaceResult[]` (`id`, `name`, `details`, `coordinates`), keep the
checking of the response with Zod, and keep the tests in `searchPlaces.test.ts` working. A
provider with a key needs the key in `.env`, never in code.

## Before a release

The maps work in **Expo Go** and in development builds without any setup. A release build
needs the following. These steps follow the
[Expo SDK 58 `react-native-maps` page](https://docs.expo.dev/versions/v58.0.0/sdk/map-view.md),
so check it again if the SDK changes.

**Android (Google Maps)**

1. Set `android.package` in `app.json`. It is not set yet, and the key restriction needs it.
2. In the [Google Cloud console](https://console.cloud.google.com/apis), create a project and
   enable **Maps SDK for Android**.
3. Get the app's **SHA-1 certificate fingerprint** (from the Google Play Console once the app
   was uploaded, or from the EAS credentials for a development build).
4. Create an **API key**, restricted to Android apps with the package name and the SHA-1.
5. Put the key in `.env` (for example `GOOGLE_MAPS_API_KEY`) and read it in an
   `app.config.js`, because `app.json` cannot read environment variables:

   ```js
   export default ({ config }) => ({
     ...config,
     plugins: [
       ...(config.plugins ?? []),
       ['react-native-maps', { androidGoogleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY }],
     ],
   });
   ```

6. For EAS builds, keep a `.easignore` that mirrors `.gitignore` but does **not** exclude
   `.env`, so the build can read the key. Rebuild the app.

**iOS.** The maps use Apple Maps by default, which needs no key. Google Maps on iOS is
optional: it needs the **Maps SDK for iOS**, a key restricted to the bundle identifier
(`ios.bundleIdentifier`, also not set yet), the plugin option `iosGoogleMapsApiKey`, and
`provider={PROVIDER_GOOGLE}` on the `MapView`.

Also decide on the **search provider for production**: the public Photon server is fine for
development and light use, but an app with many users should use its own server or a paid
provider.

## Known limits

- Distances are straight lines. There is no route length or travel time.
- There are no maps on the web.
- The public search server is rate limited and may be slow or unavailable.
- The numbered pins and distance labels are custom views on the map. Custom pins can flicker
  or clip on some Android devices, so check them on a real device.
- The sample stops only get coordinates on the very first launch (see
  [Troubleshooting](troubleshooting.md#i-do-not-see-the-maps-or-the-route)).

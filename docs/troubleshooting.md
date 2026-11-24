# Troubleshooting

## The app does not show my changes

1. Make sure the dev server is running (`npx expo start`) and the app is connected to it.
2. Press `r` in the terminal to reload.
3. Restart with a clean cache: stop the server and run `npx expo start --clear`.
4. In Expo Go, check that the app version matches **SDK 58**.
5. If you use a **development build** instead of Expo Go and you added a package with native
   code, rebuild it (`npx expo run:ios` or `npx expo run:android`).

## I do not see the maps or the route

Work down this list.

1. **Are you on the web?** There are no maps on the web. Use a phone or a simulator. See
   [Maps and place search](maps-and-search.md#what-works-where).
2. **Do the stops have a place?** A pin, a route or a preview only appears for a stop that has
   coordinates. The **route** needs at least **two** stops with a place **on the same day**.
3. **Is your data older than the maps?** The sample trips and stops are only used on the
   **first launch**. If the app already had saved data, that data is kept, and stops saved
   before coordinates existed have none. You can:
   - **Add a place to a stop:** open the stop, search for a place (for example `Belem Tower`),
     choose it and save. Do it for a second stop of the same day to get the route.
   - **Reset the sample data:** open **Settings > Developer > Reset sample data** and
     confirm. All trips and stops are replaced by the sample trips, which have places. This
     section only exists in development, never in a release build.
   - **Start fresh:** clear the app's saved data (see below). The sample trips come back, with
     places.
4. **Is the day in the past?** You can open and view past days, but stops can only be **added**
   for today or later.

### Clearing the saved data

All trips, stops and settings are cleared. This cannot be undone. If you only need the sample
trips back, **Settings > Developer > Reset sample data** is quicker and keeps your theme and
language.

- **iOS Simulator:** *Device > Erase All Content and Settings*, or delete Expo Go and
  install it again.
- **Android emulator or phone:** *Settings > Apps > Expo Go > Storage > Clear storage*. This
  clears the data of **every** project opened in Expo Go.
- **Web:** clear the site data for the address that Expo shows (for example
  `localhost:8081`) in the browser's developer tools.

## I cannot get into the app, or I am logged out

- The app now starts on the **Welcome** screen when nobody is logged in. With the stand-in back
  end any email and password work, for example `anna@example.com` and `Secret123`. See
  [Authentication](auth.md#the-stand-in-for-the-back-end) for the values that make it fail on
  purpose.
- On the **web** you are logged out after every page reload: there is no secure storage there, so
  the token only lives in memory.
- **Settings > Account > Log out** needs a confirmation. Your trips stay on the device.
- If the app seems stuck on "Checking your session…", the service did not answer. A saved user
  is kept logged in when the service cannot be reached, so this should only be brief.
- On iOS, after deleting and installing the app again, you may still be logged in: the Keychain
  survives an uninstall.

## Place search says it is unavailable

- Check the internet connection of the device.
- The public search server may be busy or rate limited. Wait a moment and try again.
- The rest of the form still works: choose the place on the map, or type the coordinates.
- In a test, the real service is never called; see [Testing](testing.md).

## Search finds the wrong place

Search results are ranked by how close they are to the stop (or to the trip's other places).
Add more detail to the text, such as the city (`Belem Tower, Lisbon`). Names come from
OpenStreetMap, so a place may be missing or named differently there. Polish searches return
names as stored in OpenStreetMap.

## The map is blank or grey

- On an emulator, check that it has Google Play services and an internet connection.
- In a **release build** on Android, a missing or wrongly restricted Google Maps API key
  shows a blank map. See [Before a release](maps-and-search.md#before-a-release).

## Tests behave strangely

- "overlapping act() calls", or an element that is not found: a missing `await` before a
  render, press or `fireEvent`. See [Testing](testing.md#patterns-that-matter).
- A date test fails only on someone's machine: the test did not pin "today" with fake timers.
- A map test cannot find a pin: check the name the stand-in gives it (see
  [Testing](testing.md#what-is-set-up-for-you)).

## The web build fails after a maps change

A `.web.tsx` file imported `react-native-maps`, directly or through another file. The web
variant must not import it. Build for the web to check:

```bash
npx expo export --platform web --output-dir "$TMPDIR/web-export"
```

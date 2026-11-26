# Getting started

## What you need

- Node.js and npm. The project uses npm (there is a `package-lock.json`), so use `npm` and
  `npx` rather than another package manager.
- To see the app: **Expo Go** on a phone, or the iOS Simulator or an Android emulator.
  Expo Go must match the Expo SDK of the project (**SDK 58**). If Expo Go says the project is
  incompatible, update Expo Go.

## Run the app

```bash
npm install
npx expo start
```

The terminal shows a QR code and a few keys:

| Key | What it does |
| --- | --- |
| `i` | Open in the iOS Simulator |
| `a` | Open in an Android emulator |
| `w` | Open in the browser (**no maps there**, see [Maps and place search](maps-and-search.md#what-works-where)) |
| `r` | Reload the app |

On a phone, scan the QR code with the camera (iOS) or in Expo Go (Android). The phone and the
computer must be on the same network.

Edits to the code reload the app by themselves. If you do not see a change, see
[Troubleshooting](troubleshooting.md#the-app-does-not-show-my-changes).

## The back end

The app runs without it, with a stand-in that accepts any password. To use the real server, see
[Back end](backend.md#run-it) and [Authentication](auth.md#using-the-real-server): in short,
`HOST=0.0.0.0 npm run dev` in `server/`, and `EXPO_PUBLIC_API_URL=auto` in a `.env.local` file in
the project root (copy `env.example`).

## Check your work

Lint and typecheck must pass, and the tests should pass, before a task is done.

```bash
npm run lint        # expo lint
npm run typecheck   # tsc --noEmit
npm test            # all tests, once
```

More about tests in [Testing](testing.md).

## Adding packages

Always install with Expo, so the version matches the SDK:

```bash
npx expo install <package>
```

Expo Go only contains the native modules Expo ships with it (`react-native-maps` is one of
them). A package with native code that Expo Go does not include needs a **development
build** instead (`npx expo run:ios` or `npx expo run:android`, or `eas build --profile
development`). Never edit the `ios/` or `android/` folders by hand: they are generated and
git-ignored, and native settings belong in `app.json` or a config plugin.

## Secrets

Secrets live only in `.env` files, which are git-ignored (`.env`, `.env.*`, except
`.env.example`). Never commit a key, and never put one in `app.json`, in code or in a test.

The app **needs no secrets today**: place search uses a service that needs no key, and the only
setting, `EXPO_PUBLIC_API_URL`, is an address that is visible in the built app anyway. Anything
that starts with `EXPO_PUBLIC_` ends up in the app in plain text, so never put a secret in one. A key will
be needed for Android release builds with Google Maps; see
[Before a release](maps-and-search.md#before-a-release).

`app.json` cannot read environment variables. When a value from `.env` is needed in the
native configuration, use an `app.config.js` that reads `process.env`. Restart Expo with
`npx expo start --clear` after changing `.env`.

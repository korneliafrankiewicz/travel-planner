# Authentication

Log in, sign up and password reset. The screens, the session handling and the secure storage of the
token are real. The part that talks to a server is chosen by one setting: the **real back end** in
`server/` ([Back end](backend.md)), or a **stand-in** that runs inside the app so it can be tried
without a server.

## What the user sees

```
Launch → splash → "Checking your session…" spinner
            ├─ logged in   → the app (Trips, Settings, ...)
            └─ logged out  → Welcome → Log in ↔ Create account
                                          └─ Forgot password → "Check your email"
                                                  └─ (link in the email) → Choose a new password
```

| Screen | Route | What it does |
| --- | --- | --- |
| Welcome | `/welcome` | The first screen when logged out: **Log in** and **Create account** |
| Log in | `/login` | Email and password, a link to reset the password, a link to sign up |
| Create account | `/sign-up` | Name, email, password (with a strength meter), confirmation, terms |
| Forgot password | `/forgot-password` | Email, then a "Check your email" confirmation |
| Choose a new password | `/reset-password?token=...` | Opened by the link in the reset email: new password, confirmation |

Every button that sends a request shows a **spinner**, ignores more taps and locks the fields
until the answer comes. Errors that belong to one field show under it. Errors of the whole form
(wrong password, no connection) show in a box that screen readers announce.

**Settings > Account > Log out** asks for confirmation and then logs out. Trips and stops stay on
the device; they are not tied to an account until there is a back end.

## How it works

| Part | File |
| --- | --- |
| The interface the app needs from a back end | `src/shared/auth/types.ts` (`AuthService`) |
| The stand-in | `src/shared/auth/fakeAuthService.ts` |
| The one place that picks the service | `src/shared/auth/authService.ts` |
| Where the token is kept | `src/shared/auth/tokenStorage.ts` |
| The state of the session | `src/shared/auth/sessionStore.ts` |
| The screens | `src/modules/auth/screens/*` |
| Checking forms | `src/modules/auth/schema/authSchemas.ts` |

### The state of the session

`useSessionStore` has a `status`:

- `loading`: the app has just started and the saved session has not been checked.
- `signedOut`: nobody is logged in.
- `signedIn`: someone is, and `user` holds their `id`, `name` and `email`.

When the app starts, `restore()` reads the saved token, asks the service who it belongs to, and
sets the status. The root layout (`src/app/_layout.tsx`) shows a spinner while the status is
`loading`.

**Navigation follows the status by itself.** The root layout puts the app screens in a
`Stack.Protected guard={status === 'signedIn'}` and the auth screens in
`Stack.Protected guard={status === 'signedOut'}`. A screen that is not allowed cannot be
opened, and when the status changes (log in, log out) the router moves the user. No screen calls
`router.push` after a successful log in; it only has to change the session. The Expo docs
describe this: <https://docs.expo.dev/router/advanced/protected.md>.

### What is saved, and where

| What | Where | Why |
| --- | --- | --- |
| The **token** that proves the session | Secure storage (Android Keystore, iOS Keychain) | A secret |
| The **user's name and email** | App storage (`session`, AsyncStorage) | So the app can start **offline** |
| A **password** | **Nowhere.** Not saved, not logged | Never stored |

- **Offline start.** A travel app must open without a connection. If the service cannot be reached
  when the app starts, a user that was saved on the device stays logged in, and the token is
  checked again at the next start. If the service says the token is **no longer valid**, the user
  is logged out and the token is deleted.
- **Web.** There is no secure storage on the web, and a token in the browser's storage can be read
  by any script on the page, so on the web the token **only lives in memory**: a page reload logs
  the user out.
- **iOS Keychain.** On iOS the Keychain **survives an uninstall** when the app is installed again
  with the same bundle ID (Expo's documentation says so, and says not to rely on it). On Android
  secure storage is removed with the app. Decide with your security team whether a leftover token
  after a reinstall is acceptable.
- Saving never throws. A token that cannot be read counts as "no token", and one that cannot be
  saved lives until the app closes.

## Which service the app uses

`src/shared/auth/authService.ts` picks the service from `EXPO_PUBLIC_API_URL`. Put it in a
`.env.local` file in the project root (copy `env.example`), and restart Expo with
`npx expo start --clear`:

| `EXPO_PUBLIC_API_URL` | The app uses |
| --- | --- |
| not set | The **stand-in** inside the app. No server is needed, any password works |
| `auto` | The server in `server/` on the computer that runs Expo (port 3000). **Development only.** The computer's address is read from Expo, so it works on a phone too |
| `https://api.example.com` | That server. A plain `http://` address is accepted in development only |

The app refuses to start with a setting that is not valid (not an address, a user name or password
in it, a query, or `http://` or `auto` outside development), so a mistake in a build is found at
once and not by a user. The setting is visible in the built app, so it must be an address and never
a secret. In development the app prints which service it uses (`[auth] Using the back end at ...`).

### Using the real server

1. Start the server so that it can be reached from the network. In `server/`:
   `HOST=0.0.0.0 npm run dev` (see [Back end](backend.md#using-it-from-the-app)).
2. In the project root create `.env.local` with `EXPO_PUBLIC_API_URL=auto`.
3. Run `npx expo start --clear` and open the app. Log in, sign up and password reset now go to the
   server. Your accounts are in the server's development database (`server/.data/`).

### How the app talks to the server

`src/shared/auth/httpAuthService.ts` implements `AuthService` over HTTP ([API](api.md)):

- Every answer is **checked with Zod** before it is used. An answer in another shape, or with the
  wrong status, is an `unknown` error.
- The server's error codes become the app's `AuthError` codes: `invalidCredentials`, `emailTaken`,
  `invalidSession`, `invalidResetToken` and `rateLimited` have their own messages. A lost
  connection or no answer in 15 seconds is `network`. Everything else is `unknown`.
- A password or a token is only ever sent to the configured address, in the body or the
  `Authorization` header. Never in a URL, never to the console.
- The same `AuthService` is behind the screens either way, so they cannot tell the two apart.

A **contract test** in the server's tests (`server/contract/`) runs this service against the real
server code and checks that the form rules in the app and on the server give the same verdict for
many inputs. See [Testing](testing.md#the-contract-test).

### The password reset link

The email holds a link made from `PASSWORD_RESET_URL` on the server, with `?token=...`. In
development there is no email provider: the server prints the link in its log. The app's own scheme
(`travel-planner://reset-password?token=...`) only opens the app in a development or production
build; **in Expo Go** the link has to look like `exp://<your computer>:8081/--/reset-password?token=...`,
so set `PASSWORD_RESET_URL` on the server accordingly.

The reset screen is only available when logged out. A logged-in user who opens the link is taken
into the app (the route is protected).

## The stand-in for the back end

`createFakeAuthService` keeps **no accounts and no passwords**. It accepts any email and password,
names the user after the email (`anna.nowak@example.com` becomes "Anna Nowak"), and its "token"
simply carries the user, so a session survives a restart. It waits 700 ms before every answer so
the spinners can be seen.

**It is not secure.** A release must always set `EXPO_PUBLIC_API_URL` to a real server.

To try the error states of the screens, use these values:

| Where | Type | You get |
| --- | --- | --- |
| Log in | the password `wrong-password` | "Wrong email or password" |
| Create account | the email `taken@example.com` | "An account with this email already exists" |
| Any form | an email that starts with `offline@` | "Could not reach the server…" |
| Reset password | the token `invalid-token` | "This reset link has expired or was already used…" |
| App start | a token that is not valid | logged out, with the token deleted |

(The real server answers the first three in the same way for the same reasons, so they can also be
tried against it: a wrong password, an email that is taken, and a server that is not running.)

## Things that need a decision before real users sign up

- **Personal data.** Sign up collects a **name and an email address**, which are personal data
  (under GDPR, for example). Ask your **Data Privacy Officer** about what is collected, where it
  is stored, how long, and how it is erased. The email and name are also kept on the device for the
  offline start.
- **Terms and privacy policy.** The sign-up screen has a required checkbox with the text "I accept
  the Terms of Use and the Privacy Policy". **No such documents exist yet and nothing is linked**,
  so the wording is a placeholder. The text and the documents must come from **Legal**.
- **Delete account and data.** The row in Settings is still a disabled placeholder. Erasing an
  account needs the back end.
- **Sign in with Apple and Google.** Not built. If social sign-in is added on iOS, check Apple's
  current App Store rules for Sign in with Apple.

## Known limits

- The stand-in accepts any password. Only the real server checks them.
- With the stand-in, password reset sends nothing; with the real server in development the link is
  printed in the server's log, because no email provider is connected yet.
- There is no email verification, no "log out everywhere", and no change of password (only a reset).
- Plain `http://` to a server works in Expo Go but is blocked by default in development builds on
  Android and iOS (and in every release build). Use https, or add an exception for development.
- The terms checkbox text is not linked to documents.
- Trips and stops are not tied to the account: after a log out and a log in as someone else, the
  same trips are on the device.

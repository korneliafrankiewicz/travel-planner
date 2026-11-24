# Authentication

Log in, sign up and password reset, with a **stand-in** for the back end. The screens, the
session handling and the secure storage of the token are real. The part that talks to a server is
a fake that is meant to be replaced.

## What the user sees

```
Launch → splash → "Checking your session…" spinner
            ├─ logged in   → the app (Trips, Settings, ...)
            └─ logged out  → Welcome → Log in ↔ Create account
                                          └─ Forgot password → "Check your email"
```

| Screen | Route | What it does |
| --- | --- | --- |
| Welcome | `/welcome` | The first screen when logged out: **Log in** and **Create account** |
| Log in | `/login` | Email and password, a link to reset the password, a link to sign up |
| Create account | `/sign-up` | Name, email, password (with a strength meter), confirmation, terms |
| Forgot password | `/forgot-password` | Email, then a "Check your email" confirmation |

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

## The stand-in for the back end

`createFakeAuthService` keeps **no accounts and no passwords**. It accepts any email and password,
names the user after the email (`anna.nowak@example.com` becomes "Anna Nowak"), and its "token"
simply carries the user, so a session survives a restart. It waits 700 ms before every answer so
the spinners can be seen.

**It is not secure and must be replaced before a release.** `authService.ts` has a `TODO` for it.

To try the error states of the screens, use these values:

| Where | Type | You get |
| --- | --- | --- |
| Log in | the password `wrong-password` | "Wrong email or password" |
| Create account | the email `taken@example.com` | "An account with this email already exists" |
| Any form | an email that starts with `offline@` | "Could not reach the server…" |
| App start | a token that is not valid | logged out, with the token deleted |

## Connecting a real back end

The app only talks to the `AuthService` interface, so the screens, the session store and the tests
stay as they are. To connect a service:

1. Write an implementation of `AuthService` (for example `httpAuthService.ts`) that calls the
   back end and turns every failure into an `AuthError` with the right `code`
   (`invalidCredentials`, `emailTaken`, `invalidSession`, `network`, `unknown`).
2. Use it in `src/shared/auth/authService.ts`, in place of the stand-in.
3. Keep the rules in [Conventions](conventions.md#data-and-storage): check what comes back with
   Zod, keep only the token in secure storage, and keep keys and secrets in `.env`.
4. Decide how the token expires and is renewed. The session store treats `invalidSession` from
   `getUser` as "log out"; a refresh-token flow would be added in the service.
5. Do not add a message that tells whether an email has an account. The password reset screen and
   its confirmation are worded so they cannot be used to find out.

Rules for passwords, tokens, rate limiting and email verification belong to the back end and
should be reviewed by your security team.

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

- The stand-in accepts any password.
- Password reset does not send anything; the confirmation screen is all there is.
- There is no email verification, no "log out everywhere", and no change of password.
- The terms checkbox text is not linked to documents.
- Trips and stops are not tied to the account: after a log out and a log in as someone else, the
  same trips are on the device.

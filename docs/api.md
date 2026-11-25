# API

The contract between the app and the back end ([Back end](backend.md)). All paths start with
`/v1`. Bodies are JSON (`Content-Type: application/json`) and are limited to 10 kB. Fields that
are not listed are **refused** with a 400.

The calls match the app's `AuthService` interface (`src/shared/auth/types.ts`), so the app can use
the server by implementing that interface; see [Authentication](auth.md#connecting-a-real-back-end).

## Conventions

**Session.** Register and log in answer with a `token`. Send it on later requests as
`Authorization: Bearer <token>`. It is valid for `SESSION_TTL_DAYS` (30 by default) unless it is
ended earlier. Keep it in secure storage only.

**Errors** always have this shape, with a status that is 4xx for a problem with the request and
500 for a failure of the server:

```json
{
  "error": {
    "code": "validation",
    "message": "The request is not valid",
    "details": [{ "field": "email", "message": "must be an email address" }]
  }
}
```

`details` is only present for `validation`, with at most one entry per field. A message is for
developers; the app writes its own texts for a code.

| Code | Status | Meaning |
| --- | --- | --- |
| `validation` | 400 | The body is not valid (see `details`), or is broken JSON |
| `invalidCredentials` | 401 | Wrong email or password (the same for an unknown email) |
| `invalidSession` | 401 | The token is missing, unknown, expired or ended |
| `emailTaken` | 409 | An account with this email exists |
| `invalidResetToken` | 400 | The reset link is unknown, used, or expired |
| `notFound` | 404 | No such route |
| `payloadTooLarge` | 413 | The body is over 10 kB |
| `rateLimited` | 429 | Too many requests; the `Retry-After` header says how many seconds to wait |
| `internal` | 500 | A failure of the server; nothing more is said about it |

The first five codes have the same names as the app's `AuthError` codes.

**Cache.** Every answer has `Cache-Control: no-store`.

## Rules for the values

| Field | Rule |
| --- | --- |
| `email` | Trimmed and lower-cased by the server. Looks like `a@b.cc`, up to 254 characters |
| `name` | Trimmed. 1 to 80 characters |
| `password` (new) | 8 to 128 characters, with at least one letter and one digit. **Not trimmed**: spaces count |
| `password` (log in) | 1 to 128 characters; the rules for a new password are not applied, so older passwords keep working |

## Endpoints

### `POST /v1/auth/register`

Creates an account and logs it in. Limit: 5 a minute per address.

```json
{ "name": "Anna Nowak", "email": "anna@example.com", "password": "Secret123" }
```

`201`:

```json
{
  "token": "Zk3...(43 characters)",
  "user": { "id": "2fa388f5-ec64-4cf9-a6eb-162acaeb7a8d", "name": "Anna Nowak", "email": "anna@example.com" }
}
```

Errors: `400 validation`, `409 emailTaken`, `429 rateLimited`.

### `POST /v1/auth/login`

Limit: 10 a minute per address.

```json
{ "email": "anna@example.com", "password": "Secret123" }
```

`200`: the same body as register. Errors: `400 validation`, `401 invalidCredentials`,
`429 rateLimited`.

### `GET /v1/auth/me`

Needs the `Authorization` header. This is how the app checks a saved token when it starts.

`200`:

```json
{ "user": { "id": "2fa388f5-ec64-4cf9-a6eb-162acaeb7a8d", "name": "Anna Nowak", "email": "anna@example.com" } }
```

Errors: `401 invalidSession`.

### `POST /v1/auth/logout`

Needs the `Authorization` header and no body. Ends **this** session only; the user stays logged in
elsewhere.

`204` with no body. Errors: `401 invalidSession` (also when the session was already ended).

### `POST /v1/auth/password-reset`

Asks for a reset link. Limit: 5 a minute per address.

```json
{ "email": "anna@example.com" }
```

`202` with `{}`, **whether or not the address has an account**, and the same wording of the answer
either way. If there is an account, a link is sent to it (`PASSWORD_RESET_URL?token=<token>`).
Asking again cancels the earlier link. Errors: `400 validation`, `429 rateLimited`.

### `POST /v1/auth/password-reset/confirm`

Chooses a new password with the token from the link. Limit: 10 a minute per address.

```json
{ "token": "the token from the link", "password": "NewSecret456" }
```

`204` with no body. The token works **once**, expires after `RESET_TTL_MINUTES` (60), and **all
sessions of the user end**. A password that is not strong enough is a `400 validation` and does
**not** use up the link. Errors: `400 validation`, `400 invalidResetToken`, `429 rateLimited`.

The app has no screen for this step yet (it needs a link that opens the app).

### `GET /health`

For load balancers. `200 {"status":"ok"}` when the database can be reached, `503
{"status":"unavailable"}` when not. Not limited.

## Connecting the app

In the app, an `httpAuthService` would implement `AuthService` like this:

| `AuthService` | Call |
| --- | --- |
| `signIn(credentials)` | `POST /v1/auth/login` → `{ token, user }` |
| `signUp(input)` | `POST /v1/auth/register` → `{ token, user }` |
| `getUser(token)` | `GET /v1/auth/me` → `user` |
| `signOut(token)` | `POST /v1/auth/logout` |
| `requestPasswordReset(email)` | `POST /v1/auth/password-reset` |

A response with `error.code` of `invalidCredentials`, `emailTaken` or `invalidSession` becomes an
`AuthError` with that code. A failed connection becomes `network`, and anything else `unknown`.
The app must read the server's address from its settings (not hard-code it), use HTTPS outside
development, and check each response with Zod before using it.

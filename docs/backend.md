# Back end

The back end lives in [`server/`](../server). It is a separate Node.js project with its own
`package.json`, tests and lint setup; the app's tooling ignores it. So far it provides **accounts**:
register, log in, log out, who am I, and password reset. Trips and stops are still saved on the
device only.

The contract the app talks to is in [API](api.md).

## Stack

| Part | Choice | Why |
| --- | --- | --- |
| Language | TypeScript, Node.js 22 | The same language as the app, so rules can later be shared |
| HTTP | [Fastify](https://fastify.dev) 5 | Fast, with good plugins and a way to test without a network |
| Checking input | [Zod](https://zod.dev) 4 | The same library as the app |
| Database | PostgreSQL 13 or newer | Production. **PGlite** (PostgreSQL inside Node) for development and tests |
| Security plugins | `@fastify/helmet`, `@fastify/cors`, `@fastify/rate-limit` | Headers, allowed web origins, request limits |
| Tests | [Vitest](https://vitest.dev) | Fast, TypeScript without extra setup |

There is no ORM. The SQL is written by hand in one file (`src/auth/repository.ts`) and every value
goes in as a parameter, never into the SQL text. The database is reached through a tiny interface
(`src/db/database.ts`) with two implementations, so the code does not depend on one driver.

## Run it

You need Node.js 22 or newer. No database has to be installed.

```bash
cd server
npm install
cp env.example .env      # optional: every setting has a default
npm run dev              # restarts when you change a file
```

The server listens on `http://127.0.0.1:3000`. Check it: `curl http://127.0.0.1:3000/health`.

> The example file is called `env.example` (not `.env.example`) in this repository. Copy it to
> `.env`; that file is git-ignored.

Without `DATABASE_URL` the server uses a **development database** saved in `server/.data/`
(git-ignored). Delete that folder to start from nothing. It is not for production.

| Command | What it does |
| --- | --- |
| `npm run dev` | Start with automatic restarts |
| `npm test` | All tests, once (`npm run test:watch` re-runs on change) |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | ESLint |
| `npm run build` | Compile to `dist/` and copy the SQL migrations |
| `npm start` | Run the compiled server (`dist/`) |

Lint, typecheck and the tests must pass, as in the app.

### Looking at the data

The development database in `server/.data/pglite` is a complete PostgreSQL data directory
(`base/` holds the tables, `pg_wal/` the write-ahead log). Its files are in PostgreSQL's
internal binary format, so **they cannot be opened or searched in an editor**, and PGlite has no
network port that a database app could connect to. Two cautions:

- **Never open the folder while `npm run dev` is running.** PGlite allows one process at a time,
  and a second one can corrupt the data. Stop the server, or work on a copy of the folder.
- **No password is stored anywhere.** `users.password_hash` is a scrypt hash that cannot be
  turned back into the password, and only the SHA-256 hash of a session or reset token is
  stored. Do not paste hashes into chats or tickets.

To browse the data with a normal database tool, run a real PostgreSQL locally, as below. The
data in the PGlite folder is **not** copied over: the new database starts empty, so sign up again.

#### Using a real PostgreSQL locally

On macOS with [Homebrew](https://brew.sh) (any PostgreSQL 13 or newer works):

```bash
brew install postgresql@17
brew services start postgresql@17
export PATH="/opt/homebrew/opt/postgresql@17/bin:$PATH"   # if `createdb` is not found
createdb travel_planner
```

Then set the address in `server/.env` (git-ignored) and start the server:

```
DATABASE_URL=postgres://localhost:5432/travel_planner
```

```bash
cd server && npm run dev
```

On start the server applies the migrations and creates the tables, and the log no longer says
"Using the development database". A Homebrew install has a superuser named after your account and
no password, which is enough locally; use a proper user and password for anything shared, and
keep them in `.env`, never in the code.

Connect a database app (for example [TablePlus](https://tableplus.com) or
[DBeaver](https://dbeaver.io)) with host `localhost`, port `5432`, database `travel_planner` and
your user name, or use `psql travel_planner`. You will see `users`, `sessions`,
`password_resets` and `schema_migrations`. For example:

```sql
SELECT id, email, name, created_at FROM users;
```

Select the columns you need instead of `*`, so `password_hash` stays out of sight. The emails and
names in this database are personal data: do not share it, and remove it when you no longer
need it with `dropdb travel_planner`. The end-to-end tests are not affected, because they
clear `DATABASE_URL` and use their own throwaway database (see [Testing](testing.md#end-to-end-tests)).

### Using it from the app

The app uses this server when `EXPO_PUBLIC_API_URL` is set (see
[Authentication](auth.md#which-service-the-app-uses)). The short version for development:

1. In `server/`, start the server so that a phone can reach it: `HOST=0.0.0.0 npm run dev`.
2. In the project root, put `EXPO_PUBLIC_API_URL=auto` in `.env.local`, then `npx expo start --clear`.

`HOST=0.0.0.0` makes the server visible to **everyone on the same network**. That is fine on a
trusted home or office network while developing; do not do it on a public one. The default,
`127.0.0.1`, is only reachable from the computer itself (which is enough for the iOS Simulator and
for `curl`, but not for a phone or an Android emulator).

The app and the server are checked against each other by a contract test, which runs as part of
`npm test` here (see [Testing](testing.md#the-contract-test)).

### Trying the password reset

There is no email provider yet. In development the server prints the reset link in its log:

```
[dev mail] Password reset for anna@example.com: travel-planner://reset-password?token=...
```

With the app, open that link (see [the password reset link](auth.md#the-password-reset-link)). Or
copy the token into `POST /v1/auth/password-reset/confirm` (see [API](api.md)).

## Settings

All settings come from environment variables and are checked when the server starts; a wrong one
stops it with a message that lists the problems (and never repeats a value, because a database
URL contains a password). See `server/env.example` for the full list.

| Setting | Default | Notes |
| --- | --- | --- |
| `NODE_ENV` | `development` | `production` turns on the checks below |
| `HOST`, `PORT` | `127.0.0.1`, `3000` | Listens on the local machine only unless changed |
| `DATABASE_URL` | none | A PostgreSQL URL. **Required in production** |
| `CORS_ORIGINS` | none | Web origins that may call the API, separated by commas. Phones need none |
| `TRUST_PROXY` | `false` | `true` only behind a proxy you control (see below) |
| `SESSION_TTL_DAYS` | `30` | How long a session lasts |
| `RESET_TTL_MINUTES` | `60` | How long a reset link works |
| `SCRYPT_N` | `131072` | Cost of hashing a password. Not below 131072 in production |
| `PASSWORD_RESET_URL` | `travel-planner://reset-password` | The link in the email; `?token=` is added |
| `MAIL_TRANSPORT` | `console` | Only `console` exists. **Refused in production** |

**In production the server refuses to start** unless there is a `DATABASE_URL`, the hashing cost is
high enough, `CORS_ORIGINS` is not `*`, and the mail transport is not `console`. Because no real
mail transport exists yet, **the server cannot start in production today**. That is on purpose: it
cannot be deployed by accident before password reset email is connected.

## How it is built

```
server/src/
  index.ts          Starts the server: config, database, migrations, shutdown
  app.ts            Builds the server (plugins, error handling, routes); used by tests too
  config.ts         Reads and checks the environment
  errors.ts         The error codes and the shape of an error answer
  db/               The database interface, the migration runner, and migrations/*.sql
  auth/
    routes.ts       The HTTP endpoints; turns requests into calls of the service
    service.ts      The rules: who may register and log in, sessions, password reset
    repository.ts   All the SQL
    schemas.ts      What each endpoint accepts (Zod)
    password.ts     Hashing and checking passwords (scrypt)
    tokens.ts       Making session and reset tokens, and hashing them
  mail/mailer.ts    Sending emails (only the development one exists)
  test-utils/       A server for tests: in-memory database, mailer that records, movable clock
```

### Migrations

The database is changed by numbered SQL files in `src/db/migrations/` (`001_accounts.sql`, ...).
The server applies the ones that have not been applied yet when it starts, each in a transaction,
and records them in `schema_migrations`. **Never edit a migration that was applied; add a new
file.**

## Security decisions

| Topic | What is done |
| --- | --- |
| **Passwords** | Never stored. A `scrypt` hash with a random salt, at the recommended cost (N=2^17, r=8, p=1). The hash carries its own settings, so the cost can be raised later and old hashes are made again at the next log in |
| **Sessions** | A random 256-bit token. Only its **SHA-256 hash** is stored, so a copy of the database cannot be used to act as a user. The token is not a JWT, so a session can be ended at any time |
| **Reset links** | Random, stored hashed, single use, expire after an hour, only the newest link of a user works. Using one ends **all** sessions of that user |
| **Logging in** | The same answer and the same work for an unknown email and a wrong password, so they cannot be told apart |
| **Asking for a reset** | The same answer for every address, and the work is done after the answer, so neither the answer nor its time tells whether an account exists |
| **Requests** | Every body is checked with Zod and unknown fields are refused; bodies over 10 kB are refused; SQL values are always parameters |
| **Limits** | 100 requests a minute per address, and stricter on register (5), log in (10) and password reset (5 and 10) |
| **Answers** | Never cached (`Cache-Control: no-store`); security headers from Helmet; errors never include a stack trace, a SQL error or a value |
| **The log** | Does not contain passwords, tokens or the `Authorization` header |
| **CORS** | Off unless web origins are listed; only `GET`, `POST` and `OPTIONS`; no cookies are used |

### Behind a proxy

`TRUST_PROXY=false` (the default) ignores a client's `X-Forwarded-For` header. If it were trusted
without a proxy, anyone could choose their own address and walk around the request limits. Set it
to `true` **only** when the server runs behind a proxy or load balancer you control, so the limits
see the real client address.

## Before it goes to production

The server is a **start**. These things are missing or must be decided, and it should be reviewed
by your security team before real users depend on it.

- **A real mail transport** for the reset email (`MAIL_TRANSPORT`). Until then it cannot start in
  production.
- **HTTPS.** The server speaks plain HTTP and sends the HSTS header; TLS must be provided by the
  proxy or platform in front of it. Use `sslmode=require` (or stronger) in `DATABASE_URL`.
- **A shared store for the request limits.** They are kept in the memory of one process, so with
  several server instances each has its own count. Use a shared store (for example Redis) before
  running more than one.
- **Migrations on start.** Fine for one instance. With several, run migrations as a separate
  step so two do not try to apply the same file together.
- **Account lockout and verification.** Limits are per address, not per account, and an email is
  not verified. Decide whether to add a lockout after repeated failures and email verification.
- **Secrets.** Keep `DATABASE_URL` and any future keys in the platform's secret store or `.env`,
  never in code.
- **Backups, monitoring and alerts** for the database and the server.
- **The app's address.** A release build must set `EXPO_PUBLIC_API_URL` to the server's **https**
  address; the app refuses plain `http://` outside development.
- **Personal data.** Accounts hold a name and an email address. Involve your **Data Privacy
  Officer** about what is stored, for how long, and how an account and its data are erased
  (there is no delete-account endpoint yet).

### Known limits

- Registering tells whether an address already has an account (it answers `409 emailTaken`),
  because the app shows that to the user. The register limit makes mass checking slow.
- The automated tests check that the answers for an unknown email and a wrong password are
  identical, but they **do not measure timing**; the decoy hash that keeps the work equal is
  reviewed by reading the code.
- A session lasts a fixed time and is not renewed while in use.
- Only accounts exist. Trips and stops are not stored on the server yet.

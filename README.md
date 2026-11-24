# travel-planner

A mobile app to plan trips day by day, with a map and travel time between stops.

## Tech stack

- [Expo](https://docs.expo.dev/) (React Native)
- TypeScript
- Expo Router (file-based navigation)
- Zustand (client state)
- expo-secure-store (the login token only)

## Documentation

See [`docs/`](docs/README.md): getting started, architecture, conventions, maps and place search, testing and troubleshooting.

## Getting started

```bash
npm install
npx expo start
```

## General rules

- Everything technical is written in English: code identifiers, file and folder names, comments, docs, commit messages, branch names and PR descriptions.
- User-facing text lives only in i18n files (`en` and `pl`). Components use translation keys (in English), never hard-coded strings.
- Use arrow functions for components, hooks and helpers.
- Structure: `src/modules/<module>/screens/<Screen>/`, with `components`, `hooks`, `schema`, `store` and `utils` subfolders created only when needed. Route files in `src/app/` are thin re-exports.
- Two themes (light and dark) and two languages (en and pl) from the start. No hard-coded colors or user-facing strings in components.
- Font sizes and weights come from the `typography` text styles in `src/shared/theme/typography.ts`, never inline.
- Secure storage holds tokens only, never passwords.
- Install packages with `npx expo install`.
- Before a task is done, lint (`npx expo lint`) and typecheck (`npx tsc --noEmit`) must pass.

## Secrets

Secrets live only in `.env` and are never committed. `.env` files are git-ignored.

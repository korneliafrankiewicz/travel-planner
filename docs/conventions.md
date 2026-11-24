# Conventions

The short version is in [`CLAUDE.md`](../CLAUDE.md). This page adds the reasons and examples.

## Language

Everything technical is in **English**: code, comments, file names, commit messages, branch
names and docs. Texts the user sees exist in English and Polish.

## Texts

- A component never contains text the user sees. It uses a translation key:
  `t('stop.errors.titleRequired')`.
- A new text goes into **both** `locales/en/<namespace>.ts` and `locales/pl/<namespace>.ts`.
  The locale test fails when the keys or placeholders differ, or when a Polish plural form is
  missing.
- Validation schemas return translation **keys**, not text, so a language switch changes
  messages that are already on screen.
- Accessibility labels are user-facing text too: they go through i18n as well.

## Colors and type

- No color is written in a component. Take it from `const { colors } = useTheme()`. A new
  color becomes a token in `src/shared/theme/tokens.ts` for **both** themes.
- No `fontSize` or `fontWeight` in a component. Spread a text style and add the color:

  ```tsx
  title: { ...typography.cardTitle },
  // ...
  <Text style={[styles.title, { color: colors.textPrimary }]} />
  ```

- Spacing and radii come from `spacing` and `radius` in `src/shared/theme`.

## Code style

- Components, hooks and helpers are **arrow functions**. Template code that came with Expo is
  left as it is.
- Keep `src/app/` files to a one-line re-export of a screen.
- Create the `components`, `hooks`, `schema`, `store` and `utils` folders only when a screen
  needs them.
- The code base keeps logic that is not about drawing in plain functions under `utils/`
  (distances, dates, formatting, validation), so it can be tested without rendering. Do the
  same.
- Comments in the existing code explain **why** something is done, not what the line does.
  Follow that, and leave out a comment that repeats the code.

## Platform-specific code

`react-native-maps` has no web support. A component that needs it comes as a pair, picked by
the bundler from the file name:

```
StopsMap.tsx        native: the real map
StopsMap.web.tsx    web: renders nothing (or a fallback)
StopsMap.types.ts   the props, shared by both files
```

The web file must **not** import `react-native-maps`, or the web build breaks. Check with
`npx expo export --platform web --output-dir <somewhere outside the project>`.

Code that works the same everywhere, but should look different on one platform, can check
`Platform.OS`. Use that for small differences only.

## Data and storage

- A value read from storage or from the network is **checked with Zod** before it is used. A
  bad entry is dropped, never trusted.
- A new field on a saved record must be optional or have a default, so records saved by an
  older version still load.
- **Secure storage holds tokens only**, never passwords. Secrets live in `.env`, never in
  code. See [Getting started](getting-started.md#secrets).

## Before you finish

1. `npm run lint` passes.
2. `npm run typecheck` passes.
3. `npm test` passes, with tests for the new behavior.
4. If you touched native-only code, the web build still works.
5. If you added or changed text, both languages are updated.
6. If you added a package, you installed it with `npx expo install`.

## Git

- Commit messages follow the existing style: `feat(trips): show a map per stop`,
  `fix(...)`, `refactor(...)`, `test: ...`, `chore: ...`, `docs: ...`.
- Work happens on `main` for now. Make a branch for anything large or risky, and name it in
  English.

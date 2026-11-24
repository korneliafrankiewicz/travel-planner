# travel-planner

Expo / React Native app. See `AGENTS.md` for Expo-specific instructions. Documentation lives in `docs/` (start at `docs/README.md`); keep it up to date when behavior, setup or conventions change.

## Rules

- All code, comments, file names, commit messages, branch names and docs are in English.
- User-facing text only via i18n files (`en`, `pl`) using English translation keys. No hard-coded strings or colors in components.
- Arrow functions for components, hooks and helpers.
- Structure: `src/modules/<module>/screens/<Screen>/` with `components`, `hooks`, `schema`, `store`, `utils` created only when needed. Files in `src/app/` are thin re-exports.
- Font sizes and weights only via `typography` in `src/shared/theme/typography.ts` (spread a text style, add only the color). No inline `fontSize` or `fontWeight` in components.
- Light and dark themes, `en` and `pl` languages from the start.
- Secure storage holds tokens only, never passwords.
- Install packages with `npx expo install`.
- Lint and typecheck must pass before a task is done.
- Secrets live only in `.env`, never committed.

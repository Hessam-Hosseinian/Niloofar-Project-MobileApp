# Niloofar mobile app coding rules

This is an Expo SDK 57 / Expo Router React Native project. Before changing Expo-specific behavior, use documentation for the SDK version in `package.json`.

## Architecture

Read `docs/project-structure.md` and `src/features/README.md` before adding a feature.

- Keep `app/` for Expo Router route/layout glue only.
- Put each mini-app in `src/features/<feature>/`.
- Use `screens/`, `components/`, `hooks/`, `data/`, `api/`, `services/`, and `utils/` by responsibility.
- Do not add feature repositories to `src/db`; `src/db` is infrastructure only.
- Do not add feature-specific UI to `src/components`; shared cross-feature UI only.
- New code must use canonical subfolder imports rather than compatibility entrypoints in feature roots.
- Avoid large new screen files: extract feature components/hooks when a screen becomes difficult to scan.
- Reuse tokens from `src/theme` and shared primitives from `src/components/ui`.

## Verification

Before considering a change complete, run:

```bash
npm run lint
npm test
```

For routing/UI changes also launch Expo with `npx expo start -c` and smoke-test the affected flow.

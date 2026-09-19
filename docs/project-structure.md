# Project structure

The app uses Expo Router plus a feature-first application architecture. The goal is to make every mini-app predictable to navigate and easy to extend.

## Top-level responsibilities

```text
app/                    Expo Router routes and layouts only
src/auth/               authentication state and auth screens
src/components/         cross-feature reusable UI and layout
src/db/                 database infrastructure only
src/features/           mini-apps and product features
src/store/              truly global application state
src/theme/              shared visual tokens
assets/                  static app assets
tests/                   automated tests
```

## Canonical feature layout

```text
src/features/<feature>/
├── screens/             route-level screens
├── components/          UI specific to the feature
├── hooks/               React hooks specific to the feature
├── data/                repositories/local persistence/static feature data
├── api/                 remote API clients
├── services/            notifications, backup, device integrations
├── utils/               pure helper/business functions
└── types.ts             shared feature types when needed
```

Only create folders that contain real files.

## Current feature map

```text
src/features/
├── activity/
│   ├── data/
│   └── screens/
├── calendar/
│   ├── data/
│   └── screens/
├── habits/
│   ├── components/
│   ├── data/
│   ├── hooks/
│   ├── screens/
│   ├── services/
│   └── utils/
├── home/
│   ├── api/
│   ├── components/
│   └── screens/
├── profile/
│   └── screens/
├── services/
│   ├── data/
│   ├── hooks/
│   ├── screens/
│   └── utils/
└── tasks/
    ├── data/
    ├── screens/
    ├── services/
    └── utils/
```

## Routing rule

Files in `app/` should contain navigation/layout glue only. A normal route looks like:

```ts
export { default } from "@/src/features/notes/screens/NotesScreen";
```

Do not build feature UI, database queries, or business logic in route files.

## Placement rules

- A component used by one feature belongs in that feature's `components/` folder.
- A component genuinely reused by multiple features belongs in `src/components/ui` or `src/components/layout`.
- SQLite CRUD for a feature belongs in its `data/` folder.
- `src/db` owns the database connection, schema and seed/migration infrastructure, not feature repositories.
- Remote network calls belong in `api/`.
- Notifications, backups, export/import, sensors and device integrations belong in `services/`.
- Pure calculations, formatting and filtering belong in `utils/`.
- Feature-specific hooks belong in `hooks/`.
- Global state goes in `src/store` only when multiple unrelated features truly need it.

## Compatibility entrypoints

Existing screens may still import historical feature-root paths such as `tasksRepository.ts`. Those files are now tiny re-export entrypoints only and contain no implementation. New code must import from the canonical subfolders shown above.

## Before merging changes

Run:

```bash
npm run lint
npm test
npx expo start -c
```

Smoke-test the feature you changed plus Home and Services navigation.

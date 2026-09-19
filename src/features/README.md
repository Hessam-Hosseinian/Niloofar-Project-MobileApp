# Feature architecture

Each mini-app or product area lives in its own folder under `src/features`.

Use only the folders a feature actually needs:

```text
src/features/<feature>/
├── screens/      # route-level screens and page composition
├── components/   # UI used only by this feature
├── hooks/        # feature-specific React hooks
├── data/         # SQLite repositories, local persistence, static feature data
├── api/          # remote HTTP/API clients
├── services/     # notifications, backup/export, device integrations
├── utils/        # pure helpers and business calculations
└── types.ts      # shared feature types when they outgrow a single file
```

Rules:

- Keep `app/` thin. Route files should only connect Expo Router to a screen.
- Do not put feature-specific code in `src/components`, `src/db`, or `src/store`.
- `src/components` is only for reusable cross-feature UI/layout.
- `src/db` is only database infrastructure: connection, schema, migrations/seed.
- Prefer a small screen that composes feature components; extract UI when it becomes hard to scan or reuse.
- Do not create empty folders. Add a folder when its first real file exists.
- New code should import canonical subfolder paths, not compatibility entrypoints at a feature root.

## Adding a mini-app

For a simple mini-app named `notes`, start with:

```text
app/(app)/service/notes.tsx
src/features/notes/screens/NotesScreen.tsx
```

Then add `components`, `data`, `api`, `hooks`, `services`, or `utils` only as the feature grows.

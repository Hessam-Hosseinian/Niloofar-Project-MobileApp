# Project structure

The project uses Expo Router for navigation and a feature-first structure for application code.

## Rules

- `app/` contains routing and layout files only. Route files should normally re-export a screen from `src/`.
- `src/features/<feature>/screens/` contains full screen implementations.
- Feature-specific components and API/data helpers stay inside their feature.
- Reusable UI belongs in `src/components/ui/` or `src/components/layout/`.
- Database infrastructure stays in `src/db/`.
- Global visual tokens stay in `src/theme/`.
- Authentication state and auth screens stay in `src/auth/`.

## Current feature layout

```text
src/
├── auth/
│   ├── AuthProvider.tsx
│   └── screens/
├── components/
│   ├── layout/
│   └── ui/
├── db/
├── features/
│   ├── activity/screens/
│   ├── calendar/screens/
│   ├── habits/screens/
│   ├── home/
│   │   ├── api/
│   │   ├── components/
│   │   └── screens/
│   ├── profile/screens/
│   ├── services/screens/
│   └── tasks/screens/
├── store/
└── theme/
```

When a feature grows, prefer adding `components/`, `hooks/`, `data/`, `utils/`, or `types/` inside that feature instead of adding feature-specific files to global folders.

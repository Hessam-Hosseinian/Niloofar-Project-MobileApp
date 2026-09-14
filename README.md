# Niloofar Super App

A mobile-first personal hub for everyday services, built with Expo and React Native. Niloofar combines a searchable service catalog, local productivity tools, and a bold neo-brutalist interface in one application.

## Current features

- Onboarding and a locally persisted mock authentication flow
- Home, services, activity, and profile tabs
- Searchable and categorized service catalog with favorites
- Local task management with notes, priorities, due dates, and completion state
- Smart task views for today, upcoming, overdue, and completed tasks
- Subtasks with completion tracking and a progress indicator
- Persistent on-device data backed by SQLite

> [!NOTE]
> This repository is an early-stage prototype. Authentication is currently mocked and several services in the catalog are placeholders for future modules.

## Tech stack

- [Expo](https://expo.dev/) SDK 57
- [React Native](https://reactnative.dev/) and TypeScript
- [Expo Router](https://docs.expo.dev/router/introduction/) for file-based navigation
- [Expo SQLite](https://docs.expo.dev/versions/latest/sdk/sqlite/) for local persistence
- [Expo SecureStore](https://docs.expo.dev/versions/latest/sdk/securestore/) for local session state
- [Zustand](https://zustand.docs.pmnd.rs/) for client-side state
- [Lucide](https://lucide.dev/) and Space Grotesk for the visual system

## Getting started

### Prerequisites

- Node.js and npm
- Expo Go, an Android emulator, or an iOS simulator

### Installation

```bash
git clone https://github.com/Hessam-Hosseinian/Niloofar-Project-MobileApp.git
cd Niloofar-Project-MobileApp
npm ci
```

Start the Expo development server:

```bash
npm start
```

Then press `a` for Android, `i` for iOS, or `w` for web. You can also use the platform-specific scripts:

```bash
npm run android
npm run ios
npm run web
```

## Quality checks

```bash
npm run lint
npx tsc --noEmit
```

## Project structure

```text
app/                     Expo Router screens and layouts
  (auth)/                Onboarding and login routes
  (app)/                 Authenticated tabs and service routes
src/
  auth/                  Authentication context and persistence
  components/            Shared layout and UI components
  db/                    SQLite schema, seed data, and repositories
  features/              Feature-specific data and logic
  store/                 Global client-side state
  theme/                 Colors, typography, spacing, and shadows
assets/                  App icons and images
```

## Data and privacy

Task data, favorites, and activity data are stored locally in SQLite. The current mock session and onboarding state are stored on the device with SecureStore. No production backend is connected yet.

## Roadmap

- Replace mock authentication with a production identity service
- Implement the remaining catalog services
- Add automated tests and continuous integration
- Add cloud sync and backup

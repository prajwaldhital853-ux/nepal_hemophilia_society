# NHMS Patient App (React Native)

Cross-platform mobile app for **Android and iOS**, built with **React Native** and [Expo](https://expo.dev).

## Tech

- React Native 0.86
- Expo SDK 57
- TypeScript
- React Navigation (native stack)
- Code splitting via `React.lazy` + dynamic imports per feature screen/modal

## Project structure

```
src/
├── core/
│   ├── config.ts
│   ├── navigation/     # Root navigator + lazyScreen helper
│   └── theme/
├── features/
│   ├── auth/           # Login, registration
│   ├── home/
│   ├── profile/
│   ├── injections/
│   └── splash/
└── components/
    └── modals/         # Lazy-loaded modals (HelpModal)
```

Each feature screen is loaded as a **separate bundle** when the user navigates to it. Modals (e.g. help dialog) use dynamic `import()` and only load when opened.

## Prerequisites

- Node.js 20+
- [Expo Go](https://expo.dev/go) on your phone, **or** Android Studio / Xcode for emulators

## Setup

```powershell
cd patient-app
copy .env.example .env
npm install
```

## Run

```powershell
# Start Expo dev server
npm start

# Android emulator / device
npm run android

# iOS (macOS only, or use Expo Go on iPhone)
npm run ios
```

## API URL

- Android emulator: `http://10.0.2.2:8000/api/v1` (default in `.env.example`)
- Physical device: use your PC's LAN IP, e.g. `http://192.168.1.10:8000/api/v1`

Set in `.env` as `EXPO_PUBLIC_API_URL`.

## Adding a new feature

1. Create `src/features/<name>/screens/<Name>Screen.tsx`
2. Register a lazy screen in `src/core/navigation/screens.ts`
3. Add route in `src/core/navigation/RootNavigator.tsx`

New features stay in their own folder and load on demand — no single monolithic bundle.

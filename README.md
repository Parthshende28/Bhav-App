# Bhav App (expo-app)

> ✅ Multi-platform Expo app (iOS, Android, Web) using Expo Router, React Native and Expo.

---

## Overview ✨

**Bhav App** is a React Native application built with Expo and Expo Router. The project targets mobile (iOS & Android) and web, and includes payment/IAP integration, real-time features via sockets, and a modular structure for components and services.

Key features
- Expo + Expo Router powered multi-platform app
- In-app purchases (react-native-iap) and Razorpay integration
- Socket-based real-time updates (`socket.io-client`)
- Modular architecture with services, components, and screens

---

## Table of Contents 📚

- [Tech Stack](#tech-stack)
- [Requirements](#requirements)
- [Getting Started](#getting-started)
- [Available Scripts](#available-scripts)
- [Project Structure](#project-structure)
- [Payments & IAP](#payments--iap)
- [Build & Deploy](#build--deploy)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)
- [References](#references)

---

## Tech Stack 🔧

- Expo (managed) & Expo Router
- React Native, React
- TypeScript
- Zustand (state management)
- Socket.io
- react-native-iap (IAP), react-native-razorpay (Android payments)

---

## Requirements 🧰

Install the following on your machine:

- Node.js (recommended LTS)
- Yarn or npm
- Expo CLI (optional but recommended): `npm i -g expo-cli` or use `npx expo`
- For Android: Android Studio + SDK
- For iOS: Xcode (macOS required for building/running iOS locally)

---

## Getting Started (Development) 🚀

1. Clone the repo:

   ```bash
   git clone <repo-url>
   cd Bhav-App
   ```

2. Install dependencies:

   ```bash
   yarn install
   # or
   npm install
   ```

3. Copy environment variables template (create your own `.env` or follow your team's convention):

   ```bash
   cp .env.example .env
   ```

   Add values for API base URLs and any secret keys used by `services/*` (payments, IAP, sockets, etc.).

4. Start the dev server (mobile + web):

   ```bash
   # Metro + tunnel
   yarn start
   # OR
   npm run start

   # Web
   yarn start-web
   ```

5. Run on a simulator/device:

   ```bash
   yarn ios      # runs on iOS simulator (macOS)
   yarn android  # runs on Android
   ```

---

## Available Scripts (from package.json) ⚙️

- `start` - `expo start --tunnel` (start dev server)
- `start-web` - `expo start --web --tunnel`
- `start-web-dev` - `DEBUG=expo* expo start --web --tunnel`
- `android` - `expo run:android`
- `ios` - `expo run:ios`

Use `npx expo` or `yarn` as needed if you don't have a global expo installation.

---

## Project Structure 🗂️

Key folders/files:

- `app/` - Application routes & screens (Expo Router)
- `components/` - Reusable UI components
- `services/` - Core services (API, payments, IAP, socket, etc.)
- `backend/` - Backend code or integration helpers (if present)
- `assets/` - Images, fonts, etc.
- `constants/` - App constants
- `store/` - Zustand / global state
- `app.json`, `eas.json`, `vercel.json` - Expo & deployment configs

Refer to the `app/` folder for route-based organization used by Expo Router.

---

## Payments & In-App Purchases 💳📱

This app contains payment integrations and IAP code:

- `services/payment-android.ts` and `services/payment-ios.ts` - platform-specific payment code
- `services/razorpay.ts` - Razorpay integration
- `services/apple-iap.ts` / `services/iap.ts` / `apple-iap-test.ts` - in-app purchase logic and tests
- Docs related to iOS IAP live in the repo: `IOS_IAP_INTEGRATION_TEST.md` and `IOS_IAP_TESTING.md` — consult these for steps to test/publish iOS purchases.

Notes:
- Ensure the proper store credentials and Apple/Google sandbox/test accounts when testing purchases.
- For iOS: follow the provided iOS IAP testing notes carefully; App Store Connect configuration is required.

---

## Build & Deploy 🧭

This project contains deployment configs for EAS and Vercel.

- Use `eas.json` for building with EAS (Expo Application Services).
- `vercel.json` is present for web deployment (if you deploy the web build to Vercel).

Typical steps:

1. Build mobile with EAS

   ```bash
   eas build -p ios
   eas build -p android
   ```

2. Deploy web (example using Vercel)

   - Build static web using Expo web or your preferred build command and push to Vercel.

---

## Troubleshooting & Tips ⚠️

- Clear Metro cache:

  ```bash
  expo start -c
  ```

- If iOS build fails on macOS, run CocoaPods install inside `ios/` (if you eject):

  ```bash
  cd ios && pod install && cd ..
  ```

- If you see native module issues, rebuild the app (restart dev server and re-run `expo run:android` / `expo run:ios`).

- If you face auth or API issues, check `services/api.ts` and ensure `.env` values are correct.

---

## Contributing 🤝

Thanks for considering contributing!

Guidelines:

- Fork the repository and make a new branch per feature or bugfix (`feature/<name>` or `fix/<issue>`)
- Keep commits small and focused; use clear commit messages
- Open a Pull Request; include screenshots and testing instructions if applicable
- Add TypeScript types for new modules and update or add unit/integration tests where feasible

---

## Code Style & Best Practices 🧭

- TypeScript for static typing
- Keep services in `services/` and UI in `components/`
- Single responsibility: small, testable functions and components
- Use environment variables for secrets and platform-specific keys

---

## References & Resources 📚

- Expo docs: https://docs.expo.dev/
- Expo Router: https://expo.github.io/router/docs
- React Native IAP: https://github.com/dooboolab/react-native-iap
- Razorpay React Native docs: https://razorpay.com/docs/
- EAS Build: https://docs.expo.dev/eas/
- Vercel: https://vercel.com/docs

Thanks for building with Expo — happy coding! 🚀

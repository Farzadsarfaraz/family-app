# Nestiq

A full-stack family management app with:

- `client`: React Native + Expo + React Navigation + NativeWind
- `server`: Node.js + TypeScript + Express + MongoDB + JWT auth

## Features

- Authentication with family group creation/join flow
- Grocery list
- Budget tracker with monthly summaries
- Family calendar with upcoming events
- Chore chart with weekly reset
- Mobile-first dashboard and bottom tab navigation

## Project Structure

```text
Nestiq/
  client/
  server/
```

## Setup

1. Install dependencies:

```bash
npm install
```

2. Configure the server:

```bash
cp server/.env.example server/.env
```

3. Update `server/.env` with your MongoDB URI and JWT secret.

4. Use Node 20 for the Expo client and server:

```bash
nvm use 20
```

5. Start the API:

```bash
npm run dev:server
```

6. Install/update client dependencies after Expo SDK changes:

```bash
npx expo install --fix
```

7. Start Expo:

```bash
npm run dev:client
```

## API

The mobile app expects the API base URL from Expo env:

```text
EXPO_PUBLIC_API_URL=http://YOUR_LOCAL_IP:4000/api
```

For a physical device, use your machine's LAN IP instead of `localhost`.

## Android Release

This repo is prepared for Expo EAS Android builds.

1. Create `client/.env` from `client/.env.example` and set your live backend URL:

```bash
cp client/.env.example client/.env
```

2. Log in to Expo and configure EAS:

```bash
npx eas login
npx eas build:configure
```

3. Build the Play Store bundle:

```bash
npm run build:android --workspace client
```

4. Submit after the build is ready:

```bash
npm run submit:android --workspace client
```

Before publishing, make sure you:

- Deploy the backend publicly and set `EXPO_PUBLIC_API_URL`
- Replace the default app icon, splash, and favicon assets
- Confirm the Android package name in `client/app.config.ts`
- Create a Google Play Developer account
- Prepare screenshots, privacy policy URL, and Play Store listing copy

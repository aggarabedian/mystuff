# myStuff Mobile

myStuff Mobile is an Expo and React Native app for organizing storage rooms,
shelves, containers, and items. It uses Expo Router for navigation and React
Native Paper for UI components.

## Get started

1. Install dependencies:

   ```bash
   npm install
   ```

2. Set the app's public backend origin in the root `.env.production` file:

   ```dotenv
   EXPO_PUBLIC_API_URL=https://your-backend.example.com
   ```

   This is the origin only; do not append `/api`. `EXPO_PUBLIC_` values are
   embedded in the app bundle and are not secret. Auth0 client secrets and
   other private backend credentials belong in the backend's environment,
   never in this app's `.env` files.

3. Start the app:

   ```bash
   npx expo start
   ```

Expo can open the app in a development build, simulator, or web browser. See the
[Expo documentation](https://docs.expo.dev/) for platform setup.

## Build for Appetize.io (iOS)

Appetize runs iOS Simulator builds, not App Store `.ipa` builds. The `appetize`
EAS profile creates a simulator build and does not require Apple Developer
signing.

1. Sign in to an [Expo account](https://expo.dev/), then configure and link the
   project:

   ```bash
   npx eas-cli@latest build:configure
   ```

   Follow the prompts to link this app to your Expo account.
2. Add `EXPO_PUBLIC_API_URL` to the project's **Preview** environment variables
   in the Expo dashboard. Set it to the same backend origin used in
   `.env.production` (do not include `/api`). This value is embedded in the
   app, so it must be a plain-text EAS environment variable; it is not a
   secret. EAS cloud builds cannot read the ignored local `.env.production`
   file.
3. Check your EAS build allowance, then run:

   ```bash
   npm run build:appetize
   ```

4. Download the completed build artifact from the EAS build page. Upload a
   `.zip` or `.tar.gz` containing the `.app` bundle to
   [Appetize's upload page](https://appetize.io/upload). If the downloaded
   artifact is not already such an archive, extract it and compress the `.app`
   bundle itself first.

This build is for Appetize and iOS simulators only; it is not installable on a
physical iPhone. Android can be configured as a separate build profile later.

## Project structure

- `src/app/` contains Expo Router screens and route layouts.
- `src/components/` contains reusable UI and feature views.
- `src/lib/api/` contains backend requests.
- `src/types/` contains API and domain types.

## Quality checks

```bash
npm run lint
npx tsc --noEmit
```

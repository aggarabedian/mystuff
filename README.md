# myStuff Mobile

myStuff Mobile is an Expo and React Native app for organizing storage rooms,
shelves, containers, and items. It uses Expo Router for navigation and React
Native Paper for UI components.

## Get started

1. Install dependencies:

   ```bash
   npm install
   ```

2. Configure `EXPO_PUBLIC_API_URL` to point to the myStuff backend.

3. Start the app:

   ```bash
   npx expo start
   ```

Expo can open the app in a development build, simulator, or web browser. See the
[Expo documentation](https://docs.expo.dev/) for platform setup.

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

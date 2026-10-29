# Known issues (v1 freeze)

Items from the publish audit that stay open. Not blockers for the frozen portfolio snapshot.

## H10 — Dexie versions 4 and 5

`src/db/database.ts` versions 4 and 5 repeat the version 3 stores with no schema change. Do not delete them: Dexie already applied those versions on existing databases.

## H11 — `npm audit` (toolchain)

`npm audit` reports high issues in Vite 6.4.1 and other build-time packages (dev server path traversal, PostCSS, lodash, etc.). They are not APK/PWA runtime RCE. Do not run `npm audit fix --force`. Revisit on a later Vite 6/7 pin.

## H12 — `USE_EXACT_ALARM`

`android/app/src/main/AndroidManifest.xml` declares `USE_EXACT_ALARM` so daily reminders can fire on time. Fine for GitHub / sideload. Google Play may ask for a calendar/alarm justification.

## PWA vs Android

- Browser notifications need a secure context. HTTP LAN preview cannot show them; the Android app can.
- The PWA and the APK do not share Dexie. Move data with the JSON backup (25 MB cap). Journal photos live inside that JSON.

## Other

- Journal photos are stored as data URLs in IndexedDB and in the backup file.
- `android/app/build` is generated and gitignored; lint must not scan it (handled in eslint ignores).

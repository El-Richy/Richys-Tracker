# Problemas conocidos (v1 congelada)

Quedaron abiertos en el audit de publicación. No bloquean el snapshot de portafolio.

## H10 — Versiones 4 y 5 de Dexie

En `src/db/database.ts` las versiones 4 y 5 copian los stores de la 3 sin cambiar el esquema. No las borres: Dexie ya las aplicó en bases existentes.

## H11 — `npm audit` (herramientas de build)

`npm audit` marca issues high en Vite 6.4.1 y otros paquetes de build (dev server, PostCSS, lodash, etc.). No son RCE en la APK ni en la PWA ya construida. No corras `npm audit fix --force`. Revisarlo cuando se actualice Vite.

## H12 — `USE_EXACT_ALARM`

`android/app/src/main/AndroidManifest.xml` declara `USE_EXACT_ALARM` para que los recordatorios diarios lleguen a horario. En GitHub o sideload no hay problema. Play puede pedir justificación de calendario/alarma.

## PWA vs Android

- Las notificaciones del navegador piden un contexto seguro. En HTTP local no salen; en la app Android sí.
- La PWA y la APK no comparten Dexie. Los datos se pasan con el respaldo JSON (tope 25 MB). Las fotos del diario van dentro de ese JSON.

## Otros

- Las fotos del diario se guardan como data URL en IndexedDB y en el archivo de respaldo.
- `android/app/build` es generado y está en `.gitignore`; el lint no debe escanearlo (ya está en los ignores de ESLint).

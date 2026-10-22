# Richy's Tracker

Tracker de hábitos offline. Los datos viven en el dispositivo (IndexedDB / Dexie). No hay backend ni cuenta.

También corre como PWA y como app Android con Capacitor.

## Requisitos

- Node.js 22 o superior
- Para Android: Android Studio y un `dist/` recién construido

## Correr

```bash
npm install
npm run dev
```

Build de producción:

```bash
npm run build
npm run preview
```

Android:

```bash
npm run android
```

Eso construye, sincroniza `android/` y abre Android Studio.

## Respaldo

Ajustes exporta un JSON e importa otro. El tope es 25 MB, el mismo para exportar e importar. Las fotos del diario van dentro de ese JSON.

Reiniciar la app borra los datos locales. Hace falta un respaldo ya guardado para recuperarlos.

## Licencia

MIT. Ver [LICENSE](LICENSE).

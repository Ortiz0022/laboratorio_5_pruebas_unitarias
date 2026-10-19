# Pruebas automatizadas

## TLDR

- Tres suites: Mocha (unitarias), Jest (integración), Playwright (E2E).
- Resultados de referencia: **9 unitarias, 4 integración, 3 E2E**, todas en verde.
- E2E necesita el servidor corriendo (`npm start`); `webServer` está comentado en `playwright.config.js`.
- El servidor reenvía cada mensaje a **todos** los clientes: las pruebas deben identificar sus propios mensajes.

## Suites

| Suite | Ubicación | Comando | Referencia |
|---|---|---|---|
| Unitarias (Mocha) | `test/test.js` | `npm test` | 9 |
| Integración (Jest) | `tests/integration/chat.test.js` | `npx jest tests/integration --runInBand --env=node` | 4 |
| E2E (Playwright) | `tests/e2e/chat.spec.js` | `npx playwright test --project=chromium --headed` | 3 |

- Jest: usa `--runInBand` y `--env=node`. Las pruebas levantan el servidor con `http.listen(0)` (puerto aleatorio) y cierran con `io.close`, por lo que no requieren `npm start`.
- Playwright: `baseURL` es `http://localhost:3000`. Inicia antes el servidor en otra terminal con `npm start`. Sin `--project=chromium` también se ejecutan firefox y webkit (configurados en el proyecto).
- `index.html` carga Socket.IO y jQuery desde CDN, y las pruebas usan URLs externas de imagen/video: E2E y parte de las demás requieren conexión a Internet.
- `e2e/example.spec.js` (raíz) es una plantilla de Playwright fuera del `testDir`; no forma parte de las 3 pruebas E2E.

## Evitar interferencias por mensajes globales (Socket.IO)

Prácticas ya aplicadas en `tests/e2e/chat.spec.js`:

- Identificador único por prueba (`idUnico()`), añadido como query `?t=...` a las URLs, y selectores por ese `src` exacto.
- Mensaje **centinela**: el servidor procesa en orden los mensajes de un socket; cuando el centinela aparece, el mensaje anterior ya fue procesado. Úsalo antes de afirmar que algo **no** se mostró.
- Para pruebas de integración: cliente nuevo por mensaje (`forceNew: true`, `reconnection: false`) y `once` sobre la respuesta.
- No uses `waitForTimeout` fijos; usa `expect(...).toBeVisible()`, `toHaveCount` y `expect.poll`.

## Verificación antes de terminar un cambio

1. Ejecuta las tres suites con los comandos de la tabla.
2. Confirma 9 / 4 / 3 en verde (o actualiza este documento si agregaste pruebas de forma intencional).
3. No edites ni elimines pruebas existentes para que pasen.

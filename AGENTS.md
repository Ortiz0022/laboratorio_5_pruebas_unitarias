# AGENTS.md — UNA Chat

## TLDR

- App: chat en tiempo real con Node.js + Express + Socket.IO. Todo mensaje pasa por `validateMessage` de `libs/unalib.js` antes de reenviarse.
- Nunca renderices contenido del usuario como HTML: usa `.text()` / `createTextNode`. Mensajes con `<` o `>` se rechazan; solo URLs `http(s)` de imagen/video.
- Antes de dar un cambio por terminado, ejecuta las 3 suites (unitarias, integración, E2E). Referencia: **9 + 4 + 3** pruebas en verde.
- No modifiques pruebas ni dependencias para "hacerlas pasar"; corrige el código.
- Cambios no triviales: flujo OpenSpec (`/opsx-propose` → `/opsx-apply` → `/opsx-archive`).
- Si descubres una buena práctica **comprobada** en este repo, actualiza este archivo en el mismo cambio (ver [Mantenimiento](#mantenimiento-de-este-archivo)).

## Estructura

| Ruta | Responsabilidad |
|---|---|
| `server.js` | Express + Socket.IO; evento `Evento-Mensaje-Server`; exporta `{ http, io }` y solo escucha si es el módulo principal |
| `libs/unalib.js` | Lógica de validación (única fuente de verdad) |
| `index.html` | Frontend (jQuery + Socket.IO cliente por CDN); renderizado seguro |
| `test/test.js` | Pruebas unitarias (Mocha) |
| `tests/integration/` | Integración (Jest + `socket.io-client`) |
| `tests/e2e/` | End-to-End (Playwright; `testDir` en `playwright.config.js`) |
| `openspec/` | Specs y cambios (ver [openspec.md](docs/agents/openspec.md)) |

## Comandos esenciales

```bash
npm start                                              # servidor en :3000
npm test                                               # unitarias (Mocha)
npx jest tests/integration --runInBand --env=node      # integración
npx playwright test --project=chromium --headed        # E2E (servidor activo)
```

## Reglas para modificar código

1. Cambia lo mínimo necesario; no refactorices código ajeno a la tarea.
2. Mantén la separación: validación en `libs/`, transporte en `server.js`, presentación en `index.html`. No muevas la validación al cliente como única defensa.
3. Conserva comentarios y docstrings existentes que no estén relacionados con tu cambio.
4. Añade/ajusta pruebas junto con cualquier cambio de comportamiento en `validateMessage`.
5. No agregues secretos, credenciales ni datos sensibles al repositorio.
6. No cambies versiones de dependencias salvo que la tarea lo pida.

## Documentación detallada (Progressive Disclosure)

- Seguridad y arquitectura: [docs/agents/arquitectura-y-seguridad.md](docs/agents/arquitectura-y-seguridad.md)
- Pruebas automatizadas: [docs/agents/pruebas.md](docs/agents/pruebas.md)
- OpenSpec: [docs/agents/openspec.md](docs/agents/openspec.md)

Lee solo el documento que necesites para la tarea. No dupliques su contenido aquí.

## Mantenimiento de este archivo

> Cuando el agente descubra una nueva buena práctica técnica, de seguridad o de pruebas que sea útil y esté comprobada en este repositorio, deberá actualizar el archivo AGENTS.md correspondiente dentro del mismo cambio de código.
>
> No debe agregar consejos genéricos, información temporal, secretos, credenciales ni afirmaciones que no hayan sido verificadas.
>
> Cuando una regla deje de ser correcta, deberá actualizarla o eliminarla.

Mantén este archivo breve: los detalles van en `docs/agents/`. Todo `AGENTS.md` nuevo debe iniciar con una sección `TLDR`.

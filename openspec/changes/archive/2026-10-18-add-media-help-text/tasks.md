# Tasks

## 1. Texto de ayuda en la interfaz

- [x] 1.1 Añadir `<meta name="viewport" content="width=device-width, initial-scale=1">` en el `<head>` de `index.html`; verificar que aparece en el HTML servido por `http://localhost:3000`.
- [x] 1.2 Añadir dentro del `<form>`, después de `#nombre`, `#m` y el botón, un `<p>` de ayuda con el texto: mensajes normales, URLs de imágenes (`jpg, jpeg, png, gif, webp`) y de videos (`mp4, webm, ogg`); verificar visualmente que se ve debajo del campo de mensajes.
- [x] 1.3 Añadir estilos para el texto de ayuda (color claro sobre fondo negro, fuente ≥ 12px, ajuste de línea) y ajustar `margin-bottom` de `#messages`, con `@media` para celular si hace falta; verificar en ancho de escritorio y en ~375px que el texto se lee completo y el último mensaje no queda tapado.
- [x] 1.4 Confirmar que `#nombre`, `#m`, `#messages` y el botón "Send" siguen presentes y que no se tocaron `server.js`, `libs/unalib.js`, pruebas ni dependencias; verificar con `git status` / `git diff --stat` que solo cambió `index.html` (más la documentación de esta tarea).

## 2. Verificación y documentación

- [x] 2.1 Ejecutar `npm test` y verificar **9 passing**.
- [x] 2.2 Ejecutar `npx jest tests/integration --runInBand --env=node` y verificar **4 passed**.
- [x] 2.3 Con `npm start` activo, ejecutar `npx playwright test --project=chromium --headed` y verificar **3 passed**.
- [x] 2.4 Si surge una práctica nueva y comprobada (por ejemplo sobre viewport o espacio del formulario fijo), actualizarla en `AGENTS.md` o `docs/agents/arquitectura-y-seguridad.md` en el mismo cambio; verificar que no se agregan consejos genéricos ni información temporal.

## Workflow follow-up

- Revisar el resultado y archivar el cambio con `/opsx-archive` cuando las tres suites estén en verde.

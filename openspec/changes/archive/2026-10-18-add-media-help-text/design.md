# Design

## Context

`index.html` define un `<form>` con `position: fixed; bottom: 0` sobre fondo negro, que contiene `#nombre`, `#m` y el botón. `#messages` tiene `margin-bottom: 40px` para que el formulario no tape el último mensaje. El documento no tiene `<meta name="viewport">`, por lo que en celulares se renderiza con un ancho virtual de escritorio y el texto pequeño sería ilegible. Ver `proposal.md` para la motivación.

## Goals / Non-Goals

**Goals:**
- Texto de ayuda estático debajo de los campos, legible en escritorio y celular.
- Cambio confinado a `index.html`.

**Non-Goals:**
- Tocar `server.js`, `libs/unalib.js`, Socket.IO, validaciones o pruebas.
- Rediseñar la interfaz o añadir mensajes de error por URL inválida.

## Decisions

1. **Texto estático dentro del `<form>`, después de los inputs.** Así queda "debajo del campo de mensajes", hereda el fondo negro y la posición fija, y se mantiene fuera de `#messages`. Alternativa descartada: elemento separado fijo, que exigiría coordinar dos barras fijas.
2. **Elemento `<p>` con clase propia, sin id nuevo ni listeners.** No toca `#nombre`, `#m` ni `#messages`; el contenido es texto literal del HTML, no datos de usuario, por lo que no introduce riesgo XSS.
3. **Extensiones listadas: `jpg, jpeg, png, gif, webp` y `mp4, webm, ogg`.** El servidor también acepta `bmp`, pero el cliente no lo renderiza como imagen (lo muestra como texto). La ayuda refleja solo lo que realmente se muestra; no se cambia el código para soportar `bmp`.
4. **Legibilidad:** color claro sobre fondo negro, tamaño de fuente ≥ 12px, `line-height` cómodo y ajuste de línea normal (sin `white-space: nowrap`).
5. **Espacio inferior:** aumentar `margin-bottom` de `#messages` (hoy 40px) para cubrir la altura adicional del formulario, incluido el texto en varias líneas en celular. Se hará con `@media (max-width: ...)` si hace falta más margen. La regla CSS existente se ajusta; el selector `#messages` se conserva.
6. **Viewport:** añadir `<meta name="viewport" content="width=device-width, initial-scale=1">` en `<head>`. Sin ella, la legibilidad en celular no puede garantizarse. Es el único cambio que afecta el escalado en móviles.

## Risks / Trade-offs

- [El formulario fijo crece y tapa mensajes] → Ajustar `margin-bottom` de `#messages` y revisar en ancho de celular.
- [La meta viewport cambia el escalado en móviles] → Los anchos del formulario ya son porcentuales (`#nombre` 20%, `#m` 69%, botón 10%); verificar visualmente que sigue usable.
- [Pruebas E2E dependen de `#nombre`, `#m`, botón "Send" y `#messages`] → No se modifican; se vuelven a ejecutar las tres suites.
- [Texto en español fijo] → Aceptable: la interfaz actual ya está en español/inglés mixto y no hay i18n.

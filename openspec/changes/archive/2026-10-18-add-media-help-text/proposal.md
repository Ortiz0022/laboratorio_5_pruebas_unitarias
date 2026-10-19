# Proposal

## Why

Hoy el formulario de UNA Chat no indica que se pueden enviar imágenes y videos mediante URL. Los usuarios no descubren esa función y, si pegan una URL no compatible, el mensaje se descarta sin explicación. Un texto de ayuda breve resuelve esto sin tocar la lógica del chat.

## What Changes

- Mostrar en `index.html`, debajo del campo de mensajes, un texto de ayuda corto que indique que se pueden enviar: mensajes normales, URLs de imágenes y URLs de videos compatibles.
- Añadir estilos CSS para que el texto sea legible en computadoras y celulares, sin alterar el diseño actual.
- Mantener intactos los identificadores `#nombre`, `#m` y `#messages`.
- Sin cambios en `server.js`, `libs/unalib.js`, el evento `Evento-Mensaje-Server`, las validaciones ni el renderizado seguro (`.text()` / `createTextNode`).
- Sin cambios en pruebas ni dependencias; se debe conservar el resultado 9 + 4 + 3.

## Capabilities

### New Capabilities
- `chat-media-help`: texto de ayuda visible en la interfaz que informa qué tipos de contenido acepta el chat y que se mantiene legible en pantallas de escritorio y móviles.

### Modified Capabilities
<!-- Ninguna: no existen specs principales previas y no cambia ningún requisito de validación o de mensajería. -->

## Impact

- Código afectado: solo `index.html` (marcado y CSS).
- Sin impacto en API, Socket.IO, dependencias ni seguridad.
- Documentación: si la implementación revela una práctica comprobada, se actualizará `AGENTS.md` o `docs/agents/` en el mismo cambio, según la regla de mantenimiento.

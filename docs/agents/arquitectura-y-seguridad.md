# Arquitectura y seguridad

## TLDR

- Flujo: cliente → `socket.emit('Evento-Mensaje-Server', JSON)` → `validateMessage` → `io.emit` a **todos** los clientes.
- El servidor valida; el cliente además renderiza de forma segura (defensa en profundidad).
- Rechazar > sanitizar: un mensaje inválido se devuelve con `mensaje: ''` y el cliente no lo muestra.

## Arquitectura

- [server.js](../../server.js): sirve `index.html` en `/` y reemite cada mensaje validado. Exporta `{ http, io }` para las pruebas de integración y solo llama a `listen` si `require.main === module`. No rompas ese patrón.
- [libs/unalib.js](../../libs/unalib.js): módulo CommonJS con `is_valid_phone`, `is_valid_url_image`, `is_valid_yt_video` y `validateMessage`.
- [index.html](../../index.html): envía `{ nombre, mensaje, color }` serializado y renderiza los mensajes recibidos.

## Qué hace `validateMessage` (verificable en el código y en `test/test.js`)

- Entrada no string, JSON inválido, no objeto, array o `mensaje` no string → `{"mensaje":""}`.
- `nombre`: se recorta a 30 caracteres; si no es string, está vacío o contiene `<`/`>` → `"Anonimo"`.
- `color`: solo `#RRGGBB` hexadecimal; si no, `#000000`.
- `mensaje` con `<` o `>` → se vacía (previene inyección de scripts/HTML).
- Mensaje que empieza con `http(s)://`: solo se acepta si la ruta termina en imagen (`jpg|jpeg|png|gif|webp|bmp`) o video (`mp4|webm|ogg`); se normaliza con `URL.href`.
- Mensaje con otro esquema (`javascript:`, `data:`, …) → se vacía.
- Todo se envuelve en `try/catch` y devuelve un resultado seguro ante errores.

## Prevención de XSS en el cliente

- Nombre: `$('<b>').text(...)`. Texto: `document.createTextNode(...)`. Nunca `.html()` ni `innerHTML` con datos del usuario.
- Imagen/video: se crean con `$('<img>')` / `$('<video controls>')` y `.attr('src', url.href)` solo si el protocolo es `http:` o `https:` y la extensión es permitida.
- Los mensajes vacíos se descartan en el cliente.

## Al modificar validaciones

- Cualquier extensión o esquema nuevo debe actualizarse de forma coherente en `libs/unalib.js` **y** en `index.html`.
- Agrega pruebas que cubran el caso permitido y al menos un caso rechazado.
- Conserva el uso de `new URL(...)` y la lista blanca de protocolos; no uses listas negras ni regex sobre la URL completa.

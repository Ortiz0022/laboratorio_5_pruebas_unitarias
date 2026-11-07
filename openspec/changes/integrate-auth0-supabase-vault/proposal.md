# Proposal

## Why

El laboratorio requiere autenticar UNA Chat con Auth0 y obtener el Client Secret desde Supabase Vault. El repositorio actual sirve el chat sin autenticación y no incluye los módulos de conexión indicados en la guía.

## What Changes

- Leer el secreto de Vault mediante la función SQL restringida y una conexión PostgreSQL con verificación TLS.
- Incorporar login, callback, sesión y logout de Auth0 con Client Secret (Post) y PKCE.
- Proteger la sala y las conexiones Socket.IO cuando Auth0 está configurado; mantener el modo abierto local de pruebas sin configuración Auth0.
- Exponer configuración pública sin secretos y mostrar identidad y cierre de sesión usando renderizado seguro.
- Incorporar recursos SQL, plantilla de entorno y documentación de despliegue y rotación.

## Capabilities

### New Capabilities

- `vault-client-secret`: lectura del secreto al arrancar, validación de credencial y rotación mediante reinicio.
- `chat-auth`: autenticación Auth0, sesiones, configuración pública y control de acceso HTTP y Socket.IO.

### Modified Capabilities

Ninguna. La ayuda de formatos multimedia conserva sus requisitos.

## Impact

Afecta server.js, index.html, nuevos módulos server/, SQL, documentación y pruebas nuevas. Añade únicamente las dependencias necesarias para PostgreSQL y autenticación/sesiones sin actualizar las existentes. Conserva la telemetría actual, validateMessage y la exportación { http, io }. Requiere configuración externa en Auth0, Supabase y Render; el despliegue y las capturas se realizan como pasos posteriores del laboratorio.

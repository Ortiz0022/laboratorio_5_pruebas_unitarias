# Design

## Context

Ver proposal.md para motivación. server.js exporta { http, io } y las pruebas de integración arrancan ese HTTP en un puerto aleatorio. index.html tiene cambios previos del usuario y renderizado seguro. instrument.js y otel.js cargan configuración y telemetría. No existen server/auth.js, server/vault.js ni sql/. La plantilla adjunta solo entrega recursos SQL y variables.

## Goals / Non-Goals

**Goals:** separar Vault, autenticación y transporte; conservar validateMessage, telemetría y exportaciones; permitir pruebas aisladas sin usar el .env real.

**Non-Goals:** cambiar el proveedor de identidad, refactorizar telemetría, resolver restricciones administrativas de Supabase, publicar o rotar credenciales sin completar primero la validación local.

## Decisions

- server/vault.js usará pg para ejecutar exclusivamente la función SQL restringida. TLS verificará certificado y hostname con la CA oficial del proyecto cuando sea necesaria; no usar rejectUnauthorized=false. Se limpiarán parámetros SSL de la URI antes de aplicar la configuración TLS explícita para evitar que el parser la sustituya. A diferencia del cliente Supabase HTTP, PostgreSQL respeta el rol dedicado y no requiere service_role.
- server/auth.js encapsulará configuración, rutas y sesión. Usar una biblioteca OIDC mantenida que valide firma, issuer, audience, nonce y PKCE; evitar implementar verificación de tokens manualmente. Configurar client_secret_post y URL de callback fija desde APP_BASE_URL.
- Sesiones opacas con almacenamiento en servidor y expiración, identificador aleatorio y cookies HttpOnly, SameSite=Lax y Secure en producción. Una clave de sesión aleatoria por proceso evita añadir una credencial obligatoria no incluida en la guía. El reinicio invalida sesiones: es aceptable para el laboratorio de una instancia y se documentará. No usar MemoryStore sin expiración ni introducir una infraestructura persistente para esta práctica.
- El arranque ejecutable esperará la lectura de Vault y el probe OAuth con código falso, timeout y errores redactados antes de listen. Invalid_grant valida la credencial; otros resultados inesperados bloquean el arranque. Importar el módulo conservará { http, io }; las pruebas existentes se ejecutarán con entorno aislado sin Auth0 ni exportadores externos.
- Compartir validación de sesión entre HTTP y Socket.IO, comprobarla también al enviar mensajes y desconectar sockets al cerrar sesión. No basta con proteger /sala. Mantener la validación de todo mensaje antes de reenviarlo.
- Servir una entrada con enlace de login para visitantes y la sala solo a autenticados. Mostrar nombre con textContent/.text(), conservar selectores del formulario y formatos multimedia. La configuración pública y la identidad usarán respuestas separadas sin secretos y sin caché de datos de sesión.
- Copiar recursos SQL originales sin contraseñas y una plantilla de variables sin tocar .env. Usar la confianza TLS de Node por defecto y permitir VAULT_CA_CERT_PATH con la CA oficial descargada del proyecto cuando la cadena lo requiera. La URL pública histórica del certificado devolvió 404 durante la implementación; no incorporar certificados inventados ni desactivar TLS.

## Risks / Trade-offs

- Reinicio o múltiples instancias invalidan sesiones → documentar una instancia y exigir nuevo login tras despliegue; persistencia queda para otro cambio.
- Autenticación rompe pruebas que cargan el .env real → ejecutar con configuración aislada y mocks para Vault/OIDC; nunca retirar autenticación de producción para probar.
- Pruebas E2E buscan un botón Send pero el frontend actual muestra Enviar → conservar texto visible y añadir nombre accesible compatible durante implementación; no modificar pruebas para ocultar el fallo.
- Telemetría puede capturar cabeceras o consultas → excluir rutas OAuth y datos de conexión sensibles de instrumentación automática y no registrar cuerpos de tokens.
- Conexión TLS y acceso Auth0 dependen de servicios externos → pruebas controladas de fallos y verificación local real sin imprimir credenciales.

## Migration Plan

Implementar y ejecutar las tres suites. Verificar conexión real y rutas sin cookie localmente. Configurar Render con los cuatro nombres de la guía y desplegar por el pipeline existente. Tras primer login, retirar AUTH0_CLIENT_SECRET si existe y redesplegar. Rotar Auth0, actualizar Vault, reiniciar y verificar login privado y comparación de errores OAuth sin exponer valores. No marcar estas verificaciones externas como realizadas sin evidencia. Si falla el despliegue, volver al commit anterior y mantener Vault intacto mientras se diagnostica; nunca habilitar acceso abierto como recuperación en producción.

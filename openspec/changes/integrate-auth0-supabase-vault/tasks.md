# Tasks

## 1. Acceso a Vault

- [x] 1.1 Añadir dependencias mínimas PostgreSQL/OIDC/sesiones y verificar instalación y compatibilidad con Node del pipeline, sin actualizar dependencias existentes.
- [x] 1.2 Incorporar server/vault.js con verificación TLS, consulta restringida, timeout y errores redactados; probar lectura válida, secreto ausente, fallo TLS y cierre de conexión mediante dobles controlados.
- [x] 1.3 Incorporar recursos SQL y .env.example sin valores reales y documentar CA, pooler y codificación de contraseña; verificar que coinciden con los recursos del ZIP y que .env permanece ignorado.

## 2. Autenticación y transporte

- [x] 2.1 Implementar configuración estricta y probe OAuth de arranque; probar configuración parcial, modo local, producción sin Auth0, invalid_grant, invalid_client y fallos de red sin filtrar credenciales.
- [x] 2.2 Implementar server/auth.js con OIDC mantenido, PKCE, state, nonce, Client Secret (Post), sesión expirable y logout; añadir pruebas de callback válido/inválido, expiración, cookies y revocación de sesión.
- [x] 2.3 Integrar rutas y arranque asíncrono en server.js conservando { http, io }; probar /auth/config 200, /sala 401 y /auth/login 302 sin cookie, y que el puerto no abra antes de validar Vault/Auth0.
- [x] 2.4 Proteger handshake y envío de mensajes de Socket.IO y desconectar al cerrar sesión; probar rechazo sin cookie, acceso válido, expiración y logout sin omitir validateMessage.
- [x] 2.5 Revisar instrumentación de OAuth/Vault para impedir captura de credenciales y documentar decisiones; verificar con pruebas de redacción y revisión de registros controlados.

## 3. Interfaz y operación

- [x] 3.1 Añadir entrada con login, identidad y Cerrar sesión con renderizado seguro; verificar identidad maliciosa como texto, flujo autenticado y modo local conservando selectores y accesibilidad Send de E2E.
- [x] 3.2 Documentar ejecución aislada de pruebas, sesiones de una instancia, configuración Render, rotación y evidencias en docs/; actualizar AGENTS.md solo con prácticas comprobadas durante la implementación y verificar que no se registren valores sensibles.

## 4. Verificación integral

- [x] 4.1 Ejecutar npm test y npx jest tests/integration --runInBand --env=node con entorno aislado; conservar las 9 y 4 pruebas existentes y pasar las pruebas nuevas sin modificar pruebas para esconder fallos.
- [x] 4.2 Ejecutar las 3 pruebas E2E existentes con Chromium y servidor local aislado; resolver fallos del código y registrar limitaciones externas reales si las hay.
- [x] 4.3 Verificar arranque local contra Vault/Auth0 reales y estados de rutas públicas sin cookie sin imprimir credenciales; registrar resultados reales y dejar el login interactivo al usuario si requiere su navegador.

## Workflow follow-up

- Revisar y archivar el cambio cuando la implementación y las tres suites estén completas.
- Guiar despliegue Render desde el pipeline, primer login privado y retiro de AUTH0_CLIENT_SECRET con evidencias del usuario.
- Guiar rotación Auth0/Vault, redespliegue y comparación invalid_client/invalid_grant con hora y estado HTTP, sin almacenar secretos en archivos entregables.

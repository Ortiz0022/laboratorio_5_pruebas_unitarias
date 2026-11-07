# Auth0 y Supabase Vault

## Configuración

Usar Node 20.19 o posterior; el pipeline usa Node 24. Conservar las variables de telemetría existentes y agregar las de .env.example al .env local, ignorado por Git. AUTH0_CLIENT_SECRET no se consulta ni se usa como alternativa.

- AUTH0_DOMAIN: dominio exacto sin protocolo ni ruta.
- AUTH0_CLIENT_ID: identificador público de la aplicación cuyo secreto está en Vault.
- APP_BASE_URL: http://localhost:3000 localmente; origen HTTPS público en Render.
- VAULT_DATABASE_URL: conexión PostgreSQL del rol una_chat_backend. En Session pooler usar usuario una_chat_backend.PROJECT_REF con la referencia real, host exacto del panel Connect y puerto 5432. Usar la contraseña del rol, no la de postgres. Codificar solo la contraseña con encodeURIComponent en una herramienta local. Conservar sslmode=verify-full.
- VAULT_CA_CERT_PATH: opcional, ruta al certificado público descargado desde Database Settings del proyecto si Node no confía en la cadena. Siempre se verifican certificado y hostname; no usar NODE_TLS_REJECT_UNAUTHORIZED=0.

El certificado mencionado en el laboratorio no vino en el ZIP y la descarga pública histórica devolvió 404. Obtener la CA desde el dashboard si hace falta. El pooler puede usar una cadena pública de confianza.

Los recursos originales están en sql/. Ejecutarlos en el proyecto de prueba. Nunca guardar plantillas SQL rellenadas con contraseña o secreto. La restricción administrativa PostgreSQL 17 se documenta en la bitácora, sin alterar consultas para simular MEMBER=false.

`npm start` espera a Vault y al probe de Auth0 antes de abrir el puerto. El mensaje esperado indica invalid_grant: el código falso fue rechazado con credencial válida. Invalid_client exige revisar aplicación y secreto. Se redactan los errores para evitar revelar contraseñas o conexiones.

`node scripts/check-auth.cjs` comprueba Vault, el probe real, discovery OIDC y las tres rutas sin cookie en un puerto efímero; no inicia telemetría ni muestra valores sensibles. No sustituye el login interactivo.

Sin dominio ni Client ID el modo local queda abierto para pruebas. Una configuración parcial se rechaza. NODE_ENV=production o RENDER exige Auth0 y URL HTTPS.

## Sesiones y privacidad

Sesiones en memoria, con expiración de una hora o del ID Token si vence antes y máximo de 10000 entradas. Cookies HttpOnly, SameSite=Lax y Secure en HTTPS. La sesión se regenera tras login y se borra al salir. Se valida en handshake y cada paquete Socket.IO; se desconectan sockets al salir o vencer.

Cada reinicio invalida sesiones: volver a iniciar sesión después de desplegar. Este diseño sirve al laboratorio de una instancia; varias instancias requerirían almacenamiento compartido y clave persistente.

Se usa PKCE, state, nonce y verificación criptográfica OIDC RS256. No se devuelven tokens ni secretos al navegador. El nombre se renderiza como texto. Sentry no usa integraciones automáticas que capturen OAuth/Vault y descarta request, breadcrumbs y extra. OpenTelemetry conserva spans manuales del chat sin auto-instrumentación HTTP/PG.

## Pruebas en PowerShell

Usar una terminal sin variables Auth0/OTLP exportadas y señalar la configuración vacía; no editar el .env real para probar:

```powershell
$env:DOTENV_CONFIG_PATH='tests/fixtures/empty.env'
npm test
npx jest tests/integration --runInBand --env=node
node --test tests/auth/vault-auth.test.cjs
node --test tests/auth/browser.test.cjs
```

Para E2E, iniciar `npm start` con esa configuración vacía. Si 3000 está ocupado, definir PORT=3100 para ese servidor y PLAYWRIGHT_BASE_URL=http://localhost:3100 al ejecutar:

```powershell
npx playwright test --project=chromium
```

Las pruebas nuevas usan dobles de Vault/OIDC; el login real se verifica con el navegador. Abrir otra terminal o quitar DOTENV_CONFIG_PATH para volver al .env real.

## Render y evidencias

Configurar los cuatro nombres de la guía con APP_BASE_URL HTTPS. Si se necesita la CA, incorporar únicamente el certificado público y configurar su ruta.

1. Capturar variables enmascaradas en Render.
2. Desplegar por el pipeline de master y capturar Live con commit. Verificar sin cookie /auth/config 200, /sala 401 y /auth/login 302 al dominio Auth0.
3. Iniciar sesión privada y capturar nombre y Cerrar sesión, ocultando correo si aparece.
4. Retirar AUTH0_CLIENT_SECRET de Render si existe, guardar y desplegar. Capturar variables finales y Live posterior. Volver a iniciar sesión después del reinicio; repetir /sala sin cookie: 401.
5. Rotar Auth0 y actualizar el mismo secreto en Vault con sql/06-rotar-secreto.sql. Borrar el SQL con el valor antes de capturar. Redesplegar y comprobar login privado nuevo.
6. Comparar POST /oauth/token con secretos anterior y nuevo, código vault-startup-probe y verifier de 43 a 128 caracteres. Anotar hora, estado HTTP y error reales. Se espera invalid_client anterior e invalid_grant nuevo; no capturar el cuerpo que contiene client_secret ni inventar resultados si la política del proveedor mantiene temporalmente el secreto anterior.

No marcar despliegue, login o rotación como realizados sin evidencia propia.

# Spec Delta

## Purpose

Obtener la credencial confidencial de Auth0 desde Vault sin exponerla al navegador, Git ni los registros del servidor.

## ADDED Requirements

### Requirement: Lectura segura al arrancar
El servidor SHALL obtener una credencial no vacía mediante la función restringida de Vault usando TLS con verificación del certificado cuando Auth0 esté configurado. MUST rechazar el arranque si no puede leerla y MUST NOT usar AUTH0_CLIENT_SECRET como alternativa.

#### Scenario: Lectura exitosa
- **WHEN** el backend arranca con conexión válida y el secreto configurado
- **THEN** obtiene la credencial para autenticar el canje de códigos sin imprimir su valor ni la conexión

#### Scenario: Vault no disponible
- **WHEN** falla la conexión, el certificado o la lectura del secreto
- **THEN** no habilita el servicio autenticado y reporta un error sin credenciales

### Requirement: Comprobación y rotación
El servidor SHALL comprobar la credencial al arrancar usando un código OAuth falso. MUST aceptar invalid_grant como validación de credencial y rechazar invalid_client. Tras reiniciar SHALL leer el secreto actualizado de Vault.

#### Scenario: Credencial válida
- **WHEN** Auth0 responde invalid_grant al código de prueba
- **THEN** el arranque continúa sin registrar el secreto

#### Scenario: Credencial incorrecta
- **WHEN** Auth0 responde invalid_client
- **THEN** el servidor rechaza el arranque y solicita revisar la configuración

#### Scenario: Secreto rotado
- **WHEN** Vault contiene el secreto nuevo de Auth0 y el servicio reinicia
- **THEN** los nuevos inicios de sesión usan la credencial nueva

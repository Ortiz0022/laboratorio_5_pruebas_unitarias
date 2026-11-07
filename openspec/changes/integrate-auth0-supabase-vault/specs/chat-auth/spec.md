# Spec Delta

## Purpose

Controlar el acceso a UNA Chat mediante Auth0 y mantener las credenciales confidenciales exclusivamente en el servidor.

## ADDED Requirements

### Requirement: Configuración y modos de ejecución
GET /auth/config SHALL responder 200 con enabled, dominio y Client ID sin secretos. Auth0 SHALL habilitarse con dominio e ID completos; configuración parcial MUST producir error. Sin ambos valores, el chat SHALL conservar el modo abierto local de pruebas. Producción MUST exigir autenticación.

#### Scenario: Configuración pública
- **WHEN** un cliente consulta /auth/config con Auth0 habilitado
- **THEN** recibe enabled=true y los identificadores públicos, sin credenciales ni conexión a Vault

#### Scenario: Pruebas sin Auth0
- **WHEN** un servidor local arranca sin dominio ni Client ID
- **THEN** permite las pruebas actuales de chat sin credenciales externas

### Requirement: Acceso autenticado
Con Auth0 habilitado, GET /sala SHALL devolver 401 sin sesión y GET /auth/login SHALL redirigir con 302 al dominio Auth0 configurado. El callback SHALL validar state, PKCE e identidad OIDC antes de establecer una sesión. Socket.IO MUST rechazar conexiones sin sesión válida.

#### Scenario: Cliente sin sesión
- **WHEN** un cliente sin cookie solicita /sala o conecta a Socket.IO
- **THEN** la sala responde 401 y Socket.IO rechaza la conexión

#### Scenario: Inicio de sesión válido
- **WHEN** el usuario completa Auth0 y el callback verifica la respuesta
- **THEN** accede a la sala con una sesión y puede enviar mensajes sujetos a validateMessage

#### Scenario: Callback inválido
- **WHEN** el callback recibe state, código o identidad inválidos
- **THEN** rechaza el inicio de sesión sin revelar credenciales

### Requirement: Identidad y cierre de sesión
La sala SHALL mostrar el nombre autenticado como texto y ofrecer Cerrar sesión. Las cookies SHALL usar HttpOnly y SameSite apropiado; en HTTPS SHALL usar Secure. El cierre de sesión SHALL invalidar la sesión y su acceso posterior al chat.

#### Scenario: Renderizado seguro
- **WHEN** una identidad contiene caracteres de marcado
- **THEN** su nombre se muestra como texto sin ejecutar HTML

#### Scenario: Sesión cerrada
- **WHEN** el usuario cierra sesión
- **THEN** solicitudes y mensajes posteriores con la sesión anterior no reciben acceso autenticado

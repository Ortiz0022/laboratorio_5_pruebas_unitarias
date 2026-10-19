# Spec Delta

## Purpose

Informar al usuario, desde la propia interfaz de UNA Chat, qué tipos de contenido puede enviar, y mantener esa ayuda legible en computadoras y celulares.

## ADDED Requirements

### Requirement: Texto de ayuda sobre el contenido admitido
La interfaz del chat SHALL mostrar, debajo del campo de mensajes, un texto breve que indique que se pueden enviar mensajes normales, URLs de imágenes y URLs de videos compatibles. El texto SHALL nombrar las extensiones que la interfaz puede mostrar: imágenes `jpg`, `jpeg`, `png`, `gif`, `webp` y videos `mp4`, `webm`, `ogg`.

#### Scenario: Ayuda visible al cargar la página
- **WHEN** el usuario abre UNA Chat
- **THEN** se muestra el texto de ayuda debajo del campo de mensajes sin necesidad de ninguna acción

#### Scenario: Ayuda no es un mensaje del chat
- **WHEN** el usuario envía o recibe mensajes
- **THEN** el texto de ayuda permanece fijo y no se agrega a la lista de mensajes

### Requirement: Legibilidad en distintos dispositivos
El texto de ayuda SHALL ser legible sobre su fondo y SHALL permanecer completo, sin recortarse ni tapar contenido, en pantallas de escritorio y de celular.

#### Scenario: Pantalla de celular
- **WHEN** el chat se abre en un ancho de pantalla de celular
- **THEN** el texto de ayuda se ajusta en varias líneas si es necesario y se lee completo

#### Scenario: Último mensaje no queda tapado
- **WHEN** la lista de mensajes llega al final de la página
- **THEN** el último mensaje queda visible por encima del formulario y del texto de ayuda

### Requirement: La ayuda no altera el comportamiento del chat
La incorporación del texto de ayuda MUST NOT modificar el envío y recepción de mensajes, las validaciones de seguridad, la protección contra XSS ni los elementos `#nombre`, `#m` y `#messages`.

#### Scenario: Controles existentes intactos
- **WHEN** se carga la página con el texto de ayuda
- **THEN** siguen existiendo y funcionando los elementos `#nombre`, `#m`, `#messages` y el botón "Send"

#### Scenario: Contenido peligroso sigue rechazado
- **WHEN** el usuario envía un mensaje con `<script>`
- **THEN** el mensaje no se muestra ni se ejecuta ningún script, igual que antes del cambio

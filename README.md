# Laboratorio 5 – Seguridad Informática

**Universidad Nacional de Costa Rica**  
**Ingeniería en Sistemas de Información**  
**Curso:** Seguridad Informática  
**Estudiante:** Angélica María Ortiz Barrantes

## Descripción del proyecto

Este laboratorio consistió en analizar, mejorar y probar la seguridad de **UNA Chat**, una aplicación de mensajería en tiempo real desarrollada con Node.js, Express y Socket.IO.

Inicialmente, se ejecutó la aplicación para identificar vulnerabilidades de inyección de scripts (XSS). A partir de los resultados, se realizaron mejoras en la validación de mensajes y en el manejo de contenido, incorporando también la posibilidad de visualizar imágenes y reproducir videos directamente en el chat.

Posteriormente, se implementaron pruebas automatizadas para comprobar el funcionamiento de las validaciones, la comunicación entre los componentes y el comportamiento completo de la aplicación desde el navegador.

## Funcionalidades implementadas

- **Prevención de XSS:** validación de mensajes para rechazar contenido malicioso y evitar la ejecución de scripts.
- **Visualización de imágenes:** reconocimiento de URLs de imágenes compatibles y presentación directa dentro del chat.
- **Reproducción de videos:** integración de un reproductor para archivos de video compatibles.
- **Validación de datos:** comprobación de URLs, nombres de usuario y formatos de color.
- **Mejoras de interfaz:** incorporación de un texto de ayuda para los usuarios y ajustes de visualización en computadoras y dispositivos móviles.

## Pruebas automatizadas

Se implementaron tres tipos de pruebas para verificar diferentes componentes de la aplicación.

| Tipo de prueba | Herramienta | Resultado |
|---|---|---|
| Unitarias | Mocha | 9 aprobadas |
| Integración | Jest y Socket.IO Client | 4 aprobadas |
| End-to-End | Playwright | 3 aprobadas |
| **Total** | | **16 aprobadas** |

Las pruebas unitarias verifican las funciones de validación. Las pruebas de integración comprueban la comunicación entre el servidor y la librería `una-lib` mediante Socket.IO. Finalmente, las pruebas End-to-End validan el envío de mensajes, la visualización de contenido multimedia y la prevención de inyecciones de scripts desde el navegador.

## Ejecución del proyecto

**1. Instalar las dependencias**

```bash
npm install
```

**2. Iniciar UNA Chat**

```bash
npm start
```

Abrir en el navegador: `http://localhost:3000`

**3. Ejecutar las pruebas unitarias**

```bash
npm test
```

**4. Ejecutar las pruebas de integración**

```bash
npx jest tests/integration --runInBand --env=node
```

**5. Ejecutar las pruebas End-to-End**

Con el servidor funcionando:

```bash
npx playwright test --project=chromium --headed
```

## OpenSpec y documentación

Como parte del trabajo adicional, se integró **OpenSpec** para organizar y documentar los cambios realizados en el proyecto mediante un flujo de propuesta, implementación y archivado.

Se completó el ciclo `/opsx-propose`, `/opsx-apply` y `/opsx-archive` con una mejora de interfaz que permite informar a los usuarios sobre los formatos multimedia compatibles.

También se creó un archivo `AGENTS.md` con instrucciones y buenas prácticas para futuros cambios, acompañado de documentación sobre arquitectura, seguridad, pruebas y OpenSpec. Esta documentación sigue el principio de *Progressive Disclosure* e incluye reglas para mantener actualizadas las prácticas aprendidas.

## Resultado

El laboratorio permitió identificar una vulnerabilidad XSS en la aplicación original, implementar controles para prevenirla y comprobar el funcionamiento de las mejoras mediante pruebas automatizadas.

Además, se fortaleció la experiencia de trabajo con herramientas de pruebas y documentación, manteniendo un repositorio organizado y preparado para futuras modificaciones.

---

**Laboratorio 5 – Seguridad Informática | Universidad Nacional | 2026**

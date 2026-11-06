// Inicializa Sentry antes que cualquier otro módulo.
// El DSN se lee de una variable de entorno; nunca se escribe en el código.
const Sentry = require('@sentry/node');

Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.RENDER ? 'render' : 'local',
    sendDefaultPii: false
});
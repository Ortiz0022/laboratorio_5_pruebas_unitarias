
// npm install para descargar los paquetes...

require('./server/environment');
// Sentry debe cargarse antes que los demás módulos
require('./instrument');
var Sentry = require('@sentry/node');
// OpenTelemetry para Grafana Cloud (solo activo si hay .env con OTLP)
var otel = require('./otel');

// libreriuas
var validation = require('./libs/unalib');
var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var port = process.env.PORT || 3000;
var auth = require('./server/auth').createAuth(app, io);
http.on('close', () => auth.close());

// Soporte para procesar JSON en peticiones HTTP
var express = require('express');
app.use(express.json());

// Endpoint HTTP para procesamiento de mensajes (usado en pruebas de carga como Artillery)
app.post('/api/mensaje', function (req, res) {
  var startTime = Date.now();
  var msg = req.body;

  if (!otel.tracer) {
    var validMsg = validation.validateMessage(msg);
    return res.json({ status: 'ok', data: validMsg });
  }

  otel.tracer.startActiveSpan('chat.http_message', function (span) {
    try {
      var duration;
      var textContent = (typeof msg === 'object' && msg.mensaje) ? msg.mensaje : String(msg);

      var validMsg = validation.validateMessage(msg);
      duration = Date.now() - startTime;

      if (otel.requestsCounter) otel.requestsCounter.add(1, { status: 'success' });
      if (otel.durationHistogram) otel.durationHistogram.record(duration, { status: 'success' });

      span.addEvent('log', {
        'log.severity': 'INFO',
        'log.message': 'Mensaje HTTP procesado por Artillery',
        'trace_id': span.spanContext().traceId,
        'duration_ms': duration
      });

      otel.emitLog('INFO', 'Mensaje HTTP de carga procesado exitosamente', {
        'trace_id': span.spanContext().traceId,
        'status': 'success',
        'duration_ms': duration
      });

      span.setStatus({ code: 1 });
      res.json({ status: 'ok', data: validMsg });
    } catch (err) {
      if (otel.errorsCounter) otel.errorsCounter.add(1, { status: 'error' });
      span.recordException(err);
      span.setStatus({ code: 2, message: err.message });
      res.status(500).json({ status: 'error', message: err.message });
    } finally {
      span.end();
    }
  });
});

// root: presentar html
app.get('/', auth.entry, function (req, res) {
  res.sendFile(__dirname + '/index.html');
});
app.get('/sala', auth.guard, function (req, res) {
  res.sendFile(__dirname + '/index.html');
});

// Envía a Sentry los errores no controlados de Express
Sentry.setupExpressErrorHandler(app);

// escuchar una conexion por socket
io.on('connection', function (socket) {
  socket.use((packet, next) => auth.authorizePacket(socket, next));
  // si se escucha "chat message"
  socket.on('Evento-Mensaje-Server', function (msg) {
    var startTime = Date.now();

    // Si no hay tracer activo, procesamos normalmente
    if (!otel.tracer) {
      msg = validation.validateMessage(msg);
      io.emit('Evento-Mensaje-Server', msg);
      return;
    }

    // Traza con OpenTelemetry
    otel.tracer.startActiveSpan('chat.process_message', function (span) {
      try {
        var duration;
        var textContent = (typeof msg === 'object' && msg.mensaje) ? msg.mensaje : String(msg);

        // Caso de fallo controlado para la práctica de laboratorio
        if (textContent.includes('/fallo') || textContent.includes('FALLO_CONTROLADO')) {
          if (otel.errorsCounter) otel.errorsCounter.add(1, { status: 'error' });
          if (otel.requestsCounter) otel.requestsCounter.add(1, { status: 'error' });

          span.addEvent('log', {
            'log.severity': 'ERROR',
            'log.message': 'Fallo controlado provocado por el usuario en el chat local',
            'chat.message': textContent,
            'trace_id': span.spanContext().traceId
          });

          otel.emitLog('ERROR', 'Fallo controlado provocado por el usuario en el chat local', {
            'trace_id': span.spanContext().traceId,
            'status': 'error',
            'chat.message': textContent
          });

          span.setStatus({ code: 2, message: 'Fallo controlado generado' });
          span.recordException(new Error('Fallo controlado generado en UNA Chat local'));
          span.end();

          // Respondemos al cliente con mensaje de error controlado
          io.emit('Evento-Mensaje-Server', validation.validateMessage(JSON.stringify({
            mensaje: '⚠️ [ERROR CONTROLADO] Se ha simulado un fallo del sistema para monitoreo.',
            nombre: 'Sistema'
          })));
          return;
        }

        // Caso normal exitoso
        msg = validation.validateMessage(msg);
        io.emit('Evento-Mensaje-Server', msg);

        duration = Date.now() - startTime;
        if (otel.requestsCounter) otel.requestsCounter.add(1, { status: 'success' });
        if (otel.durationHistogram) otel.durationHistogram.record(duration, { status: 'success' });

        span.addEvent('log', {
          'log.severity': 'INFO',
          'log.message': 'Mensaje de chat procesado exitosamente',
          'trace_id': span.spanContext().traceId,
          'duration_ms': duration
        });

        otel.emitLog('INFO', 'Mensaje de chat procesado exitosamente', {
          'trace_id': span.spanContext().traceId,
          'status': 'success',
          'duration_ms': duration
        });

        span.setStatus({ code: 1 }); // OK
      } catch (err) {
        if (otel.errorsCounter) otel.errorsCounter.add(1, { status: 'error' });
        otel.emitLog('ERROR', 'Error procesando mensaje: ' + err.message, {
          'trace_id': span.spanContext().traceId
        });
        span.recordException(err);
        span.setStatus({ code: 2, message: err.message });
      } finally {
        span.end();
      }
    });
  });
});

// Iniciar el servidor al ejecutar la aplicación
if (require.main === module) {
  auth.initialize().then(() => {
    http.listen(port, function () {
      console.log('listening on *:' + port);
    });
  }).catch(error => {
    console.error('[Arranque] ' + (error.message.startsWith('Auth0:') || error.message.startsWith('No se pudo') ? error.message : 'No se pudo inicializar la autenticación.'));
    auth.close();
    process.exit(1);
  });
}

// Permitir utilizar el servidor en las pruebas de integración
module.exports = { http, io };

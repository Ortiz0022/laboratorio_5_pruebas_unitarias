// otel.js
require('./server/environment');

const { NodeSDK } = require('@opentelemetry/sdk-node');
const { OTLPTraceExporter } = require('@opentelemetry/exporter-trace-otlp-http');
const { OTLPMetricExporter } = require('@opentelemetry/exporter-metrics-otlp-http');
const { OTLPLogExporter } = require('@opentelemetry/exporter-logs-otlp-http');
const { PeriodicExportingMetricReader } = require('@opentelemetry/sdk-metrics');
const { LoggerProvider, SimpleLogRecordProcessor } = require('@opentelemetry/sdk-logs');
const { resourceFromAttributes } = require('@opentelemetry/resources');
const { trace, metrics } = require('@opentelemetry/api');

const endpoint = (process.env.OTEL_EXPORTER_OTLP_ENDPOINT || '').trim();

let tracer = null;
let requestsCounter = null;
let durationHistogram = null;
let errorsCounter = null;
let logger = null;

if (endpoint) {
  const serviceName = process.env.OTEL_SERVICE_NAME || 'una-chat';
  const resource = resourceFromAttributes({
    'service.name': serviceName,
    'deployment.environment': 'local'
  });

  const gatewayUrl = endpoint.replace(/\/+$/, '');
  const authHeader = (process.env.OTEL_EXPORTER_OTLP_HEADERS || '').replace(/^Authorization=/, '').trim();

  // Exporter de logs con la URL y headers de Grafana Cloud explícitos
  const logExporter = new OTLPLogExporter({
    url: gatewayUrl.endsWith('/otlp') ? gatewayUrl + '/v1/logs' : gatewayUrl + '/otlp/v1/logs',
    headers: {
      Authorization: decodeURIComponent(authHeader)
    }
  });

  const loggerProvider = new LoggerProvider({
    resource: resource,
    processors: [new SimpleLogRecordProcessor(logExporter)]
  });
  logger = loggerProvider.getLogger(serviceName);

  const sdk = new NodeSDK({
    resource: resource,
    traceExporter: new OTLPTraceExporter(),
    metricReader: new PeriodicExportingMetricReader({
      exporter: new OTLPMetricExporter(),
      exportIntervalMillis: 2000
    })
  });

  sdk.start();
  console.log('[OTel] Telemetría OTLP conectada a Grafana Cloud: ' + endpoint);

  tracer = trace.getTracer(serviceName);
  const meter = metrics.getMeter(serviceName);

  requestsCounter = meter.createCounter('chat_requests_total', {
    description: 'Total de mensajes o peticiones procesadas por el chat'
  });

  durationHistogram = meter.createHistogram('chat_request_duration_ms', {
    description: 'Tiempo de respuesta del procesamiento de mensajes en ms',
    unit: 'ms'
  });

  errorsCounter = meter.createCounter('chat_errors_total', {
    description: 'Total de errores en el chat'
  });

  process.on('SIGTERM', () => {
    sdk.shutdown()
      .then(() => loggerProvider.shutdown())
      .finally(() => process.exit(0));
  });
}

function emitLog(severityText, body, attributes = {}) {
  if (logger) {
    logger.emit({
      severityText: severityText,
      body: body,
      attributes: {
        'deployment.environment': 'local',
        ...attributes
      }
    });
  }
}

module.exports = {
  tracer,
  requestsCounter,
  durationHistogram,
  errorsCounter,
  emitLog
};

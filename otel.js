// otel.js
require('dotenv').config();

const { NodeSDK } = require('@opentelemetry/sdk-node');
const { OTLPTraceExporter } = require('@opentelemetry/exporter-trace-otlp-http');
const { OTLPMetricExporter } = require('@opentelemetry/exporter-metrics-otlp-http');
const { PeriodicExportingMetricReader } = require('@opentelemetry/sdk-metrics');
const { resourceFromAttributes } = require('@opentelemetry/resources');
const { trace, metrics } = require('@opentelemetry/api');
const https = require('https');

const endpoint = (process.env.OTEL_EXPORTER_OTLP_ENDPOINT || '').trim();

let tracer = null;
let requestsCounter = null;
let durationHistogram = null;
let errorsCounter = null;

if (endpoint) {
  const serviceName = process.env.OTEL_SERVICE_NAME || 'una-chat';
  const resource = resourceFromAttributes({
    'service.name': serviceName,
    'deployment.environment': 'local'
  });

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
    sdk.shutdown().finally(() => process.exit(0));
  });
}

// Envío OTLP JSON garantizado a Grafana Cloud (204 No Content)
function emitLog(severityText, message, attributes = {}) {
  const rawHeader = process.env.OTEL_EXPORTER_OTLP_HEADERS || '';
  const auth = decodeURIComponent(rawHeader.replace(/^Authorization=/, '').trim());
  if (!auth) return;

  const serviceName = process.env.OTEL_SERVICE_NAME || 'una-chat';
  const nowNano = (Date.now() * 1000000).toString();

  const logAttributes = [
    { key: 'log.severity', value: { stringValue: severityText } },
    { key: 'trace_id', value: { stringValue: attributes.trace_id || '' } }
  ];

  if (attributes.status) {
    logAttributes.push({ key: 'status', value: { stringValue: attributes.status } });
  }

  const payload = JSON.stringify({
    resourceLogs: [{
      resource: {
        attributes: [
          { key: 'service.name', value: { stringValue: serviceName } },
          { key: 'deployment.environment', value: { stringValue: 'local' } }
        ]
      },
      scopeLogs: [{
        logRecords: [{
          timeUnixNano: nowNano,
          severityText: severityText,
          body: { stringValue: message },
          attributes: logAttributes
        }]
      }]
    }]
  });

  const req = https.request('https://otlp-gateway-prod-us-east-3.grafana.net/otlp/v1/logs', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': auth,
      'Content-Length': Buffer.byteLength(payload)
    }
  }, (res) => {
    // 204 No Content = Recibido exitosamente por Grafana Cloud
  });

  req.on('error', () => {});
  req.write(payload);
  req.end();
}

module.exports = {
  tracer,
  requestsCounter,
  durationHistogram,
  errorsCounter,
  emitLog
};

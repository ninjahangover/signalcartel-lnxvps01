import { NodeSDK } from '@opentelemetry/sdk-node';
import { ConsoleSpanExporter } from '@opentelemetry/sdk-trace-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { PeriodicExportingMetricReader, ConsoleMetricExporter } from '@opentelemetry/sdk-metrics';
import { OTLPTraceExporter } from '@opentelemetry/exporter-otlp-http';
import { OTLPMetricExporter } from '@opentelemetry/exporter-otlp-http';
import { Resource } from '@opentelemetry/resources';
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions';

// Environment configuration
const OTEL_EXPORTER_OTLP_ENDPOINT = process.env.OTEL_EXPORTER_OTLP_ENDPOINT || 'http://localhost:4318';
const SERVICE_NAME = 'quantum-forge-trading';
const SERVICE_VERSION = '4.0.0';
const DEPLOYMENT_ENVIRONMENT = process.env.NODE_ENV || 'production';

// Custom resource attributes for QUANTUM FORGE™
const resource = Resource.default().merge(
  new Resource({
    [SemanticResourceAttributes.SERVICE_NAME]: SERVICE_NAME,
    [SemanticResourceAttributes.SERVICE_VERSION]: SERVICE_VERSION,
    [SemanticResourceAttributes.DEPLOYMENT_ENVIRONMENT]: DEPLOYMENT_ENVIRONMENT,
    'quantum_forge.phase': 'dynamic',
    'quantum_forge.ai_systems': 'multi_layer',
    'quantum_forge.site': process.env.SITE_ID || 'main',
  })
);

// Configure trace exporter
const traceExporter = process.env.NODE_ENV === 'development' 
  ? new ConsoleSpanExporter()
  : new OTLPTraceExporter({
      url: `${OTEL_EXPORTER_OTLP_ENDPOINT}/v1/traces`,
    });

// Configure metric exporter
const metricReader = new PeriodicExportingMetricReader({
  exporter: process.env.NODE_ENV === 'development'
    ? new ConsoleMetricExporter()
    : new OTLPMetricExporter({
        url: `${OTEL_EXPORTER_OTLP_ENDPOINT}/v1/metrics`,
      }),
  exportIntervalMillis: 5000, // Export every 5 seconds
});

// Initialize the SDK
export const otelSDK = new NodeSDK({
  resource: resource,
  traceExporter: traceExporter,
  metricReader: metricReader,
  instrumentations: [
    getNodeAutoInstrumentations({
      '@opentelemetry/instrumentation-pg': {
        enhancedDatabaseReporting: true,
      },
      '@opentelemetry/instrumentation-http': {
        enabled: true,
      },
      '@opentelemetry/instrumentation-express': {
        enabled: true,
      },
      '@opentelemetry/instrumentation-fs': {
        enabled: false, // Disable file system instrumentation for performance
      },
    }),
  ],
});

// Initialize telemetry
export function initializeTelemetry(): void {
  try {
    otelSDK.start();
    console.log('📊 OpenTelemetry initialized successfully for QUANTUM FORGE™');
  } catch (error) {
    console.error('❌ Failed to initialize OpenTelemetry:', error);
  }
}

// Graceful shutdown
export function shutdownTelemetry(): Promise<void> {
  return otelSDK.shutdown();
}

// Process cleanup
process.on('SIGTERM', () => {
  shutdownTelemetry()
    .then(() => console.log('📊 OpenTelemetry terminated'))
    .catch((error) => console.log('❌ Error terminating OpenTelemetry', error))
    .finally(() => process.exit(0));
});
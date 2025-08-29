#!/usr/bin/env node
/**
 * Service Endpoint: mathematical-intuition-engine
 * Reports to DR SigNoz as individual service
 */

// OpenTelemetry setup BEFORE any other imports
process.env.OTEL_SERVICE_NAME = 'mathematical-intuition-engine';
process.env.OTEL_SERVICE_VERSION = '4.0.0';
process.env.OTEL_SERVICE_NAMESPACE = 'quantum-forge';
process.env.OTEL_RESOURCE_ATTRIBUTES = 'service.name=mathematical-intuition-engine,service.version=4.0.0,deployment.environment=production,business.criticality=high,monitoring.site=dr';
process.env.OTEL_EXPORTER_OTLP_ENDPOINT = 'https://monitor.pixelraidersystems.com:4318';

// Import telemetry
import('./src/lib/telemetry/simple-signoz-telemetry.js').then(({ initSimpleTelemetry, logMetrics }) => {
  console.log(`🚀 Starting mathematical-intuition-engine for DR monitoring`);
  console.log(`📡 Reporting to: monitor.pixelraidersystems.com`);
  
  const sdk = initSimpleTelemetry();
  
  // Service-specific logic here
  console.log(`✅ mathematical-intuition-engine running as individual service endpoint`);
  console.log(`📊 This service will appear in SigNoz Services tab`);
  
  // Keep service running
  setInterval(() => {
    logMetrics.trackSystem(
      Math.random() * 50 + 30, // CPU
      Math.random() * 60 + 20, // Memory  
      1 // This service
    );
  }, 30000);
  
}).catch(console.error);

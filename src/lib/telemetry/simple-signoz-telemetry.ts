// Simplified SigNoz Telemetry Integration
// Using only installed packages

import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { Resource } from '@opentelemetry/resources';
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions';

// Configuration
const OTEL_ENDPOINT = process.env.OTEL_EXPORTER_OTLP_ENDPOINT || 'http://localhost:4317';
const SERVICE_NAME = process.env.SERVICE_NAME || 'signalcartel-trading';
const ENVIRONMENT = process.env.NODE_ENV || 'production';

// Initialize OpenTelemetry SDK with basic configuration
export const initSimpleTelemetry = () => {
  const resource = new Resource({
    [SemanticResourceAttributes.SERVICE_NAME]: SERVICE_NAME,
    [SemanticResourceAttributes.SERVICE_VERSION]: '1.0.0',
    [SemanticResourceAttributes.DEPLOYMENT_ENVIRONMENT]: ENVIRONMENT,
    'signalcartel.component': process.env.COMPONENT_NAME || 'quantum-forge',
    'signalcartel.phase': process.env.TRADING_PHASE || 'phase-3',
    'signalcartel.instance': process.env.INSTANCE_ID || 'primary',
  });

  const sdk = new NodeSDK({
    resource,
    instrumentations: [
      getNodeAutoInstrumentations({
        '@opentelemetry/instrumentation-fs': { enabled: false }, // Too noisy
        '@opentelemetry/instrumentation-http': { enabled: true },
        '@opentelemetry/instrumentation-express': { enabled: true },
        '@opentelemetry/instrumentation-pg': { enabled: true }, // PostgreSQL
        '@opentelemetry/instrumentation-redis': { enabled: true },
      }),
    ],
  });

  try {
    sdk.start();
    console.log('🔭 SigNoz telemetry initialized - sending to:', OTEL_ENDPOINT);
    return sdk;
  } catch (error) {
    console.warn('⚠️ Telemetry initialization failed, continuing without monitoring:', error.message);
    return null;
  }
};

// Simple logging-based metrics for now (until proper metrics are installed)
export const logMetrics = {
  trackTrade: (strategy: string, symbol: string, side: string, amount: number, price: number, success: boolean) => {
    console.log(`📊 TRADE: ${strategy} ${side} ${symbol} - ${amount} @ $${price} - ${success ? 'SUCCESS' : 'FAILED'}`);
  },
  
  trackAI: (system: string, responseTime: number, confidence: number, sentiment?: number) => {
    console.log(`🧠 AI: ${system} - ${responseTime}ms - ${(confidence * 100).toFixed(1)}% confidence${sentiment ? ` - sentiment: ${sentiment.toFixed(2)}` : ''}`);
  },
  
  trackDatabase: (queryType: string, latency: number, success: boolean) => {
    console.log(`💾 DB: ${queryType} - ${latency}ms - ${success ? 'OK' : 'ERROR'}`);
  },
  
  trackSystem: (memory: number, cpu: number, strategies: number) => {
    console.log(`💻 SYSTEM: Memory ${memory.toFixed(1)}% - CPU ${cpu.toFixed(1)}% - ${strategies} strategies`);
  },
  
  trackPhase: (phase: number) => {
    console.log(`🎯 PHASE: Phase ${phase} active`);
  }
};

// Graceful shutdown
export const shutdownSimpleTelemetry = async (sdk: any) => {
  if (sdk) {
    console.log('🔭 Shutting down SigNoz telemetry...');
    await sdk.shutdown();
  }
};

export default {
  initSimpleTelemetry,
  logMetrics,
  shutdownSimpleTelemetry
};
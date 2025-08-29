// QUANTUM FORGE™ SigNoz Telemetry Integration
// Comprehensive monitoring for SignalCartel trading platform

import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { Resource } from '@opentelemetry/resources';
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions';
import { metrics } from '@opentelemetry/api';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-grpc';
import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-grpc';
import { PeriodicExportingMetricReader } from '@opentelemetry/sdk-metrics';

// Configuration
const OTEL_ENDPOINT = process.env.OTEL_EXPORTER_OTLP_ENDPOINT || 'http://localhost:4317';
const SERVICE_NAME = process.env.SERVICE_NAME || 'signalcartel-trading';
const ENVIRONMENT = process.env.NODE_ENV || 'production';

// Initialize OpenTelemetry SDK
export const initTelemetry = () => {
  const resource = new Resource({
    [SemanticResourceAttributes.SERVICE_NAME]: SERVICE_NAME,
    [SemanticResourceAttributes.SERVICE_VERSION]: '1.0.0',
    [SemanticResourceAttributes.DEPLOYMENT_ENVIRONMENT]: ENVIRONMENT,
    'signalcartel.component': process.env.COMPONENT_NAME || 'quantum-forge',
    'signalcartel.phase': process.env.TRADING_PHASE || 'phase-3',
    'signalcartel.instance': process.env.INSTANCE_ID || 'primary',
  });

  const traceExporter = new OTLPTraceExporter({
    url: OTEL_ENDPOINT,
  });

  const metricExporter = new OTLPMetricExporter({
    url: OTEL_ENDPOINT,
  });

  const metricReader = new PeriodicExportingMetricReader({
    exporter: metricExporter,
    exportIntervalMillis: 10000, // Export metrics every 10 seconds
  });

  const sdk = new NodeSDK({
    resource,
    traceExporter,
    metricReader,
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

  sdk.start();
  console.log('🔭 SigNoz telemetry initialized - sending to:', OTEL_ENDPOINT);
  
  return sdk;
};

// Business Metrics
const meter = metrics.getMeter('signalcartel-trading', '1.0.0');

// Trading Metrics
export const tradingMetrics = {
  tradesExecuted: meter.createCounter('trades_executed_total', {
    description: 'Total number of trades executed',
    unit: 'trades',
  }),
  
  tradesPerHour: meter.createHistogram('trades_per_hour', {
    description: 'Number of trades executed per hour',
    unit: 'trades/hour',
  }),
  
  winRate: meter.createHistogram('win_rate_percentage', {
    description: 'Trading win rate percentage',
    unit: '%',
  }),
  
  profitLoss: meter.createUpDownCounter('profit_loss_usd', {
    description: 'Cumulative profit/loss in USD',
    unit: 'USD',
  }),
  
  positionSize: meter.createHistogram('position_size_usd', {
    description: 'Position sizes in USD',
    unit: 'USD',
  }),
  
  currentPhase: meter.createGauge('current_trading_phase', {
    description: 'Current QUANTUM FORGE trading phase (0-4)',
  }),
};

// AI System Metrics
export const aiMetrics = {
  sentimentScore: meter.createHistogram('ai_sentiment_score', {
    description: 'Multi-source sentiment analysis score',
    unit: 'score',
  }),
  
  aiConfidence: meter.createHistogram('ai_confidence_level', {
    description: 'AI system confidence level',
    unit: '%',
  }),
  
  aiResponseTime: meter.createHistogram('ai_response_time_ms', {
    description: 'AI system response time',
    unit: 'ms',
  }),
  
  mathIntuitionAccuracy: meter.createHistogram('math_intuition_accuracy', {
    description: 'Mathematical Intuition Engine accuracy',
    unit: '%',
  }),
  
  orderBookSignals: meter.createCounter('orderbook_signals_generated', {
    description: 'Order book intelligence signals generated',
  }),
};

// Database Performance Metrics
export const dbMetrics = {
  queryLatency: meter.createHistogram('database_query_latency_ms', {
    description: 'Database query latency',
    unit: 'ms',
  }),
  
  connectionPoolSize: meter.createGauge('database_connection_pool_size', {
    description: 'Current database connection pool size',
  }),
  
  replicationLag: meter.createGauge('database_replication_lag_seconds', {
    description: 'Database replication lag in seconds',
    unit: 's',
  }),
  
  dataIngestionRate: meter.createHistogram('data_ingestion_rate', {
    description: 'Market data ingestion rate',
    unit: 'records/s',
  }),
};

// System Health Metrics
export const systemMetrics = {
  memoryUsage: meter.createGauge('system_memory_usage_percent', {
    description: 'System memory usage percentage',
    unit: '%',
  }),
  
  cpuUsage: meter.createGauge('system_cpu_usage_percent', {
    description: 'System CPU usage percentage',
    unit: '%',
  }),
  
  activeStrategies: meter.createGauge('active_strategies_count', {
    description: 'Number of active trading strategies',
  }),
  
  apiLatency: meter.createHistogram('api_latency_ms', {
    description: 'API endpoint latency',
    unit: 'ms',
  }),
};

// Helper function to track trade execution
export const trackTradeExecution = (
  strategy: string,
  symbol: string,
  side: 'buy' | 'sell',
  amount: number,
  price: number,
  success: boolean
) => {
  const attributes = {
    strategy,
    symbol,
    side,
    success: success.toString(),
  };
  
  tradingMetrics.tradesExecuted.add(1, attributes);
  tradingMetrics.positionSize.record(amount * price, attributes);
  
  console.log(`📊 Trade tracked: ${strategy} ${side} ${symbol} - $${(amount * price).toFixed(2)}`);
};

// Helper function to track AI performance
export const trackAIPerformance = (
  system: string,
  responseTime: number,
  confidence: number,
  sentiment?: number
) => {
  const attributes = { ai_system: system };
  
  aiMetrics.aiResponseTime.record(responseTime, attributes);
  aiMetrics.aiConfidence.record(confidence * 100, attributes);
  
  if (sentiment !== undefined) {
    aiMetrics.sentimentScore.record(sentiment, attributes);
  }
};

// Helper function to track database performance
export const trackDatabaseQuery = (
  queryType: string,
  latency: number,
  success: boolean
) => {
  dbMetrics.queryLatency.record(latency, {
    query_type: queryType,
    success: success.toString(),
  });
};

// Helper function to update system health
export const updateSystemHealth = (
  memoryPercent: number,
  cpuPercent: number,
  activeStrategies: number
) => {
  systemMetrics.memoryUsage.record(memoryPercent);
  systemMetrics.cpuUsage.record(cpuPercent);
  systemMetrics.activeStrategies.record(activeStrategies);
};

// Helper function to track win rate
export const updateWinRate = (strategy: string, winRate: number) => {
  tradingMetrics.winRate.record(winRate * 100, { strategy });
};

// Helper function to update profit/loss
export const updateProfitLoss = (amount: number, strategy: string) => {
  tradingMetrics.profitLoss.add(amount, { strategy });
};

// Helper function to update current phase
export const updateTradingPhase = (phase: number) => {
  tradingMetrics.currentPhase.record(phase);
  console.log(`🎯 Trading phase updated to: Phase ${phase}`);
};

// Export all metrics for use in other modules
export const telemetryMetrics = {
  trading: tradingMetrics,
  ai: aiMetrics,
  database: dbMetrics,
  system: systemMetrics,
};

// Graceful shutdown
export const shutdownTelemetry = async () => {
  console.log('🔭 Shutting down SigNoz telemetry...');
  // SDK shutdown will be handled by the NodeSDK instance
};

export default {
  initTelemetry,
  trackTradeExecution,
  trackAIPerformance,
  trackDatabaseQuery,
  updateSystemHealth,
  updateWinRate,
  updateProfitLoss,
  updateTradingPhase,
  metrics: telemetryMetrics,
  shutdown: shutdownTelemetry,
};
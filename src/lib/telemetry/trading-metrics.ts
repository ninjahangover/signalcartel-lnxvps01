import { metrics, trace } from '@opentelemetry/api';
import type { Counter, Gauge, Histogram } from '@opentelemetry/api';

// Initialize meter for QUANTUM FORGE™ trading metrics
const meter = metrics.getMeter('quantum-forge-trading', '4.0.0');
const tracer = trace.getTracer('quantum-forge-trading', '4.0.0');

// Trading Performance Metrics
export const tradingMetrics = {
  // Trade execution metrics
  tradesExecuted: meter.createCounter('quantum_forge_trades_total', {
    description: 'Total number of trades executed',
  }) as Counter,

  tradesPerMinute: meter.createCounter('quantum_forge_trades_per_minute', {
    description: 'Trading velocity measurement',
  }) as Counter,

  // P&L and position metrics
  currentPnL: meter.createGauge('quantum_forge_pnl_current', {
    description: 'Current total profit and loss',
  }) as Gauge,

  totalPnL: meter.createGauge('quantum_forge_pnl_total', {
    description: 'Total accumulated profit and loss',
  }) as Gauge,

  activePositions: meter.createGauge('quantum_forge_position_count', {
    description: 'Number of active trading positions',
  }) as Gauge,

  // Phase system metrics
  currentPhase: meter.createGauge('quantum_forge_phase_current', {
    description: 'Current QUANTUM FORGE™ phase level',
  }) as Gauge,

  phaseTransitions: meter.createCounter('quantum_forge_phase_transitions_total', {
    description: 'Total number of phase transitions',
  }) as Counter,
};

// AI System Performance Metrics
export const aiMetrics = {
  // AI confidence and accuracy
  aiConfidence: meter.createHistogram('quantum_forge_ai_confidence', {
    description: 'AI system confidence distribution',
    boundaries: [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0],
  }) as Histogram,

  mathematicalIntuitionAccuracy: meter.createHistogram('mathematical_intuition_accuracy', {
    description: 'Mathematical Intuition Engine accuracy vs traditional calculations',
    boundaries: [0.0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0],
  }) as Histogram,

  // AI layer processing times
  aiLayerDuration: meter.createHistogram('quantum_forge_ai_layer_duration', {
    description: 'AI processing time by layer',
    boundaries: [10, 50, 100, 250, 500, 1000, 2500, 5000, 10000], // milliseconds
  }) as Histogram,

  sentimentAnalysisDuration: meter.createHistogram('sentiment_analysis_duration', {
    description: 'Sentiment analysis processing time',
    boundaries: [100, 250, 500, 1000, 2000, 3000, 5000], // milliseconds
  }) as Histogram,

  orderBookAnalysisDuration: meter.createHistogram('order_book_analysis_duration', {
    description: 'Order book intelligence processing time',
    boundaries: [50, 100, 200, 500, 1000, 2000], // milliseconds
  }) as Histogram,

  // Sentiment system metrics
  sentimentSourceAvailability: meter.createGauge('sentiment_source_availability', {
    description: 'Number of active sentiment sources',
  }) as Gauge,

  sentimentConfidence: meter.createHistogram('sentiment_confidence_distribution', {
    description: 'Sentiment analysis confidence levels',
    boundaries: [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0],
  }) as Histogram,
};

// Infrastructure and System Metrics
export const systemMetrics = {
  // Database metrics
  postgresqlConnectionPoolUsage: meter.createGauge('postgresql_connection_pool_usage', {
    description: 'PostgreSQL connection pool utilization',
  }) as Gauge,

  databaseQueryDuration: meter.createHistogram('database_query_duration', {
    description: 'Database query execution time',
    boundaries: [1, 5, 10, 25, 50, 100, 250, 500, 1000, 2000], // milliseconds
  }) as Histogram,

  // GPU metrics (if available)
  gpuUtilization: meter.createGauge('gpu_cuda_utilization', {
    description: 'NVIDIA GPU usage percentage for AI processing',
  }) as Gauge,

  gpuMemoryUsage: meter.createGauge('gpu_memory_usage_bytes', {
    description: 'GPU memory usage in bytes',
  }) as Gauge,

  // Cross-site data sync metrics
  dataSyncLag: meter.createGauge('data_sync_lag_seconds', {
    description: 'Cross-site data synchronization delay',
  }) as Gauge,

  crossSiteEnhancementBoost: meter.createGauge('cross_site_enhancement_boost', {
    description: 'Performance improvement from multi-site data consolidation',
  }) as Gauge,

  // System health
  logFileSize: meter.createGauge('log_file_size_bytes', {
    description: 'Trading log file sizes',
  }) as Gauge,
};

// Utility functions for recording metrics
export class TradingTelemetry {
  // Record trade execution
  static recordTrade(symbol: string, strategy: string, signalType: string, confidence: number, pnl?: number) {
    const labels = { symbol, strategy, signal_type: signalType };
    
    tradingMetrics.tradesExecuted.add(1, labels);
    tradingMetrics.tradesPerMinute.add(1, labels);
    aiMetrics.aiConfidence.record(confidence, labels);
    
    if (pnl !== undefined) {
      tradingMetrics.currentPnL.record(pnl);
    }
  }

  // Record phase transition
  static recordPhaseTransition(fromPhase: number, toPhase: number, tradeCount: number) {
    tradingMetrics.phaseTransitions.add(1, {
      from_phase: fromPhase.toString(),
      to_phase: toPhase.toString(),
    });
    
    tradingMetrics.currentPhase.record(toPhase, {
      trade_count: tradeCount.toString(),
    });
  }

  // Record AI system performance
  static recordAIPerformance(layer: string, duration: number, accuracy?: number) {
    const labels = { layer };
    
    aiMetrics.aiLayerDuration.record(duration, labels);
    
    if (accuracy !== undefined) {
      aiMetrics.mathematicalIntuitionAccuracy.record(accuracy, labels);
    }
  }

  // Record sentiment analysis
  static recordSentimentAnalysis(sourceCount: number, confidence: number, duration: number) {
    aiMetrics.sentimentSourceAvailability.record(sourceCount);
    aiMetrics.sentimentConfidence.record(confidence);
    aiMetrics.sentimentAnalysisDuration.record(duration);
  }

  // Record database performance
  static recordDatabaseQuery(queryType: string, duration: number) {
    systemMetrics.databaseQueryDuration.record(duration, {
      query_type: queryType,
    });
  }

  // Record GPU usage (if available)
  static recordGPUMetrics(utilization: number, memoryUsage: number) {
    systemMetrics.gpuUtilization.record(utilization);
    systemMetrics.gpuMemoryUsage.record(memoryUsage);
  }

  // Record cross-site synchronization
  static recordDataSync(lagSeconds: number, enhancementBoost: number) {
    systemMetrics.dataSyncLag.record(lagSeconds);
    systemMetrics.crossSiteEnhancementBoost.record(enhancementBoost);
  }

  // Update position count
  static updatePositionCount(count: number, status: string) {
    tradingMetrics.activePositions.record(count, { status });
  }

  // Update P&L
  static updatePnL(currentPnL: number, totalPnL: number) {
    tradingMetrics.currentPnL.record(currentPnL);
    tradingMetrics.totalPnL.record(totalPnL);
  }
}

// Tracing utilities for detailed execution tracking
export class TradingTracing {
  // Create a span for trade execution
  static async executeWithTracing<T>(
    operationName: string,
    operation: (span: any) => Promise<T>,
    attributes?: Record<string, string | number>
  ): Promise<T> {
    const span = tracer.startSpan(operationName, { attributes });
    
    try {
      const result = await operation(span);
      span.setStatus({ code: trace.SpanStatusCode.OK });
      return result;
    } catch (error) {
      span.setStatus({
        code: trace.SpanStatusCode.ERROR,
        message: error instanceof Error ? error.message : 'Unknown error',
      });
      span.recordException(error as Error);
      throw error;
    } finally {
      span.end();
    }
  }

  // Create spans for AI system operations
  static createAIOperationSpan(aiSystem: string, symbol: string, operation: string) {
    return tracer.startSpan(`ai.${aiSystem}.${operation}`, {
      attributes: {
        'ai.system': aiSystem,
        'trading.symbol': symbol,
        'quantum_forge.operation': operation,
      },
    });
  }

  // Create spans for database operations
  static createDatabaseSpan(operation: string, table: string) {
    return tracer.startSpan(`db.${operation}`, {
      attributes: {
        'db.operation': operation,
        'db.table': table,
        'db.system': 'postgresql',
      },
    });
  }
}
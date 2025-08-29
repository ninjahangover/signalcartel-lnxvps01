/**
 * QUANTUM FORGE™ Trading System Telemetry
 * Business-focused telemetry for meaningful monitoring
 * Tracks actual trading workflow and business metrics
 */

const { NodeSDK } = require('@opentelemetry/sdk-node');
const { Resource } = require('@opentelemetry/resources');
const { SemanticResourceAttributes } = require('@opentelemetry/semantic-conventions');
const { OTLPTraceExporter } = require('@opentelemetry/exporter-otlp-http');
const { OTLPMetricExporter } = require('@opentelemetry/exporter-otlp-http');
const { MeterProvider, PeriodicExportingMetricReader } = require('@opentelemetry/sdk-metrics');
const { metrics, trace } = require('@opentelemetry/api');
const { getNodeAutoInstrumentations } = require('@opentelemetry/auto-instrumentations-node');

export class QuantumForgeTelemetry {
  private static instance: QuantumForgeTelemetry;
  private sdk: NodeSDK;
  private meterProvider: MeterProvider;
  private meter: any;
  
  // Business Metrics
  private tradesCounter: any;
  private winRateGauge: any;
  private portfolioValueGauge: any;
  private openPositionsGauge: any;
  private aiConfidenceHistogram: any;
  private tradingVolumeGauge: any;
  private phaseGauge: any;
  private positionManagementCounter: any;
  private dbLatencyHistogram: any;
  private sentimentConfidenceGauge: any;
  
  private constructor() {
    this.initializeTelemetry();
  }
  
  public static getInstance(): QuantumForgeTelemetry {
    if (!QuantumForgeTelemetry.instance) {
      QuantumForgeTelemetry.instance = new QuantumForgeTelemetry();
    }
    return QuantumForgeTelemetry.instance;
  }
  
  private initializeTelemetry() {
    // Configure OpenTelemetry SDK
    this.sdk = new NodeSDK({
      resource: new Resource({
        [SemanticResourceAttributes.SERVICE_NAME]: 'quantum-forge-trading-engine',
        [SemanticResourceAttributes.SERVICE_VERSION]: '4.0.0',
        [SemanticResourceAttributes.SERVICE_NAMESPACE]: 'signalcartel',
        [SemanticResourceAttributes.DEPLOYMENT_ENVIRONMENT]: 'production',
        'business.component': 'trading-core',
        'business.phase': 'Phase-3-OrderBook',
        'business.criticality': 'critical'
      }),
      
      // Trace exporter to SigNoz
      traceExporter: new OTLPTraceExporter({
        url: process.env.OTEL_EXPORTER_OTLP_ENDPOINT || 'http://localhost:4318/v1/traces'
      }),
      
      // Auto-instrumentations for common libraries
      instrumentations: [getNodeAutoInstrumentations({
        '@opentelemetry/instrumentation-fs': {
          enabled: false // Disable file system instrumentation to reduce noise
        }
      })]
    });
    
    // Metrics configuration
    const metricExporter = new OTLPMetricExporter({
      url: process.env.OTEL_EXPORTER_OTLP_ENDPOINT || 'http://localhost:4318/v1/metrics'
    });
    
    this.meterProvider = new MeterProvider({
      resource: new Resource({
        [SemanticResourceAttributes.SERVICE_NAME]: 'quantum-forge-trading-engine',
        [SemanticResourceAttributes.SERVICE_VERSION]: '4.0.0'
      }),
      readers: [
        new PeriodicExportingMetricReader({
          exporter: metricExporter,
          exportIntervalMillis: 5000 // Export metrics every 5 seconds
        })
      ]
    });
    
    metrics.setGlobalMeterProvider(this.meterProvider);
    this.meter = metrics.getMeter('quantum-forge-trading', '4.0.0');
    
    this.createBusinessMetrics();
  }
  
  private createBusinessMetrics() {
    // 1. Trading Volume - Most important business metric
    this.tradesCounter = this.meter.createCounter('quantum_forge_trades_total', {
      description: 'Total number of trades executed by QUANTUM FORGE™',
      unit: 'trades'
    });
    
    this.tradingVolumeGauge = this.meter.createObservableGauge('quantum_forge_trades_per_hour', {
      description: 'Real-time trading volume in trades per hour',
      unit: 'trades/hour'
    });
    
    // 2. Win Rate - Critical performance metric
    this.winRateGauge = this.meter.createObservableGauge('quantum_forge_win_rate_percent', {
      description: 'Current win rate percentage',
      unit: 'percent'
    });
    
    // 3. Portfolio Value - Financial performance
    this.portfolioValueGauge = this.meter.createObservableGauge('quantum_forge_portfolio_value_usd', {
      description: 'Current portfolio value in USD',
      unit: 'USD'
    });
    
    // 4. Position Management - Risk control
    this.openPositionsGauge = this.meter.createObservableGauge('quantum_forge_open_positions', {
      description: 'Number of currently open positions',
      unit: 'positions'
    });
    
    this.positionManagementCounter = this.meter.createCounter('quantum_forge_position_management_events', {
      description: 'Position management events (entry, exit, stop loss, etc.)',
      unit: 'events'
    });
    
    // 5. AI Performance Metrics
    this.aiConfidenceHistogram = this.meter.createHistogram('quantum_forge_ai_confidence', {
      description: 'AI confidence levels for trading decisions',
      unit: 'confidence_score',
      boundaries: [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0]
    });
    
    this.phaseGauge = this.meter.createObservableGauge('quantum_forge_current_phase', {
      description: 'Current QUANTUM FORGE™ intelligence phase (0-4)',
      unit: 'phase'
    });
    
    // 6. Sentiment Analysis
    this.sentimentConfidenceGauge = this.meter.createObservableGauge('quantum_forge_sentiment_confidence', {
      description: 'Multi-source sentiment analysis confidence',
      unit: 'confidence_score'
    });
    
    // 7. Database Performance
    this.dbLatencyHistogram = this.meter.createHistogram('quantum_forge_database_query_duration_seconds', {
      description: 'Database query execution time',
      unit: 's',
      boundaries: [0.001, 0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1.0, 2.5, 5.0]
    });
  }
  
  public start() {
    this.sdk.start();
    console.log('🔍 QUANTUM FORGE™ telemetry initialized - sending business metrics to SigNoz');
  }
  
  public stop() {
    return this.sdk.shutdown();
  }
  
  // Business Metric Recording Methods
  
  public recordTrade(type: 'BUY' | 'SELL', symbol: string, amount: number, confidence: number) {
    this.tradesCounter.add(1, {
      trade_type: type,
      symbol: symbol,
      strategy: 'quantum-forge'
    });
    
    this.aiConfidenceHistogram.record(confidence, {
      trade_type: type,
      symbol: symbol
    });
    
    // Create span for detailed trade tracking
    const tracer = trace.getTracer('quantum-forge-trading');
    const span = tracer.startSpan(`trade.${type.toLowerCase()}`, {
      attributes: {
        'trade.type': type,
        'trade.symbol': symbol,
        'trade.amount': amount,
        'trade.confidence': confidence,
        'business.event': 'trade_execution'
      }
    });
    
    span.end();
  }
  
  public recordPositionEvent(event: 'open' | 'close' | 'stop_loss' | 'take_profit', positionId: string, pnl?: number) {
    this.positionManagementCounter.add(1, {
      event_type: event,
      position_id: positionId
    });
    
    if (event === 'close' && pnl !== undefined) {
      // Record P&L for closed positions
      const tracer = trace.getTracer('quantum-forge-trading');
      const span = tracer.startSpan('position.close', {
        attributes: {
          'position.id': positionId,
          'position.pnl': pnl,
          'business.event': 'position_close'
        }
      });
      span.end();
    }
  }
  
  public updatePortfolioMetrics(portfolioValue: number, openPositions: number, winRate: number) {
    // These will be called by observable callbacks
    this._latestPortfolioValue = portfolioValue;
    this._latestOpenPositions = openPositions;
    this._latestWinRate = winRate;
  }
  
  public updatePhaseMetrics(currentPhase: number, tradesThisHour: number) {
    this._latestPhase = currentPhase;
    this._latestTradesPerHour = tradesThisHour;
  }
  
  public updateSentimentMetrics(confidence: number, sourceCount: number) {
    this._latestSentimentConfidence = confidence;
    this._latestSentimentSources = sourceCount;
  }
  
  public recordDatabaseQuery(operation: string, duration: number) {
    this.dbLatencyHistogram.record(duration, {
      operation: operation,
      database: 'postgresql'
    });
  }
  
  // Observable metric callbacks
  private _latestPortfolioValue: number = 0;
  private _latestOpenPositions: number = 0;
  private _latestWinRate: number = 0;
  private _latestPhase: number = 0;
  private _latestTradesPerHour: number = 0;
  private _latestSentimentConfidence: number = 0;
  private _latestSentimentSources: number = 0;
  
  private setupObservableCallbacks() {
    this.portfolioValueGauge.addCallback((result) => {
      result.observe(this._latestPortfolioValue, { currency: 'USD' });
    });
    
    this.openPositionsGauge.addCallback((result) => {
      result.observe(this._latestOpenPositions);
    });
    
    this.winRateGauge.addCallback((result) => {
      result.observe(this._latestWinRate);
    });
    
    this.phaseGauge.addCallback((result) => {
      result.observe(this._latestPhase, { 
        phase_name: `Phase-${this._latestPhase}` 
      });
    });
    
    this.tradingVolumeGauge.addCallback((result) => {
      result.observe(this._latestTradesPerHour, { 
        time_window: '1h' 
      });
    });
    
    this.sentimentConfidenceGauge.addCallback((result) => {
      result.observe(this._latestSentimentConfidence, {
        sources: this._latestSentimentSources.toString()
      });
    });
  }
  
  public initializeCallbacks() {
    this.setupObservableCallbacks();
  }
}

// Export singleton instance
export const quantumTelemetry = QuantumForgeTelemetry.getInstance();
export default quantumTelemetry;
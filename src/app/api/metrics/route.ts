import { NextRequest, NextResponse } from 'next/server';
import client from 'prom-client';

// Create a Registry to register the metrics
const register = new client.Registry();

// Add a default label which is added to all metrics
register.setDefaultLabels({
  app: 'signalcartel-website'
});

// Enable the collection of default metrics
client.collectDefaultMetrics({ register });

// Create custom metrics
const httpRequestsTotal = new client.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
});

const httpRequestDuration = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route'],
  buckets: [0.1, 0.5, 1, 2, 5],
});

const activeStrategies = new client.Gauge({
  name: 'active_strategies_total',
  help: 'Number of active trading strategies',
});

const marketDataPoints = new client.Counter({
  name: 'market_data_points_total',
  help: 'Total number of market data points collected',
  labelNames: ['symbol', 'source'],
});

const tradingSignals = new client.Counter({
  name: 'trading_signals_total',
  help: 'Total number of trading signals generated',
  labelNames: ['strategy', 'signal_type'],
});

// Register the custom metrics
register.registerMetric(httpRequestsTotal);
register.registerMetric(httpRequestDuration);
register.registerMetric(activeStrategies);
register.registerMetric(marketDataPoints);
register.registerMetric(tradingSignals);

// Update active strategies count (this would normally come from your engine)
try {
  const response = await fetch('http://localhost:3001/api/engine-status');
  const data = await response.json();
  if (data.success && data.data.detailed.system.isRunning) {
    activeStrategies.set(data.data.detailed.triggers?.length || 0);
  }
} catch (error) {
  // Silent fail - metrics endpoint should always work
}

export async function GET(request: NextRequest) {
  try {
    // Update metrics with current values
    httpRequestsTotal.inc({
      method: 'GET',
      route: '/api/metrics',
      status_code: '200'
    });

    const metrics = await register.metrics();
    
    return new NextResponse(metrics, {
      status: 200,
      headers: {
        'Content-Type': register.contentType,
      },
    });
  } catch (error) {
    console.error('Error generating metrics:', error);
    
    httpRequestsTotal.inc({
      method: 'GET',
      route: '/api/metrics',
      status_code: '500'
    });

    return new NextResponse('Error generating metrics', {
      status: 500,
    });
  }
}
#!/usr/bin/env node
// SigNoz Service Monitoring & Registration
// Automatically registers SignalCartel services and monitors their health

import axios from 'axios';

const SIGNOZ_BASE_URL = 'http://localhost:3301';
const QUERY_SERVICE_URL = 'http://localhost:8080';

// SignalCartel service definitions
const SIGNALCARTEL_SERVICES = [
  {
    serviceName: 'signalcartel-trading-engine',
    description: 'QUANTUM FORGE™ Main Trading Engine',
    endpoints: [
      { name: 'health', path: '/api/health', method: 'GET' },
      { name: 'metrics', path: '/api/metrics', method: 'GET' },
      { name: 'trade-execution', path: '/api/execute-trade', method: 'POST' }
    ],
    expectedMetrics: [
      'trades_executed_total',
      'win_rate_percentage', 
      'profit_loss_usd',
      'ai_response_time_ms',
      'database_query_latency_ms'
    ]
  },
  
  {
    serviceName: 'signalcartel-ai-systems',
    description: 'AI Performance Monitoring',
    endpoints: [
      { name: 'sentiment-analysis', path: '/api/multi-source-sentiment', method: 'GET' },
      { name: 'mathematical-intuition', path: '/api/intuition-analysis', method: 'GET' },
      { name: 'orderbook-intelligence', path: '/api/order-book', method: 'GET' }
    ],
    expectedMetrics: [
      'ai_sentiment_score',
      'ai_confidence_level', 
      'math_intuition_accuracy',
      'orderbook_signals_generated'
    ]
  },
  
  {
    serviceName: 'signalcartel-database',
    description: 'PostgreSQL Database Performance',
    endpoints: [
      { name: 'connection-test', path: '/api/quantum-forge/database-health', method: 'GET' }
    ],
    expectedMetrics: [
      'database_query_latency_ms',
      'database_connection_pool_size',
      'database_replication_lag_seconds'
    ]
  },
  
  {
    serviceName: 'signalcartel-webapp',
    description: 'Trading Dashboard & API',
    endpoints: [
      { name: 'dashboard', path: '/dashboard', method: 'GET' },
      { name: 'api-status', path: '/api/health', method: 'GET' },
      { name: 'quantum-forge-status', path: '/api/quantum-forge/status', method: 'GET' }
    ],
    expectedMetrics: [
      'api_latency_ms',
      'active_strategies_count',
      'system_memory_usage_percent',
      'system_cpu_usage_percent'
    ]
  }
];

class SignalCartelServiceMonitor {
  
  async registerServices() {
    console.log('🔧 Registering SignalCartel services with SigNoz...\n');
    
    for (const service of SIGNALCARTEL_SERVICES) {
      await this.registerService(service);
    }
  }
  
  async registerService(service: any) {
    console.log(`📋 Registering: ${service.serviceName}`);
    console.log(`   Description: ${service.description}`);
    
    // Check service health
    let healthStatus = 'unknown';
    for (const endpoint of service.endpoints) {
      if (endpoint.name === 'health') {
        healthStatus = await this.checkEndpointHealth(`http://localhost:3001${endpoint.path}`);
        break;
      }
    }
    
    console.log(`   Health: ${healthStatus}`);
    
    // Register with SigNoz via query service
    try {
      await this.sendServiceRegistration(service);
    } catch (error) {
      console.log(`   ⚠️  API registration not available, will monitor via telemetry`);
    }
    
    console.log(`   ✅ Service configured for monitoring\n`);
  }
  
  async sendServiceRegistration(service: any) {
    // This would be the ideal API call if SigNoz supports it
    // For now, we'll prepare the registration data
    const registrationData = {
      serviceName: service.serviceName,
      description: service.description,
      endpoints: service.endpoints,
      expectedMetrics: service.expectedMetrics,
      labels: {
        platform: 'signalcartel',
        environment: 'production',
        version: '1.0.0'
      }
    };
    
    // Store registration for later use
    const fs = require('fs');
    const path = require('path');
    
    const configDir = 'scripts/monitoring/signoz-configs';
    if (!fs.existsSync(configDir)) {
      fs.mkdirSync(configDir, { recursive: true });
    }
    
    const servicesFile = path.join(configDir, 'services.json');
    let services = [];
    
    if (fs.existsSync(servicesFile)) {
      services = JSON.parse(fs.readFileSync(servicesFile, 'utf8'));
    }
    
    // Add or update service
    const existingIndex = services.findIndex((s: any) => s.serviceName === service.serviceName);
    if (existingIndex >= 0) {
      services[existingIndex] = registrationData;
    } else {
      services.push(registrationData);
    }
    
    fs.writeFileSync(servicesFile, JSON.stringify(services, null, 2));
  }
  
  async checkEndpointHealth(url: string): Promise<string> {
    try {
      const response = await axios.get(url, { timeout: 5000 });
      return response.status === 200 ? '✅ healthy' : `⚠️ status ${response.status}`;
    } catch (error: any) {
      if (error.code === 'ECONNREFUSED') {
        return '❌ offline';
      }
      return '⚠️ error';
    }
  }
  
  async generateServiceQueries() {
    console.log('📊 Generating SigNoz queries for SignalCartel services...\n');
    
    const queries = {
      trading_performance: [
        {
          name: 'Trades Per Hour',
          query: 'rate(trades_executed_total[1h])',
          description: 'Trading velocity by strategy'
        },
        {
          name: 'Win Rate Trend',
          query: 'avg_over_time(win_rate_percentage[24h])',
          description: '24-hour win rate trend'
        },
        {
          name: 'Cumulative P&L',
          query: 'sum(profit_loss_usd)',
          description: 'Total profit/loss across all strategies'
        }
      ],
      
      ai_performance: [
        {
          name: 'AI Response Time P95',
          query: 'histogram_quantile(0.95, ai_response_time_ms)',
          description: '95th percentile AI system response time'
        },
        {
          name: 'AI Confidence Average',
          query: 'avg(ai_confidence_level) by (ai_system)',
          description: 'Average confidence per AI system'
        },
        {
          name: 'Sentiment Score',
          query: 'avg(ai_sentiment_score)',
          description: 'Current market sentiment score'
        }
      ],
      
      infrastructure: [
        {
          name: 'Database Latency P99',
          query: 'histogram_quantile(0.99, database_query_latency_ms)',
          description: '99th percentile database query time'
        },
        {
          name: 'System Resource Usage',
          query: 'avg(system_memory_usage_percent)',
          description: 'Average memory usage percentage'
        },
        {
          name: 'Active Strategies',
          query: 'active_strategies_count',
          description: 'Number of active trading strategies'
        }
      ],
      
      business_kpis: [
        {
          name: 'Current Phase',
          query: 'current_trading_phase',
          description: 'QUANTUM FORGE phase (0-4)'
        },
        {
          name: 'Hourly Revenue',
          query: 'rate(profit_loss_usd[1h]) * 3600',
          description: 'Revenue per hour in USD'
        },
        {
          name: 'Strategy Performance Comparison',
          query: 'avg(win_rate_percentage) by (strategy)',
          description: 'Win rate comparison by strategy'
        }
      ]
    };
    
    // Save queries for easy import
    const fs = require('fs');
    const path = require('path');
    
    const configDir = 'scripts/monitoring/signoz-configs';
    fs.writeFileSync(
      path.join(configDir, 'queries.json'), 
      JSON.stringify(queries, null, 2)
    );
    
    console.log('✅ Generated query templates saved to signoz-configs/queries.json');
    
    return queries;
  }
  
  async createServiceDashboards() {
    console.log('🎨 Creating service-specific dashboards...\n');
    
    const dashboards = {
      'quantum-forge-overview': {
        title: 'QUANTUM FORGE™ System Overview',
        description: 'Complete SignalCartel trading system monitoring',
        tags: ['signalcartel', 'overview', 'quantum-forge'],
        panels: [
          {
            title: 'Current Phase',
            type: 'stat',
            unit: 'phase',
            query: 'current_trading_phase',
            thresholds: [
              { value: 0, color: 'red' },
              { value: 2, color: 'yellow' },
              { value: 3, color: 'green' }
            ]
          },
          {
            title: 'Trading Velocity',
            type: 'graph',
            unit: 'trades/hour',
            query: 'rate(trades_executed_total[1h]) * 3600'
          },
          {
            title: 'Win Rate by Strategy',
            type: 'piechart',
            unit: 'percent',
            query: 'avg(win_rate_percentage) by (strategy)'
          },
          {
            title: 'System Health Score',
            type: 'gauge',
            unit: 'percent',
            query: '(avg(ai_confidence_level) + avg(win_rate_percentage) + (100 - avg(system_memory_usage_percent))) / 3'
          }
        ]
      },
      
      'ai-intelligence-center': {
        title: 'AI Intelligence Center',
        description: 'Multi-source AI system performance monitoring',
        tags: ['ai', 'sentiment', 'intelligence'],
        panels: [
          {
            title: 'AI System Response Times',
            type: 'graph',
            unit: 'ms',
            query: 'histogram_quantile(0.95, ai_response_time_ms) by (ai_system)'
          },
          {
            title: 'Sentiment Score Timeline',
            type: 'graph', 
            unit: 'score',
            query: 'ai_sentiment_score'
          },
          {
            title: 'Mathematical Intuition Accuracy',
            type: 'stat',
            unit: 'percent',
            query: 'avg(math_intuition_accuracy)'
          }
        ]
      },
      
      'trading-war-room': {
        title: 'Trading War Room',
        description: 'Real-time trading operations monitoring',
        tags: ['trading', 'operations', 'real-time'],
        panels: [
          {
            title: 'Live P&L',
            type: 'stat',
            unit: 'usd',
            query: 'sum(profit_loss_usd)',
            colorMode: 'value'
          },
          {
            title: 'Recent Trades',
            type: 'table',
            query: 'trades_executed_total',
            columns: ['strategy', 'symbol', 'side', 'timestamp']
          },
          {
            title: 'Position Sizes',
            type: 'histogram',
            unit: 'usd',
            query: 'histogram_quantile(0.5, position_size_usd)'
          }
        ]
      }
    };
    
    // Save dashboards
    const fs = require('fs');
    const path = require('path');
    
    const configDir = 'scripts/monitoring/signoz-configs';
    fs.writeFileSync(
      path.join(configDir, 'service-dashboards.json'), 
      JSON.stringify(dashboards, null, 2)
    );
    
    console.log('✅ Service dashboards created:');
    Object.keys(dashboards).forEach(key => {
      console.log(`   • ${dashboards[key].title}`);
    });
  }
  
  async generateHealthChecks() {
    console.log('🏥 Generating service health checks...\n');
    
    const healthChecks = SIGNALCARTEL_SERVICES.map(service => ({
      serviceName: service.serviceName,
      healthEndpoint: service.endpoints.find(e => e.name === 'health')?.path || '/health',
      expectedStatus: 200,
      timeout: 5000,
      interval: 30000, // 30 seconds
      retries: 3
    }));
    
    // Create health check script
    const healthCheckScript = `#!/usr/bin/env node
// Auto-generated health check script for SignalCartel services

const axios = require('axios');
const BASE_URL = 'http://localhost:3001';

const services = ${JSON.stringify(healthChecks, null, 2)};

async function checkServiceHealth(service) {
  try {
    const response = await axios.get(\`\${BASE_URL}\${service.healthEndpoint}\`, {
      timeout: service.timeout
    });
    
    return {
      service: service.serviceName,
      status: response.status === service.expectedStatus ? 'healthy' : 'degraded',
      responseTime: Date.now() - startTime,
      details: response.data
    };
  } catch (error) {
    return {
      service: service.serviceName,
      status: 'unhealthy',
      error: error.message
    };
  }
}

async function runHealthChecks() {
  console.log('🏥 SignalCartel Service Health Check');
  console.log('=====================================');
  
  const results = await Promise.all(services.map(checkServiceHealth));
  
  results.forEach(result => {
    const icon = result.status === 'healthy' ? '✅' : '❌';
    console.log(\`\${icon} \${result.service}: \${result.status}\`);
    if (result.responseTime) {
      console.log(\`   Response time: \${result.responseTime}ms\`);
    }
    if (result.error) {
      console.log(\`   Error: \${result.error}\`);
    }
  });
  
  const healthyCount = results.filter(r => r.status === 'healthy').length;
  console.log(\`\\n📊 Overall Health: \${healthyCount}/\${results.length} services healthy\`);
}

if (require.main === module) {
  runHealthChecks().catch(console.error);
}

module.exports = { runHealthChecks };`;
    
    const fs = require('fs');
    const path = require('path');
    
    fs.writeFileSync('scripts/monitoring/health-check-services.js', healthCheckScript);
    fs.chmodSync('scripts/monitoring/health-check-services.js', '755');
    
    console.log('✅ Health check script created: scripts/monitoring/health-check-services.js');
  }
}

async function main() {
  console.log('🚀 SignalCartel Service Monitoring Setup via SigNoz API\n');
  
  const monitor = new SignalCartelServiceMonitor();
  
  try {
    await monitor.registerServices();
    await monitor.generateServiceQueries();
    await monitor.createServiceDashboards();
    await monitor.generateHealthChecks();
    
    console.log('\n' + '═'.repeat(70));
    console.log('🎉 SignalCartel Service Monitoring Setup Complete!');
    console.log('═'.repeat(70));
    console.log('📁 Configuration files created in: scripts/monitoring/signoz-configs/');
    console.log('🏥 Health check script: scripts/monitoring/health-check-services.js');
    console.log('\n💡 Next Steps:');
    console.log('1. Import dashboards to SigNoz: http://localhost:3301');
    console.log('2. Set up alerts using the provided configurations');
    console.log('3. Run health checks: node scripts/monitoring/health-check-services.js');
    console.log('4. Start SignalCartel with telemetry enabled');
    console.log('═'.repeat(70));
    
  } catch (error) {
    console.error('❌ Setup failed:', error);
  }
}

main().catch(console.error);
#!/usr/bin/env node
/**
 * Create Meaningful Service Monitoring for QUANTUM FORGE™
 * Each service gets specific business metrics and alerts that matter
 */

import { PrismaClient } from '@prisma/client';

interface ServiceMonitoringConfig {
  serviceName: string;
  description: string;
  keyMetrics: string[];
  businessAlerts: AlertConfig[];
  healthChecks: HealthCheck[];
  dashboardPanels: DashboardPanel[];
}

interface AlertConfig {
  name: string;
  condition: string;
  severity: 'critical' | 'high' | 'medium';
  description: string;
  businessImpact: string;
}

interface HealthCheck {
  name: string;
  endpoint: string;
  expectedResponse: string;
  frequency: string;
}

interface DashboardPanel {
  title: string;
  type: 'graph' | 'stat' | 'table';
  query: string;
  description: string;
}

class ServiceMonitoringSetup {
  private prisma: PrismaClient;
  private monitoringConfigs: ServiceMonitoringConfig[] = [];

  constructor() {
    this.prisma = new PrismaClient();
    this.setupServiceConfigurations();
  }

  private setupServiceConfigurations() {
    // 1. Trading Engine - Core Business Logic
    this.monitoringConfigs.push({
      serviceName: 'quantum-forge-trading-engine',
      description: 'Main trading execution engine - monitors actual trading performance',
      keyMetrics: [
        'trades_per_hour',
        'win_rate_percentage',
        'current_phase',
        'strategy_success_rate',
        'avg_trade_execution_time_ms'
      ],
      businessAlerts: [
        {
          name: 'TradingVolumeDropped',
          condition: 'trades_per_hour < 50',
          severity: 'critical',
          description: 'Trading volume fell below 50 trades/hour',
          businessImpact: 'Revenue generation stopped - immediate attention required'
        },
        {
          name: 'WinRateBelowThreshold',
          condition: 'win_rate_percentage < 45',
          severity: 'high',
          description: 'Win rate dropped below 45%',
          businessImpact: 'Trading strategy performance degraded - may result in losses'
        },
        {
          name: 'PhaseDowngrade',
          condition: 'current_phase < 3',
          severity: 'medium',
          description: 'Trading phase downgraded from Phase 3',
          businessImpact: 'AI features reduced - trading efficiency may decrease'
        }
      ],
      healthChecks: [
        {
          name: 'TradingEngineHealth',
          endpoint: '/health/trading',
          expectedResponse: '{"status":"healthy","phase":3,"strategies_active":3}',
          frequency: '30s'
        }
      ],
      dashboardPanels: [
        {
          title: 'Trading Volume (Trades/Hour)',
          type: 'stat',
          query: 'avg(quantum_forge_trading_engine_trades_per_hour)',
          description: 'Current trading velocity - target: 100+ trades/hour'
        },
        {
          title: 'Win Rate Trend',
          type: 'graph',
          query: 'quantum_forge_trading_engine_win_rate_percentage',
          description: 'Trading success rate over time - target: >50%'
        },
        {
          title: 'Phase Status',
          type: 'stat',
          query: 'quantum_forge_trading_engine_current_phase',
          description: 'Current QUANTUM FORGE intelligence phase'
        }
      ]
    });

    // 2. Position Management - Risk Control
    this.monitoringConfigs.push({
      serviceName: 'position-management-service',
      description: 'Position lifecycle and risk management - critical for P&L protection',
      keyMetrics: [
        'open_positions_count',
        'positions_closed_today',
        'stop_loss_triggered_count',
        'take_profit_hit_count',
        'avg_position_hold_time_minutes',
        'total_realized_pnl'
      ],
      businessAlerts: [
        {
          name: 'TooManyOpenPositions',
          condition: 'open_positions_count > 100',
          severity: 'critical',
          description: 'Excessive open positions detected',
          businessImpact: 'Risk exposure too high - may exceed risk tolerance'
        },
        {
          name: 'StopLossFailure',
          condition: 'rate(stop_loss_triggered_count[5m]) == 0 AND open_positions_count > 10',
          severity: 'critical',
          description: 'Stop losses not triggering despite open positions',
          businessImpact: 'Risk management system may have failed - potential for major losses'
        },
        {
          name: 'NegativePnLTrend',
          condition: 'total_realized_pnl < -1000',
          severity: 'high',
          description: 'Realized P&L is significantly negative',
          businessImpact: 'Trading strategy losing money - review required'
        }
      ],
      healthChecks: [
        {
          name: 'PositionManagementHealth',
          endpoint: '/health/positions',
          expectedResponse: '{"status":"healthy","open_positions":25,"risk_level":"normal"}',
          frequency: '30s'
        }
      ],
      dashboardPanels: [
        {
          title: 'Open Positions',
          type: 'stat',
          query: 'quantum_forge_position_management_service_open_positions_count',
          description: 'Currently active trading positions'
        },
        {
          title: 'Risk Management Events',
          type: 'graph',
          query: 'rate(quantum_forge_position_management_service_stop_loss_triggered_count[1h])',
          description: 'Stop loss and take profit activity'
        },
        {
          title: 'Realized P&L',
          type: 'stat',
          query: 'quantum_forge_position_management_service_total_realized_pnl',
          description: 'Total profit/loss from closed positions'
        }
      ]
    });

    // 3. Mathematical Intuition Engine - AI Performance
    this.monitoringConfigs.push({
      serviceName: 'mathematical-intuition-engine',
      description: 'AI analysis engine - monitors decision quality and processing speed',
      keyMetrics: [
        'analyses_completed_count',
        'avg_confidence_score',
        'pattern_recognition_accuracy',
        'flow_field_resonance_score',
        'analysis_processing_time_ms'
      ],
      businessAlerts: [
        {
          name: 'LowAIConfidence',
          condition: 'avg_confidence_score < 0.6',
          severity: 'high',
          description: 'AI confidence dropped below 60%',
          businessImpact: 'Trading decisions may be unreliable - strategy review needed'
        },
        {
          name: 'SlowAIProcessing',
          condition: 'analysis_processing_time_ms > 5000',
          severity: 'medium',
          description: 'AI analysis taking too long',
          businessImpact: 'Trading decisions delayed - may miss market opportunities'
        },
        {
          name: 'AISystemStalled',
          condition: 'rate(analyses_completed_count[5m]) == 0',
          severity: 'critical',
          description: 'Mathematical Intuition Engine stopped processing',
          businessImpact: 'AI trading assistance offline - switch to manual mode'
        }
      ],
      healthChecks: [
        {
          name: 'AIEngineHealth',
          endpoint: '/health/intuition',
          expectedResponse: '{"status":"healthy","confidence":0.85,"processing_queue":2}',
          frequency: '60s'
        }
      ],
      dashboardPanels: [
        {
          title: 'AI Confidence Level',
          type: 'stat',
          query: 'quantum_forge_mathematical_intuition_engine_avg_confidence_score',
          description: 'Current AI decision confidence - target: >70%'
        },
        {
          title: 'Analysis Processing Time',
          type: 'graph',
          query: 'quantum_forge_mathematical_intuition_engine_analysis_processing_time_ms',
          description: 'AI response time trend'
        },
        {
          title: 'Pattern Recognition Accuracy',
          type: 'stat',
          query: 'quantum_forge_mathematical_intuition_engine_pattern_recognition_accuracy',
          description: 'AI pattern detection success rate'
        }
      ]
    });

    // 4. Multi-Source Sentiment Engine - Market Intelligence
    this.monitoringConfigs.push({
      serviceName: 'multi-source-sentiment-engine',
      description: 'Market sentiment analysis - monitors data quality and source reliability',
      keyMetrics: [
        'active_sources_count',
        'sentiment_analyses_count',
        'avg_sentiment_confidence',
        'api_response_time_ms',
        'source_failure_count',
        'data_freshness_minutes'
      ],
      businessAlerts: [
        {
          name: 'SentimentSourcesDown',
          condition: 'active_sources_count < 6',
          severity: 'high',
          description: 'Too many sentiment sources offline',
          businessImpact: 'Market intelligence compromised - trading decisions less informed'
        },
        {
          name: 'StaleMarketData',
          condition: 'data_freshness_minutes > 10',
          severity: 'medium',
          description: 'Market sentiment data is stale',
          businessImpact: 'Trading on outdated market conditions'
        },
        {
          name: 'HighAPILatency',
          condition: 'api_response_time_ms > 10000',
          severity: 'medium',
          description: 'Sentiment API responses are slow',
          businessImpact: 'Delayed market analysis - may miss rapid market changes'
        }
      ],
      healthChecks: [
        {
          name: 'SentimentEngineHealth',
          endpoint: '/health/sentiment',
          expectedResponse: '{"status":"healthy","active_sources":10,"last_update":"2025-08-29T05:35:00Z"}',
          frequency: '60s'
        }
      ],
      dashboardPanels: [
        {
          title: 'Active Sentiment Sources',
          type: 'stat',
          query: 'quantum_forge_multi_source_sentiment_engine_active_sources_count',
          description: 'Number of working sentiment data sources'
        },
        {
          title: 'Sentiment Analysis Rate',
          type: 'graph',
          query: 'rate(quantum_forge_multi_source_sentiment_engine_sentiment_analyses_count[1h])',
          description: 'Market sentiment analysis frequency'
        },
        {
          title: 'Source Response Times',
          type: 'graph',
          query: 'quantum_forge_multi_source_sentiment_engine_api_response_time_ms',
          description: 'API latency for sentiment sources'
        }
      ]
    });

    // 5. Database Monitoring - Data Layer Performance
    this.monitoringConfigs.push({
      serviceName: 'signalcartel-postgresql-primary',
      description: 'Primary database - monitors query performance and data integrity',
      keyMetrics: [
        'total_trades_count',
        'query_latency_p99_ms',
        'active_connections_count',
        'database_size_mb',
        'deadlock_count',
        'backup_age_hours'
      ],
      businessAlerts: [
        {
          name: 'DatabaseHighLatency',
          condition: 'query_latency_p99_ms > 1000',
          severity: 'critical',
          description: 'Database queries are very slow',
          businessImpact: 'Trading system performance severely degraded'
        },
        {
          name: 'TooManyConnections',
          condition: 'active_connections_count > 90',
          severity: 'high',
          description: 'Database connection pool nearly exhausted',
          businessImpact: 'New trades may fail to record - data loss risk'
        },
        {
          name: 'DatabaseDeadlocks',
          condition: 'rate(deadlock_count[5m]) > 5',
          severity: 'high',
          description: 'High number of database deadlocks',
          businessImpact: 'Trading operations may fail or be delayed'
        }
      ],
      healthChecks: [
        {
          name: 'DatabaseHealth',
          endpoint: '/health/database',
          expectedResponse: '{"status":"healthy","connections":15,"latency_ms":25}',
          frequency: '30s'
        }
      ],
      dashboardPanels: [
        {
          title: 'Query Performance (P99)',
          type: 'graph',
          query: 'quantum_forge_signalcartel_postgresql_primary_query_latency_p99_ms',
          description: '99th percentile query response time'
        },
        {
          title: 'Active Connections',
          type: 'stat',
          query: 'quantum_forge_signalcartel_postgresql_primary_active_connections_count',
          description: 'Current database connections'
        },
        {
          title: 'Total Trades Stored',
          type: 'stat',
          query: 'quantum_forge_signalcartel_postgresql_primary_total_trades_count',
          description: 'Complete trading history in database'
        }
      ]
    });
  }

  async generateMonitoringDocumentation() {
    console.log('📊 QUANTUM FORGE™ Service Monitoring Guide');
    console.log('==========================================');
    console.log('');

    for (const config of this.monitoringConfigs) {
      console.log(`🎯 ${config.serviceName.toUpperCase()}`);
      console.log(`📝 ${config.description}`);
      console.log('');

      console.log('📈 Key Business Metrics:');
      config.keyMetrics.forEach(metric => {
        console.log(`  • ${metric}`);
      });
      console.log('');

      console.log('🚨 Critical Alerts:');
      config.businessAlerts.forEach(alert => {
        console.log(`  • ${alert.name} (${alert.severity.toUpperCase()})`);
        console.log(`    Condition: ${alert.condition}`);
        console.log(`    Impact: ${alert.businessImpact}`);
      });
      console.log('');

      console.log('📊 Dashboard Panels:');
      config.dashboardPanels.forEach(panel => {
        console.log(`  • ${panel.title} (${panel.type})`);
        console.log(`    Query: ${panel.query}`);
        console.log(`    Purpose: ${panel.description}`);
      });
      console.log('');
      console.log('─'.repeat(80));
      console.log('');
    }

    // Generate SigNoz Dashboard JSON
    await this.generateSigNozDashboards();
    
    // Generate Alert Rules
    await this.generateAlertRules();
    
    // Generate Health Check Endpoints
    await this.generateHealthCheckSetup();
  }

  private async generateSigNozDashboards() {
    console.log('📊 Generating SigNoz Dashboard Configurations...');
    
    for (const config of this.monitoringConfigs) {
      const dashboardConfig = {
        title: `${config.serviceName} Business Metrics`,
        description: config.description,
        tags: ['quantum-forge', 'business-metrics', config.serviceName],
        panels: config.dashboardPanels.map(panel => ({
          title: panel.title,
          type: panel.type,
          targets: [{
            queryType: 'metrics',
            query: panel.query,
            legend: panel.title
          }],
          description: panel.description
        }))
      };

      // Save dashboard config to file
      require('fs').writeFileSync(
        `/tmp/dashboard-${config.serviceName}.json`,
        JSON.stringify(dashboardConfig, null, 2)
      );
      
      console.log(`✅ Dashboard config saved: /tmp/dashboard-${config.serviceName}.json`);
    }
  }

  private async generateAlertRules() {
    console.log('🚨 Generating Alert Rule Configurations...');
    
    const allAlerts = this.monitoringConfigs.flatMap(config => 
      config.businessAlerts.map(alert => ({
        serviceName: config.serviceName,
        ...alert
      }))
    );

    const alertConfig = {
      groups: [{
        name: 'quantum-forge-business-alerts',
        rules: allAlerts.map(alert => ({
          alert: alert.name,
          expr: alert.condition,
          for: alert.severity === 'critical' ? '1m' : '3m',
          labels: {
            severity: alert.severity,
            service: alert.serviceName,
            business_impact: 'high'
          },
          annotations: {
            summary: alert.description,
            business_impact: alert.businessImpact,
            runbook_url: `https://docs.signalcartel.io/alerts/${alert.name}`
          }
        }))
      }]
    };

    require('fs').writeFileSync('/tmp/alert-rules.json', JSON.stringify(alertConfig, null, 2));
    console.log('✅ Alert rules saved: /tmp/alert-rules.json');
  }

  private async generateHealthCheckSetup() {
    console.log('🏥 Generating Health Check Setup...');
    
    const healthChecks = this.monitoringConfigs.flatMap(config => 
      config.healthChecks.map(check => ({
        service: config.serviceName,
        ...check
      }))
    );

    console.log('📋 Health Check Endpoints to Implement:');
    healthChecks.forEach(check => {
      console.log(`  • ${check.service}${check.endpoint}`);
      console.log(`    Expected: ${check.expectedResponse}`);
      console.log(`    Frequency: ${check.frequency}`);
    });

    require('fs').writeFileSync('/tmp/health-checks.json', JSON.stringify(healthChecks, null, 2));
    console.log('✅ Health check config saved: /tmp/health-checks.json');
  }

  async showNextSteps() {
    console.log('');
    console.log('🎯 NEXT STEPS FOR MEANINGFUL MONITORING:');
    console.log('');
    console.log('1️⃣  Import Dashboards to SigNoz:');
    console.log('   • Go to monitor.pixelraidersystems.com');
    console.log('   • Import dashboard JSONs from /tmp/dashboard-*.json');
    console.log('');
    console.log('2️⃣  Set Up Alert Rules:');
    console.log('   • Import /tmp/alert-rules.json to SigNoz');
    console.log('   • Configure notification channels (Slack, email)');
    console.log('');
    console.log('3️⃣  Implement Health Check Endpoints:');
    console.log('   • Add health check endpoints to each service');
    console.log('   • Use /tmp/health-checks.json as reference');
    console.log('');
    console.log('4️⃣  Monitor Key Business Metrics:');
    console.log('   • Trading Volume: Should maintain 100+ trades/hour');
    console.log('   • Win Rate: Target >50%, alert if <45%');
    console.log('   • AI Confidence: Target >70%, alert if <60%');
    console.log('   • Database Latency: Target <100ms, alert if >1000ms');
    console.log('   • Position Risk: Alert if >100 open positions');
    console.log('');
    console.log('🎪 Your monitoring setup is now business-focused rather than generic!');
  }
}

// Generate meaningful service monitoring
const monitoring = new ServiceMonitoringSetup();

monitoring.generateMonitoringDocumentation().then(async () => {
  await monitoring.showNextSteps();
}).catch(console.error);
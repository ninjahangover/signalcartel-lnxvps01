#!/usr/bin/env node
// SigNoz API-Based Setup for SignalCartel
// Automatically configure services, dashboards, and alerts via API

import axios from 'axios';

const SIGNOZ_BASE_URL = 'http://localhost:3301';
const API_BASE = `${SIGNOZ_BASE_URL}/api/v1`;

// Configuration
const SIGNALCARTEL_CONFIG = {
  service: {
    name: 'signalcartel-trading',
    version: '1.0.0',
    environment: 'production'
  },
  credentials: {
    email: 'gaylen@signalcartel.io',
    password: 'admin123'
  }
};

interface SigNozAPI {
  authenticate(): Promise<string>;
  createDashboard(dashboard: any): Promise<any>;
  createAlert(alert: any): Promise<any>;
  getServices(): Promise<any>;
  getMetrics(): Promise<any>;
}

class SigNozSetup implements SigNozAPI {
  private authToken?: string;
  
  async authenticate(): Promise<string> {
    try {
      console.log('🔐 Authenticating with SigNoz...');
      
      // Try to get auth token
      const loginResponse = await axios.post(`${API_BASE}/login`, {
        email: SIGNALCARTEL_CONFIG.credentials.email,
        password: SIGNALCARTEL_CONFIG.credentials.password
      });
      
      this.authToken = loginResponse.data.token;
      console.log('✅ Authentication successful');
      return this.authToken;
      
    } catch (error: any) {
      console.log('⚠️  Authentication failed, trying alternative methods...');
      
      // Check if we can access without auth for basic operations
      try {
        const healthCheck = await axios.get(`${API_BASE}/health`);
        console.log('✅ SigNoz health check passed');
        return 'no-auth';
      } catch (healthError) {
        throw new Error(`Cannot connect to SigNoz: ${error.message}`);
      }
    }
  }
  
  private getHeaders() {
    return this.authToken && this.authToken !== 'no-auth' 
      ? { Authorization: `Bearer ${this.authToken}` }
      : {};
  }
  
  async getServices(): Promise<any> {
    try {
      const response = await axios.get(`${API_BASE}/services`, {
        headers: this.getHeaders()
      });
      return response.data;
    } catch (error: any) {
      console.log('📝 Services endpoint requires auth - will configure via alternative method');
      return null;
    }
  }
  
  async getMetrics(): Promise<any> {
    try {
      const response = await axios.get(`${API_BASE}/metrics`, {
        headers: this.getHeaders()
      });
      return response.data;
    } catch (error: any) {
      console.log('📝 Metrics endpoint requires auth - will configure via alternative method');
      return null;
    }
  }
  
  async createDashboard(dashboard: any): Promise<any> {
    try {
      const response = await axios.post(`${API_BASE}/dashboards`, dashboard, {
        headers: this.getHeaders()
      });
      console.log(`✅ Dashboard created: ${dashboard.title}`);
      return response.data;
    } catch (error: any) {
      console.log(`❌ Failed to create dashboard ${dashboard.title}:`, error.response?.data?.error || error.message);
      return null;
    }
  }
  
  async createAlert(alert: any): Promise<any> {
    try {
      const response = await axios.post(`${API_BASE}/rules`, alert, {
        headers: this.getHeaders()
      });
      console.log(`✅ Alert created: ${alert.alert}`);
      return response.data;
    } catch (error: any) {
      console.log(`❌ Failed to create alert ${alert.alert}:`, error.response?.data?.error || error.message);
      return null;
    }
  }
  
  // Alternative setup methods when API requires manual setup
  generateDashboardJSON() {
    return {
      quantumForgeTradingDashboard: {
        title: "QUANTUM FORGE™ Trading Performance",
        tags: ["trading", "signalcartel"],
        panels: [
          {
            title: "Trades Per Hour",
            type: "graph",
            targets: [
              {
                expr: "rate(trades_executed_total[1h])",
                legendFormat: "{{strategy}}"
              }
            ]
          },
          {
            title: "Win Rate %",
            type: "stat",
            targets: [
              {
                expr: "avg(win_rate_percentage)",
                legendFormat: "Win Rate"
              }
            ]
          },
          {
            title: "P&L by Strategy",
            type: "bargauge",
            targets: [
              {
                expr: "sum(profit_loss_usd) by (strategy)",
                legendFormat: "{{strategy}}"
              }
            ]
          }
        ]
      },
      
      aiSystemsDashboard: {
        title: "AI Systems Performance",
        tags: ["ai", "signalcartel"],
        panels: [
          {
            title: "AI Response Times",
            type: "graph",
            targets: [
              {
                expr: "histogram_quantile(0.95, ai_response_time_ms)",
                legendFormat: "{{ai_system}}"
              }
            ]
          },
          {
            title: "AI Confidence Levels",
            type: "gauge",
            targets: [
              {
                expr: "avg(ai_confidence_level) by (ai_system)",
                legendFormat: "{{ai_system}}"
              }
            ]
          }
        ]
      },
      
      infrastructureDashboard: {
        title: "Infrastructure Health",
        tags: ["infrastructure", "signalcartel"],
        panels: [
          {
            title: "Database Latency",
            type: "graph",
            targets: [
              {
                expr: "histogram_quantile(0.99, database_query_latency_ms)",
                legendFormat: "{{query_type}}"
              }
            ]
          },
          {
            title: "System Resources",
            type: "graph",
            targets: [
              {
                expr: "system_memory_usage_percent",
                legendFormat: "Memory %"
              },
              {
                expr: "system_cpu_usage_percent", 
                legendFormat: "CPU %"
              }
            ]
          }
        ]
      }
    };
  }
  
  generateAlertsJSON() {
    return [
      {
        alert: "Low Trading Volume",
        expr: "rate(trades_executed_total[10m]) < 2",
        for: "10m",
        labels: {
          severity: "critical",
          service: "signalcartel-trading"
        },
        annotations: {
          summary: "Trading volume dropped below 2 trades per 10 minutes",
          description: "The QUANTUM FORGE trading system has low activity"
        }
      },
      
      {
        alert: "High Database Latency",
        expr: "histogram_quantile(0.95, database_query_latency_ms) > 1000",
        for: "5m",
        labels: {
          severity: "high",
          service: "signalcartel-trading"
        },
        annotations: {
          summary: "Database queries taking > 1 second",
          description: "SignalCartel database performance degraded"
        }
      },
      
      {
        alert: "AI System Degraded",
        expr: "histogram_quantile(0.95, ai_response_time_ms) > 2000",
        for: "5m",
        labels: {
          severity: "high", 
          service: "signalcartel-trading"
        },
        annotations: {
          summary: "AI systems responding slowly",
          description: "QUANTUM FORGE AI performance degraded"
        }
      },
      
      {
        alert: "Win Rate Below Target",
        expr: "avg(win_rate_percentage) < 60",
        for: "30m",
        labels: {
          severity: "high",
          service: "signalcartel-trading"
        },
        annotations: {
          summary: "Trading win rate dropped below 60%",
          description: "SignalCartel win rate below target threshold"
        }
      },
      
      {
        alert: "High Memory Usage",
        expr: "system_memory_usage_percent > 85",
        for: "15m",
        labels: {
          severity: "medium",
          service: "signalcartel-trading"
        },
        annotations: {
          summary: "System memory usage above 85%",
          description: "SignalCartel server memory pressure"
        }
      }
    ];
  }
}

async function setupSignalCartelMonitoring() {
  console.log('🚀 Setting up SignalCartel monitoring via SigNoz API...\n');
  
  const signoz = new SigNozSetup();
  
  try {
    // Step 1: Authenticate
    await signoz.authenticate();
    
    // Step 2: Check existing services
    console.log('\n📋 Checking existing services...');
    const services = await signoz.getServices();
    
    if (services) {
      console.log('✅ Found services:', services.length || 0);
    }
    
    // Step 3: Try to create dashboards via API
    console.log('\n📊 Creating dashboards...');
    const dashboards = signoz.generateDashboardJSON();
    
    for (const [key, dashboard] of Object.entries(dashboards)) {
      await signoz.createDashboard(dashboard);
    }
    
    // Step 4: Try to create alerts via API
    console.log('\n🚨 Creating alerts...');
    const alerts = signoz.generateAlertsJSON();
    
    for (const alert of alerts) {
      await signoz.createAlert(alert);
    }
    
    // Step 5: Generate manual setup files if API doesn't work
    console.log('\n📝 Generating configuration files for manual import...');
    
    // Save dashboard configurations
    const fs = require('fs');
    const path = require('path');
    
    const configDir = 'scripts/monitoring/signoz-configs';
    if (!fs.existsSync(configDir)) {
      fs.mkdirSync(configDir, { recursive: true });
    }
    
    fs.writeFileSync(
      path.join(configDir, 'dashboards.json'), 
      JSON.stringify(dashboards, null, 2)
    );
    
    fs.writeFileSync(
      path.join(configDir, 'alerts.json'), 
      JSON.stringify(alerts, null, 2)
    );
    
    // Create import guide
    const importGuide = `# SigNoz Configuration Import Guide

## Dashboards
1. Go to http://localhost:3301
2. Login with: gaylen@signalcartel.io / admin123
3. Navigate to Dashboards → Import
4. Upload: scripts/monitoring/signoz-configs/dashboards.json

## Alerts  
1. Navigate to Alerts → Rules
2. Create New Rule
3. Copy configurations from: scripts/monitoring/signoz-configs/alerts.json

## Pre-configured Items:

### Dashboards:
- QUANTUM FORGE™ Trading Performance
- AI Systems Performance  
- Infrastructure Health

### Alerts:
- Low Trading Volume (Critical)
- High Database Latency (High)
- AI System Degraded (High)
- Win Rate Below Target (High)  
- High Memory Usage (Medium)

## Direct URLs:
- Dashboard: http://localhost:3301/dashboard
- Alerts: http://localhost:3301/alerts
- Services: http://localhost:3301/services
- Metrics Explorer: http://localhost:3301/metrics

## Quick Test:
\`\`\`bash
# Send sample data to test dashboards
npx tsx scripts/monitoring/test-basic-telemetry.ts
\`\`\`
`;

    fs.writeFileSync(path.join(configDir, 'IMPORT_GUIDE.md'), importGuide);
    
    console.log('✅ Configuration files generated in scripts/monitoring/signoz-configs/');
    
    // Step 6: Summary
    console.log('\n' + '═'.repeat(60));
    console.log('🎉 SigNoz API Setup Complete!');
    console.log('═'.repeat(60));
    console.log('📊 Dashboard: http://localhost:3301');
    console.log('🔑 Login: gaylen@signalcartel.io / admin123');
    console.log('📁 Configs: scripts/monitoring/signoz-configs/');
    console.log('📖 Guide: scripts/monitoring/signoz-configs/IMPORT_GUIDE.md');
    console.log('\n💡 Next Steps:');
    console.log('1. Access SigNoz dashboard');  
    console.log('2. Import dashboards and alerts using the guide');
    console.log('3. Start monitoring your SignalCartel system');
    console.log('═'.repeat(60));
    
  } catch (error: any) {
    console.error('❌ Setup failed:', error.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('1. Ensure SigNoz is running: docker-compose ps');
    console.log('2. Check API access: curl http://localhost:3301/api/v1/health');
    console.log('3. Try manual dashboard creation via UI');
  }
}

// Run the setup
setupSignalCartelMonitoring().catch(console.error);
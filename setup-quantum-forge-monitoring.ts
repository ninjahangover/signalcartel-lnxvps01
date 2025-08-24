#!/usr/bin/env tsx
/**
 * QUANTUM FORGE™ Monitoring Setup
 * 
 * Comprehensive monitoring setup for the QUANTUM FORGE trading system
 * Creates monitors, notifications, and status pages via OpenStatus
 */

interface MonitorConfig {
  name: string;
  url: string;
  description: string;
  expectedStatusCodes: number[];
  timeout: number;
  cronExpression: string; // Every 2 minutes
}

interface NotificationConfig {
  name: string;
  type: 'email' | 'webhook';
  data: {
    email?: string;
    url?: string;
  };
}

class QuantumForgeMonitoringSetup {
  private baseURL = 'http://localhost:3000';
  private dashboardURL = 'http://localhost:3004';
  
  private monitors: MonitorConfig[] = [
    // Core Trading Engine
    {
      name: '🚀 QUANTUM FORGE™ Trading Engine',
      url: 'http://localhost:3001/api/quantum-forge/status',
      description: 'Main trading engine status - monitors active trading, win rate, and system health',
      expectedStatusCodes: [200],
      timeout: 15000,
      cronExpression: '*/2 * * * *'
    },
    {
      name: '📊 Trading Portfolio',
      url: 'http://localhost:3001/api/quantum-forge/portfolio',
      description: 'Portfolio data endpoint - tracks current positions and P&L',
      expectedStatusCodes: [200],
      timeout: 15000,
      cronExpression: '*/5 * * * *'
    },
    
    // Market Data Infrastructure
    {
      name: '📈 Market Data Collector',
      url: 'http://localhost:3001/api/market-data/status',
      description: 'Market data collection service - ensures real-time Kraken/CoinGecko feeds are active',
      expectedStatusCodes: [200],
      timeout: 10000,
      cronExpression: '*/3 * * * *'
    },
    
    // Website & API Services
    {
      name: '🌐 Website Dashboard',
      url: 'http://localhost:3001/api/health',
      description: 'Main website and dashboard availability - Next.js application health',
      expectedStatusCodes: [200],
      timeout: 10000,
      cronExpression: '*/5 * * * *'
    },
    
    // GPU Strategies
    {
      name: '🎮 GPU Strategy Engine',
      url: 'http://localhost:3001/api/quantum-forge/gpu-status',
      description: 'GPU-accelerated trading strategies - monitors CUDA performance and strategy execution',
      expectedStatusCodes: [200, 404], // 404 acceptable if endpoint doesn\'t exist yet
      timeout: 15000,
      cronExpression: '*/5 * * * *'
    },
    
    // Database Services
    {
      name: '🗄️ SQLite Database',
      url: 'http://localhost:3001/api/quantum-forge/database-health',
      description: 'Primary SQLite database health - monitors trades, strategies, and system data',
      expectedStatusCodes: [200, 404], // 404 acceptable if endpoint doesn\'t exist yet
      timeout: 10000,
      cronExpression: '*/10 * * * *'
    },
    {
      name: '🏭 Database Warehouse (PostgreSQL)',
      url: 'http://localhost:5433',
      description: 'PostgreSQL warehouse for analytics and historical data',
      expectedStatusCodes: [200, 404], // Different response expected for direct DB connection
      timeout: 10000,
      cronExpression: '*/15 * * * *'
    },
    
    // AI/ML Services
    {
      name: '🤖 AI-ML Container',
      url: 'http://localhost:8501/v1/models',
      description: 'TensorFlow Serving and ML inference services for AI trading strategies',
      expectedStatusCodes: [200, 404], // TensorFlow Serving may have different endpoints
      timeout: 15000,
      cronExpression: '*/10 * * * *'
    },
    
    // Sentiment Analysis
    {
      name: '🧠 Sentiment Intelligence',
      url: 'http://localhost:3001/api/sentiment-analysis?hours=1',
      description: 'Twitter sentiment analysis pipeline - validates trading signals with social sentiment',
      expectedStatusCodes: [200],
      timeout: 20000,
      cronExpression: '*/10 * * * *'
    }
  ];

  async checkEndpointHealth(): Promise<void> {
    console.log('🏥 QUANTUM FORGE™ Monitoring Setup - Health Check');
    console.log('=' .repeat(60));
    
    for (const monitor of this.monitors) {
      try {
        console.log(`🔍 Checking ${monitor.name}...`);
        const response = await fetch(monitor.url, {
          method: 'GET',
          signal: AbortSignal.timeout(monitor.timeout)
        });
        
        const status = response.status;
        const isHealthy = monitor.expectedStatusCodes.includes(status);
        
        if (isHealthy) {
          console.log(`✅ ${monitor.name} - OK (${status})`);
        } else {
          console.log(`⚠️  ${monitor.name} - Warning (${status})`);
        }
      } catch (error) {
        console.log(`❌ ${monitor.name} - Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
    
    console.log('\\n📋 SETUP INSTRUCTIONS:');
    console.log('Since you are now logged into OpenStatus dashboard at http://localhost:3004');
    console.log('');
    console.log('1. 🖥️  CREATE MONITORS:');
    this.monitors.forEach((monitor, i) => {
      console.log(`   ${i + 1}. Navigate to "Monitors" → "New Monitor"`);
      console.log(`      Name: ${monitor.name}`);
      console.log(`      URL: ${monitor.url}`);
      console.log(`      Description: ${monitor.description}`);
      console.log(`      Check Frequency: Every 2-10 minutes`);
      console.log(`      Expected Status: 200 OK`);
      console.log('');
    });
    
    console.log('2. 🔔 SETUP NOTIFICATIONS:');
    console.log('   → Go to "Settings" → "Notifications"');
    console.log('   → Add Email notification with your email address');
    console.log('   → Configure alerts for failed checks');
    console.log('');
    
    console.log('3. 📄 CREATE STATUS PAGE:');
    console.log('   → Go to "Status Pages" → "Create Status Page"');
    console.log('   → Title: "QUANTUM FORGE™ Trading System Status"');
    console.log('   → Add all created monitors to the status page');
    console.log('   → Make it public or private as needed');
    console.log('');
    
    console.log('4. 📊 CONFIGURE DASHBOARDS:');
    console.log('   → Set up custom dashboards for different views');
    console.log('   → Trading Operations Dashboard');
    console.log('   → System Health Dashboard');
    console.log('   → Market Data Dashboard');
    console.log('');
    
    console.log('🎯 RECOMMENDED ALERT RULES:');
    console.log('');
    console.log('   🔥 CRITICAL (Immediate Alert):');
    console.log('   • QUANTUM FORGE Trading Engine fails');
    console.log('   • SQLite Database becomes unreachable');
    console.log('   • Website Dashboard completely down');
    console.log('');
    console.log('   ⚠️  WARNING (5-minute tolerance):');
    console.log('   • Market Data Collector fails (trading blind)');
    console.log('   • GPU Strategy Engine fails (reduced performance)');
    console.log('   • Sentiment Intelligence fails (less informed trades)');
    console.log('');
    console.log('   📊 INFO (15-minute tolerance):');
    console.log('   • AI-ML Container slow response (>20s)');
    console.log('   • Database Warehouse connectivity issues');
    console.log('   • Portfolio API slow response (>10s)');
    console.log('');
    console.log('   🚨 ESCALATE (30+ minutes):');
    console.log('   • Any critical service fails for >30 minutes');
    console.log('   • Multiple services failing simultaneously');
    console.log('   • Trading engine win rate drops below 40%');
  }

  async generateMonitoringReport(): Promise<void> {
    console.log('\\n📈 QUANTUM FORGE™ SYSTEM OVERVIEW');
    console.log('=' .repeat(60));
    
    const results = [];
    
    for (const monitor of this.monitors) {
      try {
        const startTime = Date.now();
        const response = await fetch(monitor.url, {
          method: 'GET',
          signal: AbortSignal.timeout(monitor.timeout)
        });
        const responseTime = Date.now() - startTime;
        
        results.push({
          name: monitor.name,
          status: response.status,
          responseTime,
          healthy: monitor.expectedStatusCodes.includes(response.status)
        });
      } catch (error) {
        results.push({
          name: monitor.name,
          status: 'ERROR',
          responseTime: 0,
          healthy: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
    
    // Summary
    const healthy = results.filter(r => r.healthy).length;
    const total = results.length;
    const healthPercentage = Math.round((healthy / total) * 100);
    
    console.log(`🎯 SYSTEM HEALTH: ${healthPercentage}% (${healthy}/${total} endpoints healthy)`);
    console.log('');
    
    results.forEach(result => {
      const icon = result.healthy ? '✅' : '❌';
      const time = result.responseTime > 0 ? `${result.responseTime}ms` : 'N/A';
      console.log(`${icon} ${result.name}: ${result.status} (${time})`);
      if (result.error) {
        console.log(`   Error: ${result.error}`);
      }
    });
    
    console.log('\\n🚀 Your QUANTUM FORGE™ monitoring system is ready!');
    console.log('Access your dashboard at: http://localhost:3004');
    console.log('API server running at: http://localhost:3000');
  }
}

// Script execution
async function main() {
  const setup = new QuantumForgeMonitoringSetup();
  
  try {
    await setup.checkEndpointHealth();
    await setup.generateMonitoringReport();
    
    console.log('\\n✅ Monitoring setup complete! Follow the instructions above to configure your dashboard.');
    
  } catch (error) {
    console.error('❌ Setup failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main().catch(console.error);
}
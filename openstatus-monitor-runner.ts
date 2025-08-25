#!/usr/bin/env tsx
/**
 * OpenStatus Local Monitor Runner
 * 
 * This script runs monitoring checks for all configured monitors in OpenStatus.
 * It simulates what QStash/cron would normally do in production.
 * 
 * Run this script with: npx tsx openstatus-monitor-runner.ts
 * Or add to crontab: every 2 minutes
 */

interface Monitor {
  id: number;
  name: string;
  url: string;
  periodicity: string;
  active: boolean;
}

interface MonitorCheck {
  monitorId: number;
  url: string;
  status: number;
  responseTime: number;
  success: boolean;
  error?: string;
  timestamp: Date;
}

class OpenStatusMonitorRunner {
  private readonly dashboardUrl = 'http://localhost:3006';
  private readonly serverUrl = 'http://localhost:3000'; // API server
  private readonly dbUrl = 'http://127.0.0.1:8080'; // SQLite database
  
  // Your monitoring endpoints
  private readonly monitors = [
    {
      name: '🚀 QUANTUM FORGE Trading Engine',
      url: 'http://localhost:3001/api/quantum-forge/status',
      interval: 2, // minutes
    },
    {
      name: '📊 Trading Portfolio',
      url: 'http://localhost:3001/api/quantum-forge/portfolio',
      interval: 5,
    },
    {
      name: '📈 Market Data Collector',
      url: 'http://localhost:3001/api/market-data/status',
      interval: 3,
    },
    {
      name: '🌐 Website Dashboard',
      url: 'http://localhost:3001/api/health',
      interval: 5,
    },
    {
      name: '🎮 GPU Strategy Engine',
      url: 'http://localhost:3001/api/quantum-forge/gpu-status',
      interval: 5,
    },
    {
      name: '🗄️ PostgreSQL Database',
      url: 'http://localhost:3001/api/quantum-forge/database-health',
      interval: 10,
    },
    {
      name: '🧠 Sentiment Intelligence',
      url: 'http://localhost:3001/api/sentiment-analysis?hours=1',
      interval: 10,
    },
  ];

  async checkMonitor(monitor: typeof this.monitors[0]): Promise<MonitorCheck> {
    const startTime = Date.now();
    const result: MonitorCheck = {
      monitorId: 0, // Will be set if we integrate with DB
      url: monitor.url,
      status: 0,
      responseTime: 0,
      success: false,
      timestamp: new Date(),
    };

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 30000); // 30 second timeout
      
      const response = await fetch(monitor.url, {
        method: 'GET',
        signal: controller.signal,
        headers: {
          'User-Agent': 'OpenStatus-Monitor-Runner/1.0',
        },
      });
      
      clearTimeout(timeout);
      
      result.status = response.status;
      result.responseTime = Date.now() - startTime;
      result.success = response.status >= 200 && response.status < 300;
      
      // Try to get response body for additional validation
      try {
        const body = await response.text();
        // You can add custom validation here based on expected response
      } catch {}
      
    } catch (error: any) {
      result.error = error.message || 'Unknown error';
      result.responseTime = Date.now() - startTime;
      
      if (error.name === 'AbortError') {
        result.error = 'Request timeout (30s)';
        result.status = 408; // Request Timeout
      } else if (error.code === 'ECONNREFUSED') {
        result.error = 'Connection refused';
        result.status = 503; // Service Unavailable
      } else {
        result.status = 500; // Internal Server Error
      }
    }

    return result;
  }

  async runAllChecks(): Promise<void> {
    console.log('🔄 OpenStatus Monitor Runner - Starting checks');
    console.log('=' .repeat(60));
    console.log(`⏰ Time: ${new Date().toISOString()}`);
    console.log('');
    
    const results: MonitorCheck[] = [];
    
    // Run all checks in parallel
    const checkPromises = this.monitors.map(monitor => 
      this.checkMonitor(monitor).then(result => ({
        ...result,
        name: monitor.name,
      }))
    );
    
    const checkResults = await Promise.all(checkPromises);
    
    // Display results
    let healthyCount = 0;
    let unhealthyCount = 0;
    
    for (const result of checkResults) {
      const statusIcon = result.success ? '✅' : '❌';
      const statusText = result.success ? 'HEALTHY' : 'UNHEALTHY';
      
      console.log(`${statusIcon} ${(result as any).name}`);
      console.log(`   Status: ${result.status} | Response time: ${result.responseTime}ms | ${statusText}`);
      
      if (result.error) {
        console.log(`   Error: ${result.error}`);
      }
      
      if (result.success) {
        healthyCount++;
      } else {
        unhealthyCount++;
      }
      
      console.log('');
    }
    
    // Summary
    console.log('=' .repeat(60));
    console.log('📊 Summary:');
    console.log(`   ✅ Healthy: ${healthyCount}`);
    console.log(`   ❌ Unhealthy: ${unhealthyCount}`);
    console.log(`   📈 Health Score: ${Math.round((healthyCount / checkResults.length) * 100)}%`);
    
    // Store results in database (if needed)
    await this.storeResults(checkResults);
    
    // Trigger alerts if needed
    if (unhealthyCount > 0) {
      await this.triggerAlerts(checkResults.filter(r => !r.success));
    }
  }

  async storeResults(results: any[]): Promise<void> {
    // This is where you'd store results in the OpenStatus database
    // For now, we'll just log to a file for debugging
    
    const fs = await import('fs/promises');
    const logFile = '/tmp/openstatus-monitor-results.json';
    
    try {
      let existingData: any[] = [];
      try {
        const data = await fs.readFile(logFile, 'utf-8');
        existingData = JSON.parse(data);
      } catch {}
      
      // Keep last 1000 results
      existingData.push(...results);
      if (existingData.length > 1000) {
        existingData = existingData.slice(-1000);
      }
      
      await fs.writeFile(logFile, JSON.stringify(existingData, null, 2));
    } catch (error) {
      console.error('Failed to store results:', error);
    }
  }

  async triggerAlerts(failedChecks: any[]): Promise<void> {
    console.log('');
    console.log('🚨 ALERTS:');
    
    for (const check of failedChecks) {
      console.log(`   ⚠️  ${check.name} is DOWN!`);
      console.log(`      Status: ${check.status} | Error: ${check.error || 'Unknown'}`);
      
      // Send ntfy notification
      if (process.env.NTFY_TOPIC) {
        try {
          await fetch(`https://ntfy.sh/${process.env.NTFY_TOPIC}`, {
            method: 'POST',
            body: `🚨 ALERT: ${check.name} is DOWN!\nStatus: ${check.status}\nError: ${check.error || 'Service unreachable'}`,
            headers: {
              'Title': 'SignalCartel Monitor Alert',
              'Priority': 'urgent',
              'Tags': 'warning,alert',
            },
          });
          console.log(`   📱 ntfy alert sent for ${check.name}`);
        } catch (error) {
          console.error('Failed to send ntfy alert:', error);
        }
      }

      // Send SMS alert (you can configure this with your SMS service)
      // This would integrate with whatever SMS service you configured in OpenStatus
      if (process.env.SMS_WEBHOOK_URL) {
        try {
          await fetch(process.env.SMS_WEBHOOK_URL, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              message: `🚨 SignalCartel Alert: ${check.name} is DOWN! Status: ${check.status}`,
              service: check.name,
              status: check.status,
              error: check.error,
              timestamp: new Date().toISOString(),
            }),
          });
          console.log(`   📱 SMS alert sent for ${check.name}`);
        } catch (error) {
          console.error('Failed to send SMS alert:', error);
        }
      }

      // Log alert to file for OpenStatus integration
      const alertLog = {
        timestamp: new Date().toISOString(),
        service: check.name,
        status: check.status,
        error: check.error,
        url: check.url,
        alertType: 'service_down',
      };
      
      try {
        const fs = await import('fs/promises');
        await fs.appendFile('/tmp/signalcartel-alerts.log', 
          JSON.stringify(alertLog) + '\n');
      } catch (error) {
        console.error('Failed to log alert:', error);
      }
    }
  }

  async checkDatabaseConnection(): Promise<boolean> {
    try {
      const response = await fetch(this.dbUrl);
      return response.ok;
    } catch {
      return false;
    }
  }
}

// Main execution
async function main() {
  const runner = new OpenStatusMonitorRunner();
  
  console.log('🚀 OpenStatus Local Monitor Runner v1.0');
  console.log('');
  
  // Check database connection
  const dbConnected = await runner.checkDatabaseConnection();
  if (!dbConnected) {
    console.log('⚠️  Warning: SQLite database not accessible at http://127.0.0.1:8080');
    console.log('   Monitoring will continue but results won\'t be stored in OpenStatus DB');
    console.log('');
  }
  
  // Run checks
  await runner.runAllChecks();
  
  console.log('');
  console.log('✅ Monitor run complete!');
  console.log('');
  console.log('💡 To run this automatically:');
  console.log('   Add to crontab: */2 * * * * cd /home/telgkb9/depot/dev-signalcartel && npx tsx openstatus-monitor-runner.ts');
  console.log('');
  console.log('📊 View results at: http://localhost:3006/login');
}

// Run the script
if (require.main === module) {
  main().catch(console.error);
}

export { OpenStatusMonitorRunner };
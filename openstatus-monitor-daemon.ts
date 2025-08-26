#!/usr/bin/env tsx
/**
 * OpenStatus Local Monitor Daemon
 * 
 * This is a PERSISTENT daemon that runs monitoring checks continuously.
 * Unlike the runner, this stays alive and runs checks every 2 minutes.
 * 
 * Designed to run as a systemd service with automatic restarts.
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

class OpenStatusMonitorDaemon {
  private readonly dashboardUrl = 'http://localhost:3006';
  private readonly serverUrl = 'http://localhost:3000';
  private readonly dbUrl = 'http://127.0.0.1:8080';
  private isRunning = true;
  private checkInterval = 2 * 60 * 1000; // 2 minutes in milliseconds
  
  // Your monitoring endpoints
  private readonly monitors = [
    {
      name: '🚀 QUANTUM FORGE Trading Engine',
      url: 'http://localhost:3001/api/quantum-forge/status',
      interval: 2,
    },
    {
      name: '📊 Trading Portfolio',
      url: 'http://localhost:3001/api/quantum-forge/portfolio',
      interval: 2,
    },
    {
      name: '📈 Market Data Collector',
      url: 'http://localhost:3001/api/market-data/status',
      interval: 2,
    },
    {
      name: '🌐 Website Dashboard',
      url: 'http://localhost:3001/api/health',
      interval: 2,
    },
    {
      name: '🎮 GPU Strategy Engine',
      url: 'http://localhost:3001/api/quantum-forge/gpu-status',
      interval: 2,
    },
    {
      name: '🗄️ PostgreSQL Database',
      url: 'http://localhost:3001/api/quantum-forge/database-health',
      interval: 2,
    },
    {
      name: '🧠 Sentiment Intelligence',
      url: 'http://localhost:3001/api/sentiment-analysis?hours=1',
      interval: 2,
    },
  ];

  async checkMonitor(monitor: { name: string; url: string }): Promise<MonitorCheck> {
    const startTime = Date.now();
    const result: MonitorCheck = {
      monitorId: 1,
      url: monitor.url,
      status: 0,
      responseTime: 0,
      success: false,
      timestamp: new Date(),
    };

    try {
      // 15 second timeout (reduced from 30s for faster detection)
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15000);
      
      const response = await fetch(monitor.url, {
        method: 'GET',
        headers: {
          'User-Agent': 'SignalCartel-Monitor/1.0',
        },
        signal: controller.signal,
      });
      
      clearTimeout(timeout);
      
      result.status = response.status;
      result.responseTime = Date.now() - startTime;
      result.success = response.status >= 200 && response.status < 300;
      
    } catch (error: any) {
      result.error = error.message || 'Unknown error';
      result.responseTime = Date.now() - startTime;
      
      if (error.name === 'AbortError') {
        result.error = 'Request timeout (15s)';
        result.status = 408;
      } else if (error.code === 'ECONNREFUSED') {
        result.error = 'Connection refused';
        result.status = 503;
      } else if (error.code === 'ENOTFOUND') {
        result.error = 'DNS resolution failed';
        result.status = 502;
      } else {
        result.status = 500;
      }
    }

    return result;
  }

  async runAllChecks(): Promise<void> {
    const timestamp = new Date().toISOString();
    
    try {
      console.log(`[${timestamp}] 🔄 Running monitor checks...`);
      
      const results: MonitorCheck[] = [];
      
      // Run all checks in parallel with individual error handling
      const checkPromises = this.monitors.map(monitor => 
        this.checkMonitor(monitor)
          .then(result => ({
            ...result,
            name: monitor.name,
          }))
          .catch(error => {
            console.error(`[${timestamp}] ❌ Monitor check failed for ${monitor.name}:`, error.message);
            return {
              monitorId: 1,
              url: monitor.url,
              status: 500,
              responseTime: 0,
              success: false,
              error: error.message || 'Check failed',
              timestamp: new Date(),
              name: monitor.name,
            };
          })
      );
      
      const checkResults = await Promise.all(checkPromises);
      
      // Process results
      let healthyCount = 0;
      let unhealthyCount = 0;
      
      for (const result of checkResults) {
        if (result.success) {
          healthyCount++;
          console.log(`[${timestamp}] ✅ ${result.name} - Status: ${result.status} | Time: ${result.responseTime}ms`);
        } else {
          unhealthyCount++;
          console.log(`[${timestamp}] ❌ ${result.name} - Status: ${result.status} | Error: ${result.error}`);
        }
      }
      
      const healthScore = Math.round((healthyCount / (healthyCount + unhealthyCount)) * 100);
      console.log(`[${timestamp}] 📊 Health Score: ${healthScore}% (${healthyCount}/${healthyCount + unhealthyCount})`);
      
      // Store results and trigger alerts
      await this.storeResults(checkResults);
      
      if (unhealthyCount > 0) {
        await this.triggerAlerts(checkResults.filter(r => !r.success));
      }
      
    } catch (error: any) {
      console.error(`[${timestamp}] 💥 Monitor run failed:`, error.message || error);
      // Don't exit - keep running!
    }
  }

  async storeResults(results: any[]): Promise<void> {
    try {
      const fs = await import('fs/promises');
      const logFile = '/tmp/openstatus-monitor-results.json';
      
      let existingData: any[] = [];
      try {
        const data = await fs.readFile(logFile, 'utf-8');
        existingData = JSON.parse(data);
      } catch {
        // File doesn't exist or invalid JSON - start fresh
      }
      
      existingData.push(...results);
      if (existingData.length > 1000) {
        existingData = existingData.slice(-1000);
      }
      
      await fs.writeFile(logFile, JSON.stringify(existingData, null, 2));
    } catch (error: any) {
      console.error(`[${new Date().toISOString()}] ❌ Failed to store results:`, error.message);
    }
  }

  async triggerAlerts(failedChecks: any[]): Promise<void> {
    const timestamp = new Date().toISOString();
    
    for (const check of failedChecks) {
      console.log(`[${timestamp}] 🚨 ALERT: ${check.name} is DOWN! Status: ${check.status} | Error: ${check.error}`);
      
      // Send ntfy notification with error handling
      if (process.env.NTFY_TOPIC) {
        try {
          const controller = new AbortController();
          const timeout = setTimeout(() => controller.abort(), 10000);
          
          const response = await fetch(`https://ntfy.sh/${process.env.NTFY_TOPIC}`, {
            method: 'POST',
            body: `🚨 ALERT: ${check.name} is DOWN!\\nStatus: ${check.status}\\nError: ${check.error || 'Service unreachable'}\\nTime: ${timestamp}`,
            headers: {
              'Title': 'SignalCartel Monitor Alert',
              'Priority': 'urgent',
              'Tags': 'warning,alert',
              'Content-Type': 'text/plain',
            },
            signal: controller.signal,
          });
          
          clearTimeout(timeout);
          
          if (response.ok) {
            console.log(`[${timestamp}] 📱 ntfy alert sent for ${check.name}`);
          } else {
            console.log(`[${timestamp}] ⚠️ ntfy alert failed for ${check.name}: ${response.status}`);
          }
        } catch (error: any) {
          console.log(`[${timestamp}] ⚠️ ntfy send failed for ${check.name}: ${error.message}`);
        }
      }

      // Log alert to file
      const alertLog = {
        timestamp: timestamp,
        service: check.name,
        status: check.status,
        error: check.error,
        url: check.url,
        alertType: 'service_down',
      };
      
      try {
        const fs = await import('fs/promises');
        await fs.appendFile('/tmp/signalcartel-alerts.log', 
          JSON.stringify(alertLog) + '\\n');
      } catch (error: any) {
        console.error(`[${timestamp}] ❌ Failed to log alert:`, error.message);
      }
    }
  }

  // Graceful shutdown handler
  async shutdown(): Promise<void> {
    console.log(`[${new Date().toISOString()}] 🛑 Shutting down monitor daemon...`);
    this.isRunning = false;
    // Give time for any pending operations to complete
    await new Promise(resolve => setTimeout(resolve, 1000));
    console.log(`[${new Date().toISOString()}] ✅ Monitor daemon stopped`);
  }

  // Main daemon loop
  async start(): Promise<void> {
    console.log(`[${new Date().toISOString()}] 🚀 Starting SignalCartel Monitor Daemon`);
    console.log(`[${new Date().toISOString()}] 🔄 Check interval: ${this.checkInterval / 1000}s`);
    console.log(`[${new Date().toISOString()}] 📊 Monitoring ${this.monitors.length} endpoints`);
    console.log(`[${new Date().toISOString()}] 📱 ntfy topic: ${process.env.NTFY_TOPIC || 'NOT SET'}`);
    
    // Set up graceful shutdown
    process.on('SIGTERM', () => this.shutdown());
    process.on('SIGINT', () => this.shutdown());
    
    // Initial check
    await this.runAllChecks();
    
    // Main monitoring loop
    while (this.isRunning) {
      try {
        // Wait for next check interval
        await new Promise(resolve => setTimeout(resolve, this.checkInterval));
        
        if (this.isRunning) {
          await this.runAllChecks();
        }
      } catch (error: any) {
        console.error(`[${new Date().toISOString()}] 💥 Daemon loop error:`, error.message);
        // Don't exit - keep running after a short delay
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    }
  }
}

// Main execution
async function main() {
  const daemon = new OpenStatusMonitorDaemon();
  
  try {
    await daemon.start();
  } catch (error: any) {
    console.error(`[${new Date().toISOString()}] 💥 Daemon startup failed:`, error.message);
    process.exit(1);
  }
}

// Run the daemon
if (require.main === module) {
  main().catch((error) => {
    console.error(`[${new Date().toISOString()}] 💥 Unhandled error:`, error.message || error);
    process.exit(1);
  });
}

export { OpenStatusMonitorDaemon };
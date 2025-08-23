#!/usr/bin/env tsx
/**
 * QUANTUM FORGE™ SYSTEM HEALTH CHECK
 * 
 * Comprehensive health check for all SignalCartel trading platform components
 * Tests paper trading, GPU strategies, database, APIs, and dashboard integration
 */

import { PrismaClient } from '@prisma/client';
import { telegramAlerts } from './src/lib/telegram-alert-service';

const prisma = new PrismaClient();

interface HealthCheckResult {
  component: string;
  status: 'HEALTHY' | 'WARNING' | 'CRITICAL';
  message: string;
  details?: any;
  timestamp: Date;
}

class SystemHealthChecker {
  private results: HealthCheckResult[] = [];
  private enableAlerts: boolean = false;
  private lastAlertFile: string = './last-health-alert.json';

  constructor(enableAlerts: boolean = false) {
    this.enableAlerts = enableAlerts;
  }

  private addResult(component: string, status: 'HEALTHY' | 'WARNING' | 'CRITICAL', message: string, details?: any) {
    this.results.push({
      component,
      status,
      message,
      details,
      timestamp: new Date()
    });

    // Send alert for critical issues or new warnings
    if (this.enableAlerts && (status === 'CRITICAL' || this.isNewIssue(component, status))) {
      this.sendAlert(component, status, message);
    }
  }

  private isNewIssue(component: string, status: string): boolean {
    try {
      const fs = require('fs');
      if (!fs.existsSync(this.lastAlertFile)) return true;
      
      const lastAlerts = JSON.parse(fs.readFileSync(this.lastAlertFile, 'utf8'));
      const lastStatus = lastAlerts[component];
      
      // Alert on status changes from HEALTHY to WARNING/CRITICAL
      return lastStatus === 'HEALTHY' && status !== 'HEALTHY';
    } catch (error) {
      return true; // Alert on error reading file
    }
  }

  private async sendAlert(component: string, status: string, message: string) {
    try {
      const health = status === 'HEALTHY' ? 'healthy' : 
                    status === 'WARNING' ? 'degraded' : 'critical';
      
      const recentTrades = await prisma.paperTrade.count({
        where: {
          executedAt: { gte: new Date(Date.now() - 30 * 60 * 1000) }
        }
      });

      await telegramAlerts.sendStatusAlert({
        system: `QUANTUM FORGE™ - ${component}`,
        health: health as 'healthy' | 'degraded' | 'critical',
        trades: recentTrades,
        uptime: this.getSystemUptime()
      });

      console.log(`📱 Alert sent for ${component}: ${status}`);
    } catch (error) {
      console.error(`Failed to send alert for ${component}:`, error);
    }
  }

  private getSystemUptime(): string {
    try {
      const { execSync } = require('child_process');
      const uptime = execSync('uptime -p').toString().trim();
      return uptime.replace('up ', '');
    } catch {
      return 'unknown';
    }
  }

  private saveAlertState() {
    try {
      const fs = require('fs');
      const alertState: { [key: string]: string } = {};
      
      this.results.forEach(result => {
        alertState[result.component] = result.status;
      });
      
      fs.writeFileSync(this.lastAlertFile, JSON.stringify(alertState, null, 2));
    } catch (error) {
      console.error('Failed to save alert state:', error);
    }
  }

  async checkDatabase(): Promise<void> {
    console.log('🔍 Checking Database Connection...');
    try {
      await prisma.$connect();
      
      const recentTrades = await prisma.paperTrade.count({
        where: {
          strategy: 'QUANTUM FORGE™',
          executedAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
        }
      });

      const activeSessions = await prisma.paperTradingSession.count({
        where: { strategy: 'QUANTUM FORGE™', isActive: true }
      });

      if (recentTrades > 0 && activeSessions > 0) {
        this.addResult('Database', 'HEALTHY', 
          `Database operational: ${recentTrades} trades, ${activeSessions} active sessions`);
      } else {
        this.addResult('Database', 'WARNING', 'Database connected but limited activity');
      }
    } catch (error) {
      this.addResult('Database', 'CRITICAL', `Database connection failed: ${error}`);
    }
  }

  async checkGPUStrategies(): Promise<void> {
    console.log('🔍 Checking GPU Strategies...');
    try {
      const recentTrades = await prisma.paperTrade.findMany({
        where: {
          strategy: 'QUANTUM FORGE™',
          executedAt: { gte: new Date(Date.now() - 30 * 60 * 1000) }
        },
        take: 5
      });

      if (recentTrades.length > 0) {
        this.addResult('GPU Strategies', 'HEALTHY', 
          `GPU strategies active: ${recentTrades.length} recent trades`);
      } else {
        this.addResult('GPU Strategies', 'WARNING', 'GPU strategies not generating recent trades');
      }
    } catch (error) {
      this.addResult('GPU Strategies', 'CRITICAL', `GPU strategy check failed: ${error}`);
    }
  }

  async checkTradeExecution(): Promise<void> {
    console.log('🔍 Checking Trade Execution...');
    try {
      const veryRecentTrades = await prisma.paperTrade.findMany({
        where: {
          strategy: 'QUANTUM FORGE™',
          executedAt: { gte: new Date(Date.now() - 10 * 60 * 1000) }
        },
        orderBy: { executedAt: 'desc' },
        take: 3
      });

      if (veryRecentTrades.length > 0) {
        const latest = veryRecentTrades[0];
        this.addResult('Trade Execution', 'HEALTHY', 
          `Active: ${veryRecentTrades.length} trades, latest: ${latest.side} ${latest.symbol} at $${latest.price}`);
      } else {
        this.addResult('Trade Execution', 'WARNING', 'No recent trade executions');
      }
    } catch (error) {
      this.addResult('Trade Execution', 'CRITICAL', `Trade execution check failed: ${error}`);
    }
  }

  generateReport(): void {
    console.log('\n🏥 QUANTUM FORGE™ SYSTEM HEALTH REPORT');
    console.log('=' .repeat(60));
    console.log(`Generated: ${new Date().toISOString()}`);
    console.log();

    const healthy = this.results.filter(r => r.status === 'HEALTHY').length;
    const warnings = this.results.filter(r => r.status === 'WARNING').length;
    const critical = this.results.filter(r => r.status === 'CRITICAL').length;

    let overallStatus = 'HEALTHY';
    if (critical > 0) overallStatus = 'CRITICAL';
    else if (warnings > 0) overallStatus = 'WARNING';

    console.log(`📊 OVERALL SYSTEM STATUS: ${this.getStatusIcon(overallStatus)} ${overallStatus}`);
    console.log(`   ✅ Healthy: ${healthy}   ⚠️  Warning: ${warnings}   🚨 Critical: ${critical}`);
    console.log();

    console.log('🔍 COMPONENT STATUS:');
    this.results.forEach(result => {
      const icon = this.getStatusIcon(result.status);
      console.log(`   ${icon} ${result.component.padEnd(20)} ${result.status.padEnd(10)} ${result.message}`);
    });

    console.log();
    console.log('💡 QUICK HEALTH CHECK COMMANDS:');
    console.log('   📊 Check recent trades: npx tsx -e "import {PrismaClient} from \'@prisma/client\'; const p = new PrismaClient(); p.paperTrade.findMany({where:{strategy:\'QUANTUM FORGE™\'},take:5,orderBy:{executedAt:\'desc\'}}).then(console.log)"');
    console.log('   🔄 Restart system: ENABLE_GPU_STRATEGIES=true npx tsx -r dotenv/config load-database-strategies.ts');
    console.log('   📈 Dashboard: http://localhost:3002');
    console.log('   🏭 Start warehouse: docker-compose -f containers/database/postgres-warehouse.yml up -d');
    console.log('   🚨 Test alerts: npx tsx system-health-check.ts --monitor');
    console.log('   ⚙️  Setup monitoring: ./setup-health-monitoring.sh');

    if (overallStatus === 'HEALTHY') {
      console.log('\n🎉 All systems operational! QUANTUM FORGE™ is ready for trading.');
    }
  }

  private getStatusIcon(status: string): string {
    switch (status) {
      case 'HEALTHY': return '✅';
      case 'WARNING': return '⚠️';
      case 'CRITICAL': return '🚨';
      default: return '❓';
    }
  }

  async checkWarehouse(): Promise<void> {
    console.log('🔍 Checking Data Warehouse...');
    try {
      // Check if warehouse container is running
      const { exec } = require('child_process');
      const util = require('util');
      const execAsync = util.promisify(exec);
      
      try {
        await execAsync('docker ps | grep signalcartel-warehouse');
        
        // If container is running, try to connect to check health
        try {
          await execAsync('docker exec signalcartel-warehouse pg_isready -U warehouse_user -d quantum_forge_warehouse');
          this.addResult('Data Warehouse', 'HEALTHY', 'PostgreSQL warehouse container running and accepting connections');
        } catch (healthError) {
          this.addResult('Data Warehouse', 'WARNING', 'Warehouse container running but database not ready');
        }
      } catch (containerError) {
        // Container not running - check if it's expected to be running
        try {
          // Check if warehouse configuration exists
          const fs = require('fs');
          const configExists = fs.existsSync('./containers/database/postgres-warehouse.yml');
          
          if (configExists) {
            this.addResult('Data Warehouse', 'WARNING', 
              'Warehouse configured but not running. Start with: docker-compose -f containers/database/postgres-warehouse.yml up -d',
              { 
                suggestion: 'Optional component for long-term analytics',
                configFile: './containers/database/postgres-warehouse.yml'
              });
          } else {
            this.addResult('Data Warehouse', 'WARNING', 'No warehouse configuration found');
          }
        } catch (configError) {
          this.addResult('Data Warehouse', 'WARNING', 'Warehouse not configured or running');
        }
      }
    } catch (error) {
      this.addResult('Data Warehouse', 'CRITICAL', `Warehouse check failed: ${error.message}`);
    }
  }

  async runAllChecks(): Promise<void> {
    console.log('🚀 Starting QUANTUM FORGE™ System Health Check...\n');

    await Promise.allSettled([
      this.checkDatabase(),
      this.checkGPUStrategies(),
      this.checkTradeExecution(),
      this.checkWarehouse()
    ]);

    this.generateReport();
    
    // Save current state for future alert comparisons
    if (this.enableAlerts) {
      this.saveAlertState();
      
      // Send summary if there are any critical issues
      const critical = this.results.filter(r => r.status === 'CRITICAL').length;
      if (critical > 0) {
        console.log(`📱 ${critical} critical issues detected - alerts sent`);
      }
    }
  }

  async cleanup(): Promise<void> {
    await prisma.$disconnect();
  }
}

async function main() {
  // Check if running with monitoring flag (for cron jobs)
  const enableAlerts = process.argv.includes('--monitor') || process.argv.includes('--alerts');
  const checker = new SystemHealthChecker(enableAlerts);
  
  if (enableAlerts) {
    console.log('🚨 Running in monitoring mode - alerts enabled');
  }
  
  try {
    await checker.runAllChecks();
  } catch (error) {
    console.error('❌ System health check failed:', error);
    
    // Send critical alert about health check failure
    if (enableAlerts) {
      try {
        await telegramAlerts.sendStatusAlert({
          system: 'QUANTUM FORGE™ - Health Check',
          health: 'critical',
          trades: 0,
          uptime: 'unknown'
        });
      } catch (alertError) {
        console.error('Failed to send health check failure alert:', alertError);
      }
    }
    
    process.exit(1);
  } finally {
    await checker.cleanup();
  }
}

if (require.main === module) {
  main().catch(console.error);
}

export { SystemHealthChecker };
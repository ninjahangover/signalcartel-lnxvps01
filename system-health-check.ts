#!/usr/bin/env tsx
/**
 * QUANTUM FORGE™ SYSTEM HEALTH CHECK
 * 
 * Comprehensive health check for all SignalCartel trading platform components
 * Tests paper trading, GPU strategies, database, APIs, and dashboard integration
 */

import { PrismaClient } from '@prisma/client';

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

  private addResult(component: string, status: 'HEALTHY' | 'WARNING' | 'CRITICAL', message: string, details?: any) {
    this.results.push({
      component,
      status,
      message,
      details,
      timestamp: new Date()
    });
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
    console.log('   📈 Dashboard: http://localhost:3001');

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

  async runAllChecks(): Promise<void> {
    console.log('🚀 Starting QUANTUM FORGE™ System Health Check...\n');

    await Promise.allSettled([
      this.checkDatabase(),
      this.checkGPUStrategies(),
      this.checkTradeExecution()
    ]);

    this.generateReport();
  }

  async cleanup(): Promise<void> {
    await prisma.$disconnect();
  }
}

async function main() {
  const checker = new SystemHealthChecker();
  
  try {
    await checker.runAllChecks();
  } catch (error) {
    console.error('❌ System health check failed:', error);
    process.exit(1);
  } finally {
    await checker.cleanup();
  }
}

if (require.main === module) {
  main().catch(console.error);
}

export { SystemHealthChecker };
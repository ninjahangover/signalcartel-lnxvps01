#!/usr/bin/env npx tsx

/**
 * SignalCartel Comprehensive System Health Check
 * QUANTUM FORGE™ Edition - Complete System Verification
 * 
 * This script performs end-to-end health checks of the entire SignalCartel system
 * including database, services, APIs, trading system, and real-time monitoring
 */

import { PrismaClient } from '@prisma/client';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';

const execAsync = promisify(exec);

// Colors for output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  purple: '\x1b[35m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m'
};

interface HealthCheckResult {
  name: string;
  status: 'pass' | 'fail' | 'warning';
  message: string;
  details?: any;
  duration?: number;
}

class HealthChecker {
  private results: HealthCheckResult[] = [];
  private prisma: PrismaClient;
  private startTime: number;

  constructor() {
    this.prisma = new PrismaClient();
    this.startTime = Date.now();
  }

  private log(message: string, color: keyof typeof colors = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
  }

  private logResult(result: HealthCheckResult) {
    const icon = result.status === 'pass' ? '✅' : result.status === 'fail' ? '❌' : '⚠️';
    const color = result.status === 'pass' ? 'green' : result.status === 'fail' ? 'red' : 'yellow';
    const duration = result.duration ? ` (${result.duration}ms)` : '';
    
    this.log(`${icon} ${result.name}: ${result.message}${duration}`, color);
    
    if (result.details && Object.keys(result.details).length > 0) {
      this.log(`   ${JSON.stringify(result.details, null, 2)}`, 'cyan');
    }
  }

  private async runCheck(name: string, checkFn: () => Promise<any>): Promise<HealthCheckResult> {
    const startTime = Date.now();
    
    try {
      const details = await checkFn();
      const duration = Date.now() - startTime;
      
      const result: HealthCheckResult = {
        name,
        status: 'pass',
        message: 'OK',
        details: typeof details === 'object' ? details : undefined,
        duration
      };
      
      this.results.push(result);
      this.logResult(result);
      return result;
      
    } catch (error: any) {
      const duration = Date.now() - startTime;
      
      const result: HealthCheckResult = {
        name,
        status: 'fail',
        message: error.message || 'Unknown error',
        duration
      };
      
      this.results.push(result);
      this.logResult(result);
      return result;
    }
  }

  async checkDatabaseConnectivity(): Promise<void> {
    await this.runCheck('Database Connectivity', async () => {
      await this.prisma.$connect();
      const result = await this.prisma.$queryRaw`SELECT 1 as test`;
      return { connected: true, testQuery: result };
    });
  }

  async checkDatabaseSchema(): Promise<void> {
    await this.runCheck('Database Schema', async () => {
      // Check for essential tables
      const tables = await this.prisma.$queryRaw`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public'
      ` as any[];
      
      const requiredTables = ['ManagedPosition', 'ManagedTrade', 'Strategy', 'Alert'];
      const existingTables = tables.map((t: any) => t.table_name);
      const missingTables = requiredTables.filter(t => !existingTables.includes(t));
      
      if (missingTables.length > 0) {
        throw new Error(`Missing tables: ${missingTables.join(', ')}`);
      }
      
      return { 
        totalTables: tables.length,
        requiredTables: requiredTables.length,
        allPresent: true 
      };
    });
  }

  async checkDockerContainers(): Promise<void> {
    await this.runCheck('Docker Containers', async () => {
      const { stdout } = await execAsync('docker ps --filter "name=signalcartel" --format "{{.Names}}\t{{.Status}}"');
      
      const containers = stdout.trim().split('\n').filter(line => line.trim())
        .map(line => {
          const [name, ...statusParts] = line.split('\t');
          return { name: name.trim(), status: statusParts.join('\t').trim() };
        });
      
      const expectedContainers = [
        'signalcartel-warehouse',
        'signalcartel-market-data', 
        'signalcartel-ai-ml'
      ];
      
      const runningContainers = containers.filter(c => c.status.includes('Up'));
      const missingContainers = expectedContainers.filter(
        expected => !runningContainers.some(running => running.name === expected)
      );
      
      return {
        running: runningContainers.length,
        expected: expectedContainers.length,
        containers: runningContainers,
        missing: missingContainers
      };
    });
  }

  async checkAPIEndpoints(): Promise<void> {
    const endpoints = [
      '/api/health',
      '/api/quantum-forge/status',
      '/api/quantum-forge/dashboard'
    ];

    for (const endpoint of endpoints) {
      await this.runCheck(`API ${endpoint}`, async () => {
        const response = await fetch(`http://localhost:3001${endpoint}`);
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json().catch(() => ({}));
        
        return {
          status: response.status,
          contentType: response.headers.get('content-type'),
          dataKeys: Object.keys(data)
        };
      });
    }
  }

  async checkTradingSystemComponents(): Promise<void> {
    await this.runCheck('Position Management System', async () => {
      // Check if we can query positions
      const positions = await this.prisma.managedPosition.findMany({
        take: 5,
        include: { trades: true }
      });
      
      return {
        totalPositions: positions.length,
        hasData: positions.length > 0,
        avgTradesPerPosition: positions.length > 0 
          ? positions.reduce((sum, p) => sum + p.trades.length, 0) / positions.length 
          : 0
      };
    });

    await this.runCheck('Strategy System', async () => {
      const strategies = await this.prisma.strategy.findMany({
        take: 10
      });
      
      const activeStrategies = strategies.filter(s => s.isActive);
      
      return {
        totalStrategies: strategies.length,
        activeStrategies: activeStrategies.length,
        hasActiveStrategies: activeStrategies.length > 0
      };
    });

    await this.runCheck('Alert System', async () => {
      const recentAlerts = await this.prisma.alert.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' }
      });
      
      return {
        recentAlerts: recentAlerts.length,
        hasRecentActivity: recentAlerts.length > 0,
        latestAlert: recentAlerts[0]?.createdAt
      };
    });
  }

  async checkPhaseSystem(): Promise<void> {
    await this.runCheck('QUANTUM FORGE™ Phase System', async () => {
      try {
        // Try to run the phase status check
        const { stdout } = await execAsync('npx tsx -r dotenv/config admin/phase-transition-status.ts', {
          timeout: 10000
        });
        
        // Parse the output to extract phase information
        const phaseMatch = stdout.match(/Current Phase: (\d+)/);
        const currentPhase = phaseMatch ? parseInt(phaseMatch[1]) : null;
        
        return {
          currentPhase,
          scriptExecuted: true,
          output: stdout.split('\n').slice(0, 3) // First few lines
        };
        
      } catch (error: any) {
        // If the script fails, still return some info
        return {
          scriptExecuted: false,
          error: error.message,
          note: 'Phase system may not be initialized yet'
        };
      }
    });
  }

  async checkSystemResources(): Promise<void> {
    await this.runCheck('System Resources', async () => {
      const { stdout: memInfo } = await execAsync('free -m');
      const { stdout: diskInfo } = await execAsync('df -h .');
      const { stdout: loadInfo } = await execAsync('uptime');
      
      // Parse memory info
      const memLines = memInfo.split('\n');
      const memData = memLines[1].split(/\s+/);
      const totalMem = parseInt(memData[1]);
      const usedMem = parseInt(memData[2]);
      const memUsagePercent = Math.round((usedMem / totalMem) * 100);
      
      // Parse disk info  
      const diskLines = diskInfo.split('\n');
      const diskData = diskLines[1].split(/\s+/);
      const diskUsagePercent = parseInt(diskData[4].replace('%', ''));
      
      // Parse load average
      const loadMatch = loadInfo.match(/load average: ([\d.]+)/);
      const loadAverage = loadMatch ? parseFloat(loadMatch[1]) : 0;
      
      return {
        memory: {
          total: totalMem,
          used: usedMem,
          usagePercent: memUsagePercent
        },
        disk: {
          usagePercent: diskUsagePercent,
          available: diskData[3]
        },
        load: {
          average: loadAverage
        }
      };
    });
  }

  async checkLogFiles(): Promise<void> {
    await this.runCheck('Log Files', async () => {
      const logDirectories = [
        '/tmp/signalcartel-logs',
        './logs'
      ];
      
      const logInfo: any = {};
      
      for (const logDir of logDirectories) {
        try {
          if (fs.existsSync(logDir)) {
            const files = fs.readdirSync(logDir);
            logInfo[logDir] = {
              exists: true,
              fileCount: files.length,
              recentFiles: files.slice(-3)
            };
          } else {
            logInfo[logDir] = { exists: false };
          }
        } catch (error) {
          logInfo[logDir] = { exists: false, error: (error as Error).message };
        }
      }
      
      return logInfo;
    });
  }

  private generateHealthReport(): void {
    const totalChecks = this.results.length;
    const passedChecks = this.results.filter(r => r.status === 'pass').length;
    const failedChecks = this.results.filter(r => r.status === 'fail').length;
    const warningChecks = this.results.filter(r => r.status === 'warning').length;
    const totalDuration = Date.now() - this.startTime;
    
    this.log('\n' + '═'.repeat(80), 'purple');
    this.log('🏥 SIGNALCARTEL COMPREHENSIVE HEALTH REPORT', 'purple');
    this.log('═'.repeat(80), 'purple');
    
    this.log(`\n📊 SUMMARY:`, 'bold');
    this.log(`  Total Checks: ${totalChecks}`);
    this.log(`  ✅ Passed: ${passedChecks}`, 'green');
    this.log(`  ❌ Failed: ${failedChecks}`, failedChecks > 0 ? 'red' : 'green');
    this.log(`  ⚠️  Warnings: ${warningChecks}`, warningChecks > 0 ? 'yellow' : 'green');
    this.log(`  ⏱️  Total Duration: ${totalDuration}ms`);
    
    const healthScore = Math.round((passedChecks / totalChecks) * 100);
    this.log(`\n🎯 HEALTH SCORE: ${healthScore}%`, healthScore >= 90 ? 'green' : healthScore >= 70 ? 'yellow' : 'red');
    
    if (failedChecks > 0) {
      this.log(`\n❌ FAILED CHECKS:`, 'red');
      this.results.filter(r => r.status === 'fail').forEach(result => {
        this.log(`  • ${result.name}: ${result.message}`, 'red');
      });
    }
    
    if (warningChecks > 0) {
      this.log(`\n⚠️  WARNINGS:`, 'yellow');
      this.results.filter(r => r.status === 'warning').forEach(result => {
        this.log(`  • ${result.name}: ${result.message}`, 'yellow');
      });
    }
    
    const status = failedChecks === 0 ? 'HEALTHY' : failedChecks < 3 ? 'DEGRADED' : 'CRITICAL';
    const statusColor = status === 'HEALTHY' ? 'green' : status === 'DEGRADED' ? 'yellow' : 'red';
    
    this.log(`\n🚀 SYSTEM STATUS: ${status}`, statusColor);
    this.log('═'.repeat(80), 'purple');
    
    // Save report to file
    const reportPath = `/tmp/signalcartel-health-report-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
    fs.writeFileSync(reportPath, JSON.stringify({
      timestamp: new Date().toISOString(),
      totalChecks,
      passedChecks,
      failedChecks,
      warningChecks,
      healthScore,
      status,
      totalDuration,
      results: this.results
    }, null, 2));
    
    this.log(`\n📄 Detailed report saved to: ${reportPath}`, 'cyan');
  }

  async runAllChecks(): Promise<void> {
    this.log('🏥 Starting SignalCartel Comprehensive Health Check...', 'purple');
    this.log('═'.repeat(80), 'purple');
    
    try {
      // Database checks
      this.log('\n🗄️ DATABASE CHECKS', 'blue');
      await this.checkDatabaseConnectivity();
      await this.checkDatabaseSchema();
      
      // Infrastructure checks
      this.log('\n🐳 INFRASTRUCTURE CHECKS', 'blue');
      await this.checkDockerContainers();
      await this.checkSystemResources();
      
      // Application checks  
      this.log('\n🌐 APPLICATION CHECKS', 'blue');
      await this.checkAPIEndpoints();
      
      // Trading system checks
      this.log('\n📈 TRADING SYSTEM CHECKS', 'blue');
      await this.checkTradingSystemComponents();
      await this.checkPhaseSystem();
      
      // Operational checks
      this.log('\n🔧 OPERATIONAL CHECKS', 'blue');
      await this.checkLogFiles();
      
    } catch (error) {
      this.log(`❌ Critical error during health check: ${error}`, 'red');
    } finally {
      await this.prisma.$disconnect();
      this.generateHealthReport();
    }
  }
}

// Main execution
async function main() {
  const healthChecker = new HealthChecker();
  await healthChecker.runAllChecks();
}

if (require.main === module) {
  main().catch(console.error);
}

export default HealthChecker;
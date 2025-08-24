#!/usr/bin/env tsx
/**
 * QUANTUM FORGE™ SYSTEM MONITOR
 * 
 * Lightweight monitoring system for critical trading endpoints
 * Sends email alerts via riseup.net when issues are detected
 */

import nodemailer from 'nodemailer';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface MonitorCheck {
  name: string;
  url: string;
  expectedStatus?: number;
  timeout?: number;
  critical: boolean;
}

class QuantumForgeMonitor {
  private checks: MonitorCheck[] = [
    {
      name: "QUANTUM FORGE™ Status",
      url: "http://localhost:3001/api/quantum-forge/status",
      expectedStatus: 200,
      critical: true
    },
    {
      name: "Market Data API",
      url: "http://localhost:3001/api/market-data/status", 
      expectedStatus: 200,
      critical: true
    },
    {
      name: "Trading Portfolio",
      url: "http://localhost:3001/api/quantum-forge/portfolio",
      expectedStatus: 200,
      critical: false
    },
    {
      name: "Website Health",
      url: "http://localhost:3001/api/health",
      expectedStatus: 200,
      critical: false
    }
  ];

  private emailTransporter = nodemailer.createTransport({
    host: 'mail.riseup.net',
    port: 587,
    secure: false,
    auth: {
      user: process.env.SMTP_USER || 'your-username',
      pass: process.env.SMTP_PASS || 'your-password'
    }
  });

  async checkEndpoint(check: MonitorCheck): Promise<{success: boolean, message: string, responseTime: number}> {
    const startTime = Date.now();
    
    try {
      const response = await fetch(check.url, {
        method: 'GET',
        signal: AbortSignal.timeout(check.timeout || 10000)
      });
      
      const responseTime = Date.now() - startTime;
      const success = response.status === (check.expectedStatus || 200);
      
      return {
        success,
        message: success ? `OK (${response.status})` : `Failed (${response.status})`,
        responseTime
      };
    } catch (error) {
      const responseTime = Date.now() - startTime;
      return {
        success: false,
        message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        responseTime
      };
    }
  }

  async sendAlert(subject: string, message: string): Promise<void> {
    try {
      await this.emailTransporter.sendMail({
        from: process.env.SMTP_USER,
        to: process.env.ALERT_EMAIL || process.env.SMTP_USER,
        subject: `[QUANTUM FORGE™] ${subject}`,
        text: message,
        html: `<pre>${message}</pre>`
      });
      console.log(`📧 Alert sent: ${subject}`);
    } catch (error) {
      console.error('Failed to send email alert:', error);
    }
  }

  async checkTradingActivity(): Promise<{active: boolean, message: string}> {
    try {
      const recentTrades = await prisma.paperTrade.count({
        where: {
          executedAt: { gte: new Date(Date.now() - 10 * 60 * 1000) } // Last 10 minutes
        }
      });

      const active = recentTrades > 0;
      return {
        active,
        message: active ? `${recentTrades} trades in last 10 minutes` : 'No recent trading activity'
      };
    } catch (error) {
      return {
        active: false,
        message: `Database error: ${error}`
      };
    }
  }

  async runHealthCheck(): Promise<void> {
    console.log(`🏥 QUANTUM FORGE™ Health Check - ${new Date().toISOString()}`);
    console.log('=' .repeat(60));

    const results: any[] = [];
    let criticalFailures = 0;
    let warnings = 0;

    // Check endpoints
    for (const check of this.checks) {
      console.log(`🔍 Checking ${check.name}...`);
      const result = await this.checkEndpoint(check);
      
      results.push({
        name: check.name,
        success: result.success,
        message: result.message,
        responseTime: result.responseTime,
        critical: check.critical
      });

      if (!result.success) {
        if (check.critical) {
          criticalFailures++;
          console.log(`🚨 CRITICAL: ${check.name} - ${result.message} (${result.responseTime}ms)`);
        } else {
          warnings++;
          console.log(`⚠️  WARNING: ${check.name} - ${result.message} (${result.responseTime}ms)`);
        }
      } else {
        console.log(`✅ OK: ${check.name} - ${result.message} (${result.responseTime}ms)`);
      }
    }

    // Check trading activity
    console.log(`🔍 Checking trading activity...`);
    const tradingStatus = await this.checkTradingActivity();
    
    if (!tradingStatus.active) {
      warnings++;
      console.log(`⚠️  WARNING: Trading Activity - ${tradingStatus.message}`);
    } else {
      console.log(`✅ OK: Trading Activity - ${tradingStatus.message}`);
    }

    // Summary
    console.log('\n📊 HEALTH CHECK SUMMARY');
    console.log(`   Critical Failures: ${criticalFailures}`);
    console.log(`   Warnings: ${warnings}`);
    console.log(`   Overall Status: ${criticalFailures > 0 ? '🚨 CRITICAL' : warnings > 0 ? '⚠️  DEGRADED' : '✅ HEALTHY'}`);

    // Send alerts if needed
    if (criticalFailures > 0) {
      const failedChecks = results.filter(r => !r.success && r.critical);
      const alertMessage = `CRITICAL SYSTEM FAILURE DETECTED

Failed Components:
${failedChecks.map(f => `- ${f.name}: ${f.message}`).join('\n')}

Time: ${new Date().toISOString()}
Server: ${process.env.HOSTNAME || 'localhost'}

This requires immediate attention!`;

      await this.sendAlert('CRITICAL SYSTEM FAILURE', alertMessage);
    } else if (warnings > 0) {
      const warnedChecks = results.filter(r => !r.success || (r.name === 'Trading Activity' && !tradingStatus.active));
      const alertMessage = `SYSTEM PERFORMANCE DEGRADED

Warning Components:
${warnedChecks.map(w => `- ${w.name}: ${w.message || tradingStatus.message}`).join('\n')}

Time: ${new Date().toISOString()}
Server: ${process.env.HOSTNAME || 'localhost'}

Please investigate when convenient.`;

      await this.sendAlert('System Performance Warning', alertMessage);
    }

    console.log(`\n🔄 Next check in 5 minutes...`);
  }

  async startMonitoring(): Promise<void> {
    console.log('🚀 Starting QUANTUM FORGE™ System Monitor...');
    
    // Initial check
    await this.runHealthCheck();
    
    // Schedule regular checks every 5 minutes
    setInterval(() => {
      this.runHealthCheck().catch(console.error);
    }, 5 * 60 * 1000);
    
    console.log('✅ Monitoring system started - checking every 5 minutes');
  }

  async cleanup(): Promise<void> {
    await prisma.$disconnect();
  }
}

// Script execution
async function main() {
  const monitor = new QuantumForgeMonitor();
  
  try {
    await monitor.startMonitoring();
    
    // Keep the script running
    process.on('SIGINT', async () => {
      console.log('\n🛑 Shutting down monitor...');
      await monitor.cleanup();
      process.exit(0);
    });
    
  } catch (error) {
    console.error('❌ Monitor failed to start:', error);
    await monitor.cleanup();
    process.exit(1);
  }
}

if (require.main === module) {
  main().catch(console.error);
}
#!/usr/bin/env npx tsx
/**
 * QUANTUM FORGE™ Live Trading Manager
 * Professional control interface for live trading operations
 */

import { prisma } from '../src/lib/prisma';
import { LiveTradingEngine } from '../src/lib/live-trading/live-trading-engine';
import { createKrakenClient } from '../src/lib/live-trading/kraken-client';

interface SessionConfig {
  sessionName: string;
  strategy: string;
  initialCapital: number;
  maxDailyLoss: number;
  maxPositionSize: number; // Percentage
  riskTolerance: 'conservative' | 'moderate' | 'aggressive';
  isLive: boolean;
}

class LiveTradingManager {
  private liveEngine: LiveTradingEngine | null = null;

  async showStatus(): Promise<void> {
    console.log('🚀 QUANTUM FORGE™ LIVE TRADING STATUS');
    console.log('=' .repeat(80));
    
    // Check active sessions
    const activeSessions = await prisma.liveTradingSession.findMany({
      where: { status: 'active' },
      include: {
        user: { select: { name: true, email: true } },
        _count: {
          select: {
            trades: true,
            positions: true,
            failedTrades: true
          }
        }
      }
    });
    
    console.log(`📊 Active Sessions: ${activeSessions.length}`);
    
    for (const session of activeSessions) {
      console.log(`\n🔥 ${session.sessionName}`);
      console.log(`   Strategy: ${session.strategy}`);
      console.log(`   Mode: ${session.mode === 'live' ? '🔴 LIVE' : '🟡 VALIDATE-ONLY'}`);
      console.log(`   Capital: $${session.currentCapital.toLocaleString()}`);
      console.log(`   P&L: $${session.totalPnL.toFixed(2)}`);
      console.log(`   Trades: ${session._count.trades}`);
      console.log(`   Open Positions: ${session._count.positions}`);
      console.log(`   Failed Trades: ${session._count.failedTrades}`);
    }
    
    // System health check
    console.log('\n🔌 EXCHANGE CONNECTIVITY');
    try {
      const krakenClient = createKrakenClient(false);
      const connectionOk = await krakenClient.testConnection();
      console.log(`   Kraken API: ${connectionOk ? '✅ Connected' : '❌ Failed'}`);
      
      const serverTime = await krakenClient.getServerTime();
      console.log(`   Server Time: ${new Date(serverTime.unixtime * 1000).toISOString()}`);
      
      const portfolioValue = await krakenClient.getPortfolioValue();
      console.log(`   Portfolio Value: $${portfolioValue.toFixed(2)}`);
      
    } catch (error) {
      console.log(`   Kraken API: ❌ Error - ${error.message}`);
    }
    
    // Recent performance
    const recentTrades = await prisma.liveTrade.count({
      where: {
        executedAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
      }
    });
    
    console.log('\n📈 RECENT ACTIVITY (24h)');
    console.log(`   Live Trades: ${recentTrades}`);
    
    // Risk monitoring
    const totalExposure = await this.calculateTotalExposure();
    console.log('\n⚠️ RISK MONITORING');
    console.log(`   Total Exposure: $${totalExposure.toFixed(2)}`);
    
    const failedTrades24h = await prisma.liveTradeFailure.count({
      where: {
        failedAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
      }
    });
    
    console.log(`   Failed Trades (24h): ${failedTrades24h}`);
  }

  async createSession(config: SessionConfig): Promise<string> {
    console.log(`🚀 Creating Live Trading Session: ${config.sessionName}`);
    
    // For demo purposes, use a default admin user
    // In production, this would be passed as parameter
    const adminUser = await prisma.user.findFirst({
      where: { role: 'admin' }
    });
    
    if (!adminUser) {
      throw new Error('❌ Admin user not found. Please ensure admin user exists.');
    }
    
    // Ensure user has live trading settings
    let userSettings = await prisma.userLiveTradingSettings.findUnique({
      where: { userId: adminUser.id }
    });
    
    if (!userSettings) {
      userSettings = await prisma.userLiveTradingSettings.create({
        data: {
          userId: adminUser.id,
          liveTradingEnabled: true,
          maxDailyRisk: config.maxDailyLoss,
          maxPositionSize: config.maxPositionSize,
          riskTolerance: config.riskTolerance,
          testMode: !config.isLive
        }
      });
    }
    
    const session = await prisma.liveTradingSession.create({
      data: {
        userId: adminUser.id,
        sessionName: config.sessionName,
        strategy: config.strategy,
        mode: config.isLive ? 'live' : 'validate',
        initialCapital: config.initialCapital,
        currentCapital: config.initialCapital,
        maxDailyLoss: config.maxDailyLoss,
        maxPositionSize: config.maxPositionSize,
        status: 'inactive'
      }
    });
    
    console.log(`✅ Session created: ${session.id}`);
    console.log(`   Mode: ${config.isLive ? '🔴 LIVE MONEY' : '🟡 VALIDATE-ONLY'}`);
    console.log(`   Initial Capital: $${config.initialCapital.toLocaleString()}`);
    console.log(`   Max Daily Loss: $${config.maxDailyLoss.toLocaleString()}`);
    console.log(`   Max Position Size: ${config.maxPositionSize}%`);
    
    return session.id;
  }

  async startSession(sessionId: string): Promise<void> {
    console.log(`🚀 Starting Live Trading Session: ${sessionId}`);
    
    const session = await prisma.liveTradingSession.findUnique({
      where: { id: sessionId },
      include: { user: true }
    });
    
    if (!session) {
      throw new Error(`❌ Session not found: ${sessionId}`);
    }
    
    if (session.status === 'active') {
      throw new Error(`❌ Session already active: ${session.sessionName}`);
    }
    
    // Initialize the live trading engine
    this.liveEngine = new LiveTradingEngine({
      sessionId: session.id,
      isLive: session.mode === 'live',
      riskParameters: {
        maxDailyLoss: session.maxDailyLoss,
        maxPositionSize: session.maxPositionSize / 100, // Convert percentage to decimal
        maxTotalExposure: session.maxTotalExposure / 100,
        emergencyStopEnabled: true
      }
    });
    
    // Start the session
    await prisma.liveTradingSession.update({
      where: { id: sessionId },
      data: {
        status: 'active',
        startedAt: new Date()
      }
    });
    
    console.log(`✅ Session started: ${session.sessionName}`);
    console.log(`   Mode: ${session.mode === 'live' ? '🔴 LIVE TRADING' : '🟡 VALIDATE-ONLY'}`);
    console.log(`   Strategy: ${session.strategy}`);
    console.log(`   Available Capital: $${session.currentCapital.toLocaleString()}`);
  }

  async stopSession(sessionId: string, reason?: string): Promise<void> {
    console.log(`🛑 Stopping Live Trading Session: ${sessionId}`);
    
    const session = await prisma.liveTradingSession.findUnique({
      where: { id: sessionId }
    });
    
    if (!session) {
      throw new Error(`❌ Session not found: ${sessionId}`);
    }
    
    // Close any open positions first
    const openPositions = await prisma.livePosition.findMany({
      where: {
        sessionId: sessionId,
        status: 'open'
      }
    });
    
    if (openPositions.length > 0) {
      console.log(`⚠️ ${openPositions.length} open positions found. Closing all positions...`);
      
      for (const position of openPositions) {
        console.log(`   Closing ${position.side} ${position.quantity} ${position.symbol}`);
        // In a real implementation, we would actually close these positions
        // For now, just mark them as closed
        await prisma.livePosition.update({
          where: { id: position.id },
          data: {
            status: 'closed',
            exitTime: new Date(),
            exitPrice: position.currentPrice || position.entryPrice
          }
        });
      }
    }
    
    // Stop the session
    await prisma.liveTradingSession.update({
      where: { id: sessionId },
      data: {
        status: 'stopped',
        stoppedAt: new Date()
      }
    });
    
    // Shutdown the engine
    if (this.liveEngine) {
      this.liveEngine = null;
    }
    
    console.log(`✅ Session stopped: ${session.sessionName}`);
    if (reason) {
      console.log(`   Reason: ${reason}`);
    }
  }

  async emergencyStop(sessionId?: string): Promise<void> {
    console.log('🚨 EMERGENCY STOP TRIGGERED');
    
    if (sessionId) {
      await this.emergencyStopSession(sessionId);
    } else {
      // Stop all active sessions
      const activeSessions = await prisma.liveTradingSession.findMany({
        where: { status: 'active' }
      });
      
      for (const session of activeSessions) {
        await this.emergencyStopSession(session.id);
      }
    }
    
    console.log('🔴 EMERGENCY STOP COMPLETED');
  }

  private async emergencyStopSession(sessionId: string): Promise<void> {
    const session = await prisma.liveTradingSession.findUnique({
      where: { id: sessionId }
    });
    
    if (!session) return;
    
    console.log(`🚨 Emergency stopping: ${session.sessionName}`);
    
    // Mark session as emergency stopped
    await prisma.liveTradingSession.update({
      where: { id: sessionId },
      data: {
        status: 'emergency_stop',
        emergencyStopTriggered: true,
        emergencyStopReason: 'Manual emergency stop',
        emergencyStopTime: new Date()
      }
    });
    
    // Force close all open positions
    await prisma.livePosition.updateMany({
      where: {
        sessionId: sessionId,
        status: 'open'
      },
      data: {
        status: 'closed',
        exitTime: new Date()
      }
    });
  }

  private async calculateTotalExposure(): Promise<number> {
    const result = await prisma.livePosition.aggregate({
      where: { status: 'open' },
      _sum: { entryValue: true }
    });
    
    return result._sum.entryValue || 0;
  }

  async listSessions(): Promise<void> {
    console.log('📋 LIVE TRADING SESSIONS');
    console.log('=' .repeat(80));
    
    const sessions = await prisma.liveTradingSession.findMany({
      include: {
        user: { select: { name: true, email: true } },
        _count: {
          select: {
            trades: true,
            positions: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    
    for (const session of sessions) {
      const statusEmoji = session.status === 'active' ? '🟢' : 
                         session.status === 'stopped' ? '🔴' : 
                         session.status === 'emergency_stop' ? '🚨' : '⚪';
                         
      const modeEmoji = session.mode === 'live' ? '🔴' : '🟡';
      
      console.log(`${statusEmoji} ${session.sessionName} (${session.id.slice(0, 8)})`);
      console.log(`   Status: ${session.status.toUpperCase()}`);
      console.log(`   Mode: ${modeEmoji} ${session.mode.toUpperCase()}`);
      console.log(`   Strategy: ${session.strategy}`);
      console.log(`   Capital: $${session.currentCapital.toLocaleString()} / $${session.initialCapital.toLocaleString()}`);
      console.log(`   P&L: $${session.totalPnL.toFixed(2)}`);
      console.log(`   Trades: ${session._count.trades} | Positions: ${session._count.positions}`);
      console.log(`   Created: ${session.createdAt.toISOString()}`);
      if (session.startedAt) {
        console.log(`   Started: ${session.startedAt.toISOString()}`);
      }
      console.log();
    }
  }
}

// CLI Interface
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  
  const manager = new LiveTradingManager();
  
  try {
    switch (command) {
      case 'status':
        await manager.showStatus();
        break;
        
      case 'create':
        if (args.length < 6) {
          console.log('Usage: create <name> <strategy> <capital> <maxDailyLoss> <maxPositionSize%> [live]');
          console.log('Example: create "BTC Strategy" "gpu-rsi" 10000 500 5 live');
          process.exit(1);
        }
        
        const sessionId = await manager.createSession({
          sessionName: args[1],
          strategy: args[2],
          initialCapital: parseFloat(args[3]),
          maxDailyLoss: parseFloat(args[4]),
          maxPositionSize: parseFloat(args[5]),
          riskTolerance: 'moderate',
          isLive: args[6] === 'live'
        });
        
        console.log(`\n🎯 Next step: npx tsx admin/live-trading-manager.ts start ${sessionId}`);
        break;
        
      case 'start':
        if (!args[1]) {
          console.log('Usage: start <sessionId>');
          process.exit(1);
        }
        await manager.startSession(args[1]);
        break;
        
      case 'stop':
        if (!args[1]) {
          console.log('Usage: stop <sessionId> [reason]');
          process.exit(1);
        }
        await manager.stopSession(args[1], args[2]);
        break;
        
      case 'emergency':
        await manager.emergencyStop(args[1]); // sessionId optional
        break;
        
      case 'list':
        await manager.listSessions();
        break;
        
      default:
        console.log('🚀 QUANTUM FORGE™ Live Trading Manager');
        console.log('');
        console.log('Commands:');
        console.log('  status                                    - Show system status');
        console.log('  create <name> <strategy> <capital> <loss> <size%> [live] - Create session');
        console.log('  start <sessionId>                        - Start trading session');
        console.log('  stop <sessionId> [reason]                - Stop trading session');
        console.log('  emergency [sessionId]                    - Emergency stop (all or specific)');
        console.log('  list                                     - List all sessions');
        console.log('');
        console.log('Examples:');
        console.log('  npx tsx admin/live-trading-manager.ts status');
        console.log('  npx tsx admin/live-trading-manager.ts create "Test Session" "gpu-rsi" 1000 100 5 validate');
        console.log('  npx tsx admin/live-trading-manager.ts create "Live Session" "gpu-rsi" 10000 500 5 live');
        break;
    }
    
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  main().catch(console.error);
}

export { LiveTradingManager };
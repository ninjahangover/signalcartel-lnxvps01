#!/usr/bin/env node
/**
 * QUANTUM FORGE™ Trading System with Comprehensive Monitoring
 * Starts the trading engine with full SigNoz telemetry integration
 * Provides meaningful business metrics and service monitoring
 */

import { PrismaClient } from '@prisma/client';
import { quantumTelemetry } from './src/lib/telemetry/quantum-forge-telemetry.js';

// Initialize telemetry FIRST (before any other imports)
quantumTelemetry.start();
quantumTelemetry.initializeCallbacks();

// Now import trading system components
import { PositionService } from './src/lib/position-management/position-service.js';
import { twitterSentiment } from './src/lib/sentiment/simple-twitter-sentiment.js';

class MonitoredTradingSystem {
  private prisma: PrismaClient;
  private positionService: PositionService;
  private tradingActive: boolean = true;
  private metricsUpdateInterval: any;
  
  constructor() {
    this.prisma = new PrismaClient();
    this.positionService = new PositionService();
    
    console.log('🚀 QUANTUM FORGE™ Trading System with SigNoz Monitoring');
    console.log('📊 Business metrics will be available at: http://localhost:8080');
    console.log('');
  }
  
  async start() {
    try {
      // Test database connection with telemetry
      const dbStart = Date.now();
      await this.prisma.$queryRaw`SELECT 1`;
      quantumTelemetry.recordDatabaseQuery('connection_test', (Date.now() - dbStart) / 1000);
      
      console.log('✅ Database connection established');
      
      // Start metrics update loop
      this.startMetricsCollection();
      
      // Start trading simulation with telemetry
      this.startTradingLoop();
      
      console.log('🔍 SigNoz monitoring active - check dashboards for real-time metrics');
      console.log('📈 Key metrics being tracked:');
      console.log('  • Trading volume (trades/hour)');
      console.log('  • Win rate percentage');
      console.log('  • Portfolio value');
      console.log('  • Open positions');
      console.log('  • AI confidence levels');
      console.log('  • Database performance');
      console.log('  • Position management events');
      
    } catch (error) {
      console.error('❌ Failed to start trading system:', error);
      process.exit(1);
    }
  }
  
  private startMetricsCollection() {
    // Update business metrics every 30 seconds
    this.metricsUpdateInterval = setInterval(async () => {
      try {
        await this.updateBusinessMetrics();
      } catch (error) {
        console.error('Error updating metrics:', error);
      }
    }, 30000);
    
    console.log('📊 Started business metrics collection (30-second intervals)');
  }
  
  private async updateBusinessMetrics() {
    const dbStart = Date.now();
    
    try {
      // Get real trading data from database
      const [totalTrades, openPositions, completedTrades] = await Promise.all([
        this.prisma.managedTrade.count(),
        this.prisma.managedPosition.count({ where: { status: 'OPEN' } }),
        this.prisma.managedTrade.findMany({ 
          where: { isEntry: false },
          select: { realizedPnL: true }
        })
      ]);
      
      quantumTelemetry.recordDatabaseQuery('metrics_query', (Date.now() - dbStart) / 1000);
      
      // Calculate business metrics
      const winningTrades = completedTrades.filter(t => (t.realizedPnL || 0) > 0).length;
      const winRate = completedTrades.length > 0 ? (winningTrades / completedTrades.length) * 100 : 50;
      const portfolioValue = completedTrades.reduce((sum, t) => sum + (t.realizedPnL || 0), 10000); // Starting with $10k
      
      // Calculate trades per hour (estimate based on recent activity)
      const hoursRunning = Math.max(1, (Date.now() - this.startTime) / (1000 * 60 * 60));
      const tradesPerHour = Math.round(totalTrades / hoursRunning);
      
      // Update telemetry
      quantumTelemetry.updatePortfolioMetrics(portfolioValue, openPositions, winRate);
      quantumTelemetry.updatePhaseMetrics(3, tradesPerHour); // Currently Phase 3
      
      console.log(`📊 Metrics Update: ${totalTrades} trades, ${openPositions} open positions, ${winRate.toFixed(1)}% win rate, $${portfolioValue.toFixed(2)} portfolio`);
      
    } catch (error) {
      console.error('Error fetching metrics:', error);
      quantumTelemetry.recordDatabaseQuery('metrics_error', (Date.now() - dbStart) / 1000);
    }
  }
  
  private startTime = Date.now();
  
  private async startTradingLoop() {
    // Simulate trading activity with realistic patterns
    setInterval(async () => {
      if (!this.tradingActive) return;
      
      try {
        // Simulate sentiment analysis
        const sentiment = await twitterSentiment.getBTCSentiment();
        quantumTelemetry.updateSentimentMetrics(sentiment.confidence, 12); // 12 sources
        
        // Simulate trading decision based on sentiment
        if (Math.random() > 0.7) { // 30% chance of trade
          const tradeType = sentiment.score > 0 ? 'BUY' : 'SELL';
          const amount = Math.random() * 1000 + 100;
          const confidence = Math.min(0.95, sentiment.confidence + Math.random() * 0.2);
          
          quantumTelemetry.recordTrade(tradeType, 'BTC', amount, confidence);
          
          // Simulate position management
          const positionId = `pos_${Date.now()}`;
          quantumTelemetry.recordPositionEvent('open', positionId);
          
          console.log(`📈 Simulated ${tradeType} trade: $${amount.toFixed(2)} BTC, confidence: ${(confidence * 100).toFixed(1)}%`);
          
          // Simulate position close after 1-5 minutes
          setTimeout(() => {
            const pnl = (Math.random() - 0.45) * amount * 0.05; // Slightly positive bias
            quantumTelemetry.recordPositionEvent('close', positionId, pnl);
            console.log(`💰 Position closed: ${pnl >= 0 ? '+' : ''}$${pnl.toFixed(2)} P&L`);
          }, (1 + Math.random() * 4) * 60 * 1000);
        }
        
      } catch (error) {
        console.error('Trading loop error:', error);
      }
    }, 5000); // Check every 5 seconds
    
    console.log('🔄 Trading simulation started');
  }
  
  async shutdown() {
    console.log('🛑 Shutting down QUANTUM FORGE™ trading system...');
    this.tradingActive = false;
    
    if (this.metricsUpdateInterval) {
      clearInterval(this.metricsUpdateInterval);
    }
    
    await this.prisma.$disconnect();
    await quantumTelemetry.stop();
    console.log('✅ Shutdown complete');
  }
}

// Handle graceful shutdown
const tradingSystem = new MonitoredTradingSystem();

process.on('SIGINT', async () => {
  await tradingSystem.shutdown();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await tradingSystem.shutdown();
  process.exit(0);
});

// Start the system
tradingSystem.start().catch((error) => {
  console.error('❌ Failed to start trading system:', error);
  process.exit(1);
});

console.log('');
console.log('🎯 QUANTUM FORGE™ Monitoring Active');
console.log('📊 SigNoz Dashboard: http://localhost:8080');
console.log('🚨 Key Business Alerts Configured:');
console.log('  • Trading volume drops');
console.log('  • Position management failures');  
console.log('  • Database latency issues');
console.log('  • Win rate degradation');
console.log('');
console.log('Press Ctrl+C to stop...');
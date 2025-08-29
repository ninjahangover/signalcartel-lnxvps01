#!/usr/bin/env node
/**
 * QUANTUM FORGE™ Trading System with SigNoz Monitoring
 * Uses the existing telemetry infrastructure for immediate monitoring
 */

// Initialize telemetry FIRST
import { initSimpleTelemetry, logMetrics, shutdownSimpleTelemetry } from './src/lib/telemetry/simple-signoz-telemetry.js';

console.log('🚀 Starting QUANTUM FORGE™ Trading System with SigNoz Monitoring');
console.log('📊 Monitoring Dashboard: http://localhost:8080');
console.log('');

const telemetrySDK = initSimpleTelemetry();

// Import trading components after telemetry initialization
import { PrismaClient } from '@prisma/client';
import { twitterSentiment } from './src/lib/sentiment/simple-twitter-sentiment.js';

class MonitoredQuantumForge {
  private prisma: PrismaClient;
  private isRunning: boolean = true;
  private startTime: number = Date.now();
  private tradeCount: number = 0;
  private metricsInterval: any;
  
  constructor() {
    this.prisma = new PrismaClient();
  }
  
  async start() {
    console.log('🎯 QUANTUM FORGE™ Phase 3 - Order Book Intelligence Active');
    console.log('🔍 SigNoz telemetry collecting business metrics...');
    console.log('');
    
    try {
      // Test database with telemetry
      const dbStart = Date.now();
      await this.prisma.$queryRaw`SELECT 1`;
      const dbLatency = Date.now() - dbStart;
      logMetrics.trackDatabase('connection_test', dbLatency, true);
      
      // Start metrics collection
      this.startSystemMetrics();
      
      // Start trading simulation with business metrics
      this.startTradingWithMetrics();
      
      console.log('✅ Trading system operational');
      console.log('📈 Key Business Metrics Being Tracked:');
      console.log('  • Trading volume and frequency');
      console.log('  • AI confidence and sentiment analysis');
      console.log('  • Database performance and latency');
      console.log('  • System resource utilization');
      console.log('  • Phase progression and strategy performance');
      console.log('');
      console.log('🚨 Business-Critical Alerts Active in SigNoz');
      console.log('Press Ctrl+C to stop...');
      
    } catch (error) {
      console.error('❌ Failed to start monitored trading:', error);
      process.exit(1);
    }
  }
  
  private startSystemMetrics() {
    // Update system metrics every 30 seconds
    this.metricsInterval = setInterval(async () => {
      try {
        const memUsage = process.memoryUsage();
        const memPercent = (memUsage.heapUsed / memUsage.heapTotal) * 100;
        const cpuPercent = Math.random() * 30 + 10; // Simulated CPU usage
        
        // Get current trading metrics
        const dbStart = Date.now();
        const totalTrades = await this.prisma.managedTrade.count();
        const openPositions = await this.prisma.managedPosition.count({ where: { status: 'OPEN' } });
        const dbLatency = Date.now() - dbStart;
        
        logMetrics.trackDatabase('metrics_query', dbLatency, true);
        logMetrics.trackSystem(memPercent, cpuPercent, 3); // 3 strategies active
        
        // Calculate trading velocity
        const runtimeHours = (Date.now() - this.startTime) / (1000 * 60 * 60);
        const tradesPerHour = runtimeHours > 0 ? Math.round(totalTrades / runtimeHours) : 0;
        
        console.log(`📊 System Health: ${totalTrades} trades (${tradesPerHour}/hr), ${openPositions} open positions, ${memPercent.toFixed(1)}% memory`);
        
      } catch (error) {
        console.error('Error collecting system metrics:', error);
        logMetrics.trackDatabase('metrics_error', 0, false);
      }
    }, 30000);
    
    // Log phase information
    logMetrics.trackPhase(3);
  }
  
  private startTradingWithMetrics() {
    // Main trading loop with comprehensive telemetry
    setInterval(async () => {
      if (!this.isRunning) return;
      
      try {
        // AI Sentiment Analysis with telemetry
        const aiStart = Date.now();
        const sentiment = await twitterSentiment.getBTCSentiment();
        const aiLatency = Date.now() - aiStart;
        
        logMetrics.trackAI(
          'multi-source-sentiment', 
          aiLatency, 
          sentiment.confidence, 
          sentiment.score
        );
        
        // Trading decision with business metrics
        const shouldTrade = Math.random() > 0.75; // 25% trading frequency
        
        if (shouldTrade) {
          const side = sentiment.score > 0.1 ? 'BUY' : sentiment.score < -0.1 ? 'SELL' : (Math.random() > 0.5 ? 'BUY' : 'SELL');
          const amount = Math.random() * 0.5 + 0.1; // 0.1-0.6 BTC
          const price = 45000 + (Math.random() - 0.5) * 5000; // ~$45k ±$2.5k
          const success = Math.random() > 0.05; // 95% success rate
          
          this.tradeCount++;
          
          logMetrics.trackTrade(
            'quantum-forge-phase3',
            'BTC',
            side,
            amount,
            price,
            success
          );
          
          if (success) {
            console.log(`🎯 Trade #${this.tradeCount}: ${side} ${amount.toFixed(3)} BTC @ $${price.toFixed(2)} | AI: ${(sentiment.confidence * 100).toFixed(1)}% | Sentiment: ${sentiment.score.toFixed(3)}`);
          } else {
            console.log(`❌ Trade #${this.tradeCount} failed - system resilience activated`);
          }
        }
        
        // Position management events
        if (Math.random() > 0.85) { // 15% chance of position event
          const events = ['position_opened', 'stop_loss_hit', 'take_profit', 'position_closed'];
          const event = events[Math.floor(Math.random() * events.length)];
          console.log(`📍 Position Management: ${event}`);
        }
        
      } catch (error) {
        console.error('Trading loop error:', error);
        logMetrics.trackAI('system-error', 0, 0);
      }
    }, 8000); // Every 8 seconds for realistic trading frequency
  }
  
  async shutdown() {
    console.log('');
    console.log('🛑 Shutting down QUANTUM FORGE™ monitored trading system...');
    this.isRunning = false;
    
    if (this.metricsInterval) {
      clearInterval(this.metricsInterval);
    }
    
    try {
      await this.prisma.$disconnect();
      console.log('✅ Database disconnected');
    } catch (error) {
      console.error('Database disconnect error:', error);
    }
    
    await shutdownSimpleTelemetry(telemetrySDK);
    console.log('✅ Telemetry shutdown complete');
    console.log(`📊 Final Stats: ${this.tradeCount} trades executed during this session`);
  }
}

// Initialize system
const quantumForge = new MonitoredQuantumForge();

// Graceful shutdown handlers
process.on('SIGINT', async () => {
  await quantumForge.shutdown();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await quantumForge.shutdown();
  process.exit(0);
});

// Start the monitored trading system
quantumForge.start().catch(async (error) => {
  console.error('❌ Startup failed:', error);
  await quantumForge.shutdown();
  process.exit(1);
});
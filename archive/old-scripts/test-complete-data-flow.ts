#!/usr/bin/env tsx

/**
 * Complete Data Flow Test
 * 
 * Tests the entire pipeline:
 * 1. Market Data Collection (Binance/CoinGecko → PostgreSQL)
 * 2. AI Analysis & Optimization
 * 3. Trade Signal Generation
 * 4. Execution (Alpaca Paper Trading)
 * 
 * Run with: npx tsx test-complete-data-flow.ts
 */

import { PrismaClient } from '@prisma/client';
import { marketDataCollector } from './src/lib/market-data-collector';
import { realTimePriceFetcher } from './src/lib/real-time-price-fetcher';
import { stratusEngine, getAITradingSignal } from './src/lib/stratus-engine-ai';
import RSIStrategyOptimizer from './src/lib/rsi-strategy-optimizer';
import StrategyExecutionEngine from './src/lib/strategy-execution-engine';
import { alpacaPaperTradingService } from './src/lib/alpaca-paper-trading-service';
import { aiTradeMonitor } from './src/lib/ai-trade-monitor';

const prisma = new PrismaClient();

async function testDataFlow() {
  console.log('🔍 Testing Complete Data Flow Pipeline\n');
  console.log('=' .repeat(60));
  
  // Test 1: Market Data Collection to Database
  console.log('\n📊 STEP 1: Market Data Collection (Binance/CoinGecko → PostgreSQL)');
  console.log('-' .repeat(60));
  
  try {
    // Check if market data collector is working
    const testSymbol = 'BTCUSD';
    
    // Fetch real price from multiple sources
    console.log(`\nFetching real-time price for ${testSymbol}...`);
    const priceData = await realTimePriceFetcher.getCurrentPrice(testSymbol, true);
    
    if (priceData.success) {
      console.log(`✅ Price fetched from ${priceData.source}: $${priceData.price.toLocaleString()}`);
    } else {
      console.log(`❌ Failed to fetch price: ${priceData.error}`);
    }
    
    // Check database for stored market data
    console.log('\nChecking PostgreSQL/SQLite for stored market data...');
    const recentData = await prisma.marketData.findMany({
      where: {
        symbol: testSymbol,
        timestamp: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
        }
      },
      orderBy: { timestamp: 'desc' },
      take: 5
    });
    
    console.log(`📈 Found ${recentData.length} recent data points in database`);
    if (recentData.length > 0) {
      console.log('Latest data points:');
      recentData.forEach(dp => {
        console.log(`  - ${dp.timestamp.toISOString()}: $${dp.close.toLocaleString()}`);
      });
    }
    
    // Check collection status
    const collectionStatus = await prisma.marketDataCollection.findUnique({
      where: { symbol: testSymbol }
    });
    
    if (collectionStatus) {
      console.log(`\n📊 Collection Status for ${testSymbol}:`);
      console.log(`  - Status: ${collectionStatus.status}`);
      console.log(`  - Data Points: ${collectionStatus.dataPoints}`);
      console.log(`  - Completeness: ${collectionStatus.completeness}%`);
      console.log(`  - Oldest Data: ${collectionStatus.oldestData?.toISOString() || 'N/A'}`);
      console.log(`  - Newest Data: ${collectionStatus.newestData?.toISOString() || 'N/A'}`);
    }
    
  } catch (error) {
    console.error('❌ Market data collection error:', error);
  }
  
  // Test 2: AI Analysis
  console.log('\n🤖 STEP 2: AI Analysis & Optimization');
  console.log('-' .repeat(60));
  
  try {
    // Get AI trading decision
    console.log('\nGenerating AI trading decision for BTCUSD...');
    const aiDecision = await getAITradingSignal('BTCUSD');
    
    console.log('AI Decision:', {
      action: aiDecision.decision,
      confidence: `${(aiDecision.confidence * 100).toFixed(1)}%`,
      aiScore: aiDecision.aiScore,
      expectedWinRate: `${aiDecision.expectedWinRate.toFixed(1)}%`,
      riskLevel: aiDecision.riskLevel,
      reasoning: aiDecision.reasoning.slice(0, 2) // First 2 reasons
    });
    
    // Check RSI optimizer
    console.log('\nChecking RSI Strategy Optimizer...');
    const optimizer = RSIStrategyOptimizer.getInstance();
    const currentParams = optimizer.getCurrentParameters();
    const optimizationHistory = optimizer.getOptimizationHistory();
    
    console.log('Current Optimized Parameters:', {
      rsiPeriod: currentParams.rsi_period,
      oversold: currentParams.oversold_level,
      overbought: currentParams.overbought_level,
      confirmationPeriod: currentParams.confirmation_period
    });
    console.log(`Optimization Cycles Completed: ${optimizationHistory.length}`);
    
    // Get Stratus Engine performance
    const stratusPerf = stratusEngine.getPerformanceMetrics();
    console.log('\nStratus Engine Performance:', {
      totalTrades: stratusPerf.totalTrades,
      winRate: `${stratusPerf.currentWinRate.toFixed(1)}%`,
      aiAccuracy: `${stratusPerf.aiAccuracyScore.toFixed(1)}%`,
      learningIterations: stratusPerf.learningIterations
    });
    
  } catch (error) {
    console.error('❌ AI analysis error:', error);
  }
  
  // Test 3: Trade Execution
  console.log('\n⚡ STEP 3: Trade Signal Generation & Execution');
  console.log('-' .repeat(60));
  
  try {
    const engine = StrategyExecutionEngine.getInstance();
    
    console.log('\nStrategy Execution Engine Status:');
    console.log(`  - Engine Running: ${engine.isEngineRunning() ? 'YES' : 'NO'}`);
    console.log(`  - Mode: ${engine.isPaperTradingMode() ? 'PAPER' : 'LIVE'}`);
    console.log(`  - Active Strategies: ${engine.getActiveStrategies().length}`);
    
    const dashboard = engine.getPerformanceDashboard();
    console.log('\nPerformance Dashboard:', {
      paperTradingMode: dashboard.paperTradingMode,
      totalStrategies: dashboard.totalStrategies,
      strategies: Object.keys(dashboard.strategies).length
    });
    
    // Check Alpaca connection
    console.log('\nChecking Alpaca Paper Trading Connection...');
    const accountInfo = await alpacaPaperTradingService.getAccountInfo();
    if (accountInfo) {
      console.log('✅ Alpaca Connected:', {
        equity: `$${parseFloat(accountInfo.equity).toLocaleString()}`,
        buyingPower: `$${parseFloat(accountInfo.buying_power).toLocaleString()}`
      });
      
      const positions = await alpacaPaperTradingService.getPositions();
      console.log(`  - Open Positions: ${positions.length}`);
      
      const orders = await alpacaPaperTradingService.getOpenOrders();
      console.log(`  - Pending Orders: ${orders.length}`);
    } else {
      console.log('❌ Alpaca not connected');
    }
    
  } catch (error) {
    console.error('❌ Trade execution error:', error);
  }
  
  // Test 4: Complete System Monitoring
  console.log('\n🏥 STEP 4: System Health & Monitoring');
  console.log('-' .repeat(60));
  
  const metrics = aiTradeMonitor.getMetrics();
  
  console.log('\nSystem Health Report:');
  console.log(`  Overall Status: ${metrics.health.overall.toUpperCase()}`);
  
  console.log('\n📊 Market Data:');
  console.log(`  - Active: ${metrics.marketData.isActive ? 'YES' : 'NO'}`);
  console.log(`  - Quality: ${metrics.marketData.dataQuality}`);
  console.log(`  - Symbols: ${metrics.marketData.symbolsMonitored.join(', ')}`);
  
  console.log('\n🤖 AI Analysis:');
  console.log(`  - Active: ${metrics.aiAnalysis.isActive ? 'YES' : 'NO'}`);
  console.log(`  - Optimized: ${metrics.aiAnalysis.parametersOptimized ? 'YES' : 'NO'}`);
  console.log(`  - Learning Progress: ${metrics.aiAnalysis.learningProgress.toFixed(1)}%`);
  
  console.log('\n⚡ Execution:');
  console.log(`  - Mode: ${metrics.execution.mode.toUpperCase()}`);
  console.log(`  - Engine: ${metrics.execution.engineRunning ? 'RUNNING' : 'STOPPED'}`);
  console.log(`  - Trades Executed: ${metrics.execution.tradesExecuted}`);
  
  console.log('\n📈 Performance:');
  console.log(`  - Win Rate: ${metrics.performance.winRate.toFixed(1)}%`);
  console.log(`  - AI Accuracy: ${metrics.performance.aiAccuracy.toFixed(1)}%`);
  
  if (metrics.health.issues.length > 0) {
    console.log('\n⚠️ Issues:');
    metrics.health.issues.forEach(issue => console.log(`  - ${issue}`));
  }
  
  if (metrics.health.recommendations.length > 0) {
    console.log('\n💡 Recommendations:');
    metrics.health.recommendations.forEach(rec => console.log(`  - ${rec}`));
  }
  
  // Generate full report
  console.log('\n' + '=' .repeat(60));
  console.log('FULL SYSTEM REPORT');
  console.log('=' .repeat(60));
  console.log(aiTradeMonitor.generateStatusReport());
}

// Main execution
async function main() {
  console.log('=' .repeat(60));
  console.log('COMPLETE DATA FLOW INTEGRATION TEST');
  console.log('=' .repeat(60));
  
  await testDataFlow();
  
  console.log('\n' + '=' .repeat(60));
  console.log('TEST COMPLETE');
  console.log('=' .repeat(60));
  
  console.log('\n✅ Data Flow Summary:');
  console.log('1. Market Data: Binance/CoinGecko → PostgreSQL/SQLite');
  console.log('2. AI Analysis: Uses 7-day historical data from DB');
  console.log('3. Real-time: Kraken API for live prices');
  console.log('4. Paper Trading: Alpaca API for execution');
  console.log('5. Optimization: Continuous learning from results');
  
  await prisma.$disconnect();
  process.exit(0);
}

// Run the test
main().catch(async (error) => {
  console.error('Fatal error:', error);
  await prisma.$disconnect();
  process.exit(1);
});
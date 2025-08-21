/**
 * Test Trading Pipeline Script
 * 
 * Temporarily adjusts strategy parameters to trigger trades more easily
 * for testing the complete trading pipeline through Alpaca
 */

import { PrismaClient } from '@prisma/client';
import StrategyExecutionEngine from './src/lib/strategy-execution-engine';
import { alpacaPaperTradingService } from './src/lib/alpaca-paper-trading-service';
import marketDataService from './src/lib/market-data-service';

const prisma = new PrismaClient();

// Test configurations with relaxed thresholds
const TEST_CONFIGS = {
  RSI_PULLBACK: {
    // Normal RSI oversold is 30, overbought is 70
    // For testing, we'll use 45 (oversold) and 55 (overbought) - much easier to trigger
    lookback: 14,
    lowerBarrier: 45,     // Usually 30 - RELAXED for testing
    lowerThreshold: 48,   // Usually 40 - RELAXED for testing  
    upperBarrier: 55,     // Usually 70 - RELAXED for testing
    upperThreshold: 52,   // Usually 80 - RELAXED for testing
    maLength: 20,         // Reduced from 50 for faster signals
    atrMultSL: 5.0,       // Wider stop loss to avoid early exits
    atrMultTP: 1.0,       // Tighter take profit for quick wins
    positionSize: 0.001,  // Very small position for safety
    stopLoss: 5.0,
    takeProfit: 1.0
  },
  BOLLINGER_BREAKOUT: {
    smaLength: 10,        // Reduced from 20 for faster response
    ubOffset: 1.0,        // Reduced from 2.0 - easier to break bands
    lbOffset: 1.0,        // Reduced from 2.0 - easier to break bands
    useRSIFilter: false,  // Disable additional filters for easier triggering
    useVolumeFilter: false,
    positionSize: 0.001,
    stopLoss: 5.0,
    takeProfit: 1.0
  },
  QUANTUM_OSCILLATOR: {
    fastPeriod: 3,
    slowPeriod: 5,        // Very fast periods
    signalPeriod: 2,
    overboughtLevel: 55,  // Much easier to hit than 75
    oversoldLevel: 45,    // Much easier to hit than 25
    momentumThreshold: 0.1, // Very low threshold
    volumeMultiplier: 0.5,  // Lower volume requirement
    positionSize: 0.001,
    stopLoss: 5.0,
    takeProfit: 1.0
  }
};

async function setupTestStrategy() {
  console.log('🧪 TRADING PIPELINE TEST MODE');
  console.log('=' + '='.repeat(60));
  console.log('⚠️  WARNING: Using relaxed thresholds for testing!');
  console.log('⚠️  These settings will trigger trades more frequently!\n');
  
  try {
    // 1. Check Alpaca connection
    console.log('📡 Checking Alpaca connection...');
    const account = await alpacaPaperTradingService.getAccountInfo();
    if (!account) {
      throw new Error('Alpaca not connected. Please check API credentials.');
    }
    console.log(`✅ Alpaca connected: $${parseFloat(account.buying_power).toLocaleString()} buying power\n`);
    
    // 2. Get active strategies from database
    const strategies = await prisma.pineStrategy.findMany({
      where: { isActive: true },
      take: 1 // Just test with one strategy for now
    });
    
    if (strategies.length === 0) {
      throw new Error('No active strategies in database');
    }
    
    const testStrategy = strategies[0];
    console.log(`📊 Testing with strategy: ${testStrategy.name}`);
    console.log(`   Type: ${testStrategy.strategyType}\n`);
    
    // 3. Create a test strategy with relaxed parameters
    const engine = StrategyExecutionEngine.getInstance();
    engine.setPaperTradingMode(true);
    
    // Determine config based on strategy type
    let testConfig = TEST_CONFIGS.RSI_PULLBACK; // Default
    if (testStrategy.strategyType.toLowerCase().includes('bollinger')) {
      testConfig = TEST_CONFIGS.BOLLINGER_BREAKOUT;
    } else if (testStrategy.strategyType.toLowerCase().includes('oscillator')) {
      testConfig = TEST_CONFIGS.QUANTUM_OSCILLATOR;
    }
    
    // Create test strategy with relaxed thresholds
    const testStrategyConfig = {
      id: 'test-strategy-001',
      name: `TEST - ${testStrategy.name}`,
      type: 'ENHANCED_RSI_PULLBACK', // We'll use RSI as it's most likely to trigger
      status: 'active' as const,
      config: testConfig,
      isActive: true
    };
    
    console.log('🎯 Test Strategy Configuration:');
    console.log(JSON.stringify(testConfig, null, 2));
    console.log('\n');
    
    // 4. Add strategy to execution engine
    console.log('🚀 Starting execution engine with test strategy...');
    engine.addStrategy(testStrategyConfig, 'BTCUSD');
    engine.startEngine();
    
    // 5. Monitor for trades
    console.log('👀 Monitoring for trade signals...\n');
    console.log('The strategy will now watch market data and trigger when:');
    if (testStrategyConfig.type.includes('RSI')) {
      console.log(`   - RSI drops below ${testConfig.lowerBarrier} (buy signal)`);
      console.log(`   - RSI rises above ${testConfig.upperBarrier} (sell signal)`);
    }
    console.log('\n📊 Market conditions are being evaluated every 30 seconds...\n');
    
    // 6. Set up monitoring interval
    let checkCount = 0;
    const monitorInterval = setInterval(async () => {
      checkCount++;
      console.log(`\n🔄 Check #${checkCount} - ${new Date().toLocaleTimeString()}`);
      
      // Get current market data
      const marketData = marketDataService.getLatestData('BTCUSD');
      if (marketData) {
        console.log(`   BTC Price: $${marketData.price.toLocaleString()}`);
      }
      
      // Check for recent trades
      try {
        const positions = await alpacaPaperTradingService.getPositions();
        const orders = await alpacaPaperTradingService.getOrders({ 
          status: 'all', 
          limit: 5,
          after: new Date(Date.now() - 3600000).toISOString() // Last hour
        });
        
        if (orders && orders.length > 0) {
          console.log(`   🎉 TRADES DETECTED! ${orders.length} recent orders`);
          orders.forEach(order => {
            console.log(`      - ${order.side} ${order.qty} ${order.symbol} (${order.status})`);
          });
          
          console.log('\n✅ PIPELINE TEST SUCCESSFUL! Trades are executing!');
          console.log('🛑 Stopping test mode...');
          clearInterval(monitorInterval);
          engine.stopEngine();
          process.exit(0);
        } else {
          console.log(`   No trades yet. Waiting for market conditions...`);
        }
        
        if (positions.length > 0) {
          console.log(`   📈 Open positions: ${positions.length}`);
        }
      } catch (error) {
        console.log(`   Error checking trades: ${error.message}`);
      }
      
      // Stop after 20 checks (10 minutes)
      if (checkCount >= 20) {
        console.log('\n⏱️  Test timeout reached (10 minutes)');
        console.log('💡 Try running during more volatile market hours');
        console.log('💡 Or further relax the thresholds in the TEST_CONFIGS');
        clearInterval(monitorInterval);
        engine.stopEngine();
        process.exit(0);
      }
    }, 30000); // Check every 30 seconds
    
    // Handle graceful shutdown
    process.on('SIGINT', () => {
      console.log('\n\n🛑 Stopping test mode...');
      clearInterval(monitorInterval);
      engine.stopEngine();
      process.exit(0);
    });
    
  } catch (error: any) {
    console.error('❌ Test setup failed:', error.message);
    process.exit(1);
  } finally {
    // Cleanup will happen on process exit
  }
}

// Run the test
console.log('Starting trading pipeline test...\n');
setupTestStrategy().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
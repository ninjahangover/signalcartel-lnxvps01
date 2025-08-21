#!/usr/bin/env tsx

/**
 * Test script to verify Alpaca paper trading integration
 * Run with: npx tsx test-alpaca-paper-trading.ts
 */

import { alpacaPaperTradingService } from './src/lib/alpaca-paper-trading-service';
import StrategyExecutionEngine from './src/lib/strategy-execution-engine';
import StrategyManager from './src/lib/strategy-manager';

async function testAlpacaConnection() {
  console.log('🔍 Testing Alpaca Paper Trading Integration\n');
  
  // Test 1: Check if Alpaca API keys are configured
  console.log('1️⃣ Checking Alpaca API configuration...');
  const apiKey = process.env.NEXT_PUBLIC_ALPACA_PAPER_API_KEY;
  const apiSecret = process.env.NEXT_PUBLIC_ALPACA_PAPER_API_SECRET;
  
  if (!apiKey || !apiSecret) {
    console.error('❌ Alpaca API keys not found in environment variables');
    console.log('   Please set NEXT_PUBLIC_ALPACA_PAPER_API_KEY and NEXT_PUBLIC_ALPACA_PAPER_API_SECRET');
    return false;
  }
  console.log('✅ API keys found\n');
  
  // Test 2: Try to connect to Alpaca
  console.log('2️⃣ Testing Alpaca API connection...');
  try {
    const accountInfo = await alpacaPaperTradingService.getAccountInfo(apiKey, apiSecret);
    if (accountInfo) {
      console.log('✅ Successfully connected to Alpaca');
      console.log(`   Account ID: ${accountInfo.id}`);
      console.log(`   Buying Power: $${parseFloat(accountInfo.buying_power).toLocaleString()}`);
      console.log(`   Equity: $${parseFloat(accountInfo.equity).toLocaleString()}\n`);
    } else {
      console.error('❌ Failed to get account info');
      return false;
    }
  } catch (error) {
    console.error('❌ Error connecting to Alpaca:', error);
    return false;
  }
  
  // Test 3: Check current positions
  console.log('3️⃣ Checking current positions...');
  try {
    const positions = await alpacaPaperTradingService.getPositions();
    console.log(`   Found ${positions.length} open positions`);
    if (positions.length > 0) {
      positions.forEach(pos => {
        console.log(`   - ${pos.symbol}: ${pos.qty} shares @ $${pos.currentPrice}`);
      });
    }
    console.log('✅ Position check complete\n');
  } catch (error) {
    console.error('❌ Error getting positions:', error);
  }
  
  // Test 4: Check strategy execution engine
  console.log('4️⃣ Checking Strategy Execution Engine...');
  const engine = StrategyExecutionEngine.getInstance();
  console.log(`   Paper Trading Mode: ${engine.isPaperTradingMode() ? 'ENABLED' : 'DISABLED'}`);
  console.log(`   Engine Running: ${engine.isEngineRunning() ? 'YES' : 'NO'}`);
  
  const strategyManager = StrategyManager.getInstance();
  const strategies = strategyManager.getAllStrategies();
  console.log(`   Registered Strategies: ${strategies.length}`);
  
  const activeStrategies = strategies.filter(s => s.status === 'active');
  console.log(`   Active Strategies: ${activeStrategies.length}`);
  
  if (activeStrategies.length > 0) {
    console.log('   Active strategies:');
    activeStrategies.forEach(s => {
      console.log(`   - ${s.name} (${s.id})`);
    });
  }
  console.log('✅ Engine check complete\n');
  
  // Test 5: Test placing a small order (optional)
  console.log('5️⃣ Test Order Placement (Paper Trading)...');
  const testOrder = false; // Set to true to test order placement
  
  if (testOrder) {
    try {
      console.log('   Placing test order: BUY 1 SPY...');
      const order = await alpacaPaperTradingService.placeOrder({
        symbol: 'SPY',
        qty: 1,
        side: 'buy',
        type: 'market',
        timeInForce: 'day'
      });
      
      if (order) {
        console.log('✅ Test order placed successfully');
        console.log(`   Order ID: ${order.id}`);
        console.log(`   Status: ${order.status}`);
      } else {
        console.error('❌ Failed to place test order');
      }
    } catch (error) {
      console.error('❌ Error placing test order:', error);
    }
  } else {
    console.log('   Skipping test order (set testOrder = true to enable)');
  }
  
  return true;
}

// Main execution
async function main() {
  console.log('=' .repeat(50));
  console.log('ALPACA PAPER TRADING INTEGRATION TEST');
  console.log('=' .repeat(50) + '\n');
  
  const success = await testAlpacaConnection();
  
  console.log('\n' + '=' .repeat(50));
  if (success) {
    console.log('✅ All tests passed! Paper trading should work.');
    console.log('\nNext steps:');
    console.log('1. Ensure strategies are active in the dashboard');
    console.log('2. Start the Strategy Execution Engine');
    console.log('3. Monitor the console for trade signals');
  } else {
    console.log('❌ Some tests failed. Please fix the issues above.');
  }
  console.log('=' .repeat(50));
  
  process.exit(success ? 0 : 1);
}

// Run the test
main().catch(console.error);
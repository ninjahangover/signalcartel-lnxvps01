/**
 * Test Script for Enhanced RSI Pull-Back Strategy
 * Using aggressive settings for first trade generation
 */

import { EnhancedRSIPullBackStrategy } from './src/lib/strategy-implementations';
import { MarketData } from './src/lib/market-data-service';

// Your aggressive RSI configuration
const aggressiveRSIConfig = {
  lookback: 2,           // Very fast RSI
  lowerBarrier: 43,      // Close to 50 (easier to trigger)
  lowerThreshold: 65,    // High threshold (easier buy conditions)
  upperBarrier: 45,      // Close to 50 (easier to trigger)  
  upperThreshold: 72,    // High threshold (easier sell conditions)
  maLength: 70,          // Medium-term trend filter
  atrMultSL: 11,         // Very wide stop loss (avoid early exits)
  atrMultTP: 2,          // Conservative take profit
  initialCapital: 50,
  tradePercentage: 20
};

// Create strategy instance
const strategy = new EnhancedRSIPullBackStrategy(
  'test-rsi-001', 
  'BTC/USD', 
  aggressiveRSIConfig
);

// Test with sample market data
function testStrategy() {
  console.log('🎯 Testing Enhanced RSI Pull-Back Strategy with Aggressive Settings');
  console.log('Configuration:', aggressiveRSIConfig);
  console.log('\\n' + '='.repeat(60) + '\\n');

  // Simulate price movement that should trigger signals
  const testPrices = [
    50000, 49800, 49600, 49400, 49200, 49000,  // Declining trend
    49100, 49300, 49500, 49700, 49900, 50100,  // Recovery (should trigger buy)
    50300, 50500, 50700, 50900, 51100, 51300,  // Uptrend continues
    51100, 50900, 50700, 50500, 50300, 50100   // Pullback
  ];

  testPrices.forEach((price, index) => {
    const marketData: MarketData = {
      symbol: 'BTC/USD',
      price: price,
      high: price + 50,
      low: price - 50,
      volume: 1000000,
      timestamp: new Date(Date.now() + index * 60000) // 1 minute intervals
    };

    const signal = strategy.analyzeMarket(marketData);
    
    if (signal.action !== 'HOLD') {
      console.log(`📊 Bar ${index + 1}: Price $${price.toLocaleString()}`);
      console.log(`🚨 SIGNAL: ${signal.action}`);
      console.log(`💪 Confidence: ${(signal.confidence * 100).toFixed(1)}%`);
      console.log(`📝 Reason: ${signal.reason}`);
      console.log(`💰 Quantity: ${signal.quantity.toFixed(4)}`);
      console.log(`🛑 Stop Loss: $${signal.stopLoss.toLocaleString()}`);
      console.log(`🎯 Take Profit: $${signal.takeProfit.toLocaleString()}`);
      console.log(`📈 Metadata:`, signal.metadata);
      console.log('\\n' + '-'.repeat(40) + '\\n');
    }
  });
}

// Expected behavior with these settings:
console.log('📋 Expected Strategy Behavior:');
console.log('• RSI Lookback = 2: Very responsive to price changes');
console.log('• Lower Barrier = 43: Buy signals when RSI drops below 43');
console.log('• Lower Threshold = 65: Must have been above 65 recently'); 
console.log('• Upper Barrier = 45: Sell signals when RSI rises above 45');
console.log('• Upper Threshold = 72: Must have been below 72 recently');
console.log('• MA Length = 70: Trend filter using 70-period moving average');
console.log('• Stop Loss = 11x ATR: Very wide stops to avoid premature exits');
console.log('• Take Profit = 2x ATR: Conservative profit targets');
console.log('\\n');

// Run the test
testStrategy();
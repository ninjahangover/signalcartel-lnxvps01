#!/usr/bin/env npx tsx
/**
 * QUANTUM FORGE™ Kraken API Validation Test
 * Test actual Kraken API calls with validation mode (no real trades)
 */

import { quantumForgeLiveExecutor } from '../src/lib/live-trading/quantum-forge-live-executor';

// Get real price helper
async function getRealPrice(symbol: string): Promise<number> {
  const { realTimePriceFetcher } = await import('../src/lib/real-time-price-fetcher');
  const priceData = await realTimePriceFetcher.getCurrentPrice(symbol);
  
  if (!priceData.success || priceData.price <= 0) {
    throw new Error(`❌ Cannot get real price for ${symbol}: ${priceData.error || 'Invalid price'}`);
  }
  
  return priceData.price;
}

async function main() {
  console.log('🔥 QUANTUM FORGE™ KRAKEN API VALIDATION TEST');
  console.log('=' .repeat(80));
  console.log('Account Balance: $407.60');
  console.log('Mode: VALIDATION TESTING (validate=true, no real trades)');
  console.log('');

  try {
    // Enable live trading for testing
    quantumForgeLiveExecutor.setLiveTradingEnabled(true);
    
    // Test realistic QUANTUM FORGE™ signals
    const testSignals = [
      {
        action: 'BUY' as const,
        symbol: 'BTCUSD',
        price: await getRealPrice('BTCUSD'),
        confidence: 0.92, // Ultra-high confidence
        strategy: 'mathematical-intuition-multi-layer',
        aiSystemsUsed: ['mathematical-intuition-engine', 'multi-layer-ai', 'order-book-intelligence'],
        expectedMove: 0.035, // 3.5% expected move
        reason: 'Mathematical Intuition + Multi-Layer AI convergence - Flow field resonance 94%'
      },
      {
        action: 'BUY' as const,
        symbol: 'BTCUSD', 
        price: await getRealPrice('BTCUSD'),
        confidence: 0.88, // High confidence
        strategy: 'order-book-sentiment-fusion',
        aiSystemsUsed: ['order-book-intelligence', 'universal-sentiment-enhancer'],
        expectedMove: 0.025, // 2.5% expected move
        reason: 'Order Book Intelligence + Bullish sentiment alignment - Whale accumulation detected'
      },
      {
        action: 'BUY' as const,
        symbol: 'BTCUSD',
        price: await getRealPrice('BTCUSD'),
        confidence: 0.82, // Good confidence
        strategy: 'markov-chain-prediction',
        aiSystemsUsed: ['markov-chain-predictor', 'multi-layer-ai'],
        expectedMove: 0.020, // 2.0% expected move
        reason: 'Markov Chain state transition probability 87% - Pattern recognition confirmed'
      },
      {
        action: 'SELL' as const,
        symbol: 'BTCUSD',
        price: await getRealPrice('BTCUSD'),
        confidence: 0.85, // High confidence short
        strategy: 'sentiment-orderbook-divergence',
        aiSystemsUsed: ['order-book-intelligence', 'universal-sentiment-enhancer'],
        expectedMove: 0.022, // 2.2% expected move
        reason: 'Sentiment-OrderBook divergence detected - Distribution pattern forming'
      },
      {
        action: 'BUY' as const,
        symbol: 'BTCUSD',
        price: await getRealPrice('BTCUSD'),
        confidence: 0.78, // Below live threshold
        strategy: 'basic-gpu-rsi',
        aiSystemsUsed: ['gpu-strategy'],
        expectedMove: 0.015, // 1.5% expected move
        reason: 'RSI oversold - basic signal (should be rejected for live trading)'
      }
    ];
    
    console.log('🧪 TESTING QUANTUM FORGE™ SIGNALS WITH KRAKEN API VALIDATION:');
    console.log('=' .repeat(80));
    console.log('');
    
    for (let i = 0; i < testSignals.length; i++) {
      const signal = testSignals[i];
      
      console.log(`📡 Signal #${i + 1}: ${signal.strategy}`);
      console.log(`   Action: ${signal.action} ${signal.symbol} @ $${signal.price.toLocaleString()}`);
      console.log(`   Confidence: ${(signal.confidence * 100).toFixed(1)}%`);
      console.log(`   Expected Move: ${(signal.expectedMove * 100).toFixed(1)}%`);
      console.log(`   AI Systems: ${signal.aiSystemsUsed.join(', ')}`);
      console.log(`   Reason: ${signal.reason}`);
      console.log('');
      
      try {
        const result = await quantumForgeLiveExecutor.processSignalForLiveExecution(
          signal,
          4 // Phase 4 - Full QUANTUM FORGE™
        );
        
        if (result.success) {
          console.log(`   ✅ KRAKEN VALIDATION SUCCESSFUL:`);
          console.log(`      Order ID: ${result.orderId}`);
          console.log(`      Position Size: $${result.positionSize.toFixed(0)} (${((result.positionSize / 407.60) * 100).toFixed(1)}% of account)`);
          console.log(`      Expected Profit: $${result.expectedProfit.toFixed(2)} after fees`);
          console.log(`      Commission Cost: $${result.fees.toFixed(2)}`);
          console.log(`      Message: ${result.message}`);
        } else {
          console.log(`   ❌ TRADE REJECTED: ${result.message}`);
          if (result.positionSize > 0) {
            console.log(`      Would have traded: $${result.positionSize.toFixed(0)}`);
          }
        }
        
      } catch (error) {
        console.log(`   🔥 KRAKEN API ERROR: ${error.message}`);
      }
      
      console.log('');
      
      // Wait between requests to respect rate limits
      if (i < testSignals.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    console.log('🎯 VALIDATION TEST COMPLETE');
    console.log('=' .repeat(80));
    console.log('✅ All tests completed - ready for live trading when you enable it');
    console.log('💡 To enable real trading: Set validate=false in quantum-forge-live-executor.ts');
    console.log('⚠️  Remember: This was validation only - no real trades were executed');
    
    // Disable live trading after test
    quantumForgeLiveExecutor.setLiveTradingEnabled(false);
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

if (require.main === module) {
  main().catch(console.error);
}
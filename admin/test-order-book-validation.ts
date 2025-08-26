/**
 * Test Order Book Validation Integration
 * 
 * Tests the new QUANTUM FORGE™ order book validation layer
 * integrated with sentiment enhancement system
 */

import { UniversalSentimentEnhancer, BaseStrategySignal } from './src/lib/sentiment/universal-sentiment-enhancer';

async function testOrderBookValidation() {
  console.log('🧪 TESTING QUANTUM FORGE™ ORDER BOOK VALIDATION INTEGRATION');
  console.log('===========================================================');

  const sentimentEnhancer = new UniversalSentimentEnhancer();

  // Create test trading signals
  const testSignals: BaseStrategySignal[] = [
    {
      symbol: 'BTC',
      action: 'BUY',
      confidence: 0.75,
      price: 109000,
      strategy: 'RSI_PULLBACK_TEST',
      reason: 'RSI oversold at 28, bullish divergence detected'
    },
    {
      symbol: 'BTC',
      action: 'SELL',
      confidence: 0.68,
      price: 109500,
      strategy: 'BOLLINGER_BREAKOUT_TEST',
      reason: 'Price above upper Bollinger band, momentum weakening'
    }
  ];

  console.log(`\n🔍 Testing ${testSignals.length} signals with QUANTUM FORGE™ validation...`);

  try {
    for (let i = 0; i < testSignals.length; i++) {
      const signal = testSignals[i];
      console.log(`\n--- Test Signal ${i + 1}: ${signal.action} ${signal.symbol} ---`);
      console.log(`Original: ${signal.action} at $${signal.price} (${(signal.confidence * 100).toFixed(1)}% confidence)`);
      console.log(`Reason: ${signal.reason}`);
      
      console.log(`\n🔬 Running QUANTUM FORGE™ enhancement (sentiment + order book)...`);
      const enhanced = await sentimentEnhancer.enhanceSignal(signal, {
        enableOrderBookValidation: true,
        minOrderBookValidation: 50, // Lower threshold for testing
        skipOnOrderBookConflict: false, // Don't skip for testing
        maxOrderBookBoost: 0.3 // Allow higher boost for testing
      });

      console.log(`\n📊 ENHANCEMENT RESULTS:`);
      console.log(`  Final Action: ${enhanced.finalAction}`);
      console.log(`  Final Confidence: ${(enhanced.confidence * 100).toFixed(1)}%`);
      console.log(`  Should Execute: ${enhanced.shouldExecute}`);
      console.log(`  Sentiment Score: ${enhanced.sentimentScore.toFixed(3)}`);
      console.log(`  Sentiment Conflict: ${enhanced.sentimentConflict}`);
      console.log(`  Order Book Conflict: ${enhanced.orderBookConflict}`);
      console.log(`  Market Structure Risk: ${enhanced.marketStructureRisk}`);
      console.log(`  Confidence Boost (Sentiment): ${(enhanced.confidenceModifier * 100).toFixed(1)}%`);
      console.log(`  Confidence Boost (Order Book): ${(enhanced.orderBookModifier * 100).toFixed(1)}%`);
      
      if (enhanced.orderBookValidation) {
        console.log(`\n📋 ORDER BOOK VALIDATION DETAILS:`);
        console.log(`  Validation Strength: ${enhanced.orderBookValidation.validationStrength.toFixed(1)}%`);
        console.log(`  Signal Alignment: ${enhanced.orderBookValidation.signalAlignment.toFixed(1)}%`);
        console.log(`  Order Book Signal: ${enhanced.orderBookValidation.orderBookSignal}`);
        console.log(`  Recommended Action: ${enhanced.orderBookValidation.recommendedAction}`);
        console.log(`  Risk Level: ${enhanced.orderBookValidation.riskLevel}`);
        console.log(`  Validation Reason: ${enhanced.orderBookValidation.validationReason}`);
      }
      
      console.log(`\n🎯 FINAL REASON: ${enhanced.enhancedReason}`);
      
      if (i < testSignals.length - 1) {
        console.log('\n' + '='.repeat(80));
      }
    }

    console.log('\n✅ QUANTUM FORGE™ ORDER BOOK VALIDATION TEST COMPLETED SUCCESSFULLY');
    console.log('🚀 Order book validation is now integrated with sentiment enhancement!');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testOrderBookValidation().catch(console.error);
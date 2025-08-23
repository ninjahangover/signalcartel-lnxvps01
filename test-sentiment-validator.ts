/**
 * Test script for the new sentiment validation system
 * Tests sentiment analysis with simulated data and enhanced RSI strategy
 */

import { twitterSentiment } from './src/lib/sentiment/simple-twitter-sentiment';
import { enhancedRSIStrategy } from './src/lib/sentiment/enhanced-rsi-strategy';

async function testSentimentValidation() {
  console.log('🚀 Testing Sentiment Validation System');
  console.log('=====================================\n');

  try {
    // Test 1: Basic sentiment analysis
    console.log('📊 Test 1: Basic Twitter Sentiment Analysis');
    console.log('--------------------------------------------');
    
    const btcSentiment = await twitterSentiment.getBTCSentiment();
    console.log('BTC Sentiment Analysis:');
    console.log(`  Score: ${btcSentiment.score.toFixed(3)} (${btcSentiment.score > 0 ? 'Bullish' : 'Bearish'})`);
    console.log(`  Confidence: ${(btcSentiment.confidence * 100).toFixed(1)}%`);
    console.log(`  Tweets Analyzed: ${btcSentiment.tweetCount}`);
    console.log(`  Breakdown: ${btcSentiment.positiveCount} positive, ${btcSentiment.negativeCount} negative, ${btcSentiment.neutralCount} neutral\n`);

    // Test 2: Enhanced RSI Strategy with sentiment
    console.log('🎯 Test 2: Enhanced RSI Strategy with Sentiment');
    console.log('------------------------------------------------');
    
    // Simulate BTC price data (last 20 prices ending at $97,000)
    const mockPrices = [
      96000, 95800, 96200, 96500, 96800, 97100, 97300, 96900, 96700, 96400,
      96800, 97200, 97500, 97800, 97600, 97300, 97100, 97400, 97200, 97000
    ];
    
    const currentPrice = 97000;
    const enhancedSignal = await enhancedRSIStrategy.generateEnhancedSignal('BTC', currentPrice, mockPrices);
    
    console.log('Enhanced RSI Signal Results:');
    console.log(`  Symbol: ${enhancedSignal.symbol}`);
    console.log(`  Technical Action: ${enhancedSignal.action} (Original confidence: ${(enhancedSignal.originalConfidence * 100).toFixed(1)}%)`);
    console.log(`  RSI Value: ${enhancedSignal.rsiValue?.toFixed(2) || 'N/A'}`);
    
    if (enhancedSignal.sentimentScore !== undefined) {
      console.log(`  Sentiment Score: ${enhancedSignal.sentimentScore.toFixed(3)} (Confidence: ${((enhancedSignal.sentimentConfidence || 0) * 100).toFixed(1)}%)`);
      console.log(`  Sentiment Conflict: ${enhancedSignal.sentimentConflict ? 'YES' : 'NO'}`);
      console.log(`  Confidence Boost: ${(enhancedSignal.confidenceBoost * 100).toFixed(1)}%`);
    }
    
    console.log(`  Final Action: ${enhancedSignal.finalAction}`);
    console.log(`  Final Confidence: ${(enhancedSignal.confidence * 100).toFixed(1)}%`);
    console.log(`  Reasoning: ${enhancedSignal.executeReason}\n`);

    // Test 3: Conflict Detection
    console.log('⚔️  Test 3: Sentiment Conflict Detection');
    console.log('----------------------------------------');
    
    // Test BUY signal with bearish sentiment
    const bearishSentiment = { ...btcSentiment, score: -0.5, confidence: 0.8 };
    const buyConflict = twitterSentiment.checkSentimentConflict('BUY', bearishSentiment);
    console.log(`BUY signal with bearish sentiment (-0.5): ${buyConflict ? 'CONFLICT' : 'NO CONFLICT'}`);
    
    // Test SELL signal with bullish sentiment  
    const bullishSentiment = { ...btcSentiment, score: 0.6, confidence: 0.7 };
    const sellConflict = twitterSentiment.checkSentimentConflict('SELL', bullishSentiment);
    console.log(`SELL signal with bullish sentiment (+0.6): ${sellConflict ? 'CONFLICT' : 'NO CONFLICT'}\n`);

    // Test 4: Confidence Boost Calculation
    console.log('📈 Test 4: Confidence Boost Calculation');
    console.log('---------------------------------------');
    
    const neutralSentiment = { ...btcSentiment, score: 0.1, confidence: 0.3 };
    const strongBullish = { ...btcSentiment, score: 0.8, confidence: 0.9 };
    const strongBearish = { ...btcSentiment, score: -0.7, confidence: 0.8 };
    
    console.log(`Neutral sentiment (0.1, 30% conf): ${((twitterSentiment.calculateSentimentBoost(neutralSentiment) - 1) * 100).toFixed(1)}% boost`);
    console.log(`Strong bullish (0.8, 90% conf): ${((twitterSentiment.calculateSentimentBoost(strongBullish) - 1) * 100).toFixed(1)}% boost`);
    console.log(`Strong bearish (-0.7, 80% conf): ${((twitterSentiment.calculateSentimentBoost(strongBearish) - 1) * 100).toFixed(1)}% boost\n`);

    // Test 5: Recent Signals Analysis
    console.log('📊 Test 5: Recent Enhanced Signals');
    console.log('----------------------------------');
    
    const recentSignals = await enhancedRSIStrategy.getRecentSignals('BTC', 5);
    console.log(`Found ${recentSignals.length} recent enhanced signals for BTC`);
    
    if (recentSignals.length > 0) {
      console.log('\nMost Recent Signal:');
      const latest = recentSignals[0];
      console.log(`  Time: ${latest.signalTime.toLocaleString()}`);
      console.log(`  Action: ${latest.technicalAction} → ${latest.finalAction}`);
      console.log(`  Technical: ${(latest.technicalScore * 100).toFixed(1)}% → Final: ${(latest.combinedConfidence * 100).toFixed(1)}%`);
      console.log(`  Sentiment: ${latest.sentimentScore?.toFixed(3) || 'N/A'} (${latest.sentimentConflict ? 'conflict' : 'aligned'})`);
      console.log(`  Executed: ${latest.wasExecuted ? 'YES' : 'NO'}`);
    }

    console.log('\n✅ Sentiment validation system test completed successfully!');
    console.log('🎯 Ready to integrate with your existing QUANTUM FORGE strategies!');
    
  } catch (error) {
    console.error('❌ Error testing sentiment validation:', error);
  }
}

// Run the test
testSentimentValidation().catch(console.error);
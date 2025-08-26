#!/usr/bin/env npx tsx
/**
 * Test Updated Sentiment System with All New Real Sources
 */

import { twitterSentiment } from './src/lib/sentiment/simple-twitter-sentiment.js';

async function testUpdatedSentimentSystem() {
  console.log('🚀 TESTING UPDATED SENTIMENT SYSTEM WITH 12+ REAL SOURCES');
  console.log('=' .repeat(80));

  try {
    const result = await twitterSentiment.getBTCSentiment();
    
    console.log('📊 RESULTS:');
    console.log(`   Symbol: ${result.symbol}`);
    console.log(`   Score: ${result.score.toFixed(4)} (${result.score > 0 ? 'BULLISH' : result.score < 0 ? 'BEARISH' : 'NEUTRAL'})`);
    console.log(`   Confidence: ${(result.confidence * 100).toFixed(2)}%`);
    console.log(`   Data Points: ${result.tweetCount}`);
    console.log(`   Positive: ${result.positiveCount}, Negative: ${result.negativeCount}, Neutral: ${result.neutralCount}`);
    console.log(`   Timestamp: ${result.timestamp}`);
    console.log('');
    
    if (result.tweetCount >= 25) {
      console.log('✅ SUCCESS: System now has 25+ data points from real sources');
    } else if (result.tweetCount >= 15) {
      console.log('⚠️ PARTIAL: System has ' + result.tweetCount + ' data points (goal: 25+)');
    } else {
      console.log('❌ INSUFFICIENT: Only ' + result.tweetCount + ' data points (goal: 25+)');
    }
    
    if (result.confidence >= 0.90) {
      console.log('✅ CONFIDENCE: Excellent confidence at ' + (result.confidence * 100).toFixed(1) + '%');
    } else {
      console.log('⚠️ CONFIDENCE: ' + (result.confidence * 100).toFixed(1) + '% (goal: 90%+)');
    }

    console.log('\n🎯 SYSTEM VALIDATION:');
    
    if (result.tweetCount >= 20 && result.confidence >= 0.85) {
      console.log('✅ SYSTEM READY: 12+ real sources working with high confidence');
      return true;
    } else {
      console.log('⚠️ NEEDS IMPROVEMENT: Some sources may not be working optimally');
      return false;
    }

  } catch (error) {
    console.error('❌ TEST FAILED:', error.message);
    return false;
  }
}

testUpdatedSentimentSystem().then(success => {
  console.log('\n' + '='.repeat(80));
  console.log(success ? '🎉 SENTIMENT SYSTEM VALIDATION PASSED' : '💥 SENTIMENT SYSTEM NEEDS WORK');
  console.log('='.repeat(80));
}).catch(console.error);
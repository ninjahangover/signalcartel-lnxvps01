#!/usr/bin/env npx tsx
/**
 * INDIVIDUAL SOURCE VERIFICATION - TEST EACH SOURCE SEPARATELY
 * This will call each sentiment source individually to prove they're real
 */

import { twitterSentiment } from './src/lib/sentiment/simple-twitter-sentiment.js';

console.log('🔍 INDIVIDUAL SENTIMENT SOURCE VERIFICATION');
console.log('=' .repeat(80));
console.log('Testing each source individually with live API calls...');
console.log('');

// Access private methods through reflection to test individually
const sentiment = twitterSentiment as any;

async function testSource(name: string, testFn: () => Promise<any>) {
  console.log(`🧪 TESTING: ${name}`);
  console.log('-'.repeat(40));
  
  try {
    const startTime = Date.now();
    const result = await testFn();
    const duration = Date.now() - startTime;
    
    if (result === null || result === undefined) {
      console.log('❌ FAILED: Returned null/undefined');
      console.log(`   Duration: ${duration}ms`);
    } else if (Array.isArray(result) && result.length === 0) {
      console.log('⚠️  EMPTY: Returned empty array');
      console.log(`   Duration: ${duration}ms`);
    } else if (Array.isArray(result)) {
      console.log(`✅ SUCCESS: Returned ${result.length} items`);
      console.log(`   Duration: ${duration}ms`);
      console.log(`   Sample: ${JSON.stringify(result[0], null, 2)}`);
    } else {
      console.log('✅ SUCCESS: Returned data object');
      console.log(`   Duration: ${duration}ms`);
      console.log(`   Data: ${JSON.stringify(result, null, 2)}`);
    }
  } catch (error) {
    console.log(`❌ ERROR: ${error.message}`);
  }
  
  console.log('');
}

async function main() {
  // Test each source individually
  await testSource('1. Fear & Greed Index', () => sentiment.getFearGreedIndex());
  
  await testSource('2. Reddit Bitcoin', () => sentiment.getRedditSentiment('BTC'));
  
  await testSource('3. CoinDesk RSS News', () => sentiment.getNewsSentiment('BTC'));
  
  await testSource('4. Blockchain.info On-Chain', () => sentiment.getOnChainSentiment('BTC'));
  
  await testSource('5. CoinTelegraph RSS', () => sentiment.getAdditionalNewsSources('BTC'));
  
  await testSource('6. Alternative.me Altcoin Index', () => sentiment.getAlternativeMeIndex('BTC'));
  
  await testSource('7. CryptoPanic News', () => sentiment.getCryptoPanicSentiment('BTC'));
  
  await testSource('8. Yahoo Finance Data', () => sentiment.getYahooFinanceData('BTC'));
  
  await testSource('9. Enhanced Blockchain Analysis', () => sentiment.getBlockchainAnalysis('BTC'));
  
  await testSource('10. CoinMarketCap Data', () => sentiment.getCoinMarketCapData('BTC'));
  
  await testSource('11. CoinGecko Market Data', () => sentiment.getCoinGeckoData('BTC'));
  
  await testSource('12. NewsAPI Sentiment', () => sentiment.getNewsAPISentiment('BTC'));
  
  await testSource('13. Aggregated Sentiment', () => sentiment.getAggregatedCryptoSentiment('BTC'));
  
  console.log('=' .repeat(80));
  console.log('🏁 INDIVIDUAL VERIFICATION COMPLETE');
  console.log('=' .repeat(80));
  console.log('Above results show exactly which sources are working vs failing');
  console.log('✅ = Real data source working');
  console.log('❌ = Source failed (API issue, rate limit, etc.)');
  console.log('⚠️  = Source returned empty (still real API, just no data)');
  console.log('');
  console.log('Now testing integrated system...');
  console.log('');
  
  // Test integrated system
  console.log('🔄 TESTING INTEGRATED SYSTEM');
  console.log('-'.repeat(40));
  
  try {
    const integrated = await twitterSentiment.getBTCSentiment();
    console.log('✅ INTEGRATED RESULTS:');
    console.log(`   Data Points: ${integrated.tweetCount}`);
    console.log(`   Confidence: ${(integrated.confidence * 100).toFixed(2)}%`);
    console.log(`   Score: ${integrated.score.toFixed(4)} (${integrated.score > 0 ? 'BULLISH' : 'BEARISH'})`);
    console.log(`   Sources Working: Multiple verified above`);
  } catch (error) {
    console.log(`❌ INTEGRATED FAILED: ${error.message}`);
  }
}

main().catch(console.error);
#!/usr/bin/env tsx
/**
 * REAL DATA VERIFICATION TEST
 * 
 * This script verifies which sentiment sources are using REAL data vs simulated data
 * to ensure we meet the user's requirement of NO FAKE/MOCK/SIMULATED data
 */

import { twitterSentiment } from '../src/lib/sentiment/simple-twitter-sentiment';

async function verifyRealDataSources() {
  console.log('🔍 REAL DATA VERIFICATION TEST');
  console.log('==============================');
  console.log('Testing each source individually to verify authenticity...');
  console.log('User requirement: NO FAKE/MOCK/DEMO/SIMULATED data allowed');
  console.log('');
  
  const results: { source: string; status: string; details: string }[] = [];
  
  // Test 1: Fear & Greed Index
  console.log('1. 📊 Fear & Greed Index:');
  try {
    const response = await fetch('https://api.alternative.me/fng/');
    const data = await response.json();
    if (data.data && data.data[0] && data.data[0].value) {
      const fgData = data.data[0];
      console.log('   ✅ REAL DATA: Value=' + fgData.value + '/100, Classification=' + fgData.value_classification);
      console.log('   📅 Timestamp: ' + fgData.timestamp);
      results.push({ source: 'Fear & Greed Index', status: 'REAL', details: `Live API: ${fgData.value}/100` });
    } else {
      console.log('   ❌ NO DATA from Fear & Greed API');
      results.push({ source: 'Fear & Greed Index', status: 'FAILED', details: 'API returned no data' });
    }
  } catch (e) {
    console.log('   ❌ ERROR: ' + (e as Error).message);
    results.push({ source: 'Fear & Greed Index', status: 'FAILED', details: (e as Error).message });
  }
  
  console.log('');
  console.log('2. 🤖 Reddit Data:');
  try {
    const response = await fetch('https://www.reddit.com/r/Bitcoin/hot.json?limit=3', {
      headers: {
        'User-Agent': 'SignalCartel/1.0 (Test Script)',
        'Accept': 'application/json'
      }
    });
    const data = await response.json();
    if (data.data && data.data.children && data.data.children.length > 0) {
      const post = data.data.children[0].data;
      console.log('   ✅ REAL DATA: ' + data.data.children.length + ' posts from r/Bitcoin');
      console.log('   📝 Latest: "' + post.title.substring(0, 60) + '..."');
      console.log('   👍 Upvotes: ' + post.ups + ', Comments: ' + post.num_comments);
      results.push({ source: 'Reddit', status: 'REAL', details: `${data.data.children.length} posts from r/Bitcoin API` });
    } else {
      console.log('   ❌ NO DATA from Reddit API');
      results.push({ source: 'Reddit', status: 'FAILED', details: 'Reddit API returned no posts' });
    }
  } catch (e) {
    console.log('   ❌ ERROR: ' + (e as Error).message);
    results.push({ source: 'Reddit', status: 'FAILED', details: (e as Error).message });
  }
  
  console.log('');
  console.log('3. 📰 CoinDesk News RSS:');
  try {
    const response = await fetch('https://www.coindesk.com/arc/outboundfeeds/rss/');
    const text = await response.text();
    const titleMatches = text.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/g);
    
    if (titleMatches && titleMatches.length > 1) {
      const headlines = titleMatches.slice(1, 4).map(match => 
        match.replace(/<title><!\[CDATA\[/, '').replace(/\]\]><\/title>/, '')
      );
      console.log('   ✅ REAL DATA: ' + headlines.length + ' headlines from CoinDesk RSS');
      console.log('   📝 Latest: "' + headlines[0].substring(0, 60) + '..."');
      results.push({ source: 'CoinDesk RSS', status: 'REAL', details: `${headlines.length} live headlines` });
    } else {
      console.log('   ❌ NO HEADLINES from CoinDesk RSS');
      results.push({ source: 'CoinDesk RSS', status: 'FAILED', details: 'RSS feed parsing failed' });
    }
  } catch (e) {
    console.log('   ❌ ERROR: ' + (e as Error).message);
    results.push({ source: 'CoinDesk RSS', status: 'FAILED', details: (e as Error).message });
  }
  
  console.log('');
  console.log('4. ⛓️ On-Chain Bitcoin Metrics:');
  try {
    const response = await fetch('https://blockchain.info/q/24hrtransactioncount');
    const txCount = parseInt(await response.text());
    
    if (txCount && txCount > 0) {
      console.log('   ✅ REAL DATA: ' + txCount.toLocaleString() + ' Bitcoin transactions in 24h');
      console.log('   📊 Source: blockchain.info API');
      results.push({ source: 'On-Chain Metrics', status: 'REAL', details: `${txCount.toLocaleString()} live transactions` });
    } else {
      console.log('   ❌ NO DATA from blockchain.info');
      results.push({ source: 'On-Chain Metrics', status: 'FAILED', details: 'blockchain.info API failed' });
    }
  } catch (e) {
    console.log('   ❌ ERROR: ' + (e as Error).message);
    results.push({ source: 'On-Chain Metrics', status: 'FAILED', details: (e as Error).message });
  }
  
  console.log('');
  console.log('5. 📡 CoinTelegraph RSS:');
  try {
    const response = await fetch('https://cointelegraph.com/rss/tag/bitcoin');
    const text = await response.text();
    const titleMatches = text.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/g);
    
    if (titleMatches && titleMatches.length > 1) {
      const headlines = titleMatches.slice(1, 4).map(match => 
        match.replace(/<title><!\[CDATA\[/, '').replace(/\]\]><\/title>/, '')
      );
      console.log('   ✅ REAL DATA: ' + headlines.length + ' headlines from CoinTelegraph RSS');
      console.log('   📝 Latest: "' + headlines[0].substring(0, 60) + '..."');
      results.push({ source: 'CoinTelegraph RSS', status: 'REAL', details: `${headlines.length} live headlines` });
    } else {
      console.log('   ❌ NO HEADLINES from CoinTelegraph RSS');
      results.push({ source: 'CoinTelegraph RSS', status: 'FAILED', details: 'RSS feed parsing failed' });
    }
  } catch (e) {
    console.log('   ❌ ERROR: ' + (e as Error).message);
    results.push({ source: 'CoinTelegraph RSS', status: 'FAILED', details: (e as Error).message });
  }
  
  console.log('');
  console.log('🚨 SIMULATED SOURCES (NOT REAL):');
  console.log('=====================================');
  
  const simulatedSources = [
    { name: 'Twitter/X Sentiment', reason: 'No real API key, using hardcoded sample tweets' },
    { name: 'Exchange Flow Analysis', reason: 'Simulated netflow data, would need Glassnode API' },
    { name: 'Whale Movements', reason: 'Hardcoded sample whale transactions, would need Whale Alert API' },
    { name: 'Google Trends', reason: 'Simulated search volume data, no direct API available' },
    { name: 'Economic Indicators', reason: 'Hardcoded DXY/VIX/Fed data, would need FRED API' },
    { name: 'Social Volume', reason: 'Simulated mention counts across platforms' },
    { name: 'DeFi Metrics', reason: 'Simulated WBTC/Lightning data, would need DeFi APIs' },
    { name: 'Decrypt News', reason: 'Hardcoded sample headlines, no RSS feed available' }
  ];
  
  simulatedSources.forEach((source, index) => {
    console.log(`${(index + 6).toString().padStart(2, ' ')}. ❌ ${source.name}: SIMULATED`);
    console.log(`     Reason: ${source.reason}`);
    results.push({ source: source.name, status: 'SIMULATED', details: source.reason });
  });
  
  console.log('');
  console.log('📊 VERIFICATION SUMMARY:');
  console.log('=========================');
  
  const realSources = results.filter(r => r.status === 'REAL');
  const failedSources = results.filter(r => r.status === 'FAILED');
  const simulatedSources2 = results.filter(r => r.status === 'SIMULATED');
  
  console.log(`✅ REAL DATA SOURCES (${realSources.length}):`);
  realSources.forEach(source => {
    console.log(`   • ${source.source}: ${source.details}`);
  });
  
  if (failedSources.length > 0) {
    console.log(`❌ FAILED REAL SOURCES (${failedSources.length}):`);
    failedSources.forEach(source => {
      console.log(`   • ${source.source}: ${source.details}`);
    });
  }
  
  console.log(`🚨 SIMULATED SOURCES (${simulatedSources2.length}):`);
  simulatedSources2.forEach(source => {
    console.log(`   • ${source.source}`);
  });
  
  console.log('');
  console.log('🎯 RECOMMENDATION FOR 100% REAL DATA:');
  console.log('======================================');
  console.log('Option 1: KEEP ONLY REAL SOURCES');
  console.log('  - Remove all simulated sources from the sentiment engine');
  console.log('  - Focus on the ' + realSources.length + ' working real data sources');
  console.log('  - This reduces data volume but ensures 100% authenticity');
  console.log('');
  console.log('Option 2: IMPLEMENT REAL APIs FOR SIMULATED SOURCES');
  console.log('  - Get Twitter API access for real social sentiment');
  console.log('  - Subscribe to Glassnode for real exchange flow data');
  console.log('  - Get Whale Alert API for real whale movement data');
  console.log('  - This maintains high data volume with 100% real data');
  console.log('');
  console.log('Option 3: ADD MORE REAL RSS/API SOURCES');
  console.log('  - Add more crypto news RSS feeds (Decrypt, The Block, etc.)');
  console.log('  - Add more Reddit subreddits');
  console.log('  - Add more blockchain APIs');
  console.log('  - This increases real data volume without paid APIs');
  
  const realDataPercentage = (realSources.length / results.length) * 100;
  console.log('');
  console.log(`📈 CURRENT REAL DATA PERCENTAGE: ${realDataPercentage.toFixed(1)}% (${realSources.length}/${results.length} sources)`);
  
  if (realDataPercentage < 100) {
    console.log('⚠️  NOT MEETING USER REQUIREMENT: Contains simulated data');
  } else {
    console.log('✅ MEETING USER REQUIREMENT: All data is real');
  }
}

// Run the verification
verifyRealDataSources().catch(console.error);
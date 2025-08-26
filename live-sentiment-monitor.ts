#!/usr/bin/env tsx
/**
 * Live Sentiment Data Monitor - Real-time API call logging
 */

import { twitterSentiment } from './src/lib/sentiment/simple-twitter-sentiment';

async function liveSentimentMonitor() {
  console.log('🎯 LIVE SENTIMENT MONITOR STARTING');
  console.log('==================================');
  console.log('⏰ Monitoring every 30 seconds...');
  console.log('📡 Watching real-time API calls and data flow');
  console.log('');

  let cycleCount = 1;

  async function monitorCycle() {
    const timestamp = new Date().toLocaleTimeString();
    console.log(`\n🔄 CYCLE ${cycleCount} - ${timestamp}`);
    console.log('=' .repeat(50));
    
    try {
      console.log('📊 Fetching live sentiment data from all sources...');
      
      // Get fresh data
      const result = await (twitterSentiment as any).getRealSentimentData('BTC');
      
      console.log(`✅ Retrieved ${result.length} data points from ${new Set(result.map((s: any) => s.source)).size} sources`);
      
      // Group by source and show latest data
      const sourceGroups: { [key: string]: any[] } = {};
      result.forEach((item: any) => {
        if (!sourceGroups[item.source]) {
          sourceGroups[item.source] = [];
        }
        sourceGroups[item.source].push(item);
      });

      // Show each source's current data
      Object.entries(sourceGroups).forEach(([source, items]) => {
        const latest = items[0]; // Most recent item
        const avgScore = items.reduce((sum, item) => sum + (item.sentiment_score || 0), 0) / items.length;
        
        console.log(`\n📡 ${source.toUpperCase()}:`);
        console.log(`   📊 ${items.length} data points, avg score: ${avgScore.toFixed(3)}`);
        console.log(`   📝 Latest: "${latest.text.substring(0, 60)}..."`);
        console.log(`   🎯 Score: ${latest.sentiment_score}, Weight: ${latest.weight || 1}`);
        
        if (latest.upvotes) console.log(`   👍 Upvotes: ${latest.upvotes}`);
        if (latest.tx_count) console.log(`   ⛓️ Transactions: ${latest.tx_count.toLocaleString()}`);
        if (latest.created_at) console.log(`   ⏰ Time: ${new Date(latest.created_at).toLocaleTimeString()}`);
      });

      // Overall sentiment summary
      const overallResult = await twitterSentiment.getBTCSentiment();
      console.log(`\n🎯 OVERALL SENTIMENT: ${overallResult.sentiment || 'CALCULATING...'}`);
      console.log(`   Score: ${overallResult.score.toFixed(3)} | Confidence: ${(overallResult.confidence * 100).toFixed(1)}%`);
      
      cycleCount++;
      
    } catch (error) {
      console.error(`❌ Error in cycle ${cycleCount}:`, error.message);
    }
    
    console.log(`\n⏳ Waiting 30 seconds for next update...`);
  }

  // Run initial cycle
  await monitorCycle();
  
  // Set up interval for continuous monitoring
  const interval = setInterval(monitorCycle, 30000); // 30 seconds
  
  // Handle graceful shutdown
  process.on('SIGINT', () => {
    console.log('\n\n🛑 Stopping live monitor...');
    clearInterval(interval);
    process.exit(0);
  });
}

// Start monitoring
liveSentimentMonitor().catch(console.error);
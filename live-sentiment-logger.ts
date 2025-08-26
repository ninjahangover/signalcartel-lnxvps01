#!/usr/bin/env tsx
/**
 * Live Sentiment Logger - Writes to log file for tailing
 */

import { twitterSentiment } from './src/lib/sentiment/simple-twitter-sentiment';
import { writeFileSync, appendFileSync } from 'fs';

const LOG_FILE = '/tmp/sentiment-live.log';

function log(message: string) {
  const timestamp = new Date().toISOString();
  const logLine = `${timestamp} | ${message}\n`;
  console.log(message); // Also to console
  appendFileSync(LOG_FILE, logLine);
}

async function liveSentimentLogger() {
  // Initialize log file
  writeFileSync(LOG_FILE, `🎯 SENTIMENT LIVE LOGGER STARTED: ${new Date().toISOString()}\n`);
  
  log('🎯 LIVE SENTIMENT LOGGER STARTING');
  log('==================================');
  log('📁 Log file: /tmp/sentiment-live.log');
  log('⏰ Monitoring every 30 seconds...');
  log('📡 Watching real-time API calls and data flow');
  log('');

  let cycleCount = 1;

  async function loggerCycle() {
    const timestamp = new Date().toLocaleTimeString();
    log(`🔄 CYCLE ${cycleCount} - ${timestamp}`);
    log('=' .repeat(50));
    
    try {
      log('📊 Fetching live sentiment data from all sources...');
      
      // Get fresh data
      const result = await (twitterSentiment as any).getRealSentimentData('BTC');
      
      log(`✅ Retrieved ${result.length} data points from ${new Set(result.map((s: any) => s.source)).size} sources`);
      
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
        
        log(`📡 ${source.toUpperCase()}:`);
        log(`   📊 ${items.length} data points, avg score: ${avgScore.toFixed(3)}`);
        log(`   📝 Latest: "${latest.text.substring(0, 60)}..."`);
        log(`   🎯 Score: ${latest.sentiment_score}, Weight: ${latest.weight || 1}`);
        
        if (latest.upvotes) log(`   👍 Upvotes: ${latest.upvotes}`);
        if (latest.tx_count) log(`   ⛓️ Transactions: ${latest.tx_count.toLocaleString()}`);
        if (latest.created_at) log(`   ⏰ Time: ${new Date(latest.created_at).toLocaleTimeString()}`);
        log('');
      });

      // Overall sentiment summary
      const overallResult = await twitterSentiment.getBTCSentiment();
      log(`🎯 OVERALL SENTIMENT: ${overallResult.sentiment || 'CALCULATING...'}`);
      log(`   Score: ${overallResult.score.toFixed(3)} | Confidence: ${(overallResult.confidence * 100).toFixed(1)}%`);
      log('');
      
      cycleCount++;
      
    } catch (error) {
      log(`❌ Error in cycle ${cycleCount}: ${error.message}`);
    }
    
    log(`⏳ Waiting 30 seconds for next update...`);
    log('');
  }

  // Run initial cycle
  await loggerCycle();
  
  // Set up interval for continuous monitoring
  const interval = setInterval(loggerCycle, 30000); // 30 seconds
  
  // Handle graceful shutdown
  process.on('SIGINT', () => {
    log('🛑 Stopping live logger...');
    clearInterval(interval);
    process.exit(0);
  });
}

// Start logging
liveSentimentLogger().catch(console.error);
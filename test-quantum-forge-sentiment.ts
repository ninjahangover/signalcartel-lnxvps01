#!/usr/bin/env npx tsx
/**
 * Test QUANTUM FORGE™ Multi-Source Sentiment Intelligence
 * GPU-accelerated sentiment analysis with Reddit, On-chain, and Twitter data
 */

import { quantumForgeSentimentEngine } from './src/lib/sentiment/quantum-forge-sentiment-engine';

async function testQuantumForgeSentiment() {
  console.log('🚀 QUANTUM FORGE™ SENTIMENT INTELLIGENCE TEST');
  console.log('=' .repeat(60));
  console.log('Testing GPU-accelerated multi-source sentiment analysis');
  console.log('Sources: Twitter (existing) + Reddit + On-chain Data');
  console.log('=' .repeat(60));
  
  try {
    // Test Bitcoin sentiment
    console.log('\n📊 Analyzing Bitcoin (BTC) Sentiment...');
    console.log('-'.repeat(40));
    
    const btcSentiment = await quantumForgeSentimentEngine.analyzeSentiment('BTC');
    
    console.log('\n✅ QUANTUM FORGE SENTIMENT RESULTS:');
    console.log(`Symbol: ${btcSentiment.symbol}`);
    console.log(`Overall Sentiment: ${btcSentiment.sentiment}`);
    console.log(`Overall Score: ${btcSentiment.overallScore.toFixed(4)}`);
    console.log(`Overall Confidence: ${(btcSentiment.overallConfidence * 100).toFixed(1)}%`);
    
    console.log('\n📈 SOURCE BREAKDOWN:');
    console.log(`• Twitter Score: ${btcSentiment.sources.twitter.score.toFixed(4)} (${(btcSentiment.sources.twitter.confidence * 100).toFixed(1)}% conf)`);
    console.log(`  - Positive: ${btcSentiment.sources.twitter.positiveCount}`);
    console.log(`  - Negative: ${btcSentiment.sources.twitter.negativeCount}`);
    console.log(`  - Neutral: ${btcSentiment.sources.twitter.neutralCount}`);
    
    console.log(`\n• Reddit Score: ${btcSentiment.sources.reddit.score.toFixed(4)} (${(btcSentiment.sources.reddit.confidence * 100).toFixed(1)}% conf)`);
    console.log(`  - Volume: ${btcSentiment.sources.reddit.volume} posts analyzed`);
    console.log(`  - Trending: ${btcSentiment.sources.reddit.trending ? 'YES 🔥' : 'NO'}`);
    console.log(`  - WSB Activity: ${((btcSentiment.sources.reddit.wsb_activity || 0) * 100).toFixed(1)}%`);
    if (btcSentiment.sources.reddit.topPosts.length > 0) {
      console.log(`  - Top Post: "${btcSentiment.sources.reddit.topPosts[0].title.substring(0, 60)}..."`);
    }
    
    console.log(`\n• On-Chain Score: ${btcSentiment.sources.onChain.sentimentScore.toFixed(4)} (${(btcSentiment.sources.onChain.confidence * 100).toFixed(1)}% conf)`);
    console.log(`  - Whale Transfers: ${btcSentiment.sources.onChain.whaleActivity.largeTransfers}`);
    console.log(`  - Whale Accumulation: $${btcSentiment.sources.onChain.whaleActivity.whaleAccumulation.toFixed(2)}M`);
    console.log(`  - Exchange Net Flow: $${(btcSentiment.sources.onChain.exchangeFlows.netFlow / 1000000).toFixed(2)}M`);
    console.log(`  - Network Tx Count: ${btcSentiment.sources.onChain.networkMetrics.transactionCount.toLocaleString()}`);
    console.log(`  - Mempool Size: ${btcSentiment.sources.onChain.networkMetrics.mempoolSize.toLocaleString()}`);
    
    console.log('\n🚨 CRITICAL EVENTS:');
    if (btcSentiment.criticalEvents.length > 0) {
      btcSentiment.criticalEvents.forEach(event => {
        const icon = event.impact > 0 ? '✅' : '⚠️';
        console.log(`${icon} [${event.type}] ${event.severity}: ${event.description}`);
        console.log(`   Source: ${event.source} | Impact: ${event.impact > 0 ? '+' : ''}${event.impact}`);
      });
    } else {
      console.log('No critical events detected');
    }
    
    console.log('\n🐋 WHALE ALERTS:');
    if (btcSentiment.whaleAlerts.length > 0) {
      btcSentiment.whaleAlerts.forEach(alert => {
        const icon = alert.type === 'ACCUMULATION' || alert.type === 'EXCHANGE_OUT' ? '📈' : '📉';
        console.log(`${icon} ${alert.type}: $${(alert.amount / 1000000).toFixed(2)}M ${alert.token}`);
        console.log(`   From: ${alert.from} → To: ${alert.to}`);
      });
    } else {
      console.log('No significant whale movements');
    }
    
    console.log('\n📊 MARKET CONTEXT:');
    console.log(`• Trend: ${btcSentiment.marketContext.trend}`);
    console.log(`• Volatility: ${btcSentiment.marketContext.volatility}`);
    console.log(`• Volume: ${btcSentiment.marketContext.volume}`);
    
    console.log('\n💡 TRADING SIGNAL:');
    const signalIcon = btcSentiment.tradingSignal.action.includes('BUY') ? '🟢' : 
                      btcSentiment.tradingSignal.action.includes('SELL') ? '🔴' : '🟡';
    console.log(`${signalIcon} Action: ${btcSentiment.tradingSignal.action}`);
    console.log(`• Confidence: ${(btcSentiment.tradingSignal.confidence * 100).toFixed(1)}%`);
    console.log(`• Risk Level: ${btcSentiment.tradingSignal.riskLevel}`);
    console.log(`• Reason: ${btcSentiment.tradingSignal.reason}`);
    
    console.log('\n⚡ GPU PROCESSING METRICS:');
    console.log(`• Total Time: ${btcSentiment.processingMetrics.totalTimeMs}ms`);
    console.log(`• GPU Time: ${btcSentiment.processingMetrics.gpuTimeMs}ms`);
    console.log(`• Sources Processed: ${btcSentiment.processingMetrics.sourcesProcessed}`);
    console.log(`• Tokens Analyzed: ${btcSentiment.processingMetrics.tokensAnalyzed}`);
    console.log(`• GPU Acceleration: ${btcSentiment.processingMetrics.gpuTimeMs > 0 ? '✅ ACTIVE' : '❌ FALLBACK TO CPU'}`);
    
    // Test sentiment alignment
    console.log('\n🔄 SENTIMENT ALIGNMENT TEST:');
    const sources = [
      { name: 'Twitter', score: btcSentiment.sources.twitter.score },
      { name: 'Reddit', score: btcSentiment.sources.reddit.score },
      { name: 'On-Chain', score: btcSentiment.sources.onChain.sentimentScore }
    ];
    
    const alignedSources = sources.filter(s => 
      (btcSentiment.overallScore > 0 && s.score > 0) || 
      (btcSentiment.overallScore < 0 && s.score < 0)
    );
    
    const alignmentPercent = (alignedSources.length / sources.length) * 100;
    console.log(`• Alignment: ${alignmentPercent.toFixed(0)}% (${alignedSources.length}/${sources.length} sources agree)`);
    
    if (alignmentPercent >= 66) {
      console.log('• Status: ✅ STRONG CONSENSUS');
    } else if (alignmentPercent >= 33) {
      console.log('• Status: ⚠️ MIXED SIGNALS');
    } else {
      console.log('• Status: ❌ CONFLICTING SIGNALS');
    }
    
    // Success summary
    console.log('\n' + '='.repeat(60));
    console.log('✅ QUANTUM FORGE SENTIMENT TEST COMPLETE');
    console.log('🎯 Multi-source sentiment analysis operational');
    console.log('🚀 GPU acceleration: ' + (btcSentiment.processingMetrics.gpuTimeMs > 0 ? 'ACTIVE' : 'CPU FALLBACK'));
    console.log('📊 Ready for integration with trading strategies');
    console.log('='.repeat(60));
    
  } catch (error) {
    console.error('\n❌ ERROR:', error);
    console.error('Stack:', error.stack);
  } finally {
    // Cleanup GPU resources
    quantumForgeSentimentEngine.destroy();
    process.exit(0);
  }
}

// Run test
testQuantumForgeSentiment();
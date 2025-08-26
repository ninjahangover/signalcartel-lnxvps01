#!/usr/bin/env tsx
/**
 * Test Multi-Source Dashboard Data
 * 
 * Creates an API endpoint to provide real-time data for all 12+ sentiment sources
 * to the dashboard Multi-Source tab
 */

import { twitterSentiment } from '../src/lib/sentiment/simple-twitter-sentiment';

async function testMultiSourceData() {
  console.log('🧪 TESTING MULTI-SOURCE DASHBOARD DATA');
  console.log('======================================');
  
  try {
    console.log('📊 Fetching real sentiment data from all 12+ sources...\n');
    
    // Get the raw sentiment data the same way the trading system does
    const btcSentiment = await twitterSentiment.getBTCSentiment();
    
    console.log(`✅ Received ${btcSentiment.tweetCount} data points with ${(btcSentiment.confidence * 100).toFixed(1)}% confidence\n`);
    
    // Now let's get the actual source breakdown by calling the enhanced system directly
    console.log('🔍 Analyzing source breakdown...\n');
    
    // Call the private method to get detailed source data
    const detailedSentiment = await (twitterSentiment as any).getRealSentimentData('BTC');
    
    console.log(`📈 DETAILED SOURCE BREAKDOWN:`);
    console.log(`Total sources returned: ${detailedSentiment.length}\n`);
    
    // Group by source type
    const sourceGroups = detailedSentiment.reduce((acc: any, item: any) => {
      const source = item.source;
      if (!acc[source]) {
        acc[source] = [];
      }
      acc[source].push(item);
      return acc;
    }, {});
    
    // Display each source group
    let sourceIndex = 1;
    for (const [source, items] of Object.entries(sourceGroups)) {
      const itemArray = items as any[];
      const avgScore = itemArray.reduce((sum, item) => sum + (item.sentiment_score || 0), 0) / itemArray.length;
      const avgWeight = itemArray.reduce((sum, item) => sum + (item.weight || 1), 0) / itemArray.length;
      
      console.log(`${sourceIndex.toString().padStart(2, ' ')}. 📊 ${source.toUpperCase().replace(/_/g, ' ')}`);
      console.log(`     Data Points: ${itemArray.length}`);
      console.log(`     Avg Score: ${avgScore.toFixed(3)} (${avgScore > 0 ? 'Bullish' : avgScore < 0 ? 'Bearish' : 'Neutral'})`);
      console.log(`     Avg Weight: ${avgWeight.toFixed(1)}x`);
      console.log(`     Sample Text: "${itemArray[0].text.substring(0, 60)}..."`);
      console.log('');
      sourceIndex++;
    }
    
    console.log('🎯 DASHBOARD INTEGRATION REQUIREMENTS:');
    console.log('=====================================');
    console.log('To show all sources in the Multi-Source tab, we need to:');
    console.log('1. Create an API endpoint that returns detailed source breakdown');
    console.log('2. Update QuantumForgeSentimentDashboard.tsx to display all 12+ sources');
    console.log('3. Add visual components for the new source types');
    console.log('');
    
    console.log('📋 RECOMMENDED DASHBOARD SOURCES TO DISPLAY:');
    console.log('=============================================');
    Object.keys(sourceGroups).forEach((source, index) => {
      const displayName = source.split('_').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1)
      ).join(' ');
      
      const icon = getSourceIcon(source);
      const color = getSourceColor(source);
      
      console.log(`${(index + 1).toString().padStart(2, ' ')}. ${icon} ${displayName} (${color} theme)`);
    });
    
    console.log('');
    console.log('✅ MULTI-SOURCE DATA TEST COMPLETED');
    console.log('This data structure can be used to update the dashboard');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

function getSourceIcon(source: string): string {
  const icons: { [key: string]: string } = {
    'fear_greed_index': '😨',
    'reddit_Bitcoin': '🤖',
    'coindesk_news': '📰',
    'onchain_metrics': '⛓️',
    'twitter_x': '🐦',
    'cointelegraph_news': '📡',
    'decrypt_news': '🔒',
    'exchange_flow': '🏦',
    'whale_alert': '🐋',
    'google_trends': '🔍',
    'economic_indicators': '📈',
    'social_volume': '👥',
    'defi_metrics': '🏗️'
  };
  return icons[source] || '📊';
}

function getSourceColor(source: string): string {
  const colors: { [key: string]: string } = {
    'fear_greed_index': 'purple',
    'reddit_Bitcoin': 'orange',
    'coindesk_news': 'blue',
    'onchain_metrics': 'green',
    'twitter_x': 'sky',
    'cointelegraph_news': 'indigo',
    'decrypt_news': 'violet',
    'exchange_flow': 'emerald',
    'whale_alert': 'cyan',
    'google_trends': 'red',
    'economic_indicators': 'yellow',
    'social_volume': 'pink',
    'defi_metrics': 'teal'
  };
  return colors[source] || 'gray';
}

// Run the test
if (require.main === module) {
  testMultiSourceData().catch(console.error);
}

export { testMultiSourceData };
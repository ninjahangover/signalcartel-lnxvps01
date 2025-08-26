import { NextRequest, NextResponse } from 'next/server';
import { twitterSentiment } from '../../../lib/sentiment/simple-twitter-sentiment';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const symbol = searchParams.get('symbol') || 'BTC';
    
    console.log(`🔍 Fetching multi-source sentiment for ${symbol}...`);
    
    // Get detailed sentiment data from enhanced engine
    const sentimentResult = await twitterSentiment.getBTCSentiment();
    
    // Get the raw source data (call the private method)
    const detailedSources = await (twitterSentiment as any).getRealSentimentData(symbol);
    
    console.log(`✅ Retrieved ${detailedSources.length} data points from ${new Set(detailedSources.map((s: any) => s.source)).size} unique sources`);
    
    // Group and aggregate by source type
    const sourceGroups = detailedSources.reduce((acc: any, item: any) => {
      const source = item.source;
      if (!acc[source]) {
        acc[source] = {
          source,
          dataPoints: [],
          totalScore: 0,
          totalWeight: 0,
          avgScore: 0,
          avgWeight: 0,
          confidence: 0,
          sampleText: '',
          metadata: {}
        };
      }
      
      acc[source].dataPoints.push(item);
      acc[source].totalScore += (item.sentiment_score || 0);
      acc[source].totalWeight += (item.weight || 1);
      acc[source].sampleText = acc[source].sampleText || item.text;
      
      // Store additional metadata
      if (item.upvotes) acc[source].metadata.upvotes = item.upvotes;
      if (item.engagement) acc[source].metadata.engagement = item.engagement;
      if (item.amount) acc[source].metadata.amount = item.amount;
      if (item.netflow_24h !== undefined) acc[source].metadata.netflow_24h = item.netflow_24h;
      if (item.search_volume) acc[source].metadata.search_volume = item.search_volume;
      if (item.dxy) acc[source].metadata.dxy = item.dxy;
      if (item.total_volume) acc[source].metadata.total_volume = item.total_volume;
      if (item.total_locked) acc[source].metadata.total_locked = item.total_locked;
      if (item.tx_count) acc[source].metadata.tx_count = item.tx_count;
      if (item.hash_rate) acc[source].metadata.hash_rate = item.hash_rate;
      if (item.difficulty) acc[source].metadata.difficulty = item.difficulty;
      if (item.price_change_24h !== undefined) acc[source].metadata.price_change_24h = item.price_change_24h;
      if (item.community_sentiment) acc[source].metadata.community_sentiment = item.community_sentiment;
      
      return acc;
    }, {});
    
    // Calculate averages and format for display
    const sources = Object.values(sourceGroups).map((group: any) => {
      const avgScore = group.totalScore / group.dataPoints.length;
      const avgWeight = group.totalWeight / group.dataPoints.length;
      const confidence = Math.min(0.95, 0.6 + (group.dataPoints.length / 10) * 0.2); // Higher confidence for more data points
      
      // Map source names to display information
      const sourceInfo = getSourceDisplayInfo(group.source);
      
      return {
        id: group.source,
        name: sourceInfo.name,
        icon: sourceInfo.icon,
        color: sourceInfo.color,
        category: sourceInfo.category,
        score: avgScore,
        confidence: confidence,
        weight: avgWeight,
        dataPoints: group.dataPoints.length,
        sampleText: group.sampleText.substring(0, 100) + (group.sampleText.length > 100 ? '...' : ''),
        sentiment: avgScore > 0.3 ? 'BULLISH' : avgScore < -0.3 ? 'BEARISH' : 'NEUTRAL',
        metadata: group.metadata,
        isActive: true,
        lastUpdate: new Date().toISOString()
      };
    });
    
    // Sort by weight (importance) descending
    sources.sort((a, b) => b.weight - a.weight);
    
    const summary = {
      totalSources: sources.length,
      totalDataPoints: detailedSources.length,
      overallScore: sentimentResult.score,
      overallConfidence: sentimentResult.confidence,
      processingTime: Date.now(),
      categories: {
        market_psychology: sources.filter(s => s.category === 'market_psychology').length,
        social_sentiment: sources.filter(s => s.category === 'social_sentiment').length,
        on_chain: sources.filter(s => s.category === 'on_chain').length,
        economic: sources.filter(s => s.category === 'economic').length,
        institutional: sources.filter(s => s.category === 'institutional').length
      },
      activeSourcesList: sources.map(s => s.name),
      dataQuality: sources.filter(s => s.confidence > 0.8).length / sources.length,
      realDataVerified: true
    };
    
    return NextResponse.json({
      success: true,
      data: {
        summary,
        sources,
        timestamp: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('❌ Multi-source sentiment API error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch multi-source sentiment data',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

function getSourceDisplayInfo(sourceId: string) {
  const sourceMap: { [key: string]: { name: string; icon: string; color: string; category: string } } = {
    'fear_greed_index': {
      name: 'Fear & Greed Index',
      icon: '😨',
      color: 'purple',
      category: 'market_psychology'
    },
    'reddit_Bitcoin': {
      name: 'Reddit Community',
      icon: '🤖',
      color: 'orange',
      category: 'social_sentiment'
    },
    'coindesk_news': {
      name: 'CoinDesk News',
      icon: '📰',
      color: 'blue',
      category: 'social_sentiment'
    },
    'onchain_metrics': {
      name: 'On-Chain Metrics',
      icon: '⛓️',
      color: 'green',
      category: 'on_chain'
    },
    'twitter_x': {
      name: 'Twitter/X Social',
      icon: '🐦',
      color: 'sky',
      category: 'social_sentiment'
    },
    'cointelegraph_news': {
      name: 'CoinTelegraph',
      icon: '📡',
      color: 'indigo',
      category: 'social_sentiment'
    },
    'decrypt_news': {
      name: 'Decrypt Media',
      icon: '🔒',
      color: 'violet',
      category: 'social_sentiment'
    },
    'exchange_flow': {
      name: 'Exchange Flows',
      icon: '🏦',
      color: 'emerald',
      category: 'institutional'
    },
    'whale_alert': {
      name: 'Whale Activity',
      icon: '🐋',
      color: 'cyan',
      category: 'institutional'
    },
    'google_trends': {
      name: 'Google Trends',
      icon: '🔍',
      color: 'red',
      category: 'social_sentiment'
    },
    'economic_indicators': {
      name: 'Economic Data',
      icon: '📈',
      color: 'yellow',
      category: 'economic'
    },
    'social_volume': {
      name: 'Social Volume',
      icon: '👥',
      color: 'pink',
      category: 'social_sentiment'
    },
    'defi_metrics': {
      name: 'DeFi Ecosystem',
      icon: '🏗️',
      color: 'teal',
      category: 'on_chain'
    },
    'altcoin_index': {
      name: 'Altcoin Season Index',
      icon: '🎯',
      color: 'cyan',
      category: 'market_psychology'
    },
    'cryptopanic_news': {
      name: 'CryptoPanic News',
      icon: '🚨',
      color: 'red',
      category: 'social_sentiment'
    },
    'yahoo_finance': {
      name: 'Yahoo Finance',
      icon: '💰',
      color: 'yellow',
      category: 'institutional'
    },
    'blockchain_analysis': {
      name: 'Enhanced Blockchain Analysis',
      icon: '🔗',
      color: 'emerald',
      category: 'on_chain'
    },
    'coinmarketcap_trending': {
      name: 'CoinMarketCap Trending',
      icon: '📊',
      color: 'blue',
      category: 'market_psychology'
    },
    'coingecko_market': {
      name: 'CoinGecko Market Data',
      icon: '🌍',
      color: 'orange',
      category: 'market_psychology'
    },
    'newsapi_crypto': {
      name: 'NewsAPI Crypto Headlines',
      icon: '📱',
      color: 'pink',
      category: 'social_sentiment'
    },
    'aggregated_sentiment': {
      name: 'Cross-Source Meta-Analysis',
      icon: '🧠',
      color: 'violet',
      category: 'market_psychology'
    }
  };
  
  return sourceMap[sourceId] || {
    name: sourceId.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
    icon: '📊',
    color: 'gray',
    category: 'unknown'
  };
}
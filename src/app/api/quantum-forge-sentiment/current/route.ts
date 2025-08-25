import { NextRequest, NextResponse } from 'next/server';
import { quantumForgeSentimentEngine } from '../../../../lib/sentiment/quantum-forge-sentiment-engine';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const symbol = searchParams.get('symbol') || 'BTC';
    
    console.log(`🧠 QUANTUM FORGE API: Getting current sentiment for ${symbol}...`);
    
    // Get real-time sentiment analysis
    const sentimentData = await quantumForgeSentimentEngine.analyzeSentiment(symbol);
    
    // Transform for dashboard
    const dashboardData = {
      symbol: sentimentData.symbol,
      overallScore: sentimentData.overallScore,
      overallConfidence: sentimentData.overallConfidence,
      sentiment: sentimentData.sentiment,
      sources: {
        twitter: {
          score: sentimentData.sources.twitter.score,
          confidence: sentimentData.sources.twitter.confidence,
          volume: sentimentData.sources.twitter.tweetCount
        },
        reddit: {
          score: sentimentData.sources.reddit.score,
          confidence: sentimentData.sources.reddit.confidence,
          volume: sentimentData.sources.reddit.volume,
          trending: sentimentData.sources.reddit.trending
        },
        onChain: {
          score: sentimentData.sources.onChain.sentimentScore,
          confidence: sentimentData.sources.onChain.confidence,
          whaleTransfers: sentimentData.sources.onChain.whaleActivity.largeTransfers
        }
      },
      criticalEvents: sentimentData.criticalEvents,
      whaleAlerts: sentimentData.whaleAlerts,
      marketContext: sentimentData.marketContext,
      tradingSignal: sentimentData.tradingSignal,
      processingMetrics: sentimentData.processingMetrics,
      timestamp: sentimentData.timestamp.toISOString()
    };
    
    console.log(`✅ QUANTUM FORGE API: Sentiment analysis complete for ${symbol}`);
    console.log(`   • Overall: ${sentimentData.sentiment} (${sentimentData.overallScore.toFixed(4)})`);
    console.log(`   • Confidence: ${(sentimentData.overallConfidence * 100).toFixed(1)}%`);
    console.log(`   • Processing: ${sentimentData.processingMetrics.totalTimeMs}ms (${sentimentData.processingMetrics.gpuTimeMs}ms GPU)`);
    
    return NextResponse.json({
      success: true,
      data: dashboardData,
      metadata: {
        timestamp: new Date().toISOString(),
        processingTime: sentimentData.processingMetrics.totalTimeMs,
        gpuAccelerated: sentimentData.processingMetrics.gpuTimeMs > 0
      }
    });
    
  } catch (error) {
    console.error('❌ QUANTUM FORGE API Error:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch current sentiment analysis',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
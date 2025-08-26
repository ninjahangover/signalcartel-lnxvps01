import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const hours = parseInt(searchParams.get('hours') || '24');
    const strategy = searchParams.get('strategy');
    const liveSources = searchParams.get('live') === 'true';
    
    // If live sources requested, return live sentiment data
    if (liveSources) {
      const { twitterSentiment } = await import('../../../lib/sentiment/simple-twitter-sentiment');
      
      // Get detailed sentiment data from enhanced engine
      const sentimentResult = await twitterSentiment.getBTCSentiment();
      
      // Get the raw source data
      const detailedSources = await (twitterSentiment as any).getRealSentimentData('BTC');
      
      // Group and aggregate by source type
      const sourceGroups = detailedSources.reduce((acc: any, item: any) => {
        const source = item.source;
        if (!acc[source]) {
          acc[source] = {
            source,
            dataPoints: [],
            totalScore: 0,
            totalWeight: 0,
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
        if (item.tx_count) acc[source].metadata.tx_count = item.tx_count;
        
        return acc;
      }, {});
      
      // Calculate averages and format for display
      const sources = Object.values(sourceGroups).map((group: any) => {
        const avgScore = group.totalScore / group.dataPoints.length;
        const avgWeight = group.totalWeight / group.dataPoints.length;
        const confidence = Math.min(0.95, 0.6 + (group.dataPoints.length / 10) * 0.2);
        
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
      
      const summary = {
        totalSources: sources.length,
        totalDataPoints: detailedSources.length,
        overallScore: sentimentResult.score,
        overallConfidence: sentimentResult.confidence
      };
      
      return NextResponse.json({
        success: true,
        data: {
          summary,
          sources,
          timestamp: new Date().toISOString()
        }
      });
    }
    
    const timeFilter = new Date(Date.now() - hours * 60 * 60 * 1000);

    // Get sentiment-enhanced signals
    const whereClause: any = {
      signalTime: { gte: timeFilter }
    };
    
    if (strategy && strategy !== 'all') {
      whereClause.strategy = strategy;
    }

    const enhancedSignals = await prisma.enhancedTradingSignal.findMany({
      where: whereClause,
      orderBy: { signalTime: 'desc' }
    });

    // Calculate sentiment impact statistics
    const totalSignals = enhancedSignals.length;
    const executedSignals = enhancedSignals.filter(s => s.wasExecuted).length;
    const sentimentBoosts = enhancedSignals.filter(s => (s.confidenceBoost || 0) > 0).length;
    const sentimentConflicts = enhancedSignals.filter(s => s.sentimentConflict).length;
    const avgSentimentScore = enhancedSignals.reduce((sum, s) => sum + (s.sentimentScore || 0), 0) / Math.max(totalSignals, 1);
    const avgConfidenceChange = enhancedSignals.reduce((sum, s) => sum + (s.confidenceBoost || 0), 0) / Math.max(totalSignals, 1);

    // Get per-strategy breakdown
    const strategyBreakdown = enhancedSignals.reduce((acc: any, signal) => {
      const strategy = signal.strategy;
      if (!acc[strategy]) {
        acc[strategy] = {
          strategy,
          totalSignals: 0,
          executedSignals: 0,
          sentimentBoosts: 0,
          sentimentConflicts: 0,
          avgSentimentScore: 0,
          avgConfidenceBoost: 0
        };
      }
      
      acc[strategy].totalSignals++;
      if (signal.wasExecuted) acc[strategy].executedSignals++;
      if ((signal.confidenceBoost || 0) > 0) acc[strategy].sentimentBoosts++;
      if (signal.sentimentConflict) acc[strategy].sentimentConflicts++;
      acc[strategy].avgSentimentScore += (signal.sentimentScore || 0);
      acc[strategy].avgConfidenceBoost += (signal.confidenceBoost || 0);
      
      return acc;
    }, {});

    // Calculate averages for strategy breakdown
    Object.values(strategyBreakdown).forEach((stats: any) => {
      stats.avgSentimentScore = stats.avgSentimentScore / stats.totalSignals;
      stats.avgConfidenceBoost = stats.avgConfidenceBoost / stats.totalSignals;
      stats.executionRate = (stats.executedSignals / stats.totalSignals) * 100;
      stats.boostRate = (stats.sentimentBoosts / stats.totalSignals) * 100;
      stats.conflictRate = (stats.sentimentConflicts / stats.totalSignals) * 100;
      stats.netBenefit = stats.boostRate - stats.conflictRate;
    });

    // Get recent sentiment signals for timeline
    const recentSignals = enhancedSignals.slice(0, 20).map(signal => ({
      id: signal.id,
      timestamp: signal.signalTime,
      strategy: signal.strategy,
      symbol: signal.symbol,
      originalAction: signal.technicalAction,
      finalAction: signal.finalAction,
      originalConfidence: signal.technicalScore,
      enhancedConfidence: signal.combinedConfidence,
      sentimentScore: signal.sentimentScore,
      sentimentConflict: signal.sentimentConflict,
      wasExecuted: signal.wasExecuted,
      reason: signal.executeReason
    }));

    // Calculate sentiment trends (hourly)
    const sentimentTrends = [];
    for (let i = 0; i < Math.min(hours, 24); i++) {
      const hourStart = new Date(Date.now() - (i + 1) * 60 * 60 * 1000);
      const hourEnd = new Date(Date.now() - i * 60 * 60 * 1000);
      
      const hourSignals = enhancedSignals.filter(s => 
        s.signalTime >= hourStart && s.signalTime < hourEnd
      );
      
      const avgSentiment = hourSignals.length > 0 
        ? hourSignals.reduce((sum, s) => sum + (s.sentimentScore || 0), 0) / hourSignals.length
        : 0;
      
      sentimentTrends.unshift({
        hour: hourEnd.toISOString(),
        avgSentiment,
        signalCount: hourSignals.length,
        executedCount: hourSignals.filter(s => s.wasExecuted).length
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        overview: {
          totalSignals,
          executedSignals,
          executionRate: totalSignals > 0 ? (executedSignals / totalSignals) * 100 : 0,
          sentimentBoosts,
          sentimentConflicts,
          boostRate: totalSignals > 0 ? (sentimentBoosts / totalSignals) * 100 : 0,
          conflictRate: totalSignals > 0 ? (sentimentConflicts / totalSignals) * 100 : 0,
          netBenefit: totalSignals > 0 ? ((sentimentBoosts - sentimentConflicts) / totalSignals) * 100 : 0,
          avgSentimentScore,
          avgConfidenceChange
        },
        strategyBreakdown: Object.values(strategyBreakdown),
        recentSignals,
        sentimentTrends,
        timeframe: `${hours} hours`
      }
    });

  } catch (error) {
    console.error('Error fetching sentiment analysis:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch sentiment analysis data' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
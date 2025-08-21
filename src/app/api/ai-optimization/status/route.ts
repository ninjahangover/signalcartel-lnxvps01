import { NextRequest, NextResponse } from 'next/server';
import { unifiedMarketDataService } from '@/lib/unified-market-data-service';
import { pineScriptInputOptimizer } from '@/lib/pine-script-input-optimizer';
import { marketDataCollector } from '@/lib/market-data-collector';

export async function GET(request: NextRequest) {
  try {
    const symbols = ['BTCUSD', 'ETHUSD', 'ADAUSD'];
    const aiSystemStatus = {
      timestamp: new Date().toISOString(),
      dataSource: 'REAL DATABASE ONLY - NO FAKE DATA',
      services: {}
    };

    // Check market data collection
    const collectionStatus = await marketDataCollector.getCollectionStatus();
    const totalDataPoints = await marketDataCollector.getTotalDataPoints();
    
    aiSystemStatus.services['marketDataCollector'] = {
      active: marketDataCollector.isCollectionActive(),
      totalDataPoints,
      symbols: collectionStatus.map(s => ({
        symbol: s.symbol,
        dataPoints: s.dataPoints,
        completeness: s.completeness
      }))
    };

    // Check unified market data service
    const marketAnalyses = [];
    for (const symbol of symbols) {
      const analysis = await unifiedMarketDataService.getSevenDayAnalysis(symbol);
      const conditions = await unifiedMarketDataService.getCurrentMarketConditions(symbol);
      
      marketAnalyses.push({
        symbol,
        analysis: analysis ? {
          dataPoints: analysis.dataPoints,
          completeness: analysis.completeness,
          trendDirection: analysis.trendDirection,
          averageRSI: analysis.averageRSI,
          priceChangePercent: analysis.priceChangePercent
        } : null,
        conditions: conditions ? {
          trend: conditions.trend,
          volatility: conditions.volatility,
          confidence: conditions.confidence
        } : null
      });
    }

    aiSystemStatus.services['unifiedMarketDataService'] = {
      active: true,
      analyses: marketAnalyses
    };

    // Check Pine Script optimizer
    aiSystemStatus.services['pineScriptOptimizer'] = {
      active: pineScriptInputOptimizer.isRunning(),
      optimizationHistory: pineScriptInputOptimizer.getOptimizationHistory().length,
      recentOptimizations: pineScriptInputOptimizer.getOptimizationHistory().slice(-3).map(opt => ({
        strategyId: opt.strategyId,
        timestamp: opt.timestamp,
        expectedImprovement: opt.expectedWinRateImprovement,
        dataSource: 'REAL_DATABASE'
      }))
    };

    return NextResponse.json({
      success: true,
      data: aiSystemStatus
    });
  } catch (error) {
    console.error('AI optimization status error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to get AI optimization status'
    }, { status: 500 });
  }
}
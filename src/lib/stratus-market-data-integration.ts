/**
 * Stratus Market Data Integration
 * 
 * Connects the 7-day market analyzer with the dynamic trigger system
 * and provides real market data for optimization decisions.
 */

import { sevenDayAnalyzer, getMarketAnalysis, startMarketDataCollection as startSevenDayCollection, getAllMarketAnalyses } from './seven-day-market-analyzer';
import { getAllStrategies } from './strategy-registry-competition';

class StratusMarketDataIntegration {
  private static instance: StratusMarketDataIntegration | null = null;
  private dataCollectionActive = false;
  private monitoringSymbols: string[] = [];

  static getInstance(): StratusMarketDataIntegration {
    if (!StratusMarketDataIntegration.instance) {
      StratusMarketDataIntegration.instance = new StratusMarketDataIntegration();
    }
    return StratusMarketDataIntegration.instance;
  }

  // Initialize market data collection for all strategy symbols
  async initializeDataCollection(): Promise<void> {
    try {
      // Get all symbols from active strategies
      const strategies = getAllStrategies();
      this.monitoringSymbols = [...new Set(strategies.map(s => s.symbol))];
      
      console.log(`🚀 Initializing 7-day market data collection for Stratus Engine...`);
      console.log(`📊 Monitoring symbols: ${this.monitoringSymbols.join(', ')}`);
      
      // Start data collection in background to avoid blocking
      console.log('⏳ Starting background data collection to prevent timeouts...');
      this.dataCollectionActive = true;
      
      // Start collection asynchronously to prevent request timeouts
      startSevenDayCollection(this.monitoringSymbols).catch(error => {
        console.error('❌ Background data collection error:', error);
        // Don't fail initialization if background collection has issues
      });
      
      // Log initial status after a short delay
      setTimeout(() => {
        this.logDataCollectionStatus();
      }, 3000);
      
      console.log('✅ Stratus Engine market data collection initialized (background mode)');
      
    } catch (error) {
      console.error('❌ Failed to initialize market data collection:', error);
      // Mark as active anyway to prevent repeated initialization attempts
      this.dataCollectionActive = true;
      console.log('⚠️ Continuing with limited functionality...');
    }
  }

  // Get real-time market analysis for a symbol
  getAnalysisForSymbol(symbol: string) {
    return getMarketAnalysis(symbol);
  }

  // Get market analyses for all monitored symbols
  getAllAnalyses() {
    return getAllMarketAnalyses();
  }

  // Get dynamic optimization recommendations for a strategy
  getOptimizationRecommendations(symbol: string) {
    const analysis = getMarketAnalysis(symbol);
    if (!analysis) {
      console.warn(`⚠️ No 7-day analysis available for ${symbol}`);
      return null;
    }

    return {
      symbol,
      marketRegime: analysis.marketRegime,
      technicalBias: analysis.technicalBias,
      confidence: analysis.confidence,
      recommendations: analysis.recommendations,
      keyMetrics: {
        volatility: analysis.volatilityLevel,
        trendStrength: analysis.trendStrength,
        volumeTrend: analysis.volumeTrend,
        avgVolume: analysis.avgVolume,
        supportLevels: analysis.supportLevels,
        resistanceLevels: analysis.resistanceLevels
      },
      lastUpdated: analysis.lastUpdated
    };
  }

  // Check if we have sufficient data for decision making
  hasDataForDecision(symbol: string): boolean {
    const analysis = getMarketAnalysis(symbol);
    if (!analysis) return false;
    
    // Need at least 100 data points and 70% confidence
    return analysis.dataPoints.length >= 100 && analysis.confidence >= 0.7;
  }

  // Get market condition summary for dashboard
  getMarketConditionSummary() {
    const analyses = getAllMarketAnalyses();
    if (analyses.length === 0) {
      // Check if we're still collecting data
      if (this.dataCollectionActive) {
        return {
          status: 'BACKGROUND',
          message: 'Market data collection in progress...',
          symbols: this.monitoringSymbols
        };
      }
      return {
        status: 'NO_DATA',
        message: 'No market data available',
        symbols: []
      };
    }

    const summary = {
      totalSymbols: analyses.length,
      dataQuality: analyses.reduce((sum, a) => sum + a.confidence, 0) / analyses.length,
      marketRegimes: analyses.reduce((acc, a) => {
        acc[a.marketRegime] = (acc[a.marketRegime] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      technicalBias: analyses.reduce((acc, a) => {
        acc[a.technicalBias] = (acc[a.technicalBias] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      avgVolatility: analyses.reduce((sum, a) => sum + a.trendStrength, 0) / analyses.length,
      lastUpdated: new Date(Math.max(...analyses.map(a => a.lastUpdated.getTime())))
    };

    return {
      status: 'ACTIVE',
      message: `Monitoring ${summary.totalSymbols} symbols with ${(summary.dataQuality * 100).toFixed(1)}% avg confidence`,
      summary,
      analyses: analyses.map(a => ({
        symbol: a.symbol,
        regime: a.marketRegime,
        bias: a.technicalBias,
        confidence: a.confidence,
        dataPoints: a.dataPoints.length
      }))
    };
  }

  // Log current data collection status
  private logDataCollectionStatus(): void {
    const summary = this.getMarketConditionSummary();
    
    console.log('📊 === STRATUS ENGINE MARKET DATA STATUS ===');
    console.log(`Status: ${summary.status}`);
    console.log(`Message: ${summary.message}`);
    
    if (summary.status === 'ACTIVE' && summary.analyses) {
      console.log('Market Analysis Summary:');
      summary.analyses.forEach(analysis => {
        console.log(`  ${analysis.symbol}: ${analysis.regime} | ${analysis.bias} | ${(analysis.confidence * 100).toFixed(1)}% confidence | ${analysis.dataPoints} data points`);
      });
    }
    
    console.log('=====================================');
  }

  // Stop data collection
  stopDataCollection(): void {
    sevenDayAnalyzer.stopDataCollection();
    this.dataCollectionActive = false;
    console.log('🛑 Stratus Engine market data collection stopped');
  }

  // Check if data collection is active
  isDataCollectionActive(): boolean {
    return this.dataCollectionActive;
  }

  // Get monitored symbols
  getMonitoredSymbols(): string[] {
    return [...this.monitoringSymbols];
  }

  // Force refresh data for a symbol
  async refreshSymbolData(symbol: string): Promise<void> {
    try {
      console.log(`🔄 Force refreshing data for ${symbol}...`);
      await startSevenDayCollection([symbol]);
      console.log(`✅ Data refresh completed for ${symbol}`);
    } catch (error) {
      console.error(`❌ Failed to refresh data for ${symbol}:`, error);
    }
  }
}

// Export singleton instance
export const stratusMarketDataIntegration = StratusMarketDataIntegration.getInstance();

// Export helper functions
export async function initializeStratusMarketData(): Promise<void> {
  return stratusMarketDataIntegration.initializeDataCollection();
}

export function getSymbolAnalysis(symbol: string) {
  return stratusMarketDataIntegration.getAnalysisForSymbol(symbol);
}

export function getOptimizationData(symbol: string) {
  return stratusMarketDataIntegration.getOptimizationRecommendations(symbol);
}

export function getMarketSummary() {
  return stratusMarketDataIntegration.getMarketConditionSummary();
}

export function hasAnalysisData(symbol: string): boolean {
  return stratusMarketDataIntegration.hasDataForDecision(symbol);
}
/**
 * Universal Sentiment Enhancement Layer
 * Applies sentiment validation to ANY trading strategy
 * Enables multi-strategy sentiment analysis for statistical significance
 */

import { PrismaClient } from '@prisma/client';
import { twitterSentiment, SimpleSentimentScore } from './simple-twitter-sentiment';

const prisma = new PrismaClient();

export interface BaseStrategySignal {
  symbol: string;
  action: 'BUY' | 'SELL' | 'HOLD';
  confidence: number; // 0.0 to 1.0
  price: number;
  strategy: string;
  reason: string;
  metadata?: any; // Strategy-specific data (RSI value, Bollinger bands, etc.)
}

export interface SentimentEnhancedSignal extends BaseStrategySignal {
  // Original signal
  originalAction: 'BUY' | 'SELL' | 'HOLD';
  originalConfidence: number;
  originalReason: string;
  
  // Sentiment analysis
  sentimentScore: number;
  sentimentConfidence: number;
  sentimentConflict: boolean;
  
  // Enhanced decision
  finalAction: 'BUY' | 'SELL' | 'HOLD' | 'SKIP';
  confidenceModifier: number; // -1.0 to +1.0 (how sentiment changed confidence)
  enhancedReason: string;
  
  // Execution decision
  shouldExecute: boolean;
  executionReason: string;
}

export interface SentimentConfig {
  conflictThreshold: number;     // -0.3 to 0.3 is neutral
  minSentimentConfidence: number; // Ignore sentiment below this confidence
  maxBoostPercent: number;       // Maximum confidence boost/penalty
  skipOnConflict: boolean;       // Skip trades on sentiment conflict
}

export class UniversalSentimentEnhancer {
  private defaultConfig: SentimentConfig = {
    conflictThreshold: 0.3,
    minSentimentConfidence: 0.4,
    maxBoostPercent: 0.25, // Max 25% boost or penalty
    skipOnConflict: true
  };

  /**
   * Enhance any strategy signal with sentiment validation
   * This is the main function that wraps ALL your existing strategies
   */
  async enhanceSignal(
    baseSignal: BaseStrategySignal, 
    config: Partial<SentimentConfig> = {}
  ): Promise<SentimentEnhancedSignal> {
    
    const effectiveConfig = { ...this.defaultConfig, ...config };
    
    try {
      // Get sentiment for the symbol
      const sentiment = await this.getSentimentForSymbol(baseSignal.symbol);
      
      // Apply sentiment enhancement
      const enhancedSignal = this.applySentimentEnhancement(
        baseSignal, 
        sentiment, 
        effectiveConfig
      );
      
      // Store for analysis
      await this.storeEnhancedSignal(enhancedSignal, sentiment);
      
      return enhancedSignal;
      
    } catch (error) {
      console.error(`Error enhancing ${baseSignal.strategy} signal:`, error);
      
      // Fallback to original signal on error
      return this.createFallbackSignal(baseSignal, 'Sentiment analysis failed');
    }
  }

  /**
   * Enhance multiple strategy signals simultaneously
   * Perfect for your multi-strategy trading system
   */
  async enhanceMultipleSignals(
    signals: BaseStrategySignal[],
    config: Partial<SentimentConfig> = {}
  ): Promise<SentimentEnhancedSignal[]> {
    
    console.log(`🎯 Enhancing ${signals.length} strategy signals with sentiment validation`);
    
    const enhancedSignals: SentimentEnhancedSignal[] = [];
    
    // Get unique symbols to minimize API calls
    const symbols = [...new Set(signals.map(s => s.symbol))];
    const sentimentCache: Record<string, SimpleSentimentScore> = {};
    
    // Fetch sentiment for all symbols
    for (const symbol of symbols) {
      sentimentCache[symbol] = await this.getSentimentForSymbol(symbol);
    }
    
    // Enhance each signal
    for (const signal of signals) {
      const sentiment = sentimentCache[signal.symbol];
      const enhanced = this.applySentimentEnhancement(signal, sentiment, { ...this.defaultConfig, ...config });
      enhancedSignals.push(enhanced);
      
      // Store for analysis
      await this.storeEnhancedSignal(enhanced, sentiment);
    }
    
    // Log summary
    const executed = enhancedSignals.filter(s => s.shouldExecute);
    const skipped = enhancedSignals.filter(s => s.sentimentConflict);
    const boosted = enhancedSignals.filter(s => s.confidenceModifier > 0);
    
    console.log(`📊 Sentiment Enhancement Summary:`);
    console.log(`   Signals to Execute: ${executed.length}/${signals.length}`);
    console.log(`   Skipped (Conflict): ${skipped.length}`);
    console.log(`   Confidence Boosted: ${boosted.length}`);
    
    return enhancedSignals;
  }

  /**
   * Get sentiment for symbol with caching
   */
  private async getSentimentForSymbol(symbol: string): Promise<SimpleSentimentScore> {
    switch (symbol.toUpperCase()) {
      case 'BTC':
      case 'BTCUSD':
        return await twitterSentiment.getBTCSentiment();
      case 'ETH':
      case 'ETHUSD':
        return await twitterSentiment.getETHSentiment();
      default:
        // Default to BTC sentiment for other crypto pairs
        return await twitterSentiment.getBTCSentiment();
    }
  }

  /**
   * Apply sentiment enhancement logic to a strategy signal
   */
  private applySentimentEnhancement(
    signal: BaseStrategySignal,
    sentiment: SimpleSentimentScore,
    config: SentimentConfig
  ): SentimentEnhancedSignal {
    
    const originalAction = signal.action;
    const originalConfidence = signal.confidence;
    
    // Check for sentiment conflict
    const sentimentConflict = this.checkSentimentConflict(signal.action, sentiment, config.conflictThreshold);
    
    // Calculate confidence modification
    let confidenceModifier = 0;
    let finalConfidence = originalConfidence;
    let finalAction: 'BUY' | 'SELL' | 'HOLD' | 'SKIP' = signal.action;
    let shouldExecute = signal.action !== 'HOLD';
    let executionReason = signal.reason;
    
    if (sentiment.confidence < config.minSentimentConfidence) {
      // Low confidence sentiment - ignore
      executionReason += ' (low confidence sentiment ignored)';
      
    } else if (sentimentConflict && config.skipOnConflict) {
      // Sentiment conflict - skip trade
      finalAction = 'SKIP';
      shouldExecute = false;
      executionReason = `❌ Sentiment conflict: ${signal.action} signal but ${sentiment.score > 0 ? 'bullish' : 'bearish'} sentiment (${sentiment.score.toFixed(2)}, conf: ${sentiment.confidence.toFixed(2)})`;
      
    } else if (!sentimentConflict) {
      // Sentiment alignment - apply boost
      const sentimentStrength = Math.abs(sentiment.score);
      const boostFactor = (sentimentStrength * sentiment.confidence * config.maxBoostPercent);
      
      if (sentiment.score > 0 && signal.action === 'BUY') {
        // Bullish sentiment supports BUY
        confidenceModifier = boostFactor;
        finalConfidence = Math.min(0.95, originalConfidence + boostFactor);
        executionReason += ` 📈 +${(boostFactor * 100).toFixed(1)}% bullish sentiment boost`;
        
      } else if (sentiment.score < 0 && signal.action === 'SELL') {
        // Bearish sentiment supports SELL  
        confidenceModifier = boostFactor;
        finalConfidence = Math.min(0.95, originalConfidence + boostFactor);
        executionReason += ` 📉 +${(boostFactor * 100).toFixed(1)}% bearish sentiment boost`;
        
      } else {
        // Neutral or weak sentiment - small penalty
        confidenceModifier = -0.05;
        finalConfidence = Math.max(0.1, originalConfidence - 0.05);
        executionReason += ' ➡️ neutral sentiment, slight confidence reduction';
      }
    }

    return {
      ...signal,
      confidence: finalConfidence,
      action: finalAction,
      reason: executionReason,
      
      // Original signal data
      originalAction,
      originalConfidence,
      originalReason: signal.reason,
      
      // Sentiment data
      sentimentScore: sentiment.score,
      sentimentConfidence: sentiment.confidence,
      sentimentConflict,
      
      // Enhanced decision
      finalAction,
      confidenceModifier,
      enhancedReason: executionReason,
      
      // Execution decision
      shouldExecute,
      executionReason
    };
  }

  /**
   * Check if sentiment conflicts with trading action
   */
  private checkSentimentConflict(action: 'BUY' | 'SELL' | 'HOLD', sentiment: SimpleSentimentScore, threshold: number): boolean {
    if (action === 'HOLD') return false; // No conflict for hold signals
    if (sentiment.confidence < 0.5) return false; // Ignore low confidence sentiment
    
    if (action === 'BUY' && sentiment.score < -threshold) return true; // Buying in bearish sentiment
    if (action === 'SELL' && sentiment.score > threshold) return true;  // Selling in bullish sentiment
    
    return false;
  }

  /**
   * Create fallback signal when sentiment analysis fails
   */
  private createFallbackSignal(baseSignal: BaseStrategySignal, reason: string): SentimentEnhancedSignal {
    return {
      ...baseSignal,
      originalAction: baseSignal.action,
      originalConfidence: baseSignal.confidence,
      originalReason: baseSignal.reason,
      sentimentScore: 0,
      sentimentConfidence: 0,
      sentimentConflict: false,
      finalAction: baseSignal.action,
      confidenceModifier: 0,
      enhancedReason: `${baseSignal.reason} (${reason})`,
      shouldExecute: baseSignal.action !== 'HOLD',
      executionReason: reason
    };
  }

  /**
   * Store enhanced signal for performance analysis
   */
  private async storeEnhancedSignal(signal: SentimentEnhancedSignal, sentiment: SimpleSentimentScore): Promise<void> {
    try {
      await prisma.enhancedTradingSignal.create({
        data: {
          symbol: signal.symbol,
          strategy: signal.strategy,
          technicalScore: signal.originalConfidence,
          technicalAction: signal.originalAction,
          sentimentScore: sentiment.score,
          sentimentConfidence: sentiment.confidence,
          sentimentConflict: signal.sentimentConflict,
          combinedConfidence: signal.confidence,
          finalAction: signal.finalAction,
          confidenceBoost: signal.confidenceModifier,
          executeReason: signal.executionReason,
          wasExecuted: false // Will be updated when trade executes
        }
      });
    } catch (error) {
      console.error('Error storing enhanced signal:', error);
    }
  }

  /**
   * Get performance comparison across all strategies
   */
  async getMultiStrategyPerformanceAnalysis(days: number = 7) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    
    const signals = await prisma.enhancedTradingSignal.findMany({
      where: {
        signalTime: { gte: cutoffDate }
      },
      orderBy: { signalTime: 'desc' }
    });
    
    // Group by strategy
    const byStrategy = signals.reduce((acc, signal) => {
      if (!acc[signal.strategy]) {
        acc[signal.strategy] = [];
      }
      acc[signal.strategy].push(signal);
      return acc;
    }, {} as Record<string, any[]>);
    
    // Analyze each strategy
    const analysis = Object.entries(byStrategy).map(([strategy, strategySignals]) => {
      const totalSignals = strategySignals.length;
      const conflictSignals = strategySignals.filter(s => s.sentimentConflict).length;
      const boostedSignals = strategySignals.filter(s => (s.confidenceBoost || 0) > 0).length;
      const executedSignals = strategySignals.filter(s => s.wasExecuted).length;
      
      const avgBoost = strategySignals.reduce((sum, s) => sum + (s.confidenceBoost || 0), 0) / totalSignals;
      const conflictRate = (conflictSignals / totalSignals) * 100;
      const boostRate = (boostedSignals / totalSignals) * 100;
      const executionRate = (executedSignals / totalSignals) * 100;
      
      return {
        strategy,
        totalSignals,
        conflictSignals,
        boostedSignals,
        executedSignals,
        avgBoost: avgBoost * 100, // Convert to percentage
        conflictRate,
        boostRate,
        executionRate
      };
    });
    
    return {
      analysisDate: new Date(),
      daysCovered: days,
      totalSignals: signals.length,
      strategiesAnalyzed: analysis.length,
      strategies: analysis,
      overallConflictRate: (signals.filter(s => s.sentimentConflict).length / signals.length) * 100,
      overallBoostRate: (signals.filter(s => (s.confidenceBoost || 0) > 0).length / signals.length) * 100
    };
  }
}

export const universalSentimentEnhancer = new UniversalSentimentEnhancer();
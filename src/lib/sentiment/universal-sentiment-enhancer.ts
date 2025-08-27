/**
 * Universal Sentiment Enhancement Layer
 * Applies sentiment validation AND order book validation to ANY trading strategy
 * Enables multi-strategy sentiment analysis with market microstructure validation
 */

import { PrismaClient } from '@prisma/client';
import { twitterSentiment, SimpleSentimentScore } from './simple-twitter-sentiment';
import { orderBookValidator, OrderBookValidationResult, TradingSignal } from '../order-book-validator';

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
  
  // Order book validation
  orderBookValidation?: OrderBookValidationResult;
  orderBookConflict: boolean;
  marketStructureRisk: 'LOW' | 'MEDIUM' | 'HIGH' | 'EXTREME';
  
  // Enhanced decision
  finalAction: 'BUY' | 'SELL' | 'HOLD' | 'SKIP';
  confidenceModifier: number; // -1.0 to +1.0 (how sentiment changed confidence)
  orderBookModifier: number; // -1.0 to +1.0 (how order book changed confidence)
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
  
  // Order book validation settings
  enableOrderBookValidation: boolean; // Enable order book validation layer
  minOrderBookValidation: number;     // Minimum validation strength (0-100)
  skipOnOrderBookConflict: boolean;   // Skip trades on order book conflict
  maxOrderBookBoost: number;          // Maximum order book confidence boost
}

export class UniversalSentimentEnhancer {
  private defaultConfig: SentimentConfig = {
    conflictThreshold: 0.3,
    minSentimentConfidence: 0.5, // Lowered from 0.4 to enable real sentiment impact
    maxBoostPercent: 0.35, // Increased max boost for stronger sentiment influence
    skipOnConflict: true,
    
    // Order book validation settings
    enableOrderBookValidation: true, // Enable by default for QUANTUM FORGE™
    minOrderBookValidation: 60, // Require 60% validation strength minimum
    skipOnOrderBookConflict: true, // Skip on order book conflicts
    maxOrderBookBoost: 0.25 // Order book can boost confidence by up to 25%
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
      
      // Apply sentiment and order book enhancement
      const enhancedSignal = await this.applySentimentAndOrderBookEnhancement(
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
      const enhanced = await this.applySentimentAndOrderBookEnhancement(signal, sentiment, { ...this.defaultConfig, ...config });
      enhancedSignals.push(enhanced);
      
      // Store for analysis
      await this.storeEnhancedSignal(enhanced, sentiment);
    }
    
    // Log summary
    const executed = enhancedSignals.filter(s => s.shouldExecute);
    const sentimentSkipped = enhancedSignals.filter(s => s.sentimentConflict);
    const orderBookSkipped = enhancedSignals.filter(s => s.orderBookConflict);
    const sentimentBoosted = enhancedSignals.filter(s => s.confidenceModifier > 0);
    const orderBookBoosted = enhancedSignals.filter(s => s.orderBookModifier > 0);
    const highRisk = enhancedSignals.filter(s => s.marketStructureRisk === 'HIGH' || s.marketStructureRisk === 'EXTREME');
    
    console.log(`📊 QUANTUM FORGE™ Enhancement Summary:`);
    console.log(`   Signals to Execute: ${executed.length}/${signals.length}`);
    console.log(`   Skipped (Sentiment): ${sentimentSkipped.length}`);
    console.log(`   Skipped (Order Book): ${orderBookSkipped.length}`);
    console.log(`   Sentiment Boosted: ${sentimentBoosted.length}`);
    console.log(`   Order Book Boosted: ${orderBookBoosted.length}`);
    console.log(`   High Risk Markets: ${highRisk.length}`);
    
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
   * Apply sentiment AND order book enhancement logic to a strategy signal
   * This now includes QUANTUM FORGE™ order book validation
   */
  private async applySentimentAndOrderBookEnhancement(
    signal: BaseStrategySignal,
    sentiment: SimpleSentimentScore,
    config: SentimentConfig
  ): Promise<SentimentEnhancedSignal> {
    
    const originalAction = signal.action;
    const originalConfidence = signal.confidence;
    
    // Check for sentiment conflict
    const sentimentConflict = this.checkSentimentConflict(signal.action, sentiment, config.conflictThreshold);
    
    // Initialize enhancement variables
    let confidenceModifier = 0;
    let orderBookModifier = 0;
    let finalConfidence = originalConfidence;
    let finalAction: 'BUY' | 'SELL' | 'HOLD' | 'SKIP' = signal.action;
    let shouldExecute = signal.action !== 'HOLD';
    let executionReason = signal.reason;
    
    // Order book validation
    let orderBookValidation: OrderBookValidationResult | undefined = undefined;
    let orderBookConflict = false;
    let marketStructureRisk: 'LOW' | 'MEDIUM' | 'HIGH' | 'EXTREME' = 'LOW';
    
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

    // QUANTUM FORGE™ ORDER BOOK VALIDATION LAYER
    if (config.enableOrderBookValidation && signal.action !== 'HOLD') {
      try {
        console.log(`🔬 QUANTUM FORGE™: Running order book validation for ${signal.symbol}...`);
        
        const tradingSignal: TradingSignal = {
          action: signal.action,
          confidence: finalConfidence,
          price: signal.price,
          symbol: signal.symbol,
          strategy: signal.strategy,
          reason: executionReason
        };
        
        orderBookValidation = await orderBookValidator.validateSignal(tradingSignal);
        marketStructureRisk = orderBookValidation.riskLevel;
        
        // Check for order book conflict
        orderBookConflict = orderBookValidation.signalAlignment < -20; // Conflict if alignment < -20%
        
        if (orderBookConflict && config.skipOnOrderBookConflict) {
          // Order book conflicts - skip trade
          finalAction = 'SKIP';
          shouldExecute = false;
          executionReason += ` ❌ Order book conflict: ${orderBookValidation.validationReason}`;
          
        } else if (orderBookValidation.validationStrength < config.minOrderBookValidation) {
          // Low order book validation - reduce position or skip
          if (orderBookValidation.recommendedAction === 'SKIP') {
            finalAction = 'SKIP';
            shouldExecute = false;
            executionReason += ` ⚠️ Order book validation failed: ${orderBookValidation.validationReason}`;
          } else {
            executionReason += ` 📊 Low order book validation (${orderBookValidation.validationStrength.toFixed(1)}%)`;
          }
          
        } else if (orderBookValidation.isValidated && orderBookValidation.validationStrength > 70) {
          // Strong order book validation - apply boost
          const validationStrength = orderBookValidation.validationStrength / 100;
          const alignmentBoost = Math.max(0, orderBookValidation.signalAlignment / 100);
          orderBookModifier = validationStrength * alignmentBoost * config.maxOrderBookBoost;
          
          finalConfidence = Math.min(0.95, finalConfidence + orderBookModifier);
          executionReason += ` 📈 +${(orderBookModifier * 100).toFixed(1)}% order book validation boost`;
        }
        
        console.log(`✅ Order book validation complete: ${orderBookValidation.recommendedAction} (${orderBookValidation.validationStrength.toFixed(1)}%)`);
        
      } catch (error) {
        console.error(`❌ Order book validation failed for ${signal.symbol}:`, error);
        marketStructureRisk = 'HIGH';
        executionReason += ' ⚠️ Order book validation unavailable';
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
      
      // Order book validation data
      orderBookValidation,
      orderBookConflict,
      marketStructureRisk,
      
      // Enhanced decision
      finalAction,
      confidenceModifier,
      orderBookModifier,
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
      orderBookValidation: undefined,
      orderBookConflict: false,
      marketStructureRisk: 'HIGH',
      finalAction: baseSignal.action,
      confidenceModifier: 0,
      orderBookModifier: 0,
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

// Export class as default for compatibility
export default UniversalSentimentEnhancer;
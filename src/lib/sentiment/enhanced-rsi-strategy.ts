/**
 * Enhanced RSI Strategy with Twitter Sentiment Validation
 * Combines technical RSI signals with Twitter sentiment analysis
 */

import { PrismaClient } from '@prisma/client';
import { SimpleTwitterSentiment, SimpleSentimentScore, twitterSentiment } from './simple-twitter-sentiment';

const prisma = new PrismaClient();

export interface TechnicalSignal {
  symbol: string;
  action: 'BUY' | 'SELL' | 'HOLD';
  confidence: number; // 0.0 to 1.0
  price: number;
  rsiValue?: number;
  strategy: string;
  reason: string;
}

export interface EnhancedSignal extends TechnicalSignal {
  // Original technical signal
  originalConfidence: number;
  
  // Sentiment analysis
  sentimentScore?: number;
  sentimentConfidence?: number;
  sentimentConflict: boolean;
  
  // Enhanced decision
  finalAction: 'BUY' | 'SELL' | 'HOLD' | 'SKIP';
  confidenceBoost: number; // How much sentiment modified confidence
  executeReason: string;   // Why this action was chosen
}

export class EnhancedRSIStrategy {
  private sentimentService: SimpleTwitterSentiment;
  private rsiPeriod: number = 14;
  private oversoldThreshold: number = 30;
  private overboughtThreshold: number = 70;
  
  // Sentiment validation settings
  private sentimentConflictThreshold: number = 0.3; // -0.3 to 0.3 is neutral
  private maxSentimentBoost: number = 0.2; // Max 20% confidence boost
  private minSentimentConfidence: number = 0.4; // Ignore low-confidence sentiment

  constructor() {
    this.sentimentService = twitterSentiment;
  }

  /**
   * Generate enhanced trading signal with sentiment validation
   */
  async generateEnhancedSignal(symbol: string, currentPrice: number, historicalPrices: number[]): Promise<EnhancedSignal> {
    try {
      // Step 1: Generate technical RSI signal
      const technicalSignal = this.generateRSISignal(symbol, currentPrice, historicalPrices);
      
      // Step 2: Get sentiment validation
      const sentimentScore = await this.getSentimentValidation(symbol);
      
      // Step 3: Combine signals for enhanced decision
      const enhancedSignal = this.combineSignals(technicalSignal, sentimentScore);
      
      // Step 4: Store the signal for analysis
      await this.storeEnhancedSignal(enhancedSignal, sentimentScore);
      
      return enhancedSignal;
      
    } catch (error) {
      console.error('Error generating enhanced signal:', error);
      
      // Fallback to technical-only signal on error
      const technicalSignal = this.generateRSISignal(symbol, currentPrice, historicalPrices);
      return {
        ...technicalSignal,
        originalConfidence: technicalSignal.confidence,
        sentimentConflict: false,
        finalAction: technicalSignal.action,
        confidenceBoost: 0,
        executeReason: 'Sentiment analysis failed, using technical only'
      };
    }
  }

  /**
   * Generate basic RSI technical signal
   */
  private generateRSISignal(symbol: string, currentPrice: number, historicalPrices: number[]): TechnicalSignal {
    if (historicalPrices.length < this.rsiPeriod + 1) {
      return {
        symbol,
        action: 'HOLD',
        confidence: 0,
        price: currentPrice,
        strategy: 'Enhanced RSI',
        reason: 'Insufficient price data for RSI calculation'
      };
    }

    const rsiValue = this.calculateRSI(historicalPrices, this.rsiPeriod);
    
    let action: 'BUY' | 'SELL' | 'HOLD' = 'HOLD';
    let confidence = 0;
    let reason = '';

    if (rsiValue <= this.oversoldThreshold) {
      action = 'BUY';
      // Higher confidence for more oversold conditions
      confidence = Math.min(0.95, (this.oversoldThreshold - rsiValue) / this.oversoldThreshold + 0.5);
      reason = `RSI oversold at ${rsiValue.toFixed(2)}`;
    } else if (rsiValue >= this.overboughtThreshold) {
      action = 'SELL';
      // Higher confidence for more overbought conditions
      confidence = Math.min(0.95, (rsiValue - this.overboughtThreshold) / (100 - this.overboughtThreshold) + 0.5);
      reason = `RSI overbought at ${rsiValue.toFixed(2)}`;
    } else {
      action = 'HOLD';
      confidence = 0.1; // Low confidence for neutral RSI
      reason = `RSI neutral at ${rsiValue.toFixed(2)}`;
    }

    return {
      symbol,
      action,
      confidence,
      price: currentPrice,
      rsiValue,
      strategy: 'Enhanced RSI',
      reason
    };
  }

  /**
   * Get sentiment validation for the symbol
   */
  private async getSentimentValidation(symbol: string): Promise<SimpleSentimentScore> {
    try {
      // Store sentiment data in database for analysis
      const sentiment = await (symbol === 'BTC' ? 
        this.sentimentService.getBTCSentiment() : 
        this.sentimentService.getETHSentiment()
      );

      // Store in database
      await prisma.sentimentData.create({
        data: {
          symbol: sentiment.symbol,
          source: 'twitter',
          score: sentiment.score,
          confidence: sentiment.confidence,
          tweetCount: sentiment.tweetCount,
          positiveCount: sentiment.positiveCount,
          negativeCount: sentiment.negativeCount,
          neutralCount: sentiment.neutralCount,
          keywords: JSON.stringify(['simulated']), // TODO: Store actual keywords
          processingTime: 100 // TODO: Track actual processing time
        }
      });

      return sentiment;
      
    } catch (error) {
      console.error('Error getting sentiment validation:', error);
      return {
        symbol,
        score: 0,
        confidence: 0,
        timestamp: new Date(),
        tweetCount: 0,
        positiveCount: 0,
        negativeCount: 0,
        neutralCount: 0
      };
    }
  }

  /**
   * Combine technical and sentiment signals
   */
  private combineSignals(technical: TechnicalSignal, sentiment: SimpleSentimentScore): EnhancedSignal {
    const originalConfidence = technical.confidence;
    let finalAction: 'BUY' | 'SELL' | 'HOLD' | 'SKIP' = technical.action;
    let confidenceBoost = 0;
    let executeReason = technical.reason;

    // Check for sentiment conflict
    const sentimentConflict = this.sentimentService.checkSentimentConflict(
      technical.action, 
      sentiment, 
      this.sentimentConflictThreshold
    );

    let finalConfidence = technical.confidence;

    if (sentimentConflict && sentiment.confidence > this.minSentimentConfidence) {
      // Strong sentiment conflict - skip the trade
      finalAction = 'SKIP';
      finalConfidence = 0;
      executeReason = `Sentiment conflict: ${technical.action} signal but sentiment is ${sentiment.score > 0 ? 'bullish' : 'bearish'} (${sentiment.score.toFixed(2)})`;
      
    } else if (!sentimentConflict && sentiment.confidence > this.minSentimentConfidence) {
      // Sentiment agrees - apply confidence boost
      const boost = this.sentimentService.calculateSentimentBoost(sentiment, this.maxSentimentBoost);
      confidenceBoost = boost - 1.0;
      finalConfidence = Math.min(0.95, technical.confidence * boost);
      
      if (confidenceBoost > 0) {
        executeReason += ` + sentiment boost: ${sentiment.score > 0 ? 'bullish' : 'bearish'} sentiment (${sentiment.score.toFixed(2)}, conf: ${sentiment.confidence.toFixed(2)})`;
      }
      
    } else {
      // Low confidence sentiment or neutral - use technical signal as-is
      executeReason += ' (sentiment ignored: low confidence)';
    }

    return {
      ...technical,
      confidence: finalConfidence,
      originalConfidence,
      sentimentScore: sentiment.score,
      sentimentConfidence: sentiment.confidence,
      sentimentConflict,
      finalAction,
      confidenceBoost,
      executeReason
    };
  }

  /**
   * Store enhanced signal in database for analysis
   */
  private async storeEnhancedSignal(signal: EnhancedSignal, sentiment: SimpleSentimentScore): Promise<void> {
    try {
      await prisma.enhancedTradingSignal.create({
        data: {
          symbol: signal.symbol,
          strategy: signal.strategy,
          technicalScore: signal.originalConfidence,
          technicalAction: signal.action,
          sentimentScore: sentiment.score,
          sentimentConfidence: sentiment.confidence,
          sentimentConflict: signal.sentimentConflict,
          combinedConfidence: signal.confidence,
          finalAction: signal.finalAction,
          confidenceBoost: signal.confidenceBoost,
          executeReason: signal.executeReason,
          wasExecuted: false // Will be updated when trade executes
        }
      });
    } catch (error) {
      console.error('Error storing enhanced signal:', error);
    }
  }

  /**
   * Calculate RSI using standard formula
   */
  private calculateRSI(prices: number[], period: number): number {
    if (prices.length < period + 1) {
      return 50; // Neutral RSI if insufficient data
    }

    let gains = 0;
    let losses = 0;

    // Calculate initial average gain and loss
    for (let i = 1; i <= period; i++) {
      const change = prices[i] - prices[i - 1];
      if (change > 0) {
        gains += change;
      } else {
        losses -= change;
      }
    }

    let avgGain = gains / period;
    let avgLoss = losses / period;

    // Calculate RSI using smoothed averages for remaining periods
    for (let i = period + 1; i < prices.length; i++) {
      const change = prices[i] - prices[i - 1];
      
      if (change > 0) {
        avgGain = ((avgGain * (period - 1)) + change) / period;
        avgLoss = (avgLoss * (period - 1)) / period;
      } else {
        avgGain = (avgGain * (period - 1)) / period;
        avgLoss = ((avgLoss * (period - 1)) - change) / period;
      }
    }

    const rs = avgGain / avgLoss;
    const rsi = 100 - (100 / (1 + rs));

    return rsi;
  }

  /**
   * Update signal execution status
   */
  async markSignalExecuted(signalId: string, tradeId: string, executed: boolean): Promise<void> {
    try {
      await prisma.enhancedTradingSignal.updateMany({
        where: { id: signalId },
        data: {
          wasExecuted: executed,
          executionTime: new Date(),
          tradeId: executed ? tradeId : null
        }
      });
    } catch (error) {
      console.error('Error updating signal execution status:', error);
    }
  }

  /**
   * Get recent signals for analysis
   */
  async getRecentSignals(symbol?: string, limit: number = 50) {
    return await prisma.enhancedTradingSignal.findMany({
      where: symbol ? { symbol } : undefined,
      orderBy: { signalTime: 'desc' },
      take: limit
    });
  }

  /**
   * Get sentiment vs performance analysis
   */
  async getSentimentPerformanceAnalysis(symbol?: string) {
    const signals = await prisma.enhancedTradingSignal.findMany({
      where: {
        ...(symbol ? { symbol } : {}),
        wasExecuted: true,
        sentimentScore: { not: null }
      },
      include: {
        // TODO: Add relation to actual trade results for P&L analysis
      },
      orderBy: { signalTime: 'desc' },
      take: 100
    });

    // Analyze sentiment impact on trading performance
    const withSentimentBoost = signals.filter(s => (s.confidenceBoost || 0) > 0);
    const withSentimentConflict = signals.filter(s => s.sentimentConflict);
    
    return {
      totalSignals: signals.length,
      sentimentBoostSignals: withSentimentBoost.length,
      sentimentConflictSignals: withSentimentConflict.length,
      averageBoost: withSentimentBoost.reduce((sum, s) => sum + (s.confidenceBoost || 0), 0) / Math.max(withSentimentBoost.length, 1),
      // TODO: Add P&L impact analysis when trade results are linked
    };
  }
}

export const enhancedRSIStrategy = new EnhancedRSIStrategy();
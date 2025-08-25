/**
 * QUANTUM FORGE™ Sentiment Intelligence Engine
 * GPU-accelerated multi-source sentiment analysis with real-time learning
 */

import { twitterSentiment, SimpleSentimentScore } from './simple-twitter-sentiment';
import { phase1SentimentEngine, RedditSentimentData, OnChainData } from './phase1-reddit-onchain';
import { gpuNLPProcessor, GPUSentimentResult } from './gpu-nlp-processor';
import { orderBookIntelligence, OrderBookSignal } from './order-book-intelligence';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface QuantumForgeSentiment {
  symbol: string;
  timestamp: Date;
  
  // Aggregated scores
  overallScore: number;        // -1.0 to +1.0
  overallConfidence: number;   // 0.0 to 1.0
  sentiment: 'EXTREME_BULLISH' | 'BULLISH' | 'NEUTRAL' | 'BEARISH' | 'EXTREME_BEARISH';
  
  // Individual sources
  sources: {
    twitter: SimpleSentimentScore;
    reddit: RedditSentimentData;
    onChain: OnChainData;
    orderBook: OrderBookSignal;
    news?: any; // Phase 2
    economic?: any; // Phase 2
    telegram?: any; // Phase 3
  };
  
  // Critical signals
  criticalEvents: CriticalEvent[];
  whaleAlerts: WhaleAlert[];
  
  // Market context
  marketContext: {
    trend: 'UPTREND' | 'DOWNTREND' | 'SIDEWAYS';
    volatility: 'LOW' | 'MEDIUM' | 'HIGH' | 'EXTREME';
    volume: 'LOW' | 'NORMAL' | 'HIGH' | 'EXTREME';
    gpuDemand?: number; // 0-10 scale
    aiHype?: number;    // 0-10 scale
  };
  
  // Trading recommendations
  tradingSignal: {
    action: 'STRONG_BUY' | 'BUY' | 'HOLD' | 'SELL' | 'STRONG_SELL' | 'WAIT';
    confidence: number;
    reason: string;
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'EXTREME';
  };
  
  // GPU processing metrics
  processingMetrics: {
    totalTimeMs: number;
    gpuTimeMs: number;
    sourcesProcessed: number;
    tokensAnalyzed: number;
  };
}

export interface CriticalEvent {
  type: 'PARTNERSHIP' | 'HACK' | 'REGULATORY' | 'LISTING' | 'WHALE_MOVE' | 'ECONOMIC';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  description: string;
  source: string;
  timestamp: Date;
  impact: number; // -10 to +10
}

export interface WhaleAlert {
  amount: number;
  token: string;
  from: string;
  to: string;
  type: 'ACCUMULATION' | 'DISTRIBUTION' | 'EXCHANGE_IN' | 'EXCHANGE_OUT';
  timestamp: Date;
}

export class QuantumForgeSentimentEngine {
  private gpuProcessor = gpuNLPProcessor;
  private phase1Engine = phase1SentimentEngine;
  
  // Adaptive learning weights (updated based on performance)
  private sourceWeights = {
    twitter: 0.12,    // Reduced since we already have it
    reddit: 0.18,     // Community sentiment
    onChain: 0.25,    // Most reliable
    orderBook: 0.25,  // Real-time market structure (highest priority)
    news: 0.12,       // Major events
    economic: 0.08    // Macro context
  };
  
  // Sentiment thresholds
  private readonly thresholds = {
    extremeBullish: 0.7,
    bullish: 0.3,
    bearish: -0.3,
    extremeBearish: -0.7
  };

  /**
   * Get comprehensive sentiment analysis for trading decisions
   */
  async analyzeSentiment(symbol: string): Promise<QuantumForgeSentiment> {
    const startTime = Date.now();
    let gpuTime = 0;
    let tokensAnalyzed = 0;
    
    try {
      // Collect sentiment from all sources in parallel
      console.log(`🧠 QUANTUM FORGE: Analyzing sentiment for ${symbol}...`);
      
      const [twitterData, redditData, onChainData, orderBookData] = await Promise.all([
        twitterSentiment.getSymbolSentiment(symbol, [symbol]),
        this.phase1Engine.getRedditSentiment(symbol),
        this.phase1Engine.getOnChainAnalysis(symbol),
        this.getOrderBookSignal(symbol)
      ]);
      
      // Track GPU processing metrics
      gpuTime += redditData.processingTimeMs || 0;
      tokensAnalyzed += redditData.topPosts?.length * 20 || 0; // Estimate tokens
      
      // Detect critical events
      const criticalEvents = await this.detectCriticalEvents(
        symbol,
        redditData,
        onChainData
      );
      
      // Extract whale alerts
      const whaleAlerts = this.extractWhaleAlerts(onChainData);
      
      // Calculate aggregated sentiment including order book
      const overallScore = this.calculateAggregatedScore({
        twitter: twitterData.score,
        reddit: redditData.score,
        onChain: onChainData.sentimentScore,
        orderBook: this.convertOrderBookToSentiment(orderBookData)
      });
      
      const overallConfidence = this.calculateAggregatedConfidence({
        twitter: twitterData.confidence,
        reddit: redditData.confidence,
        onChain: onChainData.confidence,
        orderBook: orderBookData ? orderBookData.confidenceScore / 100 : 0
      });
      
      // Determine sentiment category
      const sentiment = this.categorizeSentiment(overallScore);
      
      // Analyze market context
      const marketContext = await this.analyzeMarketContext(symbol, onChainData);
      
      // Generate enhanced trading signal with order book data
      const tradingSignal = this.generateTradingSignal(
        overallScore,
        overallConfidence,
        sentiment,
        criticalEvents,
        marketContext,
        orderBookData
      );
      
      // Log sentiment analysis
      console.log(`📊 Sentiment Analysis Complete:`);
      console.log(`  • Overall: ${sentiment} (${overallScore.toFixed(3)})`);
      console.log(`  • Confidence: ${(overallConfidence * 100).toFixed(1)}%`);
      console.log(`  • Twitter: ${twitterData.score.toFixed(3)}`);
      console.log(`  • Reddit: ${redditData.score.toFixed(3)} (${redditData.volume} posts)`);
      console.log(`  • On-chain: ${onChainData.sentimentScore.toFixed(3)}`);
      console.log(`  • Order Book: ${orderBookData ? orderBookData.entrySignal : 'N/A'} (${orderBookData ? orderBookData.confidenceScore.toFixed(1) + '%' : 'offline'})`);
      console.log(`  • Critical Events: ${criticalEvents.length}`);
      console.log(`  • Trading Signal: ${tradingSignal.action} (${tradingSignal.reason})`);
      
      const result: QuantumForgeSentiment = {
        symbol,
        timestamp: new Date(),
        overallScore,
        overallConfidence,
        sentiment,
        sources: {
          twitter: twitterData,
          reddit: redditData,
          onChain: onChainData,
          orderBook: orderBookData || this.getDefaultOrderBookSignal(symbol)
        },
        criticalEvents,
        whaleAlerts,
        marketContext,
        tradingSignal,
        processingMetrics: {
          totalTimeMs: Date.now() - startTime,
          gpuTimeMs: gpuTime,
          sourcesProcessed: 3,
          tokensAnalyzed
        }
      };
      
      // Store in database for learning
      await this.storeSentimentAnalysis(result);
      
      // Update adaptive weights based on performance
      await this.updateAdaptiveWeights(symbol);
      
      return result;
      
    } catch (error) {
      console.error('Quantum Forge sentiment error:', error);
      return this.getDefaultSentiment(symbol);
    }
  }

  /**
   * Detect critical events from sentiment data
   */
  private async detectCriticalEvents(
    symbol: string,
    reddit: RedditSentimentData,
    onChain: OnChainData
  ): Promise<CriticalEvent[]> {
    const events: CriticalEvent[] = [];
    
    // Check Reddit for critical keywords
    if (reddit.topPosts) {
      for (const post of reddit.topPosts) {
        const lowerTitle = post.title.toLowerCase();
        
        // Partnership detection
        if (lowerTitle.includes('partnership') || lowerTitle.includes('collaboration')) {
          events.push({
            type: 'PARTNERSHIP',
            severity: post.upvotes > 1000 ? 'HIGH' : 'MEDIUM',
            description: post.title,
            source: 'Reddit',
            timestamp: new Date(),
            impact: 5
          });
        }
        
        // Hack/exploit detection
        if (lowerTitle.includes('hack') || lowerTitle.includes('exploit') || lowerTitle.includes('breach')) {
          events.push({
            type: 'HACK',
            severity: 'CRITICAL',
            description: post.title,
            source: 'Reddit',
            timestamp: new Date(),
            impact: -8
          });
        }
        
        // Regulatory news
        if (lowerTitle.includes('sec') || lowerTitle.includes('regulation') || lowerTitle.includes('ban')) {
          events.push({
            type: 'REGULATORY',
            severity: 'HIGH',
            description: post.title,
            source: 'Reddit',
            timestamp: new Date(),
            impact: -5
          });
        }
      }
    }
    
    // Check on-chain for whale movements
    if (onChain.whaleActivity.largeTransfers > 10) {
      events.push({
        type: 'WHALE_MOVE',
        severity: onChain.whaleActivity.largeTransfers > 50 ? 'HIGH' : 'MEDIUM',
        description: `${onChain.whaleActivity.largeTransfers} large transfers detected`,
        source: 'On-chain',
        timestamp: new Date(),
        impact: onChain.whaleActivity.whaleAccumulation > 0 ? 3 : -3
      });
    }
    
    return events;
  }

  /**
   * Extract whale alerts from on-chain data
   */
  private extractWhaleAlerts(onChain: OnChainData): WhaleAlert[] {
    const alerts: WhaleAlert[] = [];
    
    // Convert on-chain metrics to whale alerts
    if (onChain.whaleActivity.largeTransfers > 0) {
      // Exchange inflows
      if (onChain.exchangeFlows.inflowVolume > 1000000) {
        alerts.push({
          amount: onChain.exchangeFlows.inflowVolume,
          token: onChain.symbol,
          from: 'whale_wallets',
          to: 'exchanges',
          type: 'EXCHANGE_IN',
          timestamp: new Date()
        });
      }
      
      // Exchange outflows
      if (onChain.exchangeFlows.outflowVolume > 1000000) {
        alerts.push({
          amount: onChain.exchangeFlows.outflowVolume,
          token: onChain.symbol,
          from: 'exchanges',
          to: 'whale_wallets',
          type: 'EXCHANGE_OUT',
          timestamp: new Date()
        });
      }
      
      // Accumulation
      if (onChain.whaleActivity.whaleAccumulation > 0) {
        alerts.push({
          amount: onChain.whaleActivity.whaleAccumulation * 1000000,
          token: onChain.symbol,
          from: 'market',
          to: 'whale_wallets',
          type: 'ACCUMULATION',
          timestamp: new Date()
        });
      }
    }
    
    return alerts;
  }

  /**
   * Get order book signal for symbol
   */
  private async getOrderBookSignal(symbol: string): Promise<OrderBookSignal | null> {
    try {
      // Convert symbol format: BTC -> BTCUSDT for Binance
      const binanceSymbol = symbol === 'BTC' ? 'BTCUSDT' : 
                           symbol === 'ETH' ? 'ETHUSDT' :
                           symbol === 'ADA' ? 'ADAUSDT' :
                           symbol === 'SOL' ? 'SOLUSDT' : 
                           `${symbol}USDT`;
      
      return orderBookIntelligence.getCurrentSignal(binanceSymbol);
    } catch (error) {
      console.error('Failed to get order book signal:', error);
      return null;
    }
  }

  /**
   * Convert order book signal to sentiment score (-1 to +1)
   */
  private convertOrderBookToSentiment(orderBookSignal: OrderBookSignal | null): number {
    if (!orderBookSignal) return 0;
    
    // Convert entry signal to sentiment score
    switch (orderBookSignal.entrySignal) {
      case 'STRONG_BUY': return 0.8;
      case 'BUY': return 0.4;
      case 'NEUTRAL': return 0;
      case 'SELL': return -0.4;
      case 'STRONG_SELL': return -0.8;
      default: return 0;
    }
  }

  /**
   * Get default order book signal when unavailable
   */
  private getDefaultOrderBookSignal(symbol: string): OrderBookSignal {
    return {
      symbol,
      timestamp: new Date(),
      liquidityScore: 0,
      marketPressure: 0,
      institutionalFlow: 0,
      whaleActivityLevel: 0,
      entrySignal: 'NEUTRAL',
      confidenceScore: 0,
      timeframe: 'SHORT_TERM',
      stopLossDistance: 2,
      takeProfitDistance: 4,
      positionSizeRecommendation: 10,
      orderFlowImbalance: 0,
      priceDiscoveryEfficiency: 50,
      marketMakerActivity: 50,
      sentimentAlignment: 0,
      conflictWarning: false
    };
  }

  /**
   * Calculate aggregated sentiment score
   */
  private calculateAggregatedScore(scores: {
    twitter: number;
    reddit: number;
    onChain: number;
    orderBook: number;
  }): number {
    const weightedSum = 
      scores.twitter * this.sourceWeights.twitter +
      scores.reddit * this.sourceWeights.reddit +
      scores.onChain * this.sourceWeights.onChain +
      scores.orderBook * this.sourceWeights.orderBook;
    
    const totalWeight = 
      this.sourceWeights.twitter +
      this.sourceWeights.reddit +
      this.sourceWeights.onChain +
      this.sourceWeights.orderBook;
    
    return Math.max(-1, Math.min(1, weightedSum / totalWeight));
  }

  /**
   * Calculate aggregated confidence
   */
  private calculateAggregatedConfidence(confidences: {
    twitter: number;
    reddit: number;
    onChain: number;
    orderBook: number;
  }): number {
    // Weighted average of confidences
    const weightedSum = 
      confidences.twitter * this.sourceWeights.twitter +
      confidences.reddit * this.sourceWeights.reddit +
      confidences.onChain * this.sourceWeights.onChain +
      confidences.orderBook * this.sourceWeights.orderBook;
    
    const totalWeight = 
      this.sourceWeights.twitter +
      this.sourceWeights.reddit +
      this.sourceWeights.onChain +
      this.sourceWeights.orderBook;
    
    return Math.min(1, weightedSum / totalWeight);
  }

  /**
   * Categorize sentiment
   */
  private categorizeSentiment(score: number): QuantumForgeSentiment['sentiment'] {
    if (score >= this.thresholds.extremeBullish) return 'EXTREME_BULLISH';
    if (score >= this.thresholds.bullish) return 'BULLISH';
    if (score <= this.thresholds.extremeBearish) return 'EXTREME_BEARISH';
    if (score <= this.thresholds.bearish) return 'BEARISH';
    return 'NEUTRAL';
  }

  /**
   * Analyze market context
   */
  private async analyzeMarketContext(
    symbol: string,
    onChain: OnChainData
  ): Promise<QuantumForgeSentiment['marketContext']> {
    // Determine trend based on sentiment and on-chain data
    let trend: 'UPTREND' | 'DOWNTREND' | 'SIDEWAYS' = 'SIDEWAYS';
    if (onChain.sentimentScore > 0.3 && onChain.exchangeFlows.netFlow > 0) {
      trend = 'UPTREND';
    } else if (onChain.sentimentScore < -0.3 && onChain.exchangeFlows.netFlow < 0) {
      trend = 'DOWNTREND';
    }
    
    // Calculate volatility based on network activity
    let volatility: 'LOW' | 'MEDIUM' | 'HIGH' | 'EXTREME' = 'MEDIUM';
    const avgTxCount = 300000;
    const txRatio = onChain.networkMetrics.transactionCount / avgTxCount;
    
    if (txRatio > 1.5) volatility = 'EXTREME';
    else if (txRatio > 1.2) volatility = 'HIGH';
    else if (txRatio < 0.8) volatility = 'LOW';
    
    // Calculate volume
    let volume: 'LOW' | 'NORMAL' | 'HIGH' | 'EXTREME' = 'NORMAL';
    if (onChain.whaleActivity.largeTransfers > 50) volume = 'EXTREME';
    else if (onChain.whaleActivity.largeTransfers > 20) volume = 'HIGH';
    else if (onChain.whaleActivity.largeTransfers < 5) volume = 'LOW';
    
    return {
      trend,
      volatility,
      volume,
      gpuDemand: 5, // Placeholder for Phase 2
      aiHype: 5     // Placeholder for Phase 2
    };
  }

  /**
   * Generate trading signal based on sentiment analysis
   */
  private generateTradingSignal(
    score: number,
    confidence: number,
    sentiment: QuantumForgeSentiment['sentiment'],
    criticalEvents: CriticalEvent[],
    marketContext: QuantumForgeSentiment['marketContext'],
    orderBookData?: OrderBookSignal | null
  ): QuantumForgeSentiment['tradingSignal'] {
    // Check for critical events first
    const criticalNegative = criticalEvents.find(e => e.type === 'HACK' || (e.type === 'REGULATORY' && e.severity === 'CRITICAL'));
    if (criticalNegative) {
      return {
        action: 'STRONG_SELL',
        confidence: 0.9,
        reason: `Critical event detected: ${criticalNegative.description}`,
        riskLevel: 'EXTREME'
      };
    }
    
    const criticalPositive = criticalEvents.find(e => e.type === 'PARTNERSHIP' && e.severity === 'HIGH');
    if (criticalPositive && confidence > 0.7) {
      return {
        action: 'STRONG_BUY',
        confidence: 0.85,
        reason: `Major partnership detected: ${criticalPositive.description}`,
        riskLevel: 'MEDIUM'
      };
    }
    
    // Order Book Override - Strong signals from order book can override low confidence
    if (orderBookData && orderBookData.confidenceScore > 80) {
      if (orderBookData.entrySignal === 'STRONG_BUY' || orderBookData.entrySignal === 'STRONG_SELL') {
        const action = orderBookData.entrySignal === 'STRONG_BUY' ? 'BUY' : 'SELL';
        return {
          action,
          confidence: Math.min(0.9, orderBookData.confidenceScore / 100),
          reason: `High-confidence order book signal: ${orderBookData.entrySignal} (${orderBookData.confidenceScore}%)`,
          riskLevel: orderBookData.confidenceScore > 90 ? 'LOW' : 'MEDIUM'
        };
      }
    }

    // Low confidence - wait for better signals unless order book provides clarity
    if (confidence < 0.5 && (!orderBookData || orderBookData.confidenceScore < 60)) {
      return {
        action: 'WAIT',
        confidence: confidence,
        reason: 'Insufficient sentiment confidence',
        riskLevel: 'HIGH'
      };
    }
    
    // Generate signal based on sentiment and market context
    let action: QuantumForgeSentiment['tradingSignal']['action'] = 'HOLD';
    let reason = '';
    let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'EXTREME' = 'MEDIUM';
    
    switch (sentiment) {
      case 'EXTREME_BULLISH':
        if (marketContext.trend === 'UPTREND' && marketContext.volatility !== 'EXTREME') {
          action = 'STRONG_BUY';
          reason = 'Extreme bullish sentiment with uptrend confirmation';
          riskLevel = 'MEDIUM';
        } else {
          action = 'BUY';
          reason = 'Extreme bullish sentiment but watch for volatility';
          riskLevel = 'HIGH';
        }
        break;
        
      case 'BULLISH':
        if (marketContext.volume === 'HIGH' || marketContext.volume === 'EXTREME') {
          action = 'BUY';
          reason = 'Bullish sentiment with high volume confirmation';
          riskLevel = 'MEDIUM';
        } else {
          action = 'HOLD';
          reason = 'Bullish sentiment but waiting for volume';
          riskLevel = 'LOW';
        }
        break;
        
      case 'BEARISH':
        if (marketContext.trend === 'DOWNTREND') {
          action = 'SELL';
          reason = 'Bearish sentiment aligned with downtrend';
          riskLevel = 'MEDIUM';
        } else {
          action = 'HOLD';
          reason = 'Bearish sentiment but trend not confirmed';
          riskLevel = 'MEDIUM';
        }
        break;
        
      case 'EXTREME_BEARISH':
        if (marketContext.volatility === 'EXTREME') {
          action = 'STRONG_SELL';
          reason = 'Extreme bearish sentiment with high volatility';
          riskLevel = 'EXTREME';
        } else {
          action = 'SELL';
          reason = 'Extreme bearish sentiment';
          riskLevel = 'HIGH';
        }
        break;
        
      default:
        action = 'HOLD';
        reason = 'Neutral sentiment - waiting for clear direction';
        riskLevel = 'LOW';
    }
    
    // Check for sentiment alignment with order book
    if (orderBookData && orderBookData.confidenceScore > 50) {
      const orderBookSentiment = this.convertOrderBookToSentiment(orderBookData);
      const sentimentAlignment = Math.abs(score - orderBookSentiment);
      
      // If sentiment and order book conflict significantly
      if (sentimentAlignment > 0.5) {
        reason += ` (Note: Order book suggests ${orderBookData.entrySignal})`;
        confidence *= 0.8; // Reduce confidence when sources conflict
        riskLevel = riskLevel === 'LOW' ? 'MEDIUM' : 'HIGH';
      } else if (sentimentAlignment < 0.2) {
        // Strong alignment boosts confidence
        confidence = Math.min(0.95, confidence * 1.1);
        reason += ` + Order book confirmation`;
        riskLevel = riskLevel === 'HIGH' ? 'MEDIUM' : 'LOW';
      }
    }

    return {
      action,
      confidence: confidence * (riskLevel === 'EXTREME' ? 0.7 : 1),
      reason,
      riskLevel
    };
  }

  /**
   * Store sentiment analysis for learning
   */
  private async storeSentimentAnalysis(sentiment: QuantumForgeSentiment) {
    try {
      // Store in enhancedTradingSignal table with correct schema
      await prisma.enhancedTradingSignal.create({
        data: {
          symbol: sentiment.symbol,
          strategy: 'QUANTUM_FORGE_SENTIMENT',
          technicalScore: 0.0, // No technical analysis in this pure sentiment signal
          technicalAction: sentiment.tradingSignal.action.includes('BUY') ? 'BUY' : 
                          sentiment.tradingSignal.action.includes('SELL') ? 'SELL' : 'HOLD',
          sentimentScore: sentiment.overallScore,
          sentimentConfidence: sentiment.overallConfidence,
          sentimentConflict: sentiment.tradingSignal.reason.includes('conflict'),
          combinedConfidence: sentiment.tradingSignal.confidence,
          finalAction: sentiment.tradingSignal.action.includes('BUY') ? 'BUY' : 
                      sentiment.tradingSignal.action.includes('SELL') ? 'SELL' : 'HOLD',
          confidenceBoost: sentiment.overallScore * 0.1, // Simple boost calculation
          wasExecuted: sentiment.tradingSignal.action !== 'WAIT',
          executeReason: sentiment.tradingSignal.reason
        }
      });
    } catch (error) {
      console.error('Error storing sentiment analysis:', error);
      // Don't throw - just log and continue
    }
  }

  /**
   * Update adaptive weights based on trading performance
   */
  private async updateAdaptiveWeights(symbol: string) {
    try {
      // Get recent trades with sentiment data
      const recentTrades = await prisma.paperTrade.findMany({
        where: {
          symbol,
          executedAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
          }
        },
        orderBy: { executedAt: 'desc' },
        take: 100
      });
      
      if (recentTrades.length < 10) return; // Not enough data
      
      // Calculate win rate
      const winningTrades = recentTrades.filter(t => t.profit && t.profit > 0);
      const winRate = winningTrades.length / recentTrades.length;
      
      // Adjust weights based on performance
      if (winRate > 0.6) {
        // Good performance - slightly increase on-chain weight (most reliable)
        this.sourceWeights.onChain = Math.min(0.4, this.sourceWeights.onChain + 0.01);
        this.sourceWeights.reddit = Math.max(0.15, this.sourceWeights.reddit - 0.005);
      } else if (winRate < 0.4) {
        // Poor performance - rebalance weights
        this.sourceWeights.onChain = Math.max(0.25, this.sourceWeights.onChain - 0.01);
        this.sourceWeights.reddit = Math.min(0.25, this.sourceWeights.reddit + 0.005);
      }
      
      // Normalize weights to sum to 1
      const totalWeight = Object.values(this.sourceWeights).reduce((a, b) => a + b, 0);
      for (const key in this.sourceWeights) {
        this.sourceWeights[key] /= totalWeight;
      }
      
    } catch (error) {
      console.error('Error updating adaptive weights:', error);
    }
  }

  /**
   * Get default sentiment on error
   */
  private getDefaultSentiment(symbol: string): QuantumForgeSentiment {
    return {
      symbol,
      timestamp: new Date(),
      overallScore: 0,
      overallConfidence: 0,
      sentiment: 'NEUTRAL',
      sources: {
        twitter: {
          symbol,
          score: 0,
          confidence: 0,
          timestamp: new Date(),
          tweetCount: 0,
          positiveCount: 0,
          negativeCount: 0,
          neutralCount: 0
        },
        reddit: {
          subreddit: 'none',
          score: 0,
          confidence: 0,
          volume: 0,
          trending: false,
          topPosts: [],
          processingTimeMs: 0
        },
        onChain: {
          symbol,
          whaleActivity: { largeTransfers: 0, whaleAccumulation: 0, smartMoneyFlow: 0, dormantActivations: 0 },
          exchangeFlows: { inflowVolume: 0, outflowVolume: 0, netFlow: 0, majorExchanges: { binance: 0, coinbase: 0, kraken: 0 } },
          networkMetrics: { transactionCount: 0, activeAddresses: 0, gasPrice: 0, hashRate: 0, difficulty: 0, mempoolSize: 0 },
          defiActivity: { tvl: 0, lendingVolume: 0, dexVolume: 0, stablecoinFlows: 0 },
          sentimentScore: 0,
          confidence: 0
        }
      },
      criticalEvents: [],
      whaleAlerts: [],
      marketContext: {
        trend: 'SIDEWAYS',
        volatility: 'MEDIUM',
        volume: 'NORMAL'
      },
      tradingSignal: {
        action: 'WAIT',
        confidence: 0,
        reason: 'No sentiment data available',
        riskLevel: 'HIGH'
      },
      processingMetrics: {
        totalTimeMs: 0,
        gpuTimeMs: 0,
        sourcesProcessed: 0,
        tokensAnalyzed: 0
      }
    };
  }

  /**
   * Cleanup resources
   */
  destroy() {
    this.gpuProcessor.destroy();
  }
}

// Export singleton
export const quantumForgeSentimentEngine = new QuantumForgeSentimentEngine();
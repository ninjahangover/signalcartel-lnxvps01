/**
 * AI-Driven Position Optimizer
 * Tracks every position against its original strategy signals
 * Uses AI to continuously validate, optimize, and manage positions
 */

import { PrismaClient } from '@prisma/client';
import { TradingSignal } from '@/types/trading';

interface StrategySignalData {
  // Original strategy inputs
  rsi?: number;
  macd?: { value: number; signal: number; histogram: number };
  bbands?: { upper: number; middle: number; lower: number };
  volume?: number;
  priceAction?: { support: number; resistance: number };
  
  // AI enhancement data
  sentiment?: {
    fearGreedIndex?: number;
    socialSentiment?: number;
    newsScore?: number;
    marketMood?: string;
  };
  
  mathematicalIntuition?: {
    flowFieldResonance?: number;
    harmonicPattern?: number;
    quantumProbability?: number;
    patternComplexity?: number;
    overallIntuition?: number;
  };
  
  bayesianAnalysis?: {
    marketRegime?: string;
    regimeProbabilities?: Record<string, number>;
    confidence?: number;
    uncertainty?: number;
    recommendation?: string;
  };
  
  orderBookAnalysis?: {
    bidAskSpread?: number;
    liquidityScore?: number;
    whaleActivity?: number;
    orderFlowImbalance?: number;
  };
  
  // Strategy metadata
  confidence: number;
  timeframe: string;
  signalStrength: number;
  expectedHoldTime?: number;
  targetPrice?: number;
  invalidationPrice?: number;
}

interface PositionWithSignals {
  positionId: string;
  strategy: string;
  symbol: string;
  side: 'long' | 'short';
  entryPrice: number;
  currentPrice: number;
  quantity: number;
  entryTime: Date;
  holdTimeMinutes: number;
  unrealizedPnL: number;
  unrealizedPnLPercent: number;
  
  // Original signal data
  originalSignal: StrategySignalData;
  
  // Current market analysis
  currentAnalysis?: StrategySignalData;
  
  // AI recommendations
  aiRecommendation?: {
    action: 'hold' | 'close' | 'add' | 'reduce' | 'reverse';
    confidence: number;
    reasoning: string[];
    suggestedStopLoss?: number;
    suggestedTakeProfit?: number;
    riskScore: number;
  };
}

export class AIPositionOptimizer {
  private prisma: PrismaClient;
  private positionSignals: Map<string, StrategySignalData> = new Map();
  
  constructor() {
    this.prisma = new PrismaClient();
  }
  
  /**
   * Store original strategy signals when opening a position
   */
  async storePositionSignals(
    positionId: string,
    signal: TradingSignal,
    strategyData: StrategySignalData
  ): Promise<void> {
    try {
      // Store in memory for fast access
      this.positionSignals.set(positionId, strategyData);
      
      // Store in database for persistence
      await this.prisma.$executeRaw`
        INSERT INTO position_signals (
          position_id,
          original_signal,
          created_at
        ) VALUES (
          ${positionId},
          ${JSON.stringify(strategyData)}::jsonb,
          NOW()
        )
        ON CONFLICT (position_id) 
        DO UPDATE SET 
          original_signal = ${JSON.stringify(strategyData)}::jsonb,
          updated_at = NOW()
      `;
      
      console.log(`📊 Stored strategy signals for position ${positionId}`);
    } catch (error) {
      console.error('Error storing position signals:', error);
    }
  }
  
  /**
   * Analyze position against current market conditions and original signals
   */
  async analyzePosition(position: PositionWithSignals): Promise<void> {
    const { originalSignal, currentAnalysis } = position;
    
    if (!originalSignal || !currentAnalysis) return;
    
    const recommendation = {
      action: 'hold' as const,
      confidence: 0,
      reasoning: [] as string[],
      riskScore: 0
    };
    
    // 1. Check if original thesis is still valid
    const thesisValid = this.validateOriginalThesis(originalSignal, currentAnalysis);
    if (!thesisValid) {
      recommendation.reasoning.push('Original trading thesis invalidated');
      recommendation.action = 'close';
      recommendation.confidence += 30;
    }
    
    // 2. Analyze Bayesian regime change
    if (originalSignal.bayesianAnalysis && currentAnalysis.bayesianAnalysis) {
      const regimeShift = this.detectRegimeShift(
        originalSignal.bayesianAnalysis,
        currentAnalysis.bayesianAnalysis
      );
      
      if (regimeShift.significant) {
        recommendation.reasoning.push(`Market regime shifted from ${regimeShift.from} to ${regimeShift.to}`);
        if (regimeShift.adverse) {
          recommendation.action = 'close';
          recommendation.confidence += 40;
        }
      }
    }
    
    // 3. Check Mathematical Intuition divergence
    if (originalSignal.mathematicalIntuition && currentAnalysis.mathematicalIntuition) {
      const intuitionDrift = Math.abs(
        (currentAnalysis.mathematicalIntuition.overallIntuition || 0) -
        (originalSignal.mathematicalIntuition.overallIntuition || 0)
      );
      
      if (intuitionDrift > 30) {
        recommendation.reasoning.push(`Mathematical intuition diverged by ${intuitionDrift.toFixed(1)}%`);
        recommendation.riskScore += intuitionDrift / 100;
      }
    }
    
    // 4. Sentiment analysis
    if (currentAnalysis.sentiment) {
      const sentimentScore = this.analyzeSentiment(currentAnalysis.sentiment, position.side);
      if (sentimentScore < -50) {
        recommendation.reasoning.push('Sentiment strongly against position');
        recommendation.action = 'close';
        recommendation.confidence += 25;
      } else if (sentimentScore > 70) {
        recommendation.reasoning.push('Sentiment strongly supports position');
        if (recommendation.action === 'hold') {
          recommendation.action = 'add';
        }
      }
    }
    
    // 5. Order book pressure analysis
    if (currentAnalysis.orderBookAnalysis) {
      const pressure = this.analyzeOrderBookPressure(
        currentAnalysis.orderBookAnalysis,
        position.side
      );
      
      if (pressure.against > 70) {
        recommendation.reasoning.push('Strong order book pressure against position');
        recommendation.action = 'reduce';
        recommendation.confidence += 20;
      }
    }
    
    // 6. Time decay and P&L analysis
    const timeDecayFactor = this.calculateTimeDecay(position);
    if (timeDecayFactor > 0.8 && position.unrealizedPnLPercent < 1) {
      recommendation.reasoning.push('Position experiencing time decay without profit');
      recommendation.riskScore += 0.3;
    }
    
    // 7. Dynamic stop loss and take profit
    const dynamicLevels = this.calculateDynamicExitLevels(position, currentAnalysis);
    recommendation.suggestedStopLoss = dynamicLevels.stopLoss;
    recommendation.suggestedTakeProfit = dynamicLevels.takeProfit;
    
    // Store recommendation
    position.aiRecommendation = recommendation;
  }
  
  /**
   * Validate if original trading thesis is still valid
   */
  private validateOriginalThesis(
    original: StrategySignalData,
    current: StrategySignalData
  ): boolean {
    let validationScore = 100;
    
    // RSI divergence check
    if (original.rsi && current.rsi) {
      const rsiDivergence = Math.abs(original.rsi - current.rsi);
      if (rsiDivergence > 20) validationScore -= 25;
    }
    
    // MACD signal line cross
    if (original.macd && current.macd) {
      const originalCross = original.macd.value > original.macd.signal;
      const currentCross = current.macd.value > current.macd.signal;
      if (originalCross !== currentCross) validationScore -= 30;
    }
    
    // Bollinger Bands breakout
    if (original.bbands && current.bbands) {
      const originalPosition = this.getBBPosition(original.bbands);
      const currentPosition = this.getBBPosition(current.bbands);
      if (originalPosition !== currentPosition) validationScore -= 20;
    }
    
    // Signal strength degradation
    if (current.signalStrength < original.signalStrength * 0.5) {
      validationScore -= 35;
    }
    
    return validationScore > 40;
  }
  
  /**
   * Detect significant market regime shifts
   */
  private detectRegimeShift(
    original: StrategySignalData['bayesianAnalysis'],
    current: StrategySignalData['bayesianAnalysis']
  ): { significant: boolean; adverse: boolean; from?: string; to?: string } {
    if (!original?.marketRegime || !current?.marketRegime) {
      return { significant: false, adverse: false };
    }
    
    const regimeMap = {
      'STRONG_BULL': 2,
      'BULL': 1,
      'NEUTRAL': 0,
      'BEAR': -1,
      'STRONG_BEAR': -2,
      'VOLATILE': 0
    };
    
    const originalScore = regimeMap[original.marketRegime] || 0;
    const currentScore = regimeMap[current.marketRegime] || 0;
    const shift = Math.abs(originalScore - currentScore);
    
    return {
      significant: shift >= 2,
      adverse: currentScore < originalScore,
      from: original.marketRegime,
      to: current.marketRegime
    };
  }
  
  /**
   * Analyze sentiment relative to position direction
   */
  private analyzeSentiment(
    sentiment: StrategySignalData['sentiment'],
    side: 'long' | 'short'
  ): number {
    if (!sentiment) return 0;
    
    const fearGreed = sentiment.fearGreedIndex || 50;
    const social = sentiment.socialSentiment || 50;
    const news = sentiment.newsScore || 50;
    
    const avgSentiment = (fearGreed + social + news) / 3;
    
    // For long positions, high sentiment is good
    // For short positions, low sentiment is good
    if (side === 'long') {
      return avgSentiment - 50; // Positive when bullish
    } else {
      return 50 - avgSentiment; // Positive when bearish
    }
  }
  
  /**
   * Analyze order book pressure
   */
  private analyzeOrderBookPressure(
    orderBook: StrategySignalData['orderBookAnalysis'],
    side: 'long' | 'short'
  ): { against: number; favor: number } {
    if (!orderBook) return { against: 0, favor: 0 };
    
    const imbalance = orderBook.orderFlowImbalance || 0;
    const whaleActivity = orderBook.whaleActivity || 0;
    
    // Positive imbalance = more buying pressure
    // Negative imbalance = more selling pressure
    
    if (side === 'long') {
      return {
        against: Math.max(0, -imbalance) + (whaleActivity < 0 ? Math.abs(whaleActivity) : 0),
        favor: Math.max(0, imbalance) + (whaleActivity > 0 ? whaleActivity : 0)
      };
    } else {
      return {
        against: Math.max(0, imbalance) + (whaleActivity > 0 ? whaleActivity : 0),
        favor: Math.max(0, -imbalance) + (whaleActivity < 0 ? Math.abs(whaleActivity) : 0)
      };
    }
  }
  
  /**
   * Calculate time decay factor
   */
  private calculateTimeDecay(position: PositionWithSignals): number {
    const expectedHold = position.originalSignal.expectedHoldTime || 30; // minutes
    const actualHold = position.holdTimeMinutes;
    
    // Exponential decay after expected hold time
    if (actualHold <= expectedHold) {
      return 0;
    }
    
    const overTime = actualHold - expectedHold;
    return 1 - Math.exp(-overTime / expectedHold);
  }
  
  /**
   * Calculate dynamic exit levels based on current conditions
   */
  private calculateDynamicExitLevels(
    position: PositionWithSignals,
    current: StrategySignalData
  ): { stopLoss: number; takeProfit: number } {
    const { entryPrice, side, unrealizedPnLPercent } = position;
    
    // Base levels
    let stopLossPercent = 2.0; // 2% default
    let takeProfitPercent = 3.0; // 3% default
    
    // Adjust based on volatility
    if (current.bayesianAnalysis?.marketRegime === 'VOLATILE') {
      stopLossPercent *= 1.5; // Wider stops in volatile markets
      takeProfitPercent *= 1.5;
    }
    
    // Tighten stops if confidence is low
    if (current.confidence < 50) {
      stopLossPercent *= 0.7;
      takeProfitPercent *= 0.8;
    }
    
    // Trailing stop for profitable positions
    if (unrealizedPnLPercent > 2) {
      stopLossPercent = Math.max(0.5, unrealizedPnLPercent - 1.5); // Trail 1.5% below profit
    }
    
    // Calculate actual prices
    if (side === 'long') {
      return {
        stopLoss: entryPrice * (1 - stopLossPercent / 100),
        takeProfit: entryPrice * (1 + takeProfitPercent / 100)
      };
    } else {
      return {
        stopLoss: entryPrice * (1 + stopLossPercent / 100),
        takeProfit: entryPrice * (1 - takeProfitPercent / 100)
      };
    }
  }
  
  /**
   * Get Bollinger Band position
   */
  private getBBPosition(bbands: { upper: number; middle: number; lower: number }): string {
    const range = bbands.upper - bbands.lower;
    const position = (bbands.middle - bbands.lower) / range;
    
    if (position > 0.8) return 'upper';
    if (position < 0.2) return 'lower';
    return 'middle';
  }
  
  /**
   * Execute AI recommendations
   */
  async executeRecommendation(
    position: PositionWithSignals,
    forceAction?: boolean
  ): Promise<{ executed: boolean; action?: string; reason?: string }> {
    const rec = position.aiRecommendation;
    if (!rec) return { executed: false };
    
    // Only execute high-confidence recommendations unless forced
    if (!forceAction && rec.confidence < 60) {
      return { executed: false, reason: 'Low confidence' };
    }
    
    // Log the decision
    console.log(`
🤖 AI Position Decision for ${position.positionId}
📊 Symbol: ${position.symbol} | Side: ${position.side}
💰 P&L: ${position.unrealizedPnLPercent.toFixed(2)}% ($${position.unrealizedPnL.toFixed(2)})
🎯 Action: ${rec.action} (${rec.confidence}% confidence)
📝 Reasoning: ${rec.reasoning.join(', ')}
⚠️ Risk Score: ${rec.riskScore.toFixed(2)}
    `);
    
    return {
      executed: true,
      action: rec.action,
      reason: rec.reasoning[0]
    };
  }
  
  /**
   * Monitor all positions with AI
   */
  async monitorAllPositions(): Promise<void> {
    try {
      // Get all open positions
      const positions = await this.prisma.managedPosition.findMany({
        where: { status: 'open' },
        include: {
          entryTrade: true
        }
      });
      
      console.log(`🤖 AI monitoring ${positions.length} open positions`);
      
      for (const position of positions) {
        // Get current market analysis
        const currentAnalysis = await this.getCurrentMarketAnalysis(position.symbol);
        
        // Get original signals
        const originalSignal = this.positionSignals.get(position.id);
        
        if (originalSignal && currentAnalysis) {
          const positionData: PositionWithSignals = {
            positionId: position.id,
            strategy: position.strategy,
            symbol: position.symbol,
            side: position.side as 'long' | 'short',
            entryPrice: position.entryPrice,
            currentPrice: currentAnalysis.priceAction?.resistance || position.entryPrice,
            quantity: position.quantity,
            entryTime: position.entryTime,
            holdTimeMinutes: (Date.now() - position.entryTime.getTime()) / (1000 * 60),
            unrealizedPnL: position.unrealizedPnL || 0,
            unrealizedPnLPercent: ((position.unrealizedPnL || 0) / (position.entryPrice * position.quantity)) * 100,
            originalSignal,
            currentAnalysis
          };
          
          // Analyze and get recommendations
          await this.analyzePosition(positionData);
          
          // Execute recommendations if needed
          await this.executeRecommendation(positionData);
        }
      }
    } catch (error) {
      console.error('Error in AI position monitoring:', error);
    }
  }
  
  /**
   * Get current market analysis for a symbol
   */
  private async getCurrentMarketAnalysis(symbol: string): Promise<StrategySignalData | null> {
    // This would integrate with your existing analysis systems
    // For now, returning a placeholder
    return {
      confidence: 65,
      timeframe: '5m',
      signalStrength: 70,
      // Additional data would be fetched from your existing systems
    };
  }
}

// Export singleton instance
export const aiPositionOptimizer = new AIPositionOptimizer();
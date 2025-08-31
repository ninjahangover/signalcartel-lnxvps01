/**
 * Enhanced Position Service with Full AI Integration
 * Every trade is tracked with unique ID and managed by AI intelligence
 */

import { PrismaClient } from '@prisma/client';
import { positionService } from './position-service';
import { aiPositionOptimizer } from './ai-position-optimizer';
import { TradingSignal } from '@/types/trading';

// Import all AI intelligence systems
import { BayesianProbabilityEngine } from '@/lib/bayesian-probability-engine';
import { MathematicalIntuitionEngine } from '@/lib/mathematical-intuition-engine';
import { QuantumForgeOrderBookAI } from '@/lib/quantum-forge-orderbook-ai';
import { QuantumForgeMultiLayerAI } from '@/lib/quantum-forge-multi-layer-ai';

interface EnhancedTradingSignal extends TradingSignal {
  uniqueTradeId?: string;
  strategyInputs?: Record<string, any>;
  aiValidation?: {
    bayesian?: any;
    intuition?: any;
    orderBook?: any;
    multiLayer?: any;
    consensus?: {
      action: string;
      confidence: number;
      reasoning: string[];
    };
  };
}

export class EnhancedPositionService {
  private prisma: PrismaClient;
  private bayesianEngine: BayesianProbabilityEngine;
  private intuitionEngine: MathematicalIntuitionEngine;
  private learningCache: Map<string, any> = new Map();
  
  constructor() {
    this.prisma = new PrismaClient();
    this.bayesianEngine = new BayesianProbabilityEngine();
    this.intuitionEngine = new MathematicalIntuitionEngine();
  }
  
  /**
   * Generate unique trade ID for tracking
   */
  private generateUniqueTradeId(strategy: string, symbol: string): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 10);
    return `${strategy}-${symbol}-${timestamp}-${random}`;
  }
  
  /**
   * Process signal with full AI validation and tracking
   */
  async processSignalWithAI(signal: EnhancedTradingSignal): Promise<{
    action: 'opened' | 'ignored' | 'closed';
    uniqueTradeId?: string;
    position?: any;
    aiDecision?: any;
  }> {
    // Generate unique trade ID
    const uniqueTradeId = this.generateUniqueTradeId(signal.strategy, signal.symbol);
    signal.uniqueTradeId = uniqueTradeId;
    
    console.log(`
🎯 Processing Signal with AI Intelligence
📊 Unique Trade ID: ${uniqueTradeId}
🔍 Symbol: ${signal.symbol} | Action: ${signal.action}
💡 Strategy: ${signal.strategy}
    `);
    
    // 1. Capture all strategy inputs
    const strategyInputs = await this.captureStrategyInputs(signal);
    
    // 2. Run through all AI validation systems
    const aiValidation = await this.runFullAIValidation(signal, strategyInputs);
    signal.aiValidation = aiValidation;
    
    // 3. Make consensus decision
    const consensusDecision = this.makeConsensusDecision(aiValidation);
    
    // 4. Store signal data for learning
    await this.storeSignalForLearning(uniqueTradeId, signal, strategyInputs, aiValidation);
    
    // 5. Execute trade if approved
    if (consensusDecision.approved) {
      const result = await positionService.processSignal(signal);
      
      if (result.action === 'opened' && result.position) {
        // Update position with unique trade ID
        await this.prisma.managedPosition.update({
          where: { id: result.position.id },
          data: { unique_trade_id: uniqueTradeId }
        });
        
        // Store position signals for AI monitoring
        await aiPositionOptimizer.storePositionSignals(
          result.position.id,
          signal,
          strategyInputs
        );
        
        console.log(`
✅ Position Opened with AI Tracking
🆔 Trade ID: ${uniqueTradeId}
📈 Position: ${result.position.id}
🤖 AI Confidence: ${consensusDecision.confidence}%
📝 Reasoning: ${consensusDecision.reasoning.join(', ')}
        `);
        
        return {
          action: 'opened',
          uniqueTradeId,
          position: result.position,
          aiDecision: consensusDecision
        };
      }
      
      return result;
    } else {
      console.log(`
❌ Signal Rejected by AI Consensus
🆔 Trade ID: ${uniqueTradeId}
🤖 Confidence: ${consensusDecision.confidence}%
📝 Reasoning: ${consensusDecision.reasoning.join(', ')}
      `);
      
      // Store rejection for learning
      await this.storeRejectedSignal(uniqueTradeId, signal, consensusDecision);
      
      return {
        action: 'ignored',
        uniqueTradeId,
        aiDecision: consensusDecision
      };
    }
  }
  
  /**
   * Capture all strategy inputs and market conditions
   */
  private async captureStrategyInputs(signal: EnhancedTradingSignal): Promise<any> {
    const { realTimePriceFetcher } = await import('@/lib/real-time-price-fetcher');
    
    // Get current market data
    const priceData = await realTimePriceFetcher.getCurrentPrice(signal.symbol);
    
    // Technical indicators (would integrate with your TA library)
    const technicalData = {
      rsi: signal.metadata?.rsi || 50,
      macd: signal.metadata?.macd || { value: 0, signal: 0, histogram: 0 },
      bbands: signal.metadata?.bbands || { upper: 0, middle: 0, lower: 0 },
      volume: signal.metadata?.volume || 0,
      ema: signal.metadata?.ema || {},
      sma: signal.metadata?.sma || {}
    };
    
    // Market conditions
    const marketConditions = {
      price: priceData.price,
      timestamp: new Date(),
      volatility: signal.metadata?.volatility || 0,
      spread: signal.metadata?.spread || 0,
      liquidity: signal.metadata?.liquidity || 0
    };
    
    return {
      technical: technicalData,
      market: marketConditions,
      strategy: {
        name: signal.strategy,
        confidence: signal.confidence,
        timeframe: signal.metadata?.timeframe || '5m',
        signalStrength: signal.metadata?.signalStrength || signal.confidence
      },
      original: signal.metadata || {}
    };
  }
  
  /**
   * Run signal through all AI validation systems
   */
  private async runFullAIValidation(
    signal: EnhancedTradingSignal,
    inputs: any
  ): Promise<any> {
    const validations: any = {};
    
    // 1. Bayesian Probability Analysis
    try {
      const marketData = {
        price: inputs.market.price,
        volume: inputs.technical.volume,
        rsi: inputs.technical.rsi,
        volatility: inputs.market.volatility
      };
      
      validations.bayesian = await this.bayesianEngine.analyzeMarket(
        signal.symbol,
        marketData,
        {} // Additional data
      );
      
      console.log(`🧠 Bayesian: ${validations.bayesian.recommendation} (${validations.bayesian.confidence}%)`);
    } catch (error) {
      console.error('Bayesian analysis error:', error);
    }
    
    // 2. Mathematical Intuition
    try {
      const intuitionResult = await this.intuitionEngine.analyzeIntuition({
        symbol: signal.symbol,
        price: inputs.market.price,
        volume: inputs.technical.volume,
        volatility: inputs.market.volatility,
        technicalIndicators: inputs.technical
      });
      
      validations.intuition = intuitionResult;
      console.log(`🔮 Intuition: ${intuitionResult.overallIntuition}% confidence`);
    } catch (error) {
      console.error('Intuition analysis error:', error);
    }
    
    // 3. Order Book Analysis (if available)
    try {
      const { QuantumForgeOrderBookAI } = await import('@/lib/quantum-forge-orderbook-ai');
      const orderBookAI = new QuantumForgeOrderBookAI();
      
      validations.orderBook = await orderBookAI.analyzeOrderBook(signal.symbol);
      console.log(`📊 Order Book: ${validations.orderBook?.recommendation || 'N/A'}`);
    } catch (error) {
      console.error('Order book analysis error:', error);
    }
    
    // 4. Multi-Layer AI Fusion
    try {
      const { QuantumForgeMultiLayerAI } = await import('@/lib/quantum-forge-multi-layer-ai');
      const multiLayerAI = new QuantumForgeMultiLayerAI();
      
      validations.multiLayer = await multiLayerAI.analyzeSignal(signal);
      console.log(`🎯 Multi-Layer: ${validations.multiLayer?.decision || 'N/A'}`);
    } catch (error) {
      console.error('Multi-layer analysis error:', error);
    }
    
    return validations;
  }
  
  /**
   * Make consensus decision from all AI systems
   */
  private makeConsensusDecision(aiValidation: any): {
    approved: boolean;
    confidence: number;
    reasoning: string[];
  } {
    const votes = [];
    const reasoning = [];
    let totalConfidence = 0;
    let validVotes = 0;
    
    // Bayesian vote
    if (aiValidation.bayesian) {
      const rec = aiValidation.bayesian.recommendation;
      const conf = aiValidation.bayesian.confidence || 50;
      
      if (rec === 'STRONG_BUY' || rec === 'BUY') {
        votes.push({ system: 'Bayesian', vote: 1, confidence: conf });
        reasoning.push(`Bayesian: ${rec} (${conf}%)`);
      } else if (rec === 'STRONG_SELL' || rec === 'SELL') {
        votes.push({ system: 'Bayesian', vote: -1, confidence: conf });
        reasoning.push(`Bayesian: ${rec} (${conf}%)`);
      } else {
        votes.push({ system: 'Bayesian', vote: 0, confidence: conf });
      }
      totalConfidence += conf;
      validVotes++;
    }
    
    // Mathematical Intuition vote
    if (aiValidation.intuition) {
      const intuition = aiValidation.intuition.overallIntuition || 50;
      const vote = intuition > 60 ? 1 : intuition < 40 ? -1 : 0;
      
      votes.push({ system: 'Intuition', vote, confidence: intuition });
      if (vote !== 0) {
        reasoning.push(`Intuition: ${intuition}% ${vote > 0 ? 'bullish' : 'bearish'}`);
      }
      totalConfidence += intuition;
      validVotes++;
    }
    
    // Order Book vote
    if (aiValidation.orderBook?.recommendation) {
      const rec = aiValidation.orderBook.recommendation;
      const conf = aiValidation.orderBook.confidence || 50;
      const vote = rec.includes('BUY') ? 1 : rec.includes('SELL') ? -1 : 0;
      
      votes.push({ system: 'OrderBook', vote, confidence: conf });
      if (vote !== 0) {
        reasoning.push(`OrderBook: ${rec}`);
      }
      totalConfidence += conf;
      validVotes++;
    }
    
    // Multi-Layer vote
    if (aiValidation.multiLayer?.decision) {
      const decision = aiValidation.multiLayer.decision;
      const conf = aiValidation.multiLayer.confidence || 50;
      const vote = decision === 'BUY' ? 1 : decision === 'SELL' ? -1 : 0;
      
      votes.push({ system: 'MultiLayer', vote, confidence: conf });
      if (vote !== 0) {
        reasoning.push(`MultiLayer: ${decision} (${conf}%)`);
      }
      totalConfidence += conf;
      validVotes++;
    }
    
    // Calculate weighted consensus
    const weightedVote = votes.reduce((sum, v) => sum + (v.vote * v.confidence), 0);
    const totalWeight = votes.reduce((sum, v) => sum + Math.abs(v.confidence), 0);
    const consensus = totalWeight > 0 ? weightedVote / totalWeight : 0;
    
    // Average confidence
    const avgConfidence = validVotes > 0 ? totalConfidence / validVotes : 50;
    
    // Decision threshold
    const approved = consensus > 0.2 && avgConfidence > 55;
    
    if (!approved && reasoning.length === 0) {
      reasoning.push('Insufficient AI consensus for trade');
    }
    
    return {
      approved,
      confidence: Math.round(avgConfidence),
      reasoning
    };
  }
  
  /**
   * Store signal data for machine learning
   */
  private async storeSignalForLearning(
    uniqueTradeId: string,
    signal: EnhancedTradingSignal,
    inputs: any,
    aiValidation: any
  ): Promise<void> {
    try {
      await this.prisma.$executeRaw`
        INSERT INTO trade_learning (
          unique_trade_id,
          position_id,
          symbol,
          strategy,
          entry_signals,
          entry_price,
          entry_time,
          entry_confidence,
          ai_recommendations
        ) VALUES (
          ${uniqueTradeId},
          ${uniqueTradeId},
          ${signal.symbol},
          ${signal.strategy},
          ${JSON.stringify(inputs)}::jsonb,
          ${signal.price},
          NOW(),
          ${signal.confidence},
          ${JSON.stringify(aiValidation)}::jsonb
        )
        ON CONFLICT (unique_trade_id) DO NOTHING
      `;
    } catch (error) {
      console.error('Error storing signal for learning:', error);
    }
  }
  
  /**
   * Store rejected signals for pattern analysis
   */
  private async storeRejectedSignal(
    uniqueTradeId: string,
    signal: EnhancedTradingSignal,
    decision: any
  ): Promise<void> {
    // Store in a separate table or with a flag for analysis
    this.learningCache.set(`rejected_${uniqueTradeId}`, {
      signal,
      decision,
      timestamp: new Date()
    });
    
    // Periodically analyze rejected signals to improve AI
    if (this.learningCache.size > 100) {
      await this.analyzeRejectedPatterns();
    }
  }
  
  /**
   * Analyze rejected signal patterns for learning
   */
  private async analyzeRejectedPatterns(): Promise<void> {
    const rejected = Array.from(this.learningCache.entries())
      .filter(([key]) => key.startsWith('rejected_'));
    
    // Pattern analysis logic here
    console.log(`📊 Analyzing ${rejected.length} rejected signals for pattern learning`);
    
    // Clear old cache entries
    const cutoff = Date.now() - (24 * 60 * 60 * 1000); // 24 hours
    for (const [key, value] of this.learningCache.entries()) {
      if (value.timestamp && value.timestamp.getTime() < cutoff) {
        this.learningCache.delete(key);
      }
    }
  }
  
  /**
   * Monitor and optimize positions with AI
   */
  async monitorPositionsWithAI(): Promise<void> {
    const positions = await this.prisma.$queryRaw`
      SELECT 
        p.*,
        ps.original_signal,
        ps.current_signal,
        ps.ai_decisions,
        ps.unique_trade_id
      FROM "ManagedPosition" p
      LEFT JOIN position_signals ps ON p.id = ps.position_id
      WHERE p.status = 'open'
    `;
    
    console.log(`🤖 AI monitoring ${positions.length} positions for optimization`);
    
    for (const position of positions) {
      await this.optimizePosition(position);
    }
  }
  
  /**
   * Optimize individual position with AI
   */
  private async optimizePosition(position: any): Promise<void> {
    const uniqueTradeId = position.unique_trade_id;
    if (!uniqueTradeId) return;
    
    // Get current market conditions
    const currentInputs = await this.captureStrategyInputs({
      symbol: position.symbol,
      strategy: position.strategy,
      action: position.side,
      price: position.entryPrice,
      confidence: 50
    } as EnhancedTradingSignal);
    
    // Run AI validation on current conditions
    const currentValidation = await this.runFullAIValidation(
      { symbol: position.symbol } as EnhancedTradingSignal,
      currentInputs
    );
    
    // Make optimization decision
    const decision = this.makeOptimizationDecision(
      position,
      position.original_signal,
      currentValidation
    );
    
    // Log AI decision
    await this.logAIDecision(uniqueTradeId, position.id, decision);
    
    // Execute if needed
    if (decision.action !== 'hold') {
      console.log(`
🎯 AI Optimization Decision
🆔 Trade ID: ${uniqueTradeId}
📊 Position: ${position.symbol} ${position.side}
🤖 Action: ${decision.action}
💡 Reasoning: ${decision.reasoning}
      `);
    }
  }
  
  /**
   * Make optimization decision for position
   */
  private makeOptimizationDecision(
    position: any,
    originalSignal: any,
    currentValidation: any
  ): { action: string; reasoning: string; confidence: number } {
    // Compare original vs current conditions
    const consensusNow = this.makeConsensusDecision(currentValidation);
    
    // Calculate P&L
    const pnlPercent = position.unrealizedPnL 
      ? (position.unrealizedPnL / (position.entryPrice * position.quantity)) * 100
      : 0;
    
    // Decision logic
    if (!consensusNow.approved && pnlPercent < 0) {
      return {
        action: 'close',
        reasoning: 'AI consensus turned negative with loss',
        confidence: consensusNow.confidence
      };
    }
    
    if (pnlPercent > 2 && consensusNow.confidence < 40) {
      return {
        action: 'reduce',
        reasoning: 'Take partial profits due to reduced AI confidence',
        confidence: consensusNow.confidence
      };
    }
    
    if (pnlPercent < -1.5) {
      return {
        action: 'close',
        reasoning: 'Stop loss triggered',
        confidence: 90
      };
    }
    
    return {
      action: 'hold',
      reasoning: 'Conditions still favorable',
      confidence: consensusNow.confidence
    };
  }
  
  /**
   * Log AI decision for learning
   */
  private async logAIDecision(
    uniqueTradeId: string,
    positionId: string,
    decision: any
  ): Promise<void> {
    try {
      await this.prisma.$executeRaw`
        UPDATE position_signals
        SET 
          ai_decisions = ai_decisions || ${JSON.stringify([{
            timestamp: new Date(),
            decision: decision.action,
            reasoning: decision.reasoning,
            confidence: decision.confidence
          }])}::jsonb,
          updated_at = NOW()
        WHERE position_id = ${positionId}
      `;
    } catch (error) {
      console.error('Error logging AI decision:', error);
    }
  }
  
  /**
   * Learn from completed trades
   */
  async learnFromCompletedTrade(positionId: string): Promise<void> {
    const tradeData = await this.prisma.$queryRaw`
      SELECT 
        p.*,
        ps.original_signal,
        ps.ai_decisions,
        ps.unique_trade_id,
        tl.entry_signals,
        tl.ai_recommendations
      FROM "ManagedPosition" p
      LEFT JOIN position_signals ps ON p.id = ps.position_id
      LEFT JOIN trade_learning tl ON p.unique_trade_id = tl.unique_trade_id
      WHERE p.id = ${positionId}
    `;
    
    if (!tradeData || tradeData.length === 0) return;
    
    const trade = tradeData[0];
    const pnl = trade.realizedPnL || 0;
    const success = pnl > 0;
    
    // Extract success/failure factors
    const factors = this.extractLearningFactors(trade, success);
    
    // Update learning database
    await this.prisma.$executeRaw`
      UPDATE trade_learning
      SET 
        exit_price = ${trade.exitPrice},
        exit_time = ${trade.exitTime},
        realized_pnl = ${pnl},
        pnl_percent = ${(pnl / (trade.entryPrice * trade.quantity)) * 100},
        hold_time_minutes = EXTRACT(EPOCH FROM (${trade.exitTime} - ${trade.entryTime}))/60,
        success_factors = ${success ? JSON.stringify(factors) : null}::jsonb,
        failure_factors = ${!success ? JSON.stringify(factors) : null}::jsonb,
        updated_at = NOW()
      WHERE unique_trade_id = ${trade.unique_trade_id}
    `;
    
    console.log(`
📚 Learning from completed trade
🆔 Trade ID: ${trade.unique_trade_id}
💰 P&L: $${pnl.toFixed(2)} (${success ? '✅ Success' : '❌ Loss'})
📝 Factors: ${JSON.stringify(factors)}
    `);
  }
  
  /**
   * Extract learning factors from trade
   */
  private extractLearningFactors(trade: any, success: boolean): any {
    const factors: any = {};
    
    if (trade.original_signal) {
      const signal = JSON.parse(trade.original_signal);
      factors.entryConditions = {
        rsi: signal.technical?.rsi,
        confidence: signal.strategy?.confidence,
        timeframe: signal.strategy?.timeframe
      };
    }
    
    if (trade.ai_recommendations) {
      const ai = JSON.parse(trade.ai_recommendations);
      factors.aiConsensus = {
        bayesian: ai.bayesian?.recommendation,
        intuition: ai.intuition?.overallIntuition,
        approved: ai.consensus?.approved
      };
    }
    
    factors.performance = {
      holdTime: trade.hold_time_minutes,
      maxDrawdown: trade.max_drawdown_percent,
      maxProfit: trade.max_profit_percent
    };
    
    return factors;
  }
}

// Export singleton instance
export const enhancedPositionService = new EnhancedPositionService();
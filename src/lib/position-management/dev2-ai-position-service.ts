/**
 * DEV2-SPECIFIC AI POSITION SERVICE
 * Enhanced position management with full AI tracking for A/B testing
 * This service is ONLY used when NTFY_TOPIC="signal-cartel-dev2"
 */

import { PrismaClient } from '@prisma/client';
import { positionService } from './position-service';
import { TradingSignal } from '@/types/trading';

// Only load AI systems if running dev2
const isDev2 = () => process.env.NTFY_TOPIC === 'signal-cartel-dev2';

export class Dev2AIPositionService {
  private prisma: PrismaClient;
  private isEnabled: boolean;
  
  constructor() {
    this.prisma = new PrismaClient();
    this.isEnabled = isDev2();
    
    if (this.isEnabled) {
      console.log(`
🚀 DEV2 AI POSITION SERVICE ACTIVATED
📊 A/B Test Variant: Enhanced AI Tracking
🔍 Unique Trade IDs: Enabled
🤖 Full AI Validation: Active
📈 Learning System: Recording
      `);
    }
  }
  
  /**
   * Process signal with dev2 AI enhancements
   */
  async processSignal(signal: TradingSignal): Promise<any> {
    // If not dev2, use standard position service
    if (!this.isEnabled) {
      return positionService.processSignal(signal);
    }
    
    // Generate unique trade ID for dev2
    const uniqueTradeId = this.generateDev2TradeId(signal.strategy, signal.symbol);
    
    console.log(`
🎯 DEV2 AI Processing Signal
🆔 Unique Trade ID: ${uniqueTradeId}
📊 Symbol: ${signal.symbol} | Action: ${signal.action}
🤖 Enhanced AI Validation: Starting...
    `);
    
    // Capture all strategy inputs
    const strategyInputs = await this.captureStrategyInputs(signal);
    
    // Run AI validation
    const aiValidation = await this.runAIValidation(signal, strategyInputs);
    
    // Make consensus decision
    const decision = this.makeConsensusDecision(aiValidation, signal);
    
    // Store in dev2 learning table
    await this.storeDev2Learning(uniqueTradeId, signal, strategyInputs, aiValidation);
    
    if (decision.approved) {
      // Process through standard position service
      const result = await positionService.processSignal(signal);
      
      if (result.action === 'opened' && result.position) {
        // Update with dev2 unique trade ID
        await this.prisma.managedPosition.update({
          where: { id: result.position.id },
          data: { unique_trade_id_dev2: uniqueTradeId }
        });
        
        // Store position signals in dev2 table
        await this.storeDev2PositionSignals(result.position.id, uniqueTradeId, strategyInputs);
        
        console.log(`✅ DEV2 Position Opened: ${uniqueTradeId}`);
      }
      
      return { ...result, uniqueTradeId, aiDecision: decision };
    } else {
      console.log(`❌ DEV2 AI Rejected: ${decision.reasoning.join(', ')}`);
      return { action: 'ignored', uniqueTradeId, aiDecision: decision };
    }
  }
  
  /**
   * Generate dev2-specific trade ID
   */
  private generateDev2TradeId(strategy: string, symbol: string): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return `dev2-${strategy}-${symbol}-${timestamp}-${random}`;
  }
  
  /**
   * Capture strategy inputs for dev2 tracking
   */
  private async captureStrategyInputs(signal: TradingSignal): Promise<any> {
    const inputs = {
      price: signal.price,
      confidence: signal.confidence,
      strategy: signal.strategy,
      metadata: signal.metadata || {},
      timestamp: new Date(),
      
      // Technical indicators from signal
      technical: {
        rsi: signal.metadata?.rsi,
        macd: signal.metadata?.macd,
        bbands: signal.metadata?.bbands,
        volume: signal.metadata?.volume
      },
      
      // AI components from signal
      ai: {
        bayesian: signal.metadata?.bayesian,
        intuition: signal.metadata?.intuition,
        sentiment: signal.metadata?.sentiment
      }
    };
    
    return inputs;
  }
  
  /**
   * Run AI validation for dev2
   */
  private async runAIValidation(signal: TradingSignal, inputs: any): Promise<any> {
    const validation: any = {};
    
    // Check Bayesian confidence
    if (inputs.ai?.bayesian) {
      validation.bayesian = {
        recommendation: inputs.ai.bayesian.recommendation,
        confidence: inputs.ai.bayesian.confidence,
        regime: inputs.ai.bayesian.marketRegime
      };
    }
    
    // Check Mathematical Intuition
    if (inputs.ai?.intuition) {
      validation.intuition = {
        overall: inputs.ai.intuition.overallIntuition,
        flowField: inputs.ai.intuition.flowFieldResonance,
        harmonic: inputs.ai.intuition.harmonicPattern
      };
    }
    
    // Technical validation
    validation.technical = {
      rsiValid: inputs.technical.rsi ? (
        signal.action === 'buy' ? inputs.technical.rsi < 70 : inputs.technical.rsi > 30
      ) : true,
      volumeValid: inputs.technical.volume > 0
    };
    
    return validation;
  }
  
  /**
   * Make consensus decision for dev2
   */
  private makeConsensusDecision(validation: any, signal: TradingSignal): any {
    const reasoning = [];
    let score = 0;
    let confidence = signal.confidence;
    
    // Bayesian vote
    if (validation.bayesian) {
      const rec = validation.bayesian.recommendation;
      if ((signal.action === 'buy' && rec?.includes('BUY')) ||
          (signal.action === 'sell' && rec?.includes('SELL'))) {
        score += 30;
        reasoning.push(`Bayesian: ${rec}`);
      } else if (rec === 'HOLD') {
        score += 10;
      } else {
        score -= 20;
        reasoning.push(`Bayesian against: ${rec}`);
      }
      
      // Adjust confidence based on Bayesian
      if (validation.bayesian.confidence) {
        confidence = (confidence + validation.bayesian.confidence) / 2;
      }
    }
    
    // Intuition vote
    if (validation.intuition?.overall) {
      const intuition = validation.intuition.overall;
      if (intuition > 60) {
        score += 20;
        reasoning.push(`Intuition high: ${intuition}%`);
      } else if (intuition < 40) {
        score -= 15;
        reasoning.push(`Intuition low: ${intuition}%`);
      }
    }
    
    // Technical validation
    if (!validation.technical.rsiValid) {
      score -= 25;
      reasoning.push('RSI unfavorable');
    }
    
    // Final decision
    const approved = score > 0 && confidence > 50;
    
    return {
      approved,
      score,
      confidence: Math.round(confidence),
      reasoning: reasoning.length > 0 ? reasoning : ['Standard validation']
    };
  }
  
  /**
   * Store dev2 learning data
   */
  private async storeDev2Learning(
    uniqueTradeId: string,
    signal: TradingSignal,
    inputs: any,
    validation: any
  ): Promise<void> {
    try {
      await this.prisma.$executeRaw`
        INSERT INTO trade_learning_dev2 (
          unique_trade_id,
          position_id,
          symbol,
          strategy,
          entry_signals,
          entry_price,
          entry_time,
          entry_confidence,
          ai_recommendations,
          test_variant
        ) VALUES (
          ${uniqueTradeId},
          ${uniqueTradeId},
          ${signal.symbol},
          ${signal.strategy},
          ${JSON.stringify(inputs)}::jsonb,
          ${signal.price},
          NOW(),
          ${signal.confidence},
          ${JSON.stringify(validation)}::jsonb,
          'dev2_ai_enhanced'
        )
      `;
    } catch (error) {
      console.error('Dev2 learning storage error:', error);
    }
  }
  
  /**
   * Store dev2 position signals
   */
  private async storeDev2PositionSignals(
    positionId: string,
    uniqueTradeId: string,
    signals: any
  ): Promise<void> {
    try {
      await this.prisma.$executeRaw`
        INSERT INTO position_signals_dev2 (
          position_id,
          unique_trade_id,
          original_signal,
          created_at
        ) VALUES (
          ${positionId},
          ${uniqueTradeId},
          ${JSON.stringify(signals)}::jsonb,
          NOW()
        )
      `;
    } catch (error) {
      console.error('Dev2 position signals storage error:', error);
    }
  }
  
  /**
   * Monitor dev2 positions with enhanced AI
   */
  async monitorDev2Positions(): Promise<void> {
    if (!this.isEnabled) return;
    
    const positions = await this.prisma.$queryRaw`
      SELECT 
        mp.*,
        ps.original_signal,
        ps.ai_decisions,
        mp.unique_trade_id_dev2
      FROM "ManagedPosition" mp
      LEFT JOIN position_signals_dev2 ps ON mp.id = ps.position_id
      WHERE mp.status = 'open' 
        AND mp.unique_trade_id_dev2 IS NOT NULL
    ` as any[];
    
    console.log(`🤖 DEV2 monitoring ${positions.length} AI-tracked positions`);
    
    for (const position of positions) {
      await this.evaluateDev2Position(position);
    }
  }
  
  /**
   * Evaluate individual dev2 position
   */
  private async evaluateDev2Position(position: any): Promise<void> {
    const holdTime = (Date.now() - new Date(position.entryTime).getTime()) / (1000 * 60);
    const pnlPercent = position.unrealizedPnL 
      ? (position.unrealizedPnL / (position.entryPrice * position.quantity)) * 100
      : 0;
    
    // Log AI decision for tracking
    const decision = {
      timestamp: new Date(),
      holdTime,
      pnlPercent,
      action: 'hold',
      reasoning: []
    };
    
    // Enhanced exit logic for dev2
    if (pnlPercent <= -1.5) {
      decision.action = 'close';
      decision.reasoning.push('Stop loss -1.5%');
    } else if (holdTime > 30 && pnlPercent < 0.5) {
      decision.action = 'close';
      decision.reasoning.push('Time exit after 30min');
    } else if (pnlPercent > 3) {
      decision.action = 'trail';
      decision.reasoning.push('Trailing profit protection');
    }
    
    // Store decision in dev2 table
    if (decision.action !== 'hold') {
      await this.prisma.$executeRaw`
        UPDATE position_signals_dev2
        SET 
          ai_decisions = ai_decisions || ${JSON.stringify([decision])}::jsonb,
          updated_at = NOW()
        WHERE position_id = ${position.id}
      `;
      
      console.log(`📊 DEV2 Position ${position.unique_trade_id_dev2}: ${decision.action} - ${decision.reasoning.join(', ')}`);
    }
  }
  
  /**
   * Get A/B test comparison
   */
  async getABTestComparison(): Promise<any> {
    const comparison = await this.prisma.$queryRaw`
      SELECT * FROM ab_test_comparison
    `;
    
    return comparison;
  }
  
  /**
   * Learn from completed dev2 trades
   */
  async learnFromDev2Trade(positionId: string): Promise<void> {
    if (!this.isEnabled) return;
    
    const trade = await this.prisma.$queryRaw`
      SELECT 
        mp.*,
        ps.original_signal,
        ps.ai_decisions,
        tl.entry_signals
      FROM "ManagedPosition" mp
      LEFT JOIN position_signals_dev2 ps ON mp.id = ps.position_id
      LEFT JOIN trade_learning_dev2 tl ON mp.unique_trade_id_dev2 = tl.unique_trade_id
      WHERE mp.id = ${positionId}
    ` as any[];
    
    if (trade.length === 0) return;
    
    const t = trade[0];
    const pnl = t.realizedPnL || 0;
    
    // Update learning table
    await this.prisma.$executeRaw`
      UPDATE trade_learning_dev2
      SET 
        exit_price = ${t.exitPrice},
        exit_time = ${t.exitTime},
        realized_pnl = ${pnl},
        pnl_percent = ${(pnl / (t.entryPrice * t.quantity)) * 100},
        updated_at = NOW()
      WHERE unique_trade_id = ${t.unique_trade_id_dev2}
    `;
    
    console.log(`📚 DEV2 Learning: Trade ${t.unique_trade_id_dev2} closed with P&L: $${pnl.toFixed(2)}`);
  }
}

// Export singleton
export const dev2AIPositionService = new Dev2AIPositionService();
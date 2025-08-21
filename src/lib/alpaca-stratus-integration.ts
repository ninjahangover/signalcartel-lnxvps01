/**
 * Alpaca-Stratus Engine Integration Service
 * 
 * This service integrates the Alpaca paper trading system with the Stratus Engine
 * for real-time AI optimization and automated trading execution.
 * 
 * Features:
 * - Real-time Pine Script webhook processing
 * - AI-driven trade optimization 
 * - Dynamic strategy parameter adjustment
 * - Performance feedback loop for 100% win rate targeting
 * - Automated position management
 */

import { alpacaPaperTradingService, type AlpacaPaperAccount, type AlpacaPosition, type AlpacaOrder } from './alpaca-paper-trading-service';
import { unifiedMarketDataService, type SevenDayAnalysis, type MarketConditions } from './unified-market-data-service';
import { getAITradingSignal, type AITradingDecision } from './stratus-engine-ai';
import PineScriptManager from './pine-script-manager';

export interface StrategyParameters {
  strategyId: string;
  name: string;
  symbol: string;
  timeframe: string;
  rsiPeriod: number;
  rsiOverbought: number;
  rsiOversold: number;
  macdFast: number;
  macdSlow: number;
  macdSignal: number;
  stopLossPercent: number;
  takeProfitPercent: number;
  positionSize: number;
  enabled: boolean;
  lastOptimized: Date;
}

export interface OptimizationResult {
  strategyId: string;
  oldParameters: Partial<StrategyParameters>;
  newParameters: Partial<StrategyParameters>;
  expectedImprovement: number;
  confidence: number;
  reasoning: string[];
  timestamp: Date;
}

export interface TradeExecution {
  strategyId: string;
  symbol: string;
  action: 'BUY' | 'SELL' | 'CLOSE';
  quantity: number;
  price: number;
  aiDecision: AITradingDecision;
  parameters: StrategyParameters;
  alpacaOrderId?: string;
  executionTime: Date;
  webhookData?: any;
}

class AlpacaStratusIntegration {
  private static instance: AlpacaStratusIntegration | null = null;
  private userId: string = '';
  private strategies: Map<string, StrategyParameters> = new Map();
  private activePositions: Map<string, AlpacaPosition> = new Map();
  private tradeHistory: TradeExecution[] = [];
  private optimizationInterval: NodeJS.Timeout | null = null;
  private isRunning: boolean = false;
  private listeners: Set<(data: any) => void> = new Set();

  private constructor() {
    this.initializeDefaultStrategies();
  }

  static getInstance(): AlpacaStratusIntegration {
    if (!AlpacaStratusIntegration.instance) {
      AlpacaStratusIntegration.instance = new AlpacaStratusIntegration();
    }
    return AlpacaStratusIntegration.instance;
  }

  // Initialize with user and start the optimization engine
  async initialize(userId: string): Promise<void> {
    this.userId = userId;
    
    // Initialize Alpaca paper trading for this user
    await alpacaPaperTradingService.initializeAccount(
      userId,
      process.env.NEXT_PUBLIC_ALPACA_PAPER_API_KEY || '',
      process.env.NEXT_PUBLIC_ALPACA_PAPER_API_SECRET || ''
    );

    // Load existing strategies and positions
    await this.loadUserStrategies();
    await this.syncAlpacaPositions();

    console.log('🚀 Alpaca-Stratus Integration initialized for user:', userId);
  }

  // Start the real-time optimization engine
  async startOptimizationEngine(): Promise<void> {
    if (this.isRunning) {
      console.log('⚠️ Optimization engine already running');
      return;
    }

    this.isRunning = true;
    console.log('🎯 Starting Stratus Engine real-time optimization...');

    // Real-time optimization loop - every 30 seconds
    this.optimizationInterval = setInterval(async () => {
      try {
        await this.performRealTimeOptimization();
        await this.syncAlpacaPositions();
        this.notifyListeners({
          type: 'optimization_cycle',
          timestamp: new Date(),
          strategies: Array.from(this.strategies.values()),
          positions: Array.from(this.activePositions.values())
        });
      } catch (error) {
        console.error('❌ Optimization cycle error:', error);
      }
    }, 30000);

    console.log('✅ Optimization engine started');
  }

  // Stop the optimization engine
  stopOptimizationEngine(): void {
    if (this.optimizationInterval) {
      clearInterval(this.optimizationInterval);
      this.optimizationInterval = null;
    }
    this.isRunning = false;
    console.log('⏹️ Optimization engine stopped');
  }

  // Process Pine Script webhook and execute trade
  async processWebhookTrade(webhookData: any): Promise<TradeExecution | null> {
    try {
      console.log('📡 Processing webhook trade:', webhookData);

      const strategyId = webhookData.strategy_id || webhookData.strategyId || 'default';
      const strategy = this.strategies.get(strategyId);
      
      if (!strategy || !strategy.enabled) {
        console.log(`⚠️ Strategy ${strategyId} not found or disabled`);
        return null;
      }

      // Get AI enhancement for this trade
      const aiDecision = await getAITradingSignal(webhookData.ticker || webhookData.symbol);
      
      // Apply AI optimization to the trade parameters
      const optimizedTrade = await this.optimizeTradeWithAI(webhookData, strategy, aiDecision);
      
      if (!optimizedTrade) {
        console.log('🚫 AI rejected trade - conditions not optimal');
        return null;
      }

      // Execute the trade through Alpaca
      const execution = await this.executeAlpacaTrade(optimizedTrade, strategy, aiDecision, webhookData);
      
      if (execution) {
        this.tradeHistory.push(execution);
        
        // Trigger immediate optimization based on execution
        setTimeout(() => this.optimizeStrategyFromTrade(execution), 1000);
        
        this.notifyListeners({
          type: 'trade_executed',
          execution,
          timestamp: new Date()
        });
      }

      return execution;

    } catch (error) {
      console.error('❌ Webhook trade processing error:', error);
      return null;
    }
  }

  // Execute trade through Alpaca with AI enhancements
  private async executeAlpacaTrade(
    tradeData: any, 
    strategy: StrategyParameters, 
    aiDecision: AITradingDecision,
    webhookData: any
  ): Promise<TradeExecution | null> {
    try {
      const symbol = tradeData.symbol || tradeData.ticker;
      const action = tradeData.action || tradeData.strategy?.order_action;
      let quantity = parseFloat(tradeData.quantity || tradeData.strategy?.order_contracts || '1');

      // AI position sizing optimization
      if (aiDecision.confidence > 0.8) {
        quantity *= aiDecision.positionSize; // Increase size for high-confidence trades
      } else if (aiDecision.confidence < 0.6) {
        quantity *= 0.5; // Reduce size for low-confidence trades
      }

      quantity = Math.max(1, Math.floor(quantity)); // Ensure minimum 1 share

      // Prepare order parameters
      const orderParams = {
        symbol: symbol.replace(/USD$/, ''), // Remove USD suffix if present
        qty: quantity,
        side: action.toLowerCase() as 'buy' | 'sell',
        type: 'market' as const,
        time_in_force: 'day' as const
      };

      console.log('🎯 Executing Alpaca order with AI optimization:', {
        ...orderParams,
        aiConfidence: `${(aiDecision.confidence * 100).toFixed(1)}%`,
        aiDecision: aiDecision.decision,
        expectedWinRate: `${aiDecision.expectedWinRate.toFixed(1)}%`
      });

      // Execute the order
      const order = await alpacaPaperTradingService.placeOrder(orderParams);
      
      if (order) {
        const execution: TradeExecution = {
          strategyId: strategy.strategyId,
          symbol,
          action: action.toUpperCase() as 'BUY' | 'SELL' | 'CLOSE',
          quantity,
          price: parseFloat(tradeData.price || '0'),
          aiDecision,
          parameters: strategy,
          alpacaOrderId: order.id,
          executionTime: new Date(),
          webhookData
        };

        console.log('✅ Trade executed successfully:', {
          strategyId: strategy.strategyId,
          symbol,
          action,
          quantity,
          orderId: order.id,
          aiConfidence: `${(aiDecision.confidence * 100).toFixed(1)}%`
        });

        return execution;
      }

      return null;

    } catch (error) {
      console.error('❌ Alpaca trade execution error:', error);
      return null;
    }
  }

  // Optimize trade with AI before execution
  private async optimizeTradeWithAI(
    webhookData: any, 
    strategy: StrategyParameters, 
    aiDecision: AITradingDecision
  ): Promise<any | null> {
    // AI filtering - only execute high-quality trades
    if (aiDecision.confidence < 0.6) {
      console.log(`🚫 AI confidence too low: ${(aiDecision.confidence * 100).toFixed(1)}% (minimum 60%)`);
      return null;
    }

    // Check if AI decision aligns with Pine Script signal
    const pineAction = webhookData.strategy?.order_action || webhookData.action;
    const aiAction = aiDecision.decision;
    
    const actionsAlign = (
      (pineAction === 'buy' && ['BUY', 'CLOSE_SHORT'].includes(aiAction)) ||
      (pineAction === 'sell' && ['SELL', 'CLOSE_LONG'].includes(aiAction))
    );

    if (!actionsAlign && aiDecision.confidence < 0.8) {
      console.log(`🚫 AI and Pine Script signals don't align. Pine: ${pineAction}, AI: ${aiAction}`);
      return null;
    }

    // Get market intelligence adjustments
    const marketAdjustments = await getQuickTradingAdjustments(webhookData.ticker || webhookData.symbol);
    
    // Apply optimizations
    const optimizedData = {
      ...webhookData,
      // Apply AI-optimized position size
      quantity: (parseFloat(webhookData.quantity || '1') * aiDecision.positionSize).toString(),
      // Use AI optimal entry if available
      price: aiDecision.optimalEntry > 0 ? aiDecision.optimalEntry.toString() : webhookData.price,
      // Add AI stop loss and take profit
      stopLoss: aiDecision.stopLoss,
      takeProfit: aiDecision.takeProfit[0] // Use first take profit level
    };

    console.log('🎯 Trade optimized with AI:', {
      originalQuantity: webhookData.quantity,
      optimizedQuantity: optimizedData.quantity,
      aiConfidence: `${(aiDecision.confidence * 100).toFixed(1)}%`,
      aiDecision: aiDecision.decision,
      marketCondition: marketAdjustments?.condition || 'unknown'
    });

    return optimizedData;
  }

  // Perform real-time optimization of strategy parameters
  private async performRealTimeOptimization(): Promise<void> {
    for (const [strategyId, strategy] of this.strategies) {
      try {
        if (!strategy.enabled) continue;

        // Get current market conditions
        const currentPrice = await realMarketData.getCurrentPrice(strategy.symbol);
        const aiDecision = await getAITradingSignal(strategy.symbol);
        
        // Calculate recent performance
        const recentTrades = this.getRecentTradesForStrategy(strategyId, 10);
        const winRate = this.calculateWinRate(recentTrades);
        
        // If win rate is below target, optimize parameters
        if (winRate < 95 && recentTrades.length >= 3) { // Target 95%+ win rate
          const optimization = await this.optimizeStrategyParameters(strategy, recentTrades, aiDecision);
          
          if (optimization && optimization.confidence > 0.7) {
            this.applyOptimization(optimization);
            console.log(`🔧 Strategy ${strategyId} optimized:`, {
              oldWinRate: `${winRate.toFixed(1)}%`,
              expectedImprovement: `+${optimization.expectedImprovement.toFixed(1)}%`,
              changes: Object.keys(optimization.newParameters).length
            });
          }
        }

      } catch (error) {
        console.error(`❌ Optimization error for strategy ${strategyId}:`, error);
      }
    }
  }

  // Optimize strategy parameters using AI analysis
  private async optimizeStrategyParameters(
    strategy: StrategyParameters,
    recentTrades: TradeExecution[],
    aiDecision: AITradingDecision
  ): Promise<OptimizationResult | null> {
    try {
      const losses = recentTrades.filter(t => this.wasTradeLoser(t));
      
      if (losses.length === 0) return null; // Already perfect

      // Analyze losing trades to identify improvement areas
      const optimizations: Partial<StrategyParameters> = {};
      const reasoning: string[] = [];

      // RSI optimization
      const rsiIssues = losses.filter(t => this.isRSIRelatedLoss(t));
      if (rsiIssues.length > 0) {
        // Adjust RSI thresholds based on AI insights
        if (aiDecision.confidence > 0.8) {
          optimizations.rsiOverbought = Math.min(85, strategy.rsiOverbought + 2);
          optimizations.rsiOversold = Math.max(15, strategy.rsiOversold - 2);
          reasoning.push('RSI thresholds adjusted for higher signal quality');
        }
      }

      // Stop loss optimization
      const stopLossIssues = losses.filter(t => this.isStopLossRelatedLoss(t));
      if (stopLossIssues.length > 0) {
        // Tighten stop loss if getting stopped out too often
        optimizations.stopLossPercent = Math.max(0.5, strategy.stopLossPercent * 0.9);
        reasoning.push('Stop loss tightened to preserve capital');
      }

      // Position size optimization
      if (aiDecision.expectedWinRate > 85) {
        optimizations.positionSize = Math.min(2.0, strategy.positionSize * 1.1);
        reasoning.push('Position size increased for high-probability setups');
      } else if (aiDecision.expectedWinRate < 70) {
        optimizations.positionSize = Math.max(0.5, strategy.positionSize * 0.9);
        reasoning.push('Position size reduced for uncertain conditions');
      }

      if (Object.keys(optimizations).length === 0) return null;

      // Calculate expected improvement
      const currentWinRate = this.calculateWinRate(recentTrades);
      const expectedImprovement = Math.min(10, (100 - currentWinRate) * 0.3); // Conservative estimate

      return {
        strategyId: strategy.strategyId,
        oldParameters: this.extractParameters(strategy, Object.keys(optimizations)),
        newParameters: optimizations,
        expectedImprovement,
        confidence: aiDecision.confidence,
        reasoning,
        timestamp: new Date()
      };

    } catch (error) {
      console.error('❌ Parameter optimization error:', error);
      return null;
    }
  }

  // Apply optimization to strategy
  private applyOptimization(optimization: OptimizationResult): void {
    const strategy = this.strategies.get(optimization.strategyId);
    if (!strategy) return;

    // Apply the new parameters
    Object.assign(strategy, optimization.newParameters);
    strategy.lastOptimized = new Date();

    // Update the strategy
    this.strategies.set(optimization.strategyId, strategy);

    // Notify Pine Script manager to update webhooks if needed
    this.updateWebhookParameters(optimization.strategyId, optimization.newParameters);

    console.log(`✅ Applied optimization to strategy ${optimization.strategyId}:`, optimization.newParameters);
  }

  // Helper methods
  private initializeDefaultStrategies(): void {
    const defaultStrategy: StrategyParameters = {
      strategyId: 'rsi_macd_scalper',
      name: 'RSI MACD Scalper',
      symbol: 'BTCUSD',
      timeframe: '5m',
      rsiPeriod: 14,
      rsiOverbought: 75,
      rsiOversold: 25,
      macdFast: 12,
      macdSlow: 26,
      macdSignal: 9,
      stopLossPercent: 2.0,
      takeProfitPercent: 4.0,
      positionSize: 1.0,
      enabled: true,
      lastOptimized: new Date()
    };

    this.strategies.set(defaultStrategy.strategyId, defaultStrategy);
  }

  private async loadUserStrategies(): Promise<void> {
    // TODO: Load user's custom strategies from database
    console.log('📊 Loading user strategies...');
  }

  private async syncAlpacaPositions(): Promise<void> {
    try {
      const positions = await alpacaPaperTradingService.getPositions();
      this.activePositions.clear();
      positions.forEach(pos => {
        this.activePositions.set(pos.symbol, pos);
      });
    } catch (error) {
      console.error('❌ Failed to sync Alpaca positions:', error);
    }
  }

  private getRecentTradesForStrategy(strategyId: string, limit: number): TradeExecution[] {
    return this.tradeHistory
      .filter(t => t.strategyId === strategyId)
      .sort((a, b) => b.executionTime.getTime() - a.executionTime.getTime())
      .slice(0, limit);
  }

  private calculateWinRate(trades: TradeExecution[]): number {
    if (trades.length === 0) return 0;
    const winners = trades.filter(t => this.wasTradeWinner(t)).length;
    return (winners / trades.length) * 100;
  }

  private wasTradeWinner(trade: TradeExecution): boolean {
    // TODO: Implement actual P&L calculation from Alpaca position data
    return trade.aiDecision.expectedWinRate > 70;
  }

  private wasTradeLoser(trade: TradeExecution): boolean {
    return !this.wasTradeWinner(trade);
  }

  private isRSIRelatedLoss(trade: TradeExecution): boolean {
    // TODO: Implement RSI analysis of losing trades
    return false;
  }

  private isStopLossRelatedLoss(trade: TradeExecution): boolean {
    // TODO: Implement stop loss analysis
    return false;
  }

  private extractParameters(strategy: StrategyParameters, keys: string[]): Partial<StrategyParameters> {
    const result: any = {};
    keys.forEach(key => {
      if (key in strategy) {
        result[key] = (strategy as any)[key];
      }
    });
    return result;
  }

  private updateWebhookParameters(strategyId: string, newParams: Partial<StrategyParameters>): void {
    // TODO: Update Pine Script webhook configuration with new parameters
    console.log(`🔗 Updating webhook parameters for ${strategyId}:`, newParams);
  }

  private async optimizeStrategyFromTrade(execution: TradeExecution): Promise<void> {
    // Immediate optimization after each trade
    const strategy = this.strategies.get(execution.strategyId);
    if (!strategy) return;

    // Record trade outcome for AI learning
    setTimeout(async () => {
      try {
        // Get final position data to determine actual outcome
        const positions = await alpacaPaperTradingService.getPositions();
        const position = positions.find(p => p.symbol === execution.symbol);
        
        if (position) {
          const wasWinner = position.unrealizedPl > 0;
          const actualProfit = position.unrealizedPl;
          
          const outcome: TradeOutcome = {
            tradeId: execution.alpacaOrderId || '',
            symbol: execution.symbol,
            decision: execution.aiDecision,
            entryPrice: execution.price,
            exitPrice: position.avgEntryPrice,
            actualProfit,
            actualMargin: (actualProfit / (position.avgEntryPrice * position.qty)) * 100,
            wasCorrect: wasWinner,
            executionTime: execution.executionTime,
            marketCondition: 'normal',
            aiConfidence: execution.aiDecision.confidence,
            actualWinRate: this.calculateWinRate(this.getRecentTradesForStrategy(execution.strategyId, 20))
          };

          await recordAITradeResult(outcome);
          console.log(`📊 Recorded trade outcome for AI learning:`, {
            strategyId: execution.strategyId,
            symbol: execution.symbol,
            wasWinner,
            profit: `$${actualProfit.toFixed(2)}`
          });
        }
      } catch (error) {
        console.error('❌ Failed to record trade outcome:', error);
      }
    }, 5000); // Wait 5 seconds for position to update
  }

  // Public API
  addListener(callback: (data: any) => void): void {
    this.listeners.add(callback);
  }

  removeListener(callback: (data: any) => void): void {
    this.listeners.delete(callback);
  }

  private notifyListeners(data: any): void {
    this.listeners.forEach(callback => callback(data));
  }

  getStrategies(): StrategyParameters[] {
    return Array.from(this.strategies.values());
  }

  getActivePositions(): AlpacaPosition[] {
    return Array.from(this.activePositions.values());
  }

  getTradeHistory(): TradeExecution[] {
    return [...this.tradeHistory];
  }

  isOptimizationRunning(): boolean {
    return this.isRunning;
  }
}

// Export singleton instance
export const alpacaStratusIntegration = AlpacaStratusIntegration.getInstance();

// Export helper functions
export async function initializeAlpacaStratusIntegration(userId: string): Promise<void> {
  await alpacaStratusIntegration.initialize(userId);
}

export async function startRealTimeOptimization(): Promise<void> {
  await alpacaStratusIntegration.startOptimizationEngine();
}

export function stopRealTimeOptimization(): void {
  alpacaStratusIntegration.stopOptimizationEngine();
}

export async function processWebhookTrade(webhookData: any): Promise<TradeExecution | null> {
  return await alpacaStratusIntegration.processWebhookTrade(webhookData);
}
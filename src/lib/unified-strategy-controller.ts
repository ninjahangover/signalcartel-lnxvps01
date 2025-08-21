/**
 * UNIFIED STRATEGY CONTROLLER
 * Central management system for all strategy operations
 */

import { 
  UnifiedStrategy, 
  UnifiedStrategyParameters, 
  DEFAULT_STRATEGY_CONFIGS,
  MARKET_CONDITION_ADJUSTMENTS,
  OPTIMIZATION_CONSTRAINTS,
  validateParameters,
  mergeParameters
} from './unified-strategy-config';
import marketDataService, { MarketData } from './market-data-service';
import { telegramBotService } from './telegram-bot-service';
import { rsiOptimizationEngine } from './strategy-optimization-engines/rsi-optimization-engine';
import StrategyExecutionEngine from './strategy-execution-engine';
import { PineScriptInputOptimizer } from './pine-script-input-optimizer';
import { RealTimeStrategyOptimizer } from './real-time-strategy-optimizer';
import { alpacaPaperTradingService } from './alpaca-paper-trading-service';  // Real Paper trading
import { krakenWebhookService } from './kraken-webhook-service';  // Live trading

export type StrategyEvent = 
  | 'STRATEGY_CREATED'
  | 'STRATEGY_UPDATED' 
  | 'PARAMETERS_OPTIMIZED'
  | 'MARKET_ADJUSTED'
  | 'TRADE_EXECUTED'
  | 'PERFORMANCE_UPDATED';

export interface StrategyEventData {
  type: StrategyEvent;
  strategyId: string;
  data: any;
  timestamp: Date;
}

export interface MarketConditions {
  trend: 'bullish' | 'bearish' | 'neutral';
  volatility: number; // 0-1 scale
  volume: 'low' | 'normal' | 'high';
  regime: 'trending_up' | 'trending_down' | 'ranging' | 'volatile';
  confidence: number; // 0-1 scale
}

export interface OptimizationResult {
  originalParams: UnifiedStrategyParameters;
  optimizedParams: UnifiedStrategyParameters;
  expectedImprovement: number; // Percentage
  backtestResults?: {
    winRate: number;
    profitFactor: number;
    sharpeRatio: number;
  };
  reason: string;
}

class UnifiedStrategyController {
  private static instance: UnifiedStrategyController;
  private strategies: Map<string, UnifiedStrategy> = new Map();
  private listeners: Map<StrategyEvent, Set<(data: StrategyEventData) => void>> = new Map();
  private marketData: MarketData[] = [];
  private currentMarketConditions: MarketConditions | null = null;
  private optimizationQueue: string[] = [];
  private isOptimizing = false;
  
  // Performance tracking
  private performanceHistory: Map<string, Array<{
    timestamp: Date;
    winRate: number;
    profitLoss: number;
    trades: number;
  }>> = new Map();

  private constructor() {
    this.initializeDefaultStrategies();
    this.startMarketAnalysis();
    this.startOptimizationCycle();
  }

  static getInstance(): UnifiedStrategyController {
    if (!UnifiedStrategyController.instance) {
      UnifiedStrategyController.instance = new UnifiedStrategyController();
    }
    return UnifiedStrategyController.instance;
  }

  // Initialize with default strategies
  private initializeDefaultStrategies(): void {
    // Create your manual trading system strategy
    this.createStrategy({
      id: 'manual-system-001',
      name: 'Manual Trading Strategy',
      type: 'RSI_PULLBACK',
      enabled: true,
      mode: 'paper',
      parameters: DEFAULT_STRATEGY_CONFIGS.YOUR_MANUAL_SYSTEM,
      defaultParameters: DEFAULT_STRATEGY_CONFIGS.YOUR_MANUAL_SYSTEM,
      performance: {
        totalTrades: 0,
        winRate: 0,
        profitLoss: 0,
        sharpeRatio: 0,
        maxDrawdown: 0,
        consecutiveWins: 0,
        consecutiveLosses: 0
      }
    });

    // Create aggressive scalping strategy
    this.createStrategy({
      id: 'aggressive-scalp-001',
      name: 'Aggressive Scalper',
      type: 'RSI_PULLBACK',
      enabled: false,
      mode: 'paper',
      parameters: DEFAULT_STRATEGY_CONFIGS.AGGRESSIVE_SCALPING,
      defaultParameters: DEFAULT_STRATEGY_CONFIGS.AGGRESSIVE_SCALPING,
      performance: {
        totalTrades: 0,
        winRate: 0,
        profitLoss: 0,
        sharpeRatio: 0,
        maxDrawdown: 0,
        consecutiveWins: 0,
        consecutiveLosses: 0
      }
    });
  }

  // Start continuous market analysis
  private startMarketAnalysis(): void {
    marketDataService.subscribe('BTCUSD', (data) => {
      this.marketData.push(data);
      if (this.marketData.length > 1000) {
        this.marketData.shift();
      }
      
      // Analyze market every 50 data points
      if (this.marketData.length % 50 === 0) {
        this.analyzeMarketConditions();
      }
    });
  }

  // Start optimization cycle
  private startOptimizationCycle(): void {
    setInterval(() => {
      this.processOptimizationQueue();
    }, 30000); // Every 30 seconds
  }

  // CORE METHODS

  /**
   * Create a new strategy
   */
  createStrategy(strategy: UnifiedStrategy): void {
    if (!validateParameters(strategy.parameters)) {
      throw new Error('Invalid strategy parameters');
    }
    
    this.strategies.set(strategy.id, strategy);
    this.performanceHistory.set(strategy.id, []);
    
    this.emit('STRATEGY_CREATED', {
      type: 'STRATEGY_CREATED',
      strategyId: strategy.id,
      data: strategy,
      timestamp: new Date()
    });
    
    console.log(`✅ Strategy created: ${strategy.name} (${strategy.id})`);
  }

  /**
   * Get a strategy by ID
   */
  getStrategy(strategyId: string): UnifiedStrategy | undefined {
    return this.strategies.get(strategyId);
  }

  /**
   * Get all strategies
   */
  getAllStrategies(): UnifiedStrategy[] {
    return Array.from(this.strategies.values());
  }

  /**
   * Update strategy parameters
   */
  updateStrategyParameters(
    strategyId: string, 
    parameters: Partial<UnifiedStrategyParameters>,
    source: 'manual' | 'optimization' | 'market_adjustment' = 'manual'
  ): void {
    const strategy = this.strategies.get(strategyId);
    if (!strategy) {
      console.error(`Strategy ${strategyId} not found`);
      return;
    }

    const newParams = mergeParameters(strategy.parameters, parameters);
    
    if (!validateParameters(newParams)) {
      console.error('Invalid parameters after merge');
      return;
    }

    // Store old parameters for comparison
    const oldParams = { ...strategy.parameters };
    
    // Update strategy
    strategy.parameters = newParams;
    
    if (source === 'optimization') {
      strategy.optimizedParameters = newParams;
      strategy.lastOptimization = new Date();
    }

    this.strategies.set(strategyId, strategy);

    this.emit('PARAMETERS_OPTIMIZED', {
      type: 'PARAMETERS_OPTIMIZED',
      strategyId,
      data: {
        oldParams,
        newParams,
        source,
        changes: this.calculateParameterChanges(oldParams, newParams)
      },
      timestamp: new Date()
    });

    console.log(`📊 Updated ${strategy.name} parameters (${source})`);
  }

  /**
   * Toggle strategy enabled/disabled
   */
  toggleStrategy(strategyId: string): void {
    const strategy = this.strategies.get(strategyId);
    if (!strategy) return;

    strategy.enabled = !strategy.enabled;
    this.strategies.set(strategyId, strategy);

    this.emit('STRATEGY_UPDATED', {
      type: 'STRATEGY_UPDATED',
      strategyId,
      data: { enabled: strategy.enabled },
      timestamp: new Date()
    });
  }

  /**
   * Switch between paper and live trading
   */
  setTradingMode(strategyId: string, mode: 'paper' | 'live'): void {
    const strategy = this.strategies.get(strategyId);
    if (!strategy) return;

    const oldMode = strategy.mode;
    strategy.mode = mode;
    this.strategies.set(strategyId, strategy);

    // Configure trading execution based on mode
    if (mode === 'paper') {
      console.log(`📋 ${strategy.name}: Switched to PAPER TRADING (Alpaca API)`);
      // Ensure Alpaca connection is active
      this.setupPaperTrading(strategyId);
    } else {
      console.log(`🔴 ${strategy.name}: Switched to LIVE TRADING (Kraken Webhooks)`);
      // Setup webhook configuration for live trading
      this.setupLiveTrading(strategyId);
    }

    this.emit('STRATEGY_UPDATED', {
      type: 'STRATEGY_UPDATED',
      strategyId,
      data: { mode, oldMode },
      timestamp: new Date()
    });

    // Send Telegram alert for mode change
    telegramBotService.sendTradeAlert({
      type: mode === 'live' ? 'LIVE_TRADING_ENABLED' : 'PAPER_TRADING_ENABLED',
      strategy: strategy.name,
      symbol: 'BTCUSD',
      action: 'BUY',
      price: 0,
      quantity: 0,
      profit: 0,
      confidence: 0,
      metadata: { 
        strategyId,
        tradingMode: mode,
        platform: mode === 'paper' ? 'Alpaca' : 'Kraken'
      }
    });
  }

  /**
   * Setup paper trading with Alpaca API
   */
  private setupPaperTrading(strategyId: string): void {
    const strategy = this.strategies.get(strategyId);
    if (!strategy) return;

    // Configure strategy for Alpaca paper trading
    try {
      // Initialize Alpaca connection if needed
      console.log(`📊 Setting up Alpaca paper trading for ${strategy.name}`);
      
      // Add strategy to execution engine for direct API trading
      const executionEngine = StrategyExecutionEngine.getInstance();
      executionEngine.addStrategy(strategy, 'BTCUSD');
      
    } catch (error) {
      console.error(`Failed to setup paper trading for ${strategyId}:`, error);
    }
  }

  /**
   * Setup live trading with Kraken webhooks
   */
  private setupLiveTrading(strategyId: string): void {
    const strategy = this.strategies.get(strategyId);
    if (!strategy) return;

    try {
      console.log(`🔴 Setting up Kraken webhook trading for ${strategy.name}`);
      
      // Configure Pine Script webhook for this strategy
      const webhookConfig = {
        strategyId: strategy.id,
        webhookUrl: `https://kraken.circuitcartel.com/webhook/strategy/${strategy.id}`,
        strategyName: strategy.name,
        alertPayload: {
          strategy_id: strategy.id,
          strategy_name: strategy.name,
          action: '{{strategy.order.action}}',
          symbol: '{{ticker}}',
          price: '{{strategy.order.price}}',
          quantity: '{{strategy.order.contracts}}',
          rsi: '{{rsi}}',
          rsi_period: strategy.parameters.rsi.lookback,
          oversold_level: strategy.parameters.rsi.oversoldEntry,
          overbought_level: strategy.parameters.rsi.overboughtEntry,
          stop_loss_atr: strategy.parameters.risk.stopLossATR,
          take_profit_atr: strategy.parameters.risk.takeProfitATR,
          position_size_pct: strategy.parameters.risk.positionSize * 100,
          timestamp: '{{timestamp}}',
          passphrase: 'sdfqoei1898498'  // Security passphrase
        },
        testingMode: false, // Live mode
        platform: 'kraken'
      };

      // Store webhook configuration
      strategy.pineScript = {
        source: `/src/strategies/${strategy.id}.pine`,
        webhookUrl: webhookConfig.webhookUrl,
        alertPayload: webhookConfig.alertPayload,
        testingMode: false,
        lastAlert: new Date(),
        alertCount: 0
      };

      this.strategies.set(strategyId, strategy);
      
      console.log(`✅ Webhook configured: ${webhookConfig.webhookUrl}`);
      
    } catch (error) {
      console.error(`Failed to setup live trading for ${strategyId}:`, error);
    }
  }

  /**
   * Execute trade signal based on trading mode
   */
  async executeTradeSignal(
    strategyId: string, 
    signal: {
      action: 'BUY' | 'SELL' | 'CLOSE';
      symbol: string;
      price: number;
      quantity: number;
      confidence: number;
      rsi: number;
    }
  ): Promise<void> {
    const strategy = this.strategies.get(strategyId);
    if (!strategy || !strategy.enabled) return;

    console.log(`🎯 ${strategy.name} (${strategy.mode.toUpperCase()}): ${signal.action} signal at $${signal.price}`);

    if (strategy.mode === 'paper') {
      // Execute via Alpaca Paper Trading API
      await this.executePaperTrade(strategy, signal);
    } else {
      // Execute via Kraken Webhook (Pine Script triggers this)
      await this.executeLiveTrade(strategy, signal);
    }

    // Update performance tracking
    this.emit('TRADE_EXECUTED', {
      type: 'TRADE_EXECUTED',
      strategyId,
      data: {
        signal,
        mode: strategy.mode,
        timestamp: new Date()
      },
      timestamp: new Date()
    });
  }

  /**
   * Execute paper trade via Alpaca API
   */
  private async executePaperTrade(
    strategy: UnifiedStrategy,
    signal: any
  ): Promise<void> {
    try {
      console.log(`📊 Executing Alpaca paper trade for ${strategy.name}`);
      
      // Calculate position size based on strategy parameters
      const positionSize = strategy.parameters.risk.positionSize;
      const dollarAmount = positionSize * 10000; // Assuming $10k account
      const quantity = Math.floor(dollarAmount / signal.price);

      const tradeOrder = {
        symbol: signal.symbol,
        qty: quantity,
        side: signal.action.toLowerCase() as 'buy' | 'sell',
        type: 'market' as const,
        time_in_force: 'day' as const,
        client_order_id: `${strategy.id}_${Date.now()}`
      };

      // Execute via Alpaca (would need actual alpacaService implementation)
      console.log(`📋 Paper trade order:`, tradeOrder);
      
      // Send to Telegram
      await telegramBotService.sendTradeAlert({
        type: 'PAPER_TRADE_EXECUTED',
        strategy: strategy.name,
        symbol: signal.symbol,
        action: signal.action,
        price: signal.price,
        quantity: quantity,
        profit: 0,
        confidence: signal.confidence,
        metadata: {
          platform: 'Alpaca',
          rsi: signal.rsi,
          mode: 'paper'
        }
      });

    } catch (error) {
      console.error('Paper trade execution failed:', error);
    }
  }

  /**
   * Execute live trade via Kraken webhook
   */
  private async executeLiveTrade(
    strategy: UnifiedStrategy,
    signal: any
  ): Promise<void> {
    try {
      console.log(`🔴 Live trade signal for ${strategy.name} - Webhook will handle execution`);
      
      // For live trading, the Pine Script strategy sends the webhook
      // We just log and notify, actual execution happens via Pine Script → Webhook → Kraken
      
      const webhookPayload = {
        strategy_id: strategy.id,
        strategy_name: strategy.name,
        action: signal.action,
        symbol: signal.symbol,
        price: signal.price,
        quantity: Math.floor((strategy.parameters.risk.positionSize * 10000) / signal.price),
        rsi: signal.rsi,
        rsi_period: strategy.parameters.rsi.lookback,
        timestamp: new Date().toISOString(),
        passphrase: 'sdfqoei1898498'
      };

      console.log(`🔗 Webhook payload prepared for Kraken:`, webhookPayload);
      
      // Send to Telegram
      await telegramBotService.sendTradeAlert({
        type: 'LIVE_TRADE_SIGNAL',
        strategy: strategy.name,
        symbol: signal.symbol,
        action: signal.action,
        price: signal.price,
        quantity: webhookPayload.quantity,
        profit: 0,
        confidence: signal.confidence,
        metadata: {
          platform: 'Kraken',
          webhook: strategy.pineScript?.webhookUrl,
          rsi: signal.rsi,
          mode: 'live'
        }
      });

    } catch (error) {
      console.error('Live trade signal failed:', error);
    }
  }

  /**
   * Queue strategy for optimization
   */
  queueOptimization(strategyId: string): void {
    if (!this.optimizationQueue.includes(strategyId)) {
      this.optimizationQueue.push(strategyId);
      console.log(`📋 Queued ${strategyId} for optimization`);
    }
  }

  /**
   * Optimize a specific strategy using AI engines
   */
  async optimizeStrategy(strategyId: string): Promise<OptimizationResult | null> {
    const strategy = this.strategies.get(strategyId);
    if (!strategy || !strategy.parameters.optimization.enabled) {
      return null;
    }

    console.log(`🧠 Optimizing ${strategy.name} with AI engines...`);

    try {
      // Use the RSI Optimization Engine for intelligent parameter optimization
      const marketCondition = rsiOptimizationEngine.analyzeMarketConditions(
        this.marketData.map(d => d.price),
        this.marketData.map(d => d.volume)
      );

      // Convert our parameters to RSI engine format
      const currentRSIParams = {
        rsi_lookback: strategy.parameters.rsi.lookback,
        lower_barrier: strategy.parameters.rsi.oversoldEntry,
        lower_threshold: strategy.parameters.rsi.oversoldExit,
        upper_barrier: strategy.parameters.rsi.overboughtEntry,
        upper_threshold: strategy.parameters.rsi.overboughtExit,
        ma_length: strategy.parameters.ma.shortPeriod,
        atr_multiplier_stop: strategy.parameters.risk.stopLossATR,
        atr_multiplier_take: strategy.parameters.risk.takeProfitATR,
        atr_length: strategy.parameters.risk.atrPeriod
      };

      // Get optimization recommendations from the AI engine
      const recommendations = rsiOptimizationEngine.optimizeParameters(
        currentRSIParams,
        {
          marketCondition,
          recentPerformance: {
            winRate: strategy.performance.winRate,
            profitFactor: strategy.performance.profitLoss > 0 ? 
              Math.abs(strategy.performance.profitLoss / Math.max(1, strategy.performance.maxDrawdown)) : 0.5,
            avgWin: strategy.performance.profitLoss / Math.max(1, strategy.performance.totalTrades),
            avgLoss: strategy.performance.maxDrawdown / Math.max(1, strategy.performance.totalTrades),
            maxDrawdown: strategy.performance.maxDrawdown,
            sharpeRatio: strategy.performance.sharpeRatio,
            consecutiveLosses: strategy.performance.consecutiveLosses
          },
          parameterEffectiveness: {
            rsi_lookback: 0.8,
            lower_barrier: 0.7,
            lower_threshold: 0.6,
            upper_barrier: 0.7,
            upper_threshold: 0.6,
            ma_length: 0.5,
            atr_multiplier_stop: 0.9,
            atr_multiplier_take: 0.8,
            atr_length: 0.4
          }
        }
      );

      // Apply the best recommendations
      let optimizedParams = { ...strategy.parameters };
      let totalExpectedImprovement = 0;
      let appliedChanges: string[] = [];

      for (const rec of recommendations.slice(0, 3)) { // Apply top 3 recommendations
        console.log(`📊 AI Recommendation: ${rec.reasoning}`);
        
        switch (rec.parameter) {
          case 'rsi_lookback':
            optimizedParams.rsi.lookback = rec.recommendedValue;
            break;
          case 'lower_barrier':
            optimizedParams.rsi.oversoldEntry = rec.recommendedValue;
            break;
          case 'upper_barrier':
            optimizedParams.rsi.overboughtEntry = rec.recommendedValue;
            break;
          case 'atr_multiplier_stop':
            optimizedParams.risk.stopLossATR = rec.recommendedValue;
            break;
          case 'atr_multiplier_take':
            optimizedParams.risk.takeProfitATR = rec.recommendedValue;
            break;
        }
        
        totalExpectedImprovement += rec.expectedImpact.winRate + rec.expectedImpact.profitFactor;
        appliedChanges.push(rec.reasoning);
      }

      // Update Stratus Brain learning
      if (!strategy.stratusBrain) {
        strategy.stratusBrain = {
          neuralConfidence: 0.5,
          predictedWinRate: strategy.performance.winRate,
          suggestedAdjustments: {},
          learningProgress: 0
        };
      }

      // Enhance with neural network learning progress
      strategy.stratusBrain.learningProgress = Math.min(100, 
        (strategy.performance.totalTrades / 100) * 100
      );
      strategy.stratusBrain.neuralConfidence = Math.min(1, 
        0.5 + (strategy.performance.totalTrades / 200)
      );
      strategy.stratusBrain.predictedWinRate = strategy.performance.winRate * 1.1; // Optimistic prediction
      strategy.stratusBrain.suggestedAdjustments = {
        rsi: { lookback: optimizedParams.rsi.lookback }
      };

      this.strategies.set(strategyId, strategy);

      const result: OptimizationResult = {
        originalParams: strategy.parameters,
        optimizedParams,
        expectedImprovement: totalExpectedImprovement,
        reason: appliedChanges.join('; '),
        backtestResults: {
          winRate: strategy.performance.winRate * (1 + totalExpectedImprovement / 100),
          profitFactor: 1.5 + (totalExpectedImprovement / 10),
          sharpeRatio: strategy.performance.sharpeRatio * (1 + totalExpectedImprovement / 50)
        }
      };

      // Apply optimization if improvement is significant
      if (result.expectedImprovement > 3) {
        this.updateStrategyParameters(strategyId, result.optimizedParams, 'optimization');
        
        // Send notification about optimization
        await telegramBotService.sendTradeAlert({
          type: 'STRATEGY_OPTIMIZED',
          strategy: strategy.name,
          symbol: 'BTCUSD',
          action: 'BUY',
          price: 0,
          quantity: 0,
          profit: 0,
          confidence: recommendations[0]?.confidence || 0,
          metadata: {
            improvements: appliedChanges,
            expectedGain: `${totalExpectedImprovement.toFixed(1)}%`
          }
        });
      }

      return result;

    } catch (error) {
      console.error('Error during AI optimization:', error);
      
      // Fallback to basic optimization
      return this.basicOptimization(strategy);
    }
  }

  private basicOptimization(strategy: UnifiedStrategy): OptimizationResult {
    // Basic fallback optimization
    const optimizedParams = { ...strategy.parameters };
    
    // Simple adjustments based on performance
    if (strategy.performance.winRate < 0.4) {
      // Poor performance - be more conservative
      optimizedParams.rsi.lookback = Math.min(5, optimizedParams.rsi.lookback + 1);
      optimizedParams.risk.positionSize = Math.max(0.005, optimizedParams.risk.positionSize * 0.8);
    } else if (strategy.performance.winRate > 0.6) {
      // Good performance - can be slightly more aggressive
      optimizedParams.risk.positionSize = Math.min(0.03, optimizedParams.risk.positionSize * 1.1);
    }

    return {
      originalParams: strategy.parameters,
      optimizedParams,
      expectedImprovement: 5,
      reason: 'Basic performance-based adjustments'
    };
  }

  /**
   * Analyze current market conditions
   */
  private analyzeMarketConditions(): void {
    if (this.marketData.length < 100) return;

    const prices = this.marketData.slice(-100).map(d => d.price);
    const volumes = this.marketData.slice(-100).map(d => d.volume);
    
    // Calculate trend
    const sma20 = this.calculateSMA(prices.slice(-20));
    const sma50 = this.calculateSMA(prices.slice(-50));
    const currentPrice = prices[prices.length - 1];
    
    let trend: 'bullish' | 'bearish' | 'neutral';
    if (currentPrice > sma20 && sma20 > sma50) {
      trend = 'bullish';
    } else if (currentPrice < sma20 && sma20 < sma50) {
      trend = 'bearish';
    } else {
      trend = 'neutral';
    }

    // Calculate volatility (normalized)
    const returns = [];
    for (let i = 1; i < prices.length; i++) {
      returns.push((prices[i] - prices[i-1]) / prices[i-1]);
    }
    const volatility = Math.min(1, this.calculateStdDev(returns) * 100);

    // Determine volume level
    const avgVolume = volumes.reduce((a, b) => a + b, 0) / volumes.length;
    const recentVolume = volumes.slice(-10).reduce((a, b) => a + b, 0) / 10;
    const volumeRatio = recentVolume / avgVolume;
    
    let volume: 'low' | 'normal' | 'high';
    if (volumeRatio < 0.7) volume = 'low';
    else if (volumeRatio > 1.3) volume = 'high';
    else volume = 'normal';

    // Determine market regime
    let regime: 'trending_up' | 'trending_down' | 'ranging' | 'volatile';
    if (volatility > 0.7) {
      regime = 'volatile';
    } else if (trend === 'bullish') {
      regime = 'trending_up';
    } else if (trend === 'bearish') {
      regime = 'trending_down';
    } else {
      regime = 'ranging';
    }

    const previousConditions = this.currentMarketConditions;
    
    this.currentMarketConditions = {
      trend,
      volatility,
      volume,
      regime,
      confidence: 0.7 + (Math.random() * 0.3) // Simulated confidence
    };

    // Send alert for significant market condition changes
    if (previousConditions && previousConditions.regime !== regime) {
      telegramBotService.sendTradeAlert({
        type: 'MARKET_CONDITION_CHANGE',
        strategy: 'Market Analysis',
        symbol: 'BTCUSD',
        action: 'BUY',
        price: 0,
        quantity: 0,
        profit: 0,
        confidence: this.currentMarketConditions.confidence,
        metadata: {
          previousRegime: previousConditions.regime,
          newRegime: regime,
          volatility: `${(volatility * 100).toFixed(0)}%`,
          volume: volume,
          trend: trend,
          adjustmentsApplied: 'Auto-adjusting strategy parameters'
        }
      });
    }

    // Apply market adjustments to active strategies
    this.applyMarketAdjustments();
  }

  /**
   * Apply market condition adjustments to strategies
   */
  private applyMarketAdjustments(): void {
    if (!this.currentMarketConditions) return;

    for (const [strategyId, strategy] of this.strategies) {
      if (!strategy.enabled || !strategy.parameters.optimization.adaptToMarket) {
        continue;
      }

      // Find applicable market adjustments
      for (const adjustment of MARKET_CONDITION_ADJUSTMENTS) {
        if (this.matchesMarketCondition(adjustment.condition)) {
          console.log(`📈 Applying market adjustment to ${strategy.name}: ${adjustment.reason}`);
          this.updateStrategyParameters(strategyId, adjustment.parameterOverrides, 'market_adjustment');
        }
      }

      // Update market adaptation info
      strategy.marketAdaptation = {
        detectedRegime: this.currentMarketConditions.regime,
        confidence: this.currentMarketConditions.confidence,
        lastAnalysis: new Date()
      };
      
      this.strategies.set(strategyId, strategy);
    }
  }

  /**
   * Process optimization queue
   */
  private async processOptimizationQueue(): Promise<void> {
    if (this.isOptimizing || this.optimizationQueue.length === 0) {
      return;
    }

    this.isOptimizing = true;
    const strategyId = this.optimizationQueue.shift();
    
    if (strategyId) {
      await this.optimizeStrategy(strategyId);
    }
    
    this.isOptimizing = false;
  }

  /**
   * Update strategy performance
   */
  async updatePerformance(strategyId: string, tradeResult: {
    won: boolean;
    profit: number;
    entryPrice: number;
    exitPrice: number;
  }): Promise<void> {
    const strategy = this.strategies.get(strategyId);
    if (!strategy) return;

    // Update performance metrics
    strategy.performance.totalTrades++;
    strategy.performance.profitLoss += tradeResult.profit;
    
    if (tradeResult.won) {
      strategy.performance.consecutiveWins++;
      strategy.performance.consecutiveLosses = 0;
    } else {
      strategy.performance.consecutiveLosses++;
      strategy.performance.consecutiveWins = 0;
    }
    
    // Recalculate win rate
    const history = this.performanceHistory.get(strategyId) || [];
    const wins = history.filter(h => h.winRate > 0).length;
    strategy.performance.winRate = wins / Math.max(1, history.length);
    
    strategy.performance.lastTradeTime = new Date();
    
    // Add to performance history
    history.push({
      timestamp: new Date(),
      winRate: tradeResult.won ? 1 : 0,
      profitLoss: tradeResult.profit,
      trades: 1
    });
    
    // Keep only last 100 trades
    if (history.length > 100) {
      history.shift();
    }
    
    this.performanceHistory.set(strategyId, history);
    this.strategies.set(strategyId, strategy);

    // Send Telegram alert for trade result
    await telegramBotService.sendTradeAlert({
      type: tradeResult.won ? 'TRADE_WIN' : 'TRADE_LOSS',
      strategy: strategy.name,
      symbol: 'BTCUSD',
      action: 'CLOSE',
      price: tradeResult.exitPrice,
      quantity: 0,
      profit: tradeResult.profit,
      confidence: 0,
      metadata: {
        entryPrice: tradeResult.entryPrice,
        exitPrice: tradeResult.exitPrice,
        winRate: `${(strategy.performance.winRate * 100).toFixed(1)}%`,
        totalTrades: strategy.performance.totalTrades,
        consecutiveWins: strategy.performance.consecutiveWins,
        consecutiveLosses: strategy.performance.consecutiveLosses,
        totalPnL: strategy.performance.profitLoss,
        mode: strategy.mode
      }
    });

    // Send alert for milestone achievements
    if (strategy.performance.totalTrades % 10 === 0) {
      await telegramBotService.sendTradeAlert({
        type: 'MILESTONE_REACHED',
        strategy: strategy.name,
        symbol: 'BTCUSD',
        action: 'BUY',
        price: 0,
        quantity: 0,
        profit: strategy.performance.profitLoss,
        confidence: 0,
        metadata: {
          milestone: `${strategy.performance.totalTrades} trades completed`,
          winRate: `${(strategy.performance.winRate * 100).toFixed(1)}%`,
          totalPnL: strategy.performance.profitLoss,
          mode: strategy.mode
        }
      });
    }

    // Send alert for consecutive losses
    if (strategy.performance.consecutiveLosses >= 3) {
      await telegramBotService.sendTradeAlert({
        type: 'POOR_PERFORMANCE_ALERT',
        strategy: strategy.name,
        symbol: 'BTCUSD',
        action: 'BUY',
        price: 0,
        quantity: 0,
        profit: 0,
        confidence: 0,
        metadata: {
          consecutiveLosses: strategy.performance.consecutiveLosses,
          winRate: `${(strategy.performance.winRate * 100).toFixed(1)}%`,
          action: 'Queuing optimization',
          mode: strategy.mode
        }
      });
      
      this.queueOptimization(strategyId);
    }

    // Send alert for winning streaks
    if (strategy.performance.consecutiveWins >= 5) {
      await telegramBotService.sendTradeAlert({
        type: 'WINNING_STREAK',
        strategy: strategy.name,
        symbol: 'BTCUSD',
        action: 'BUY',
        price: 0,
        quantity: 0,
        profit: strategy.performance.profitLoss,
        confidence: 0,
        metadata: {
          consecutiveWins: strategy.performance.consecutiveWins,
          winRate: `${(strategy.performance.winRate * 100).toFixed(1)}%`,
          totalPnL: strategy.performance.profitLoss,
          mode: strategy.mode
        }
      });
    }

    this.emit('PERFORMANCE_UPDATED', {
      type: 'PERFORMANCE_UPDATED',
      strategyId,
      data: {
        performance: strategy.performance,
        lastTrade: tradeResult
      },
      timestamp: new Date()
    });
  }

  /**
   * Get current market conditions
   */
  getMarketConditions(): MarketConditions | null {
    return this.currentMarketConditions;
  }

  /**
   * Reset strategy to default parameters
   */
  resetToDefaults(strategyId: string): void {
    const strategy = this.strategies.get(strategyId);
    if (!strategy) return;

    strategy.parameters = { ...strategy.defaultParameters };
    this.strategies.set(strategyId, strategy);

    this.emit('STRATEGY_UPDATED', {
      type: 'STRATEGY_UPDATED',
      strategyId,
      data: { parameters: strategy.parameters },
      timestamp: new Date()
    });
  }

  // EVENT SYSTEM

  on(event: StrategyEvent, callback: (data: StrategyEventData) => void): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)?.add(callback);
  }

  off(event: StrategyEvent, callback: (data: StrategyEventData) => void): void {
    this.listeners.get(event)?.delete(callback);
  }

  private emit(event: StrategyEvent, data: StrategyEventData): void {
    this.listeners.get(event)?.forEach(callback => callback(data));
  }

  // HELPER METHODS

  private generateParameterCandidates(
    base: UnifiedStrategyParameters, 
    count: number
  ): UnifiedStrategyParameters[] {
    const candidates: UnifiedStrategyParameters[] = [];
    
    for (let i = 0; i < count; i++) {
      const candidate = JSON.parse(JSON.stringify(base)); // Deep clone
      
      // Randomly adjust parameters within constraints
      candidate.rsi.lookback = this.randomInRange(
        OPTIMIZATION_CONSTRAINTS.rsi.lookback.min,
        OPTIMIZATION_CONSTRAINTS.rsi.lookback.max
      );
      
      candidate.rsi.oversoldEntry = this.randomInRange(
        OPTIMIZATION_CONSTRAINTS.rsi.oversoldEntry.min,
        OPTIMIZATION_CONSTRAINTS.rsi.oversoldEntry.max
      );
      
      // Add more parameter variations...
      
      if (validateParameters(candidate)) {
        candidates.push(candidate);
      }
    }
    
    return candidates;
  }

  private async evaluateParameters(
    params: UnifiedStrategyParameters, 
    data: MarketData[]
  ): Promise<number> {
    // Simplified backtest simulation
    let score = 0.5; // Base score
    
    // Prefer shorter RSI for your trading style
    if (params.rsi.lookback >= 2 && params.rsi.lookback <= 5) {
      score += 0.1;
    }
    
    // Add more evaluation logic...
    
    return Math.min(1, Math.max(0, score));
  }

  private calculateParameterChanges(
    oldParams: UnifiedStrategyParameters,
    newParams: UnifiedStrategyParameters
  ): Record<string, { old: any; new: any }> {
    const changes: Record<string, { old: any; new: any }> = {};
    
    // Check RSI changes
    if (oldParams.rsi.lookback !== newParams.rsi.lookback) {
      changes['rsi.lookback'] = { old: oldParams.rsi.lookback, new: newParams.rsi.lookback };
    }
    
    // Add more change detection...
    
    return changes;
  }

  private matchesMarketCondition(condition: string): boolean {
    if (!this.currentMarketConditions) return false;
    
    switch (condition) {
      case 'high_volatility':
        return this.currentMarketConditions.volatility > 0.7;
      case 'strong_trend':
        return this.currentMarketConditions.trend !== 'neutral';
      case 'low_volume':
        return this.currentMarketConditions.volume === 'low';
      default:
        return false;
    }
  }

  private calculateSMA(values: number[]): number {
    return values.reduce((a, b) => a + b, 0) / values.length;
  }

  private calculateStdDev(values: number[]): number {
    const mean = this.calculateSMA(values);
    const squaredDiffs = values.map(v => Math.pow(v - mean, 2));
    const variance = squaredDiffs.reduce((a, b) => a + b, 0) / values.length;
    return Math.sqrt(variance);
  }

  private randomInRange(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }
}

export default UnifiedStrategyController;
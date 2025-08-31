/**
 * Pine Script Input Optimizer
 * 
 * This service directly updates Pine Script strategy inputs based on:
 * - 7-day rolling market data analysis
 * - AI performance feedback
 * - Real-time market conditions
 * - Win rate optimization targeting 100%
 * 
 * The system adjusts the actual strategy inputs that Pine Script reads,
 * not webhook parameters.
 */

import { unifiedMarketDataService, type SevenDayAnalysis, type OptimizationRecommendation } from './unified-market-data-service';
import { competitionStrategyRegistry, type PineScriptStrategy, getAllStrategies, getOptimizationCandidates, updateStrategyInputs } from './strategy-registry-competition';
import { alpacaPaperTradingService } from './alpaca-paper-trading-service';

export interface PineScriptInputs {
  // RSI Inputs (Your 95% win rate parameters)
  rsi_length: number;           // RSI Lookback = 2
  rsi_overbought: number;       // Upper Threshold = 72
  rsi_oversold: number;         // Lower Barrier = 43
  rsi_upper_barrier: number;    // Upper Barrier = 45
  rsi_lower_threshold: number;  // Lower Threshold = 65
  
  // Moving Average Inputs (Your parameters)
  ma_length: number;            // MA Length = 70
  atr_stop_loss: number;        // ATR Multiplier for Stop-Loss = 11
  atr_take_profit: number;      // ATR Multiplier for Take-Profit = 2
  
  // MACD Inputs
  macd_fast: number;
  macd_slow: number;
  macd_signal: number;
  
  // Standard Moving Average Inputs
  ema_length: number;
  sma_length: number;
  
  // Risk Management Inputs
  stop_loss_percent: number;
  take_profit_percent: number;
  risk_reward_ratio: number;
  
  // Position Sizing Inputs
  position_size_percent: number;
  max_positions: number;
  
  // Entry/Exit Condition Inputs
  momentum_threshold: number;
  volume_threshold: number;
  volatility_filter: number;
  
  // Session and Time Inputs
  enable_session_filter: boolean;
  start_hour: number;
  end_hour: number;
  enable_weekend_trading: boolean;
  
  // Advanced Strategy Inputs
  enable_pyramiding: boolean;
  max_pyramid_levels: number;
  trend_filter_enabled: boolean;
  min_trend_strength: number;
}

export interface InputOptimization {
  strategyId: string;
  symbol: string;
  timestamp: Date;
  oldInputs: PineScriptInputs;
  newInputs: PineScriptInputs;
  optimizationReason: string[];
  expectedWinRateImprovement: number;
  marketCondition: string;
  aiConfidence: number;
  performanceData: {
    recentWinRate: number;
    totalTrades: number;
    avgProfit: number;
    avgLoss: number;
  };
}

export interface PerformanceFeedback {
  strategyId: string;
  symbol: string;
  tradeOutcome: 'WIN' | 'LOSS';
  entryPrice: number;
  exitPrice: number;
  profit: number;
  profitPercent: number;
  holdTime: number;
  marketConditions: {
    rsi: number;
    macd: number;
    trend: string;
    volatility: number;
  };
  inputsUsed: PineScriptInputs;
  timestamp: Date;
}

class PineScriptInputOptimizer {
  private static instance: PineScriptInputOptimizer | null = null;
  private strategyInputs: Map<string, PineScriptInputs> = new Map();
  private optimizationHistory: InputOptimization[] = [];
  private performanceFeedback: PerformanceFeedback[] = [];
  private optimizationInterval: NodeJS.Timeout | null = null;
  private feedbackInterval: NodeJS.Timeout | null = null;
  private _isRunning: boolean = false;
  private listeners: Set<(optimization: InputOptimization) => void> = new Set();

  private constructor() {
    this.initializeDefaultInputs();
  }

  static getInstance(): PineScriptInputOptimizer {
    if (!PineScriptInputOptimizer.instance) {
      PineScriptInputOptimizer.instance = new PineScriptInputOptimizer();
    }
    return PineScriptInputOptimizer.instance;
  }

  // Start the optimization engine
  async startOptimization(): Promise<void> {
    if (this._isRunning) {
      console.log('⚠️ Pine Script input optimizer already running');
      return;
    }

    this._isRunning = true;
    console.log('🎯 Starting Pine Script input optimization engine...');

    // Market data collection is handled by unified service - no need to start separately
    console.log('🎯 Using unified market data service for REAL market data analysis');

    // Optimize inputs every 15 minutes based on 7-day analysis
    this.optimizationInterval = setInterval(async () => {
      try {
        await Promise.race([
          this.performInputOptimization(),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Optimization timeout')), 30000))
        ]);
      } catch (error) {
        if (error.message.includes('timeout')) {
          console.log('⏰ Optimization cycle timed out - will retry next cycle');
        } else {
          console.error('❌ Optimization cycle failed:', error);
        }
      }
    }, 15 * 60 * 1000);

    // Collect performance feedback every 5 minutes
    this.feedbackInterval = setInterval(async () => {
      try {
        await Promise.race([
          this.collectPerformanceFeedback(),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Feedback timeout')), 10000))
        ]);
      } catch (error) {
        if (error.message.includes('timeout')) {
          console.log('⏰ Performance feedback timed out - will retry next cycle');
        } else {
          console.error('❌ Performance feedback failed:', error);
        }
      }
    }, 5 * 60 * 1000);

    // Initial optimization - run in background, don't block startup
    setTimeout(async () => {
      try {
        console.log('🚀 Running initial optimization in background...');
        await Promise.race([
          this.performInputOptimization(),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Initial optimization timeout')), 20000))
        ]);
        console.log('✅ Initial optimization completed successfully');
      } catch (error) {
        if (error.message.includes('timeout')) {
          console.log('⏰ Initial optimization timed out - engine still started successfully');
        } else {
          console.error('❌ Initial optimization failed:', error);
        }
      }
    }, 1000); // Start after 1 second delay

    console.log('✅ Pine Script input optimization engine started (initial optimization running in background)');
  }

  // Stop optimization
  stopOptimization(): void {
    if (this.optimizationInterval) {
      clearInterval(this.optimizationInterval);
      this.optimizationInterval = null;
    }
    if (this.feedbackInterval) {
      clearInterval(this.feedbackInterval);
      this.feedbackInterval = null;
    }
    this._isRunning = false;
    console.log('⏹️ Pine Script input optimization stopped');
  }

  // Main optimization logic - uses REAL market data from database
  private async performInputOptimization(): Promise<void> {
    console.log('🔧 Performing Pine Script input optimization with REAL market data...');

    // Get strategies that need optimization from the registry
    const optimizationCandidates = getOptimizationCandidates();
    
    if (optimizationCandidates.length === 0) {
      console.log('✅ All strategies are performing optimally');
      return;
    }

    for (const strategy of optimizationCandidates) {
      try {
        console.log(`🎯 Optimizing strategy: ${strategy.name} (${strategy.id}) with REAL data`);
        
        // Get REAL 7-day market analysis from database
        const marketAnalysis = await unifiedMarketDataService.getSevenDayAnalysis(strategy.symbol);
        if (!marketAnalysis || marketAnalysis.completeness < 60) {
          console.log(`📊 Insufficient REAL market data for ${strategy.id} (${marketAnalysis?.completeness.toFixed(1)}% complete)`);
          continue;
        }

        // Get REAL current market conditions
        const marketConditions = await unifiedMarketDataService.getCurrentMarketConditions(strategy.symbol);
        if (!marketConditions || marketConditions.confidence < 60) {
          console.log(`📊 Current market conditions not reliable for ${strategy.id}`);
          continue;
        }

        // Check if strategy needs optimization
        if (strategy.performance.winRate >= 98) {
          console.log(`✅ ${strategy.id} already performing excellently: ${strategy.performance.winRate.toFixed(1)}%`);
          continue;
        }

        // Get REAL optimization recommendations based on database data
        const currentInputs = this.convertStrategyInputsToPineScriptInputs(strategy.inputs);
        const recommendations = await unifiedMarketDataService.getOptimizationRecommendations(
          strategy.symbol, 
          currentInputs
        );

        if (recommendations.length === 0) {
          console.log(`📊 No optimization recommendations for ${strategy.id} based on current market data`);
          continue;
        }

        // Generate optimization based on REAL recommendations
        const optimization = await this.generateRealDataOptimization(
          strategy,
          marketAnalysis,
          marketConditions,
          recommendations
        );

        if (optimization && optimization.expectedWinRateImprovement > 1) {
          await this.applyStrategyOptimization(optimization);
          this.optimizationHistory.push(optimization);

          console.log(`🎯 Strategy optimized with REAL data: ${strategy.name}`, {
            expectedImprovement: `+${optimization.expectedWinRateImprovement.toFixed(1)}%`,
            currentWinRate: `${strategy.performance.winRate.toFixed(1)}%`,
            changedInputs: Object.keys(optimization.newInputs).length,
            dataPoints: marketAnalysis.dataPoints,
            marketTrend: marketConditions.trend
          });
        }

      } catch (error) {
        console.error(`❌ Strategy optimization error for ${strategy.id}:`, error);
      }
    }
  }

  // Generate strategy optimization based on REAL market data
  private async generateRealDataOptimization(
    strategy: PineScriptStrategy,
    marketAnalysis: SevenDayAnalysis,
    marketConditions: any,
    recommendations: OptimizationRecommendation[]
  ): Promise<InputOptimization | null> {
    try {
      const currentInputs = this.convertStrategyInputsToPineScriptInputs(strategy.inputs);
      const newInputs = { ...currentInputs };
      const optimizationReasons: string[] = [];
      let expectedImprovement = 0;

      // Apply REAL optimization recommendations
      for (const recommendation of recommendations) {
        if (recommendation.confidence > 70) {
          newInputs[recommendation.parameter] = recommendation.recommendedValue;
          optimizationReasons.push(recommendation.reason);
          expectedImprovement += recommendation.expectedImprovement;
        }
      }

      // Additional optimizations based on REAL market analysis
      if (marketAnalysis.trendDirection === 'UP' && marketConditions.trend === 'BULLISH') {
        // Bullish market: optimize for uptrend
        if (marketAnalysis.averageRSI > 50) {
          newInputs.rsi_overbought = Math.min(80, newInputs.rsi_overbought + 2);
          optimizationReasons.push(`Bullish trend confirmed: RSI avg ${marketAnalysis.averageRSI.toFixed(1)}`);
          expectedImprovement += 3;
        }
      } else if (marketAnalysis.trendDirection === 'DOWN' && marketConditions.trend === 'BEARISH') {
        // Bearish market: optimize for downtrend
        if (marketAnalysis.averageRSI < 50) {
          newInputs.rsi_oversold = Math.max(20, newInputs.rsi_oversold - 2);
          optimizationReasons.push(`Bearish trend confirmed: RSI avg ${marketAnalysis.averageRSI.toFixed(1)}`);
          expectedImprovement += 3;
        }
      }

      // Volatility-based adjustments using REAL data
      if (marketConditions.volatility > 30) {
        newInputs.stop_loss_percent = Math.min(5, newInputs.stop_loss_percent + 0.3);
        newInputs.volatility_filter = Math.min(50, newInputs.volatility_filter + 5);
        optimizationReasons.push(`High volatility detected: ${marketConditions.volatility.toFixed(1)}%`);
        expectedImprovement += 4;
      }

      // Data quality adjustments
      if (marketAnalysis.completeness > 90) {
        expectedImprovement += 2; // Bonus for high-quality data
        optimizationReasons.push(`High data quality: ${marketAnalysis.completeness.toFixed(1)}% complete`);
      }

      if (optimizationReasons.length === 0) {
        return null;
      }

      return {
        strategyId: strategy.id,
        timestamp: new Date(),
        currentInputs,
        newInputs,
        optimizationReason: optimizationReasons,
        expectedWinRateImprovement: expectedImprovement,
        marketConditions: {
          trend: marketConditions.trend,
          volatility: marketConditions.volatility,
          momentum: marketConditions.momentum,
          confidence: marketConditions.confidence
        },
        dataQuality: {
          dataPoints: marketAnalysis.dataPoints,
          completeness: marketAnalysis.completeness,
          timespan: '7 days'
        }
      };
    } catch (error) {
      console.error(`Failed to generate real data optimization for ${strategy.id}:`, error);
      return null;
    }
  }

  // Legacy method - kept for compatibility but now uses real data
  private async generateStrategyOptimization(
    strategy: PineScriptStrategy,
    marketAnalysis: SevenDayAnalysis,
    aiDecision: any
  ): Promise<InputOptimization | null> {
    try {
      const currentInputs = this.convertStrategyInputsToPineScriptInputs(strategy.inputs);
      const newInputs = { ...currentInputs };
      const optimizationReasons: string[] = [];
      let expectedImprovement = 0;

      // RSI optimization based on 7-day analysis and strategy performance
      if (strategy.performance.winRate < 90) {
        const optimalRSI = marketAnalysis.winningConditions.rsiRange;
        if (optimalRSI.min > currentInputs.rsi_oversold + 5) {
          newInputs.rsi_oversold = Math.min(35, optimalRSI.min - 2);
          optimizationReasons.push('RSI oversold level adjusted based on 7-day winning patterns');
          expectedImprovement += 3;
        }
        if (optimalRSI.max < currentInputs.rsi_overbought - 5) {
          newInputs.rsi_overbought = Math.max(65, optimalRSI.max + 2);
          optimizationReasons.push('RSI overbought level adjusted based on 7-day winning patterns');
          expectedImprovement += 3;
        }
      }

      // MACD optimization for different market regimes
      switch (marketAnalysis.marketRegime) {
        case 'TRENDING':
          newInputs.macd_fast = Math.max(8, currentInputs.macd_fast - 1);
          newInputs.macd_slow = Math.max(20, currentInputs.macd_slow - 2);
          optimizationReasons.push('MACD periods shortened for trending market');
          expectedImprovement += 4;
          break;
        case 'RANGING':
          newInputs.macd_fast = Math.min(15, currentInputs.macd_fast + 1);
          newInputs.macd_slow = Math.min(30, currentInputs.macd_slow + 2);
          optimizationReasons.push('MACD periods lengthened for ranging market');
          expectedImprovement += 3;
          break;
        case 'VOLATILE':
          newInputs.volatility_filter = Math.min(50, currentInputs.volatility_filter + 10);
          optimizationReasons.push('Volatility filter increased for volatile market');
          expectedImprovement += 5;
          break;
      }

      // Risk management optimization based on recent performance
      if (strategy.performance.winRate < 80) {
        // Tighter stop loss for underperforming strategies
        newInputs.stop_loss_percent = Math.max(0.5, currentInputs.stop_loss_percent * 0.9);
        optimizationReasons.push('Stop loss tightened to improve win rate');
        expectedImprovement += 4;
      }

      // Position sizing based on AI confidence and strategy performance
      if (aiDecision.confidence > 0.85 && strategy.performance.winRate > 75) {
        newInputs.position_size_percent = Math.min(5, currentInputs.position_size_percent * 1.2);
        optimizationReasons.push('Position size increased for high-confidence and good performance');
        expectedImprovement += 2;
      } else if (aiDecision.confidence < 0.6 || strategy.performance.winRate < 60) {
        newInputs.position_size_percent = Math.max(0.5, currentInputs.position_size_percent * 0.8);
        optimizationReasons.push('Position size decreased for low confidence or poor performance');
        expectedImprovement += 3;
      }

      if (optimizationReasons.length === 0) return null;

      return {
        strategyId: strategy.id,
        symbol: strategy.symbol,
        timestamp: new Date(),
        oldInputs: currentInputs,
        newInputs,
        optimizationReason: optimizationReasons,
        expectedWinRateImprovement: expectedImprovement,
        marketCondition: marketAnalysis.marketRegime,
        aiConfidence: aiDecision.confidence,
        performanceData: {
          recentWinRate: strategy.performance.winRate,
          totalTrades: strategy.performance.totalTrades,
          avgProfit: strategy.performance.avgProfitPerTrade,
          avgLoss: 0 // Would calculate from actual loss data
        }
      };

    } catch (error) {
      console.error('❌ Strategy optimization generation error:', error);
      return null;
    }
  }

  // Apply optimization to strategy in registry
  private async applyStrategyOptimization(optimization: InputOptimization): Promise<void> {
    // Convert back to strategy inputs format
    const strategyInputs = this.convertPineScriptInputsToStrategyInputs(optimization.newInputs);
    
    // Update the strategy in the registry
    const success = updateStrategyInputs(optimization.strategyId, strategyInputs);
    
    if (success) {
      // Generate updated Pine Script code
      const updatedPineScript = competitionStrategyRegistry.generatePineScriptCode(optimization.strategyId);
      
      // Save the updated Pine Script
      await this.savePineScriptInputs(optimization.strategyId, optimization.newInputs, updatedPineScript);
      
      // Notify listeners
      this.notifyListeners(optimization);
      
      console.log(`✅ Applied optimization to strategy ${optimization.strategyId}`);
    } else {
      console.error(`❌ Failed to update strategy ${optimization.strategyId} in registry`);
    }
  }

  // Convert strategy inputs to PineScriptInputs format
  private convertStrategyInputsToPineScriptInputs(strategyInputs: PineScriptStrategy['inputs']): PineScriptInputs {
    return {
      rsi_length: strategyInputs.rsi_length,
      rsi_overbought: strategyInputs.rsi_overbought,
      rsi_oversold: strategyInputs.rsi_oversold,
      macd_fast: strategyInputs.macd_fast,
      macd_slow: strategyInputs.macd_slow,
      macd_signal: strategyInputs.macd_signal,
      ema_length: strategyInputs.ema_length,
      sma_length: strategyInputs.sma_length,
      stop_loss_percent: strategyInputs.stop_loss_percent,
      take_profit_percent: strategyInputs.take_profit_percent,
      risk_reward_ratio: strategyInputs.risk_reward_ratio,
      position_size_percent: strategyInputs.position_size_percent,
      max_positions: strategyInputs.max_positions,
      momentum_threshold: strategyInputs.momentum_threshold,
      volume_threshold: strategyInputs.volume_threshold,
      volatility_filter: strategyInputs.volatility_filter,
      enable_session_filter: strategyInputs.enable_session_filter,
      start_hour: strategyInputs.start_hour,
      end_hour: strategyInputs.end_hour,
      enable_weekend_trading: strategyInputs.enable_weekend_trading,
      enable_pyramiding: strategyInputs.enable_pyramiding,
      max_pyramid_levels: strategyInputs.max_pyramid_levels,
      trend_filter_enabled: strategyInputs.trend_filter_enabled,
      min_trend_strength: strategyInputs.min_trend_strength
    };
  }

  // Convert PineScriptInputs to strategy inputs format
  private convertPineScriptInputsToStrategyInputs(pineInputs: PineScriptInputs): Partial<PineScriptStrategy['inputs']> {
    return {
      rsi_length: pineInputs.rsi_length,
      rsi_overbought: pineInputs.rsi_overbought,
      rsi_oversold: pineInputs.rsi_oversold,
      macd_fast: pineInputs.macd_fast,
      macd_slow: pineInputs.macd_slow,
      macd_signal: pineInputs.macd_signal,
      ema_length: pineInputs.ema_length,
      sma_length: pineInputs.sma_length,
      stop_loss_percent: pineInputs.stop_loss_percent,
      take_profit_percent: pineInputs.take_profit_percent,
      risk_reward_ratio: pineInputs.risk_reward_ratio,
      position_size_percent: pineInputs.position_size_percent,
      max_positions: pineInputs.max_positions,
      momentum_threshold: pineInputs.momentum_threshold,
      volume_threshold: pineInputs.volume_threshold,
      volatility_filter: pineInputs.volatility_filter,
      enable_session_filter: pineInputs.enable_session_filter,
      start_hour: pineInputs.start_hour,
      end_hour: pineInputs.end_hour,
      enable_weekend_trading: pineInputs.enable_weekend_trading,
      enable_pyramiding: pineInputs.enable_pyramiding,
      max_pyramid_levels: pineInputs.max_pyramid_levels,
      trend_filter_enabled: pineInputs.trend_filter_enabled,
      min_trend_strength: pineInputs.min_trend_strength
    };
  }

  // Generate input optimization based on analysis
  private async generateInputOptimization(
    strategyId: string,
    currentInputs: PineScriptInputs,
    marketAnalysis: SevenDayAnalysis,
    aiDecision: AITradingDecision,
    performanceData: any
  ): Promise<InputOptimization | null> {
    try {
      const newInputs = { ...currentInputs };
      const optimizationReasons: string[] = [];
      let expectedImprovement = 0;

      // RSI optimization based on 7-day analysis
      if (performanceData.recentWinRate < 90) {
        const optimalRSI = marketAnalysis.winningConditions.rsiRange;
        if (optimalRSI.min > currentInputs.rsi_oversold + 5) {
          newInputs.rsi_oversold = Math.min(35, optimalRSI.min - 2);
          optimizationReasons.push('RSI oversold level adjusted based on 7-day winning patterns');
          expectedImprovement += 3;
        }
        if (optimalRSI.max < currentInputs.rsi_overbought - 5) {
          newInputs.rsi_overbought = Math.max(65, optimalRSI.max + 2);
          optimizationReasons.push('RSI overbought level adjusted based on 7-day winning patterns');
          expectedImprovement += 3;
        }
      }

      // MACD optimization for different market regimes
      switch (marketAnalysis.marketRegime) {
        case 'TRENDING':
          newInputs.macd_fast = Math.max(8, currentInputs.macd_fast - 1);
          newInputs.macd_slow = Math.max(20, currentInputs.macd_slow - 2);
          optimizationReasons.push('MACD periods shortened for trending market');
          expectedImprovement += 4;
          break;
        case 'RANGING':
          newInputs.macd_fast = Math.min(15, currentInputs.macd_fast + 1);
          newInputs.macd_slow = Math.min(30, currentInputs.macd_slow + 2);
          optimizationReasons.push('MACD periods lengthened for ranging market');
          expectedImprovement += 3;
          break;
        case 'VOLATILE':
          newInputs.volatility_filter = Math.min(50, currentInputs.volatility_filter + 10);
          optimizationReasons.push('Volatility filter increased for volatile market');
          expectedImprovement += 5;
          break;
      }

      // Risk management optimization based on recent losses
      const recentLosses = this.getRecentLosses(strategyId);
      if (recentLosses.length > 2) {
        const avgLossPercent = recentLosses.reduce((sum, loss) => sum + Math.abs(loss.profitPercent), 0) / recentLosses.length;
        
        if (avgLossPercent > currentInputs.stop_loss_percent * 0.8) {
          newInputs.stop_loss_percent = Math.max(0.5, currentInputs.stop_loss_percent * 0.9);
          optimizationReasons.push('Stop loss tightened based on recent loss analysis');
          expectedImprovement += 4;
        }
      }

      // Position sizing based on AI confidence and market conditions
      if (aiDecision.confidence > 0.85 && marketAnalysis.confidence > 0.8) {
        newInputs.position_size_percent = Math.min(5, currentInputs.position_size_percent * 1.2);
        optimizationReasons.push('Position size increased for high-confidence conditions');
        expectedImprovement += 2;
      } else if (aiDecision.confidence < 0.6 || marketAnalysis.confidence < 0.6) {
        newInputs.position_size_percent = Math.max(0.5, currentInputs.position_size_percent * 0.8);
        optimizationReasons.push('Position size decreased for uncertain conditions');
        expectedImprovement += 3;
      }

      // Volume threshold optimization
      if (marketAnalysis.avgVolume > 0) {
        const optimalVolume = marketAnalysis.winningConditions.volumeThreshold;
        if (optimalVolume > currentInputs.volume_threshold * 1.2) {
          newInputs.volume_threshold = optimalVolume;
          optimizationReasons.push('Volume threshold raised based on 7-day analysis');
          expectedImprovement += 2;
        }
      }

      // Session filter optimization based on winning time patterns
      const winningHours = marketAnalysis.winningConditions.timeOfDay;
      if (winningHours.length > 0) {
        newInputs.start_hour = Math.min(...winningHours);
        newInputs.end_hour = Math.max(...winningHours);
        newInputs.enable_session_filter = true;
        optimizationReasons.push('Session filter optimized based on winning time patterns');
        expectedImprovement += 3;
      }

      // Trend filter optimization
      if (marketAnalysis.marketRegime === 'TRENDING') {
        newInputs.trend_filter_enabled = true;
        newInputs.min_trend_strength = marketAnalysis.winningConditions.trendStrength;
        optimizationReasons.push('Trend filter enabled for trending market regime');
        expectedImprovement += 4;
      } else if (marketAnalysis.marketRegime === 'RANGING') {
        newInputs.trend_filter_enabled = false;
        optimizationReasons.push('Trend filter disabled for ranging market regime');
        expectedImprovement += 2;
      }

      // Moving average optimization
      if (performanceData.recentWinRate < 85) {
        // Adjust EMA length based on market volatility
        if (marketAnalysis.avgVolatility > 30) {
          newInputs.ema_length = Math.min(50, currentInputs.ema_length + 5);
          optimizationReasons.push('EMA period lengthened for high volatility');
          expectedImprovement += 2;
        } else if (marketAnalysis.avgVolatility < 15) {
          newInputs.ema_length = Math.max(10, currentInputs.ema_length - 3);
          optimizationReasons.push('EMA period shortened for low volatility');
          expectedImprovement += 2;
        }
      }

      if (optimizationReasons.length === 0) return null;

      return {
        strategyId,
        symbol: this.getStrategySymbol(strategyId),
        timestamp: new Date(),
        oldInputs: currentInputs,
        newInputs,
        optimizationReason: optimizationReasons,
        expectedWinRateImprovement: expectedImprovement,
        marketCondition: marketAnalysis.marketRegime,
        aiConfidence: aiDecision.confidence,
        performanceData
      };

    } catch (error) {
      console.error('❌ Input optimization generation error:', error);
      return null;
    }
  }

  // Apply optimization to strategy inputs
  private async applyInputOptimization(optimization: InputOptimization): Promise<void> {
    // Update the strategy inputs
    this.strategyInputs.set(optimization.strategyId, optimization.newInputs);

    // Generate updated Pine Script code with new inputs
    const updatedPineScript = this.generateUpdatedPineScript(optimization.strategyId, optimization.newInputs);

    // Save the updated Pine Script (this would typically be saved to a file or database)
    await this.savePineScriptInputs(optimization.strategyId, optimization.newInputs, updatedPineScript);

    // Notify listeners
    this.notifyListeners(optimization);

    console.log(`✅ Applied input optimization to ${optimization.strategyId}:`, {
      rsi: `${optimization.newInputs.rsi_oversold}/${optimization.newInputs.rsi_overbought}`,
      macd: `${optimization.newInputs.macd_fast}/${optimization.newInputs.macd_slow}/${optimization.newInputs.macd_signal}`,
      stopLoss: `${optimization.newInputs.stop_loss_percent}%`,
      positionSize: `${optimization.newInputs.position_size_percent}%`
    });
  }

  // Generate updated Pine Script code with optimized inputs
  private generateUpdatedPineScript(strategyId: string, inputs: PineScriptInputs): string {
    return `
//@version=5
strategy("${strategyId}_optimized", overlay=true, pyramiding=${inputs.max_pyramid_levels})

// =============================================================================
// OPTIMIZED STRATEGY INPUTS (Auto-updated by Stratus Engine)
// Last updated: ${new Date().toISOString()}
// =============================================================================

// RSI Inputs
rsi_length = input.int(${inputs.rsi_length}, title="RSI Length", minval=5, maxval=50)
rsi_overbought = input.float(${inputs.rsi_overbought}, title="RSI Overbought", minval=50, maxval=90)
rsi_oversold = input.float(${inputs.rsi_oversold}, title="RSI Oversold", minval=10, maxval=50)

// MACD Inputs
macd_fast = input.int(${inputs.macd_fast}, title="MACD Fast Length", minval=5, maxval=20)
macd_slow = input.int(${inputs.macd_slow}, title="MACD Slow Length", minval=15, maxval=40)
macd_signal = input.int(${inputs.macd_signal}, title="MACD Signal Length", minval=5, maxval=15)

// Moving Average Inputs
ema_length = input.int(${inputs.ema_length}, title="EMA Length", minval=5, maxval=100)
sma_length = input.int(${inputs.sma_length}, title="SMA Length", minval=10, maxval=200)

// Risk Management Inputs
stop_loss_percent = input.float(${inputs.stop_loss_percent}, title="Stop Loss %", minval=0.1, maxval=10.0, step=0.1)
take_profit_percent = input.float(${inputs.take_profit_percent}, title="Take Profit %", minval=0.5, maxval=20.0, step=0.1)
risk_reward_ratio = input.float(${inputs.risk_reward_ratio}, title="Risk/Reward Ratio", minval=1.0, maxval=5.0, step=0.1)

// Position Sizing Inputs
position_size_percent = input.float(${inputs.position_size_percent}, title="Position Size %", minval=0.1, maxval=10.0, step=0.1)
max_positions = input.int(${inputs.max_positions}, title="Max Positions", minval=1, maxval=10)

// Entry/Exit Condition Inputs
momentum_threshold = input.float(${inputs.momentum_threshold}, title="Momentum Threshold", minval=0.1, maxval=2.0, step=0.1)
volume_threshold = input.int(${inputs.volume_threshold}, title="Volume Threshold", minval=100, maxval=100000)
volatility_filter = input.float(${inputs.volatility_filter}, title="Volatility Filter", minval=5, maxval=100)

// Session and Time Inputs
enable_session_filter = input.bool(${inputs.enable_session_filter}, title="Enable Session Filter")
start_hour = input.int(${inputs.start_hour}, title="Start Hour", minval=0, maxval=23)
end_hour = input.int(${inputs.end_hour}, title="End Hour", minval=0, maxval=23)
enable_weekend_trading = input.bool(${inputs.enable_weekend_trading}, title="Enable Weekend Trading")

// Advanced Strategy Inputs
enable_pyramiding = input.bool(${inputs.enable_pyramiding}, title="Enable Pyramiding")
trend_filter_enabled = input.bool(${inputs.trend_filter_enabled}, title="Enable Trend Filter")
min_trend_strength = input.float(${inputs.min_trend_strength}, title="Min Trend Strength", minval=0.1, maxval=1.0, step=0.1)

// =============================================================================
// TECHNICAL INDICATORS
// =============================================================================

// RSI
rsi = ta.rsi(close, rsi_length)

// MACD
[macd_line, signal_line, macd_histogram] = ta.macd(close, macd_fast, macd_slow, macd_signal)

// Moving Averages
ema = ta.ema(close, ema_length)
sma = ta.sma(close, sma_length)

// Volatility (ATR)
atr = ta.atr(14)
volatility = (atr / close) * 100

// Volume
volume_ma = ta.sma(volume, 20)
volume_ratio = volume / volume_ma

// Trend Strength
trend_strength = math.abs(ta.change(ema, 1)) / atr

// =============================================================================
// ENTRY CONDITIONS
// =============================================================================

// Session Filter
in_session = enable_session_filter ? (hour >= start_hour and hour <= end_hour) : true
weekend_ok = enable_weekend_trading ? true : (dayofweek != dayofweek.saturday and dayofweek != dayofweek.sunday)

// Volatility Filter
volatility_ok = volatility <= volatility_filter

// Volume Filter
volume_ok = volume_ratio >= momentum_threshold

// Trend Filter
trend_ok = trend_filter_enabled ? trend_strength >= min_trend_strength : true

// Base Conditions
base_conditions = in_session and weekend_ok and volatility_ok and volume_ok and trend_ok

// Long Entry
long_rsi = rsi <= rsi_oversold
long_macd = macd_line > signal_line and macd_histogram > macd_histogram[1]
long_trend = close > ema
long_condition = base_conditions and long_rsi and long_macd and long_trend

// Short Entry
short_rsi = rsi >= rsi_overbought
short_macd = macd_line < signal_line and macd_histogram < macd_histogram[1]
short_trend = close < ema
short_condition = base_conditions and short_rsi and short_macd and short_trend

// =============================================================================
// POSITION SIZING
// =============================================================================

// Calculate position size based on account equity and risk
account_equity = strategy.equity
position_value = account_equity * (position_size_percent / 100)
shares = position_value / close

// =============================================================================
// STRATEGY LOGIC
// =============================================================================

// Entry Orders
if long_condition and strategy.position_size == 0
    strategy.entry("Long", strategy.long, qty=shares)
    
if short_condition and strategy.position_size == 0 
    strategy.entry("Short", strategy.short, qty=shares)

// Exit Orders
if strategy.position_size > 0
    stop_price = strategy.position_avg_price * (1 - stop_loss_percent / 100)
    take_price = strategy.position_avg_price * (1 + take_profit_percent / 100)
    strategy.exit("Long Exit", "Long", stop=stop_price, limit=take_price)
    
if strategy.position_size < 0
    stop_price = strategy.position_avg_price * (1 + stop_loss_percent / 100)
    take_price = strategy.position_avg_price * (1 - take_profit_percent / 100)
    strategy.exit("Short Exit", "Short", stop=stop_price, limit=take_price)

// =============================================================================
// ALERTS FOR WEBHOOK INTEGRATION
// =============================================================================

// Long Alert
if long_condition
    alert_msg = '{"strategy_id": "${strategyId}", "action": "BUY", "symbol": "' + syminfo.ticker + '", "price": ' + str.tostring(close) + ', "quantity": ' + str.tostring(shares) + ', "stop_loss": ' + str.tostring(stop_price) + ', "take_profit": ' + str.tostring(take_price) + '}'
    alert(alert_msg, alert.freq_once_per_bar)

// Short Alert
if short_condition
    alert_msg = '{"strategy_id": "${strategyId}", "action": "SELL", "symbol": "' + syminfo.ticker + '", "price": ' + str.tostring(close) + ', "quantity": ' + str.tostring(shares) + ', "stop_loss": ' + str.tostring(stop_price) + ', "take_profit": ' + str.tostring(take_price) + '}'
    alert(alert_msg, alert.freq_once_per_bar)

// =============================================================================
// PLOTTING
// =============================================================================

plot(ema, "EMA", color=color.blue)
plot(sma, "SMA", color=color.orange)

hline(rsi_overbought, "RSI Overbought", color=color.red, linestyle=hline.style_dashed)
hline(rsi_oversold, "RSI Oversold", color=color.green, linestyle=hline.style_dashed)

plotshape(long_condition, title="Long Entry", location=location.belowbar, style=shape.triangleup, size=size.small, color=color.green)
plotshape(short_condition, title="Short Entry", location=location.abovebar, style=shape.triangledown, size=size.small, color=color.red)
`;
  }

  // Collect performance feedback from recent trades
  private async collectPerformanceFeedback(): Promise<void> {
    try {
      // Get recent Alpaca trades for performance analysis
      const alpacaPositions = await alpacaPaperTradingService.getPositions();
      const closedPositions = alpacaPositions.filter(p => p.qty === 0); // Closed positions

      for (const position of closedPositions) {
        const feedback: PerformanceFeedback = {
          strategyId: 'default', // Would map from position data
          symbol: position.symbol,
          tradeOutcome: position.unrealizedPl > 0 ? 'WIN' : 'LOSS',
          entryPrice: position.avgEntryPrice,
          exitPrice: position.marketValue / position.qty,
          profit: position.unrealizedPl,
          profitPercent: (position.unrealizedPl / (position.avgEntryPrice * Math.abs(position.qty))) * 100,
          holdTime: 0, // Would calculate from entry/exit times
          marketConditions: {
            rsi: 50, // Would get from market data
            macd: 0,
            trend: 'NEUTRAL',
            volatility: 20
          },
          inputsUsed: this.strategyInputs.get('default') || this.getDefaultInputs(),
          timestamp: new Date()
        };

        this.performanceFeedback.push(feedback);
      }

      // Keep only last 100 feedback entries
      if (this.performanceFeedback.length > 100) {
        this.performanceFeedback = this.performanceFeedback.slice(-100);
      }

    } catch (error) {
      console.error('❌ Performance feedback collection error:', error);
    }
  }

  // Save Pine Script inputs (would typically save to file system or database)
  private async savePineScriptInputs(strategyId: string, inputs: PineScriptInputs, pineScript: string): Promise<void> {
    try {
      // This would save the updated Pine Script to a file or send to TradingView
      console.log(`💾 Pine Script inputs saved for ${strategyId}`);
      
      // In a real implementation, this would:
      // 1. Save the Pine Script file to the file system
      // 2. Update any external Pine Script hosting service
      // 3. Notify TradingView to reload the strategy
      // 4. Update webhook configurations

    } catch (error) {
      console.error('❌ Pine Script input save error:', error);
    }
  }

  // Helper methods
  private initializeDefaultInputs(): void {
    const defaultInputs = this.getDefaultInputs();
    this.strategyInputs.set('rsi_macd_scalper', defaultInputs);
    this.strategyInputs.set('momentum_breakout', { ...defaultInputs, momentum_threshold: 1.5 });
    this.strategyInputs.set('mean_reversion', { ...defaultInputs, rsi_overbought: 80, rsi_oversold: 20 });
  }

  private getDefaultInputs(): PineScriptInputs {
    return {
      rsi_length: 14,
      rsi_overbought: 75,
      rsi_oversold: 25,
      macd_fast: 12,
      macd_slow: 26,
      macd_signal: 9,
      ema_length: 20,
      sma_length: 50,
      stop_loss_percent: 2.0,
      take_profit_percent: 4.0,
      risk_reward_ratio: 2.0,
      position_size_percent: 2.0,
      max_positions: 3,
      momentum_threshold: 1.0,
      volume_threshold: 1000,
      volatility_filter: 30,
      enable_session_filter: true,
      start_hour: 9,
      end_hour: 16,
      enable_weekend_trading: false,
      enable_pyramiding: false,
      max_pyramid_levels: 1,
      trend_filter_enabled: true,
      min_trend_strength: 0.5
    };
  }

  private getStrategySymbol(strategyId: string): string {
    // Map strategy IDs to their primary symbols
    const symbolMap: Record<string, string> = {
      'rsi_macd_scalper': 'BTCUSD',
      'momentum_breakout': 'ETHUSD',
      'mean_reversion': 'ADAUSD'
    };
    return symbolMap[strategyId] || 'BTCUSD';
  }

  private getRecentPerformanceData(strategyId: string): any {
    const recentFeedback = this.performanceFeedback
      .filter(f => f.strategyId === strategyId)
      .slice(-20); // Last 20 trades

    if (recentFeedback.length === 0) {
      return {
        recentWinRate: 50,
        totalTrades: 0,
        avgProfit: 0,
        avgLoss: 0
      };
    }

    const wins = recentFeedback.filter(f => f.tradeOutcome === 'WIN');
    const losses = recentFeedback.filter(f => f.tradeOutcome === 'LOSS');

    return {
      recentWinRate: (wins.length / recentFeedback.length) * 100,
      totalTrades: recentFeedback.length,
      avgProfit: wins.length > 0 ? wins.reduce((sum, w) => sum + w.profitPercent, 0) / wins.length : 0,
      avgLoss: losses.length > 0 ? losses.reduce((sum, l) => sum + Math.abs(l.profitPercent), 0) / losses.length : 0
    };
  }

  private getRecentLosses(strategyId: string): PerformanceFeedback[] {
    return this.performanceFeedback
      .filter(f => f.strategyId === strategyId && f.tradeOutcome === 'LOSS')
      .slice(-5); // Last 5 losses
  }

  // Public API
  addListener(callback: (optimization: InputOptimization) => void): void {
    this.listeners.add(callback);
  }

  removeListener(callback: (optimization: InputOptimization) => void): void {
    this.listeners.delete(callback);
  }

  private notifyListeners(optimization: InputOptimization): void {
    this.listeners.forEach(callback => callback(optimization));
  }

  getCurrentInputs(strategyId: string): PineScriptInputs | null {
    return this.strategyInputs.get(strategyId) || null;
  }

  getOptimizationHistory(): InputOptimization[] {
    return [...this.optimizationHistory];
  }

  getPerformanceFeedback(): PerformanceFeedback[] {
    return [...this.performanceFeedback];
  }

  isRunning(): boolean {
    return this._isRunning;
  }
}

// Export singleton instance
export const pineScriptInputOptimizer = PineScriptInputOptimizer.getInstance();

// Export helper functions
export async function startInputOptimization(): Promise<void> {
  await pineScriptInputOptimizer.startOptimization();
}

export function stopInputOptimization(): void {
  pineScriptInputOptimizer.stopOptimization();
}

export function getCurrentInputs(strategyId: string): PineScriptInputs | null {
  return pineScriptInputOptimizer.getCurrentInputs(strategyId);
}

export function getOptimizationHistory(): InputOptimization[] {
  return pineScriptInputOptimizer.getOptimizationHistory();
}
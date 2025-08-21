import StrategyExecutionEngine, { StrategyState } from './strategy-execution-engine';
import StrategyManager, { Strategy } from './strategy-manager';
import marketDataService, { MarketData } from './market-data-service';
import AlertGenerationEngine from './alert-generation-engine';

interface OptimizationResult {
  strategyId: string;
  originalParams: Record<string, any>;
  optimizedParams: Record<string, any>;
  backtestResults: {
    winRate: number;
    totalTrades: number;
    profitLoss: number;
    sharpeRatio: number;
  };
  improvementPercent: number;
  timestamp: Date;
}

interface TradeSignal {
  timestamp: Date;
  action: 'BUY' | 'SELL' | 'CLOSE';
  price: number;
  rsi: number;
  result?: 'win' | 'loss';
  profit?: number;
}

interface OptimizationProgress {
  isRunning: boolean;
  currentIteration: number;
  totalIterations: number;
  bestParams: Record<string, any>;
  bestWinRate: number;
  progress: number;
}

class StrategyOptimizer {
  private static instance: StrategyOptimizer;
  private optimizationHistory: OptimizationResult[] = [];
  private listeners: Set<() => void> = new Set();
  private optimizationProgress: OptimizationProgress = {
    isRunning: false,
    currentIteration: 0,
    totalIterations: 0,
    bestParams: {},
    bestWinRate: 0,
    progress: 0
  };

  private constructor() {}

  static getInstance(): StrategyOptimizer {
    if (!StrategyOptimizer.instance) {
      StrategyOptimizer.instance = new StrategyOptimizer();
    }
    return StrategyOptimizer.instance;
  }

  // Start optimization for a specific strategy
  async optimizeStrategy(strategyId: string, marketConditions: 'trending' | 'ranging' | 'volatile' = 'trending'): Promise<OptimizationResult> {
    console.log(`🔧 Starting optimization for strategy ${strategyId} with ${marketConditions} market conditions`);
    
    const strategyManager = StrategyManager.getInstance();
    const strategy = strategyManager.getStrategy(strategyId);
    
    if (!strategy) {
      throw new Error(`Strategy ${strategyId} not found`);
    }

    this.optimizationProgress = {
      isRunning: true,
      currentIteration: 0,
      totalIterations: 50,
      bestParams: strategy.config,
      bestWinRate: strategy.performance.winRate,
      progress: 0
    };

    this.notifyListeners();

    try {
      const optimizationResult = await this.runOptimization(strategy, marketConditions);
      
      // Apply optimized parameters
      await this.applyOptimizedParameters(strategyId, optimizationResult.optimizedParams);
      
      this.optimizationHistory.push(optimizationResult);
      
      console.log(`✅ Optimization completed for ${strategyId}. Win rate improved by ${optimizationResult.improvementPercent.toFixed(2)}%`);
      
      return optimizationResult;
    } finally {
      this.optimizationProgress.isRunning = false;
      this.notifyListeners();
    }
  }

  private async runOptimization(strategy: Strategy, marketConditions: string): Promise<OptimizationResult> {
    // Get recent market data for backtesting
    const marketData = await this.getRecentMarketData('BTCUSD', 200); // Last 200 bars
    
    let bestParams = { ...strategy.config };
    let bestWinRate = 0;
    let bestBacktest: any = null;

    // Define parameter ranges based on market conditions
    const parameterRanges = this.getParameterRanges(marketConditions);
    
    console.log(`🎯 Testing ${this.optimizationProgress.totalIterations} parameter combinations for ${marketConditions} market`);

    // Test different parameter combinations
    for (let iteration = 0; iteration < this.optimizationProgress.totalIterations; iteration++) {
      const testParams = this.generateTestParameters(parameterRanges, iteration);
      
      // Run backtest with these parameters
      const backtestResult = await this.backtest(marketData, testParams);
      
      // Update progress
      this.optimizationProgress.currentIteration = iteration + 1;
      this.optimizationProgress.progress = (iteration + 1) / this.optimizationProgress.totalIterations * 100;
      
      if (backtestResult.winRate > bestWinRate) {
        bestWinRate = backtestResult.winRate;
        bestParams = { ...testParams };
        bestBacktest = backtestResult;
        
        this.optimizationProgress.bestParams = bestParams;
        this.optimizationProgress.bestWinRate = bestWinRate;
        
        console.log(`📈 New best parameters found at iteration ${iteration + 1}: Win Rate ${(bestWinRate * 100).toFixed(1)}%`);
      }
      
      this.notifyListeners();
      
      // Small delay to prevent blocking
      await new Promise(resolve => setTimeout(resolve, 10));
    }

    const improvementPercent = ((bestWinRate - strategy.performance.winRate) / strategy.performance.winRate) * 100;

    return {
      strategyId: strategy.id,
      originalParams: strategy.config,
      optimizedParams: bestParams,
      backtestResults: bestBacktest,
      improvementPercent,
      timestamp: new Date()
    };
  }

  private getParameterRanges(marketConditions: string): Record<string, { min: number; max: number; step: number }> {
    // Adjust parameter ranges based on market conditions
    switch (marketConditions) {
      case 'trending':
        return {
          rsiPeriod: { min: 10, max: 20, step: 2 },
          oversoldLevel: { min: 25, max: 35, step: 5 },
          overboughtLevel: { min: 65, max: 75, step: 5 },
          confirmationPeriod: { min: 1, max: 3, step: 1 }
        };
      case 'ranging':
        return {
          rsiPeriod: { min: 14, max: 25, step: 2 },
          oversoldLevel: { min: 20, max: 30, step: 5 },
          overboughtLevel: { min: 70, max: 80, step: 5 },
          confirmationPeriod: { min: 2, max: 5, step: 1 }
        };
      case 'volatile':
        return {
          rsiPeriod: { min: 8, max: 16, step: 2 },
          oversoldLevel: { min: 15, max: 25, step: 5 },
          overboughtLevel: { min: 75, max: 85, step: 5 },
          confirmationPeriod: { min: 3, max: 6, step: 1 }
        };
      default:
        return {
          rsiPeriod: { min: 10, max: 20, step: 2 },
          oversoldLevel: { min: 25, max: 35, step: 5 },
          overboughtLevel: { min: 65, max: 75, step: 5 },
          confirmationPeriod: { min: 1, max: 3, step: 1 }
        };
    }
  }

  private generateTestParameters(ranges: Record<string, { min: number; max: number; step: number }>, iteration: number): Record<string, any> {
    const params: Record<string, any> = {};
    
    // Generate systematic parameter combinations
    for (const [key, range] of Object.entries(ranges)) {
      const steps = Math.floor((range.max - range.min) / range.step) + 1;
      const stepIndex = Math.floor(iteration / Object.keys(ranges).length) % steps;
      params[key] = range.min + (stepIndex * range.step);
    }
    
    // Add some randomization for better exploration
    if (iteration % 10 === 0) {
      for (const [key, range] of Object.entries(ranges)) {
        const randomValue = range.min + Math.random() * (range.max - range.min);
        params[key] = Math.round(randomValue / range.step) * range.step;
      }
    }
    
    return params;
  }

  private async backtest(marketData: number[], params: Record<string, any>): Promise<any> {
    const signals: TradeSignal[] = [];
    let position: 'none' | 'long' | 'short' = 'none';
    let entryPrice = 0;
    let totalTrades = 0;
    let winningTrades = 0;
    let totalProfit = 0;

    // Calculate indicators for backtest
    const rsiValues: number[] = [];
    const sma20Values: number[] = [];
    const sma50Values: number[] = [];

    for (let i = 0; i < marketData.length; i++) {
      // Calculate RSI
      if (i >= params.rsiPeriod) {
        const rsi = this.calculateRSI(marketData.slice(i - params.rsiPeriod, i + 1), params.rsiPeriod);
        rsiValues.push(rsi);
      }

      // Calculate SMAs
      if (i >= 19) { // SMA20
        const sma20 = marketData.slice(i - 19, i + 1).reduce((sum, val) => sum + val, 0) / 20;
        sma20Values.push(sma20);
      }

      if (i >= 49) { // SMA50
        const sma50 = marketData.slice(i - 49, i + 1).reduce((sum, val) => sum + val, 0) / 50;
        sma50Values.push(sma50);
      }

      // Strategy logic (simplified)
      if (rsiValues.length > 0 && sma20Values.length > 0 && sma50Values.length > 0) {
        const currentRSI = rsiValues[rsiValues.length - 1];
        const currentPrice = marketData[i];
        const currentSMA20 = sma20Values[sma20Values.length - 1];
        const currentSMA50 = sma50Values[sma50Values.length - 1];

        // Entry signals
        if (position === 'none') {
          if (currentRSI <= params.oversoldLevel && currentPrice > currentSMA50 && currentSMA20 > currentSMA50) {
            position = 'long';
            entryPrice = currentPrice;
            signals.push({
              timestamp: new Date(),
              action: 'BUY',
              price: currentPrice,
              rsi: currentRSI
            });
          }
        }

        // Exit signals
        if (position === 'long') {
          if (currentRSI >= params.overboughtLevel || currentPrice < currentSMA20) {
            const profit = currentPrice - entryPrice;
            const isWin = profit > 0;
            
            if (isWin) winningTrades++;
            totalTrades++;
            totalProfit += profit;
            
            signals.push({
              timestamp: new Date(),
              action: 'SELL',
              price: currentPrice,
              rsi: currentRSI,
              result: isWin ? 'win' : 'loss',
              profit
            });
            
            position = 'none';
            entryPrice = 0;
          }
        }
      }
    }

    const winRate = totalTrades > 0 ? winningTrades / totalTrades : 0;
    const sharpeRatio = this.calculateSharpeRatio(signals);

    return {
      winRate,
      totalTrades,
      profitLoss: totalProfit,
      sharpeRatio,
      signals
    };
  }

  private calculateRSI(prices: number[], period: number): number {
    if (prices.length < period + 1) return 50;

    let gains = 0;
    let losses = 0;

    for (let i = prices.length - period; i < prices.length; i++) {
      const change = prices[i] - prices[i - 1];
      if (change > 0) {
        gains += change;
      } else {
        losses -= change;
      }
    }

    const avgGain = gains / period;
    const avgLoss = losses / period;

    if (avgLoss === 0) return 100;

    const rs = avgGain / avgLoss;
    return 100 - (100 / (1 + rs));
  }

  private calculateSharpeRatio(signals: TradeSignal[]): number {
    const returns = signals.filter(s => s.profit !== undefined).map(s => s.profit!);
    if (returns.length === 0) return 0;

    const avgReturn = returns.reduce((sum, ret) => sum + ret, 0) / returns.length;
    const stdDev = Math.sqrt(returns.reduce((sum, ret) => sum + Math.pow(ret - avgReturn, 2), 0) / returns.length);
    
    return stdDev === 0 ? 0 : avgReturn / stdDev;
  }

  private async getRecentMarketData(symbol: string, bars: number): Promise<number[]> {
    // Get historical price data - for now we'll simulate this
    // In production, this would fetch real historical data
    const mockData: number[] = [];
    const basePrice = 50000;
    
    for (let i = 0; i < bars; i++) {
      const volatility = 0.02; // 2% volatility
      const randomChange = (Math.random() - 0.5) * volatility;
      const price = i === 0 ? basePrice : mockData[i - 1] * (1 + randomChange);
      mockData.push(price);
    }
    
    return mockData;
  }

  private async applyOptimizedParameters(strategyId: string, params: Record<string, any>) {
    const strategyManager = StrategyManager.getInstance();
    const alertEngine = AlertGenerationEngine.getInstance();
    
    // Log variable changes with performance tracking
    alertEngine.updateStrategyVariables(
      strategyId, 
      params, 
      `Optimization: Automated parameter update based on backtest results`
    );
    
    // Update strategy configuration
    strategyManager.updateStrategy(strategyId, {
      config: { ...params },
      lastUpdated: new Date()
    });

    // Restart strategy execution with new parameters
    const executionEngine = StrategyExecutionEngine.getInstance();
    const strategy = strategyManager.getStrategy(strategyId);
    
    if (strategy) {
      executionEngine.removeStrategy(strategyId);
      executionEngine.addStrategy(strategy, 'BTCUSD');
    }

    console.log(`✅ Applied optimized parameters to strategy ${strategyId}:`, params);
    console.log(`📊 Variable changes logged for performance tracking`);
  }

  // Detect market conditions automatically
  detectMarketConditions(symbol: string = 'BTCUSD'): 'trending' | 'ranging' | 'volatile' {
    const currentData = marketDataService.getCurrentData(symbol);
    
    if (!currentData) {
      return 'trending'; // Default
    }

    // Simple market condition detection based on price range and volatility
    const dayRange = currentData.high24h - currentData.low24h;
    const rangePercent = dayRange / currentData.price;
    const volatility = Math.abs(currentData.changePercent) / 100;

    if (volatility > 0.05) {
      return 'volatile'; // High volatility
    } else if (rangePercent < 0.02) {
      return 'ranging'; // Low range, sideways movement
    } else {
      return 'trending'; // Normal trending market
    }
  }

  getOptimizationProgress(): OptimizationProgress {
    return { ...this.optimizationProgress };
  }

  getOptimizationHistory(): OptimizationResult[] {
    return [...this.optimizationHistory];
  }

  subscribe(callback: () => void): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  private notifyListeners(): void {
    this.listeners.forEach(callback => callback());
  }
}

export default StrategyOptimizer;
export type { OptimizationResult, OptimizationProgress };
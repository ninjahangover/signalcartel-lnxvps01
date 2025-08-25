import { Strategy } from './strategy-manager';
import marketDataService, { MarketData } from './market-data-service';
import { StrategyState } from './strategy-execution-engine';


interface RSIParameters {
  rsi_period: number;           // 5-50
  oversold_level: number;       // 10-40  
  overbought_level: number;     // 60-90
  confirmation_period: number;  // 1-10
  ma_short_period: number;      // 10-30
  ma_long_period: number;       // 30-100
  position_size: number;        // 0.01-0.1
}

interface PerformanceMetrics {
  winRate: number;
  profitFactor: number;
  totalTrades: number;
  sharpeRatio: number;
  maxDrawdown: number;
  avgWinLoss: number;
  timeInMarket: number;
}

interface MarketRegime {
  trend: 'bullish' | 'bearish' | 'sideways';
  volatility: 'low' | 'medium' | 'high';
  volume: 'low' | 'medium' | 'high';
  momentum: number;
}

interface OptimizationResult {
  parameters: RSIParameters;
  performance: PerformanceMetrics;
  marketRegime: MarketRegime;
  timestamp: Date;
  confidence: number; // 0-1 confidence in this parameter set
}

class RSIStrategyOptimizer {
  private static instance: RSIStrategyOptimizer;
  private currentParameters: RSIParameters;
  private optimizationHistory: OptimizationResult[] = [];
  private marketData: MarketData[] = [];
  private isOptimizing = false;
  private listeners: Set<() => void> = new Set();

  // Default parameters from your Pine Script
  private defaultParameters: RSIParameters = {
    rsi_period: 14,
    oversold_level: 30,
    overbought_level: 70,
    confirmation_period: 3,
    ma_short_period: 20,
    ma_long_period: 50,
    position_size: 0.01
  };

  private constructor() {
    this.currentParameters = { ...this.defaultParameters };
    this.subscribeToMarketData();
  }

  static getInstance(): RSIStrategyOptimizer {
    if (!RSIStrategyOptimizer.instance) {
      RSIStrategyOptimizer.instance = new RSIStrategyOptimizer();
    }
    return RSIStrategyOptimizer.instance;
  }

  private subscribeToMarketData(): void {
    marketDataService.subscribe('BTCUSD', (data) => {
      this.marketData.push(data);
      
      // Keep last 1000 data points for analysis
      if (this.marketData.length > 1000) {
        this.marketData.shift();
      }

      // Trigger optimization every 100 new data points
      if (this.marketData.length % 100 === 0 && !this.isOptimizing) {
        this.scheduleOptimization();
      }
    });
  }

  // Schedule optimization to run asynchronously
  private scheduleOptimization(): void {
    setTimeout(() => {
      this.optimizeParameters();
    }, 1000); // Wait 1 second to avoid blocking
  }

  // Main optimization function using genetic algorithm approach
  async optimizeParameters(): Promise<RSIParameters> {
    if (this.isOptimizing || this.marketData.length < 200) {
      return this.currentParameters;
    }

    this.isOptimizing = true;
    console.log('🧠 Stratus Engine: Starting RSI parameter optimization...');

    try {
      const currentRegime = this.analyzeMarketRegime();
      
      // Generate parameter candidates using genetic algorithm
      const candidates = this.generateParameterCandidates(20);
      
      // Evaluate each candidate on recent market data
      const results: OptimizationResult[] = [];
      
      for (const params of candidates) {
        const performance = await this.backtestParameters(params);
        results.push({
          parameters: params,
          performance,
          marketRegime: currentRegime,
          timestamp: new Date(),
          confidence: this.calculateConfidence(performance, currentRegime)
        });
      }

      // Sort by performance score (weighted combination of metrics)
      results.sort((a, b) => this.calculateScore(b) - this.calculateScore(a));
      
      const bestResult = results[0];
      
      // Only update if significantly better than current
      if (this.shouldUpdateParameters(bestResult)) {
        this.currentParameters = { ...bestResult.parameters };
        this.optimizationHistory.push(bestResult);
        
        // Keep only last 100 optimization results
        if (this.optimizationHistory.length > 100) {
          this.optimizationHistory.shift();
        }

        console.log('✅ Stratus Engine: Parameters optimized!', {
          oldParams: this.defaultParameters,
          newParams: this.currentParameters,
          improvement: `${((this.calculateScore(bestResult) - 0.5) * 100).toFixed(1)}%`
        });

        // Log strategy optimization (disabled to prevent telegram spam)
        // console.log('🎯 RSI Strategy Optimized:', {
        //   type: 'STRATEGY_OPTIMIZED',
        //   strategy: 'RSI Strategy Optimizer',
        //   symbol: 'BTCUSD',
        //   confidence: Math.round(this.calculateScore(bestResult) * 100),
        //   timestamp: new Date(),
        //   details: {
        //     optimizedParams: this.currentParameters,
        //     improvement: `${((this.calculateScore(bestResult) - 0.5) * 100).toFixed(1)}%`,
        //     score: this.calculateScore(bestResult)
        //   }
        // });

        // Temporarily disable notifications to stop telegram spam
        // this.notifyListeners();
      }

      return this.currentParameters;
    } catch (error) {
      console.error('❌ Error in RSI optimization:', error);
      return this.currentParameters;
    } finally {
      this.isOptimizing = false;
    }
  }

  // Analyze current market regime to optimize for current conditions
  private analyzeMarketRegime(): MarketRegime {
    if (this.marketData.length < 50) {
      return {
        trend: 'sideways',
        volatility: 'medium',
        volume: 'medium',
        momentum: 0
      };
    }

    const recent = this.marketData.slice(-50);
    const prices = recent.map(d => d.price);
    
    // Calculate trend
    const sma20 = this.calculateSMA(prices.slice(-20), 20);
    const sma50 = this.calculateSMA(prices, 50);
    const trend = sma20 > sma50 * 1.02 ? 'bullish' : 
                  sma20 < sma50 * 0.98 ? 'bearish' : 'sideways';

    // Calculate volatility (standard deviation)
    const returns = [];
    for (let i = 1; i < prices.length; i++) {
      returns.push((prices[i] - prices[i-1]) / prices[i-1]);
    }
    const volatility = this.standardDeviation(returns);
    const volLevel = volatility > 0.03 ? 'high' : volatility > 0.015 ? 'medium' : 'low';

    // Calculate momentum (rate of change)
    const momentum = (prices[prices.length - 1] - prices[0]) / prices[0];

    // Volume analysis (using timestamp frequency as proxy)
    const avgTimeDiff = recent.reduce((sum, d, i) => {
      if (i === 0) return sum;
      return sum + (d.timestamp - recent[i-1].timestamp);
    }, 0) / (recent.length - 1);
    
    const volumeLevel = avgTimeDiff < 5000 ? 'high' : avgTimeDiff < 15000 ? 'medium' : 'low';

    return {
      trend,
      volatility: volLevel,
      volume: volumeLevel,
      momentum
    };
  }

  // Generate parameter candidates using genetic algorithm
  private generateParameterCandidates(count: number): RSIParameters[] {
    const candidates: RSIParameters[] = [];
    
    // Add current parameters as baseline
    candidates.push({ ...this.currentParameters });
    
    // Add best historical parameters if available
    if (this.optimizationHistory.length > 0) {
      const best = this.optimizationHistory
        .sort((a, b) => this.calculateScore(b) - this.calculateScore(a))[0];
      candidates.push({ ...best.parameters });
    }

    // Generate random variations
    while (candidates.length < count) {
      const base = candidates[Math.floor(Math.random() * Math.min(candidates.length, 3))];
      const mutated = this.mutateParameters(base);
      candidates.push(mutated);
    }

    return candidates;
  }

  // Mutate parameters for genetic algorithm
  private mutateParameters(base: RSIParameters): RSIParameters {
    const mutated = { ...base };
    const mutationRate = 0.1; // 10% chance per parameter
    
    if (Math.random() < mutationRate) {
      mutated.rsi_period = Math.max(5, Math.min(50, base.rsi_period + (Math.random() - 0.5) * 10));
    }
    
    if (Math.random() < mutationRate) {
      mutated.oversold_level = Math.max(10, Math.min(40, base.oversold_level + (Math.random() - 0.5) * 10));
    }
    
    if (Math.random() < mutationRate) {
      mutated.overbought_level = Math.max(60, Math.min(90, base.overbought_level + (Math.random() - 0.5) * 10));
    }
    
    if (Math.random() < mutationRate) {
      mutated.confirmation_period = Math.max(1, Math.min(10, Math.round(base.confirmation_period + (Math.random() - 0.5) * 4)));
    }
    
    if (Math.random() < mutationRate) {
      mutated.ma_short_period = Math.max(10, Math.min(30, Math.round(base.ma_short_period + (Math.random() - 0.5) * 8)));
    }
    
    if (Math.random() < mutationRate) {
      mutated.ma_long_period = Math.max(30, Math.min(100, Math.round(base.ma_long_period + (Math.random() - 0.5) * 20)));
    }

    return mutated;
  }

  // Backtest parameters on recent market data
  private async backtestParameters(params: RSIParameters): Promise<PerformanceMetrics> {
    if (this.marketData.length < 100) {
      return this.getDefaultMetrics();
    }

    const testData = this.marketData.slice(-200); // Last 200 data points
    const trades: { entry: number; exit: number; type: 'long' | 'short' }[] = [];
    
    let position: 'none' | 'long' | 'short' = 'none';
    let entryPrice = 0;
    let confirmationBars = 0;

    for (let i = Math.max(params.rsi_period, params.ma_long_period); i < testData.length - 1; i++) {
      const prices = testData.slice(0, i + 1).map(d => d.price);
      const currentPrice = prices[prices.length - 1];
      
      // Calculate indicators
      const rsi = this.calculateRSI(prices, params.rsi_period);
      const maShort = this.calculateSMA(prices.slice(-params.ma_short_period), params.ma_short_period);
      const maLong = this.calculateSMA(prices.slice(-params.ma_long_period), params.ma_long_period);

      // RSI conditions
      const rsiOversold = rsi <= params.oversold_level;
      const rsiOverbought = rsi >= params.overbought_level;
      
      // Trend conditions
      const uptrend = maShort > maLong;
      const downtrend = maShort < maLong;
      const priceAboveLongMA = currentPrice > maLong;
      const priceBelowLongMA = currentPrice < maLong;

      // Entry logic (matching your Pine Script)
      if (position === 'none') {
        // Long entry conditions
        if (rsiOversold && priceAboveLongMA && uptrend) {
          confirmationBars++;
          if (confirmationBars >= params.confirmation_period) {
            position = 'long';
            entryPrice = currentPrice;
            confirmationBars = 0;
          }
        }
        // Short entry conditions
        else if (rsiOverbought && priceBelowLongMA && downtrend) {
          confirmationBars++;
          if (confirmationBars >= params.confirmation_period) {
            position = 'short';
            entryPrice = currentPrice;
            confirmationBars = 0;
          }
        } else {
          confirmationBars = 0;
        }
      }
      // Exit logic
      else if (position === 'long' && (rsiOverbought || currentPrice < maShort)) {
        trades.push({ entry: entryPrice, exit: currentPrice, type: 'long' });
        position = 'none';
      }
      else if (position === 'short' && (rsiOversold || currentPrice > maShort)) {
        trades.push({ entry: entryPrice, exit: currentPrice, type: 'short' });
        position = 'none';
      }
    }

    return this.calculatePerformanceMetrics(trades);
  }

  // Calculate performance metrics from trades
  private calculatePerformanceMetrics(trades: { entry: number; exit: number; type: 'long' | 'short' }[]): PerformanceMetrics {
    if (trades.length === 0) {
      return this.getDefaultMetrics();
    }

    const returns = trades.map(trade => {
      if (trade.type === 'long') {
        return (trade.exit - trade.entry) / trade.entry;
      } else {
        return (trade.entry - trade.exit) / trade.entry;
      }
    });

    const winningTrades = returns.filter(r => r > 0);
    const losingTrades = returns.filter(r => r < 0);
    
    const winRate = winningTrades.length / trades.length;
    const avgWin = winningTrades.length > 0 ? winningTrades.reduce((a, b) => a + b, 0) / winningTrades.length : 0;
    const avgLoss = losingTrades.length > 0 ? Math.abs(losingTrades.reduce((a, b) => a + b, 0)) / losingTrades.length : 1;
    
    const profitFactor = avgWin * winningTrades.length / (avgLoss * losingTrades.length) || 0;
    const totalReturn = returns.reduce((a, b) => a + b, 0);
    const sharpeRatio = returns.length > 1 ? totalReturn / this.standardDeviation(returns) : 0;
    
    // Calculate max drawdown
    let peak = 0;
    let maxDrawdown = 0;
    let cumulative = 0;
    
    for (const ret of returns) {
      cumulative += ret;
      peak = Math.max(peak, cumulative);
      const drawdown = peak - cumulative;
      maxDrawdown = Math.max(maxDrawdown, drawdown);
    }

    return {
      winRate,
      profitFactor,
      totalTrades: trades.length,
      sharpeRatio,
      maxDrawdown,
      avgWinLoss: avgWin / avgLoss || 0,
      timeInMarket: 0.5 // Placeholder - would need more detailed timing
    };
  }

  private getDefaultMetrics(): PerformanceMetrics {
    return {
      winRate: 0.5,
      profitFactor: 1,
      totalTrades: 0,
      sharpeRatio: 0,
      maxDrawdown: 0,
      avgWinLoss: 1,
      timeInMarket: 0
    };
  }

  // Calculate optimization confidence based on metrics and market regime
  private calculateConfidence(performance: PerformanceMetrics, regime: MarketRegime): number {
    let confidence = 0;
    
    // Base confidence on number of trades
    confidence += Math.min(performance.totalTrades / 20, 1) * 0.3;
    
    // Add confidence based on win rate
    confidence += Math.max(0, (performance.winRate - 0.5) * 2) * 0.3;
    
    // Add confidence based on profit factor
    confidence += Math.min(performance.profitFactor / 2, 1) * 0.2;
    
    // Add confidence based on Sharpe ratio
    confidence += Math.min(Math.max(performance.sharpeRatio, 0) / 2, 1) * 0.2;
    
    return Math.min(confidence, 1);
  }

  // Calculate composite score for ranking parameter sets
  private calculateScore(result: OptimizationResult): number {
    const p = result.performance;
    
    // Weighted composite score
    return (
      p.winRate * 0.25 +
      Math.min(p.profitFactor / 3, 1) * 0.25 +
      Math.min(Math.max(p.sharpeRatio, 0) / 2, 1) * 0.20 +
      Math.max(0, 1 - p.maxDrawdown * 2) * 0.15 +
      Math.min(p.totalTrades / 50, 1) * 0.15
    ) * result.confidence;
  }

  // Determine if new parameters should replace current ones
  private shouldUpdateParameters(newResult: OptimizationResult): boolean {
    if (this.optimizationHistory.length === 0) return true;
    
    const currentScore = this.optimizationHistory
      .slice(-5)
      .reduce((sum, r) => sum + this.calculateScore(r), 0) / Math.min(5, this.optimizationHistory.length);
    
    const newScore = this.calculateScore(newResult);
    
    // Require 5% improvement to change parameters (avoid overfitting)
    return newScore > currentScore * 1.05;
  }

  // Utility functions
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

  private calculateSMA(prices: number[], period: number): number {
    if (prices.length < period) return prices[prices.length - 1];
    
    const sum = prices.slice(-period).reduce((acc, price) => acc + price, 0);
    return sum / period;
  }

  private standardDeviation(values: number[]): number {
    if (values.length === 0) return 0;
    
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const squaredDiffs = values.map(value => Math.pow(value - mean, 2));
    const variance = squaredDiffs.reduce((a, b) => a + b, 0) / values.length;
    return Math.sqrt(variance);
  }

  // Public API
  getCurrentParameters(): RSIParameters {
    return { ...this.currentParameters };
  }

  getOptimizationHistory(): OptimizationResult[] {
    return [...this.optimizationHistory];
  }

  isCurrentlyOptimizing(): boolean {
    return this.isOptimizing;
  }

  // Force optimization (for testing or manual triggers)
  async forceOptimization(): Promise<RSIParameters> {
    return this.optimizeParameters();
  }

  // Subscribe to parameter updates
  subscribe(callback: () => void): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  private notifyListeners(): void {
    this.listeners.forEach(callback => callback());
  }
}

export default RSIStrategyOptimizer;
export type { RSIParameters, PerformanceMetrics, MarketRegime, OptimizationResult };
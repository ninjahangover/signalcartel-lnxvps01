/**
 * Base Strategy Optimization Engine
 * 
 * Abstract base class that defines the interface for strategy-specific optimization engines.
 * Each strategy type (RSI, MACD, Bollinger Bands, etc.) extends this with their own trading logic.
 */

export type StrategyType = 'rsi' | 'macd' | 'bollinger' | 'custom';

export interface BaseParameters {
  [key: string]: number | string | boolean;
}

export interface PerformanceMetrics {
  winRate: number;
  profitFactor: number;
  totalTrades: number;
  avgWin: number;
  avgLoss: number;
  maxDrawdown: number;
  sharpeRatio: number;
  sortinoRatio: number;
  calmarRatio: number;
  consecutiveLosses: number;
  consecutiveWins: number;
  largestWin: number;
  largestLoss: number;
  expectancy: number; // Average $ per trade
}

export interface MarketData {
  prices: number[];
  volumes?: number[];
  timestamps: Date[];
  symbol: string;
  timeframe: string; // '1m', '5m', '1h', '4h', '1d'
}

export interface OptimizationResult<T extends BaseParameters> {
  parameters: T;
  performance: PerformanceMetrics;
  confidence: number; // 0-1, how confident we are in this optimization
  reasoning: string;
  marketContext: string;
  backtestPeriod: {
    start: Date;
    end: Date;
    totalBars: number;
  };
}

export interface StrategyContext {
  marketData: MarketData;
  recentPerformance: PerformanceMetrics;
  optimizationHistory: OptimizationResult<any>[];
  riskParameters: {
    maxDrawdown: number;
    maxConsecutiveLosses: number;
    minWinRate: number;
    minProfitFactor: number;
  };
}

/**
 * Abstract base class for strategy optimization engines
 */
export abstract class BaseStrategyEngine<TParams extends BaseParameters> {
  protected strategyType: StrategyType;
  protected name: string;

  constructor(strategyType: StrategyType, name: string) {
    this.strategyType = strategyType;
    this.name = name;
  }

  /**
   * Identifies the strategy type from Pine Script code
   */
  abstract identifyStrategy(pineScriptCode: string): boolean;

  /**
   * Analyzes current market conditions specific to this strategy
   */
  abstract analyzeMarketConditions(marketData: MarketData): any;

  /**
   * Core optimization logic - understands how parameters affect strategy performance
   */
  abstract optimize(
    currentParameters: TParams,
    context: StrategyContext
  ): Promise<OptimizationResult<TParams>[]>;

  /**
   * Validates if parameter combination makes sense for this strategy
   */
  abstract validateParameters(parameters: TParams): {
    valid: boolean;
    errors: string[];
    warnings: string[];
  };

  /**
   * Explains what each parameter does in context of this strategy
   */
  abstract explainParameter(parameterName: string): {
    description: string;
    impact: string;
    optimalRange: { min: number; max: number };
    marketDependency: string;
  };

  /**
   * Calculates parameter interdependencies
   * e.g., RSI period affects optimal barrier levels
   */
  abstract calculateParameterDependencies(parameters: TParams): {
    [key: string]: {
      affectedBy: string[];
      affects: string[];
      relationship: 'positive' | 'negative' | 'complex';
    };
  };

  /**
   * Provides strategy-specific performance interpretation
   */
  abstract interpretPerformance(
    performance: PerformanceMetrics,
    parameters: TParams,
    marketConditions: any
  ): {
    strengths: string[];
    weaknesses: string[];
    recommendations: string[];
  };

  /**
   * Determines if current market conditions favor this strategy
   */
  abstract isStrategyFavorable(marketConditions: any): {
    favorable: boolean;
    confidence: number;
    reasoning: string;
  };

  // Common utility methods available to all strategy engines

  protected calculateSharpeRatio(returns: number[], riskFreeRate = 0.02): number {
    if (returns.length === 0) return 0;
    
    const avgReturn = returns.reduce((sum, ret) => sum + ret, 0) / returns.length;
    const excessReturn = avgReturn - (riskFreeRate / 252); // Daily risk-free rate
    
    const variance = returns.reduce((sum, ret) => sum + Math.pow(ret - avgReturn, 2), 0) / returns.length;
    const stdDev = Math.sqrt(variance);
    
    return stdDev === 0 ? 0 : excessReturn / stdDev;
  }

  protected calculateMaxDrawdown(equityCurve: number[]): number {
    let maxDrawdown = 0;
    let peak = equityCurve[0];
    
    for (const value of equityCurve) {
      if (value > peak) {
        peak = value;
      }
      
      const drawdown = (peak - value) / peak;
      if (drawdown > maxDrawdown) {
        maxDrawdown = drawdown;
      }
    }
    
    return maxDrawdown;
  }

  protected calculateExpectancy(wins: number[], losses: number[]): number {
    if (wins.length === 0 && losses.length === 0) return 0;
    
    const avgWin = wins.length > 0 ? wins.reduce((sum, win) => sum + win, 0) / wins.length : 0;
    const avgLoss = losses.length > 0 ? losses.reduce((sum, loss) => sum + loss, 0) / losses.length : 0;
    const winRate = wins.length / (wins.length + losses.length);
    const lossRate = 1 - winRate;
    
    return (winRate * avgWin) - (lossRate * Math.abs(avgLoss));
  }

  protected normalizeToTimeframe(value: number, currentTimeframe: string, targetTimeframe: string): number {
    const timeframeMultipliers: Record<string, number> = {
      '1m': 1,
      '5m': 5,
      '15m': 15,
      '1h': 60,
      '4h': 240,
      '1d': 1440
    };
    
    const currentMultiplier = timeframeMultipliers[currentTimeframe] || 1;
    const targetMultiplier = timeframeMultipliers[targetTimeframe] || 1;
    
    return value * (targetMultiplier / currentMultiplier);
  }

  // Abstract methods for backtesting (to be implemented by subclasses)
  abstract backtest(
    parameters: TParams,
    marketData: MarketData,
    options?: {
      commission?: number;
      slippage?: number;
      startCapital?: number;
    }
  ): Promise<{
    trades: Array<{
      entry: { price: number; timestamp: Date };
      exit: { price: number; timestamp: Date };
      side: 'long' | 'short';
      pnl: number;
      pnlPercent: number;
    }>;
    performance: PerformanceMetrics;
    equityCurve: number[];
  }>;
}

// Factory for creating strategy engines
export class StrategyEngineFactory {
  private static engines: Map<StrategyType, () => BaseStrategyEngine<any>> = new Map();

  static registerEngine<T extends BaseParameters>(
    type: StrategyType,
    engineFactory: () => BaseStrategyEngine<T>
  ) {
    this.engines.set(type, engineFactory);
  }

  static createEngine(type: StrategyType): BaseStrategyEngine<any> | null {
    const factory = this.engines.get(type);
    return factory ? factory() : null;
  }

  static identifyStrategyFromCode(pineScriptCode: string): StrategyType | null {
    // Try each registered engine to see if it can identify the strategy
    for (const [type, factory] of this.engines.entries()) {
      const engine = factory();
      if (engine.identifyStrategy(pineScriptCode)) {
        return type;
      }
    }
    return null;
  }
}
/**
 * UNIFIED STRATEGY CONFIGURATION SYSTEM
 * Single source of truth for all strategy parameters and settings
 */

export interface UnifiedStrategyParameters {
  // Core RSI Parameters
  rsi: {
    lookback: number;        // Your preferred: 2-5, Default was 14
    oversoldEntry: number;   // Entry level when oversold (e.g., 30)
    oversoldExit: number;    // Exit oversold position (e.g., 35)
    overboughtEntry: number; // Entry level when overbought (e.g., 70)
    overboughtExit: number;  // Exit overbought position (e.g., 65)
  };
  
  // Moving Average Parameters
  ma: {
    shortPeriod: number;     // Fast MA (e.g., 20)
    longPeriod: number;      // Slow MA (e.g., 50)
    type: 'SMA' | 'EMA';     // Moving average type
  };
  
  // Risk Management
  risk: {
    positionSize: number;    // Percentage of capital per trade
    stopLossATR: number;     // Stop loss in ATR multiples
    takeProfitATR: number;   // Take profit in ATR multiples
    atrPeriod: number;       // ATR calculation period
    maxOpenPositions: number; // Maximum concurrent positions
  };
  
  // Trade Confirmation
  confirmation: {
    requiredBars: number;    // Bars needed to confirm signal
    volumeThreshold: number; // Minimum volume for entry
    trendAlignment: boolean; // Require trend alignment
  };
  
  // Optimization Settings
  optimization: {
    enabled: boolean;        // Allow AI optimization
    adaptToMarket: boolean;  // Adjust for market conditions
    learningRate: number;    // How fast to adapt (0.01-1.0)
    minDataPoints: number;   // Minimum data before optimizing
  };
}

export interface UnifiedStrategy {
  id: string;
  name: string;
  type: 'RSI_PULLBACK' | 'MOMENTUM' | 'MEAN_REVERSION' | 'TREND_FOLLOWING' | 'CUSTOM';
  enabled: boolean;
  mode: 'paper' | 'live';
  
  // Current Active Parameters
  parameters: UnifiedStrategyParameters;
  
  // Original/Default Parameters (for reset)
  defaultParameters: UnifiedStrategyParameters;
  
  // Last Optimized Parameters (for comparison)
  optimizedParameters?: UnifiedStrategyParameters;
  lastOptimization?: Date;
  
  // Performance Tracking
  performance: {
    totalTrades: number;
    winRate: number;
    profitLoss: number;
    sharpeRatio: number;
    maxDrawdown: number;
    consecutiveWins: number;
    consecutiveLosses: number;
    lastTradeTime?: Date;
  };
  
  // Market Adaptation
  marketAdaptation?: {
    detectedRegime: 'trending_up' | 'trending_down' | 'ranging' | 'volatile';
    confidence: number;
    lastAnalysis: Date;
  };
  
  // Stratus Brain Learning
  stratusBrain?: {
    neuralConfidence: number;
    predictedWinRate: number;
    suggestedAdjustments: Partial<UnifiedStrategyParameters>;
    learningProgress: number; // 0-100%
  };
}

// DEFAULT CONFIGURATIONS FOR DIFFERENT STRATEGY TYPES
export const DEFAULT_STRATEGY_CONFIGS: Record<string, UnifiedStrategyParameters> = {
  AGGRESSIVE_SCALPING: {
    rsi: {
      lookback: 2,          // Ultra-short for fastest signals
      oversoldEntry: 25,
      oversoldExit: 35,
      overboughtEntry: 75,
      overboughtExit: 65
    },
    ma: {
      shortPeriod: 10,
      longPeriod: 30,
      type: 'EMA'
    },
    risk: {
      positionSize: 0.02,
      stopLossATR: 1.5,
      takeProfitATR: 2.0,
      atrPeriod: 14,
      maxOpenPositions: 3
    },
    confirmation: {
      requiredBars: 1,
      volumeThreshold: 1000,
      trendAlignment: false
    },
    optimization: {
      enabled: true,
      adaptToMarket: true,
      learningRate: 0.5,
      minDataPoints: 50
    }
  },
  
  CONSERVATIVE_SWING: {
    rsi: {
      lookback: 14,         // Standard RSI
      oversoldEntry: 30,
      oversoldExit: 40,
      overboughtEntry: 70,
      overboughtExit: 60
    },
    ma: {
      shortPeriod: 20,
      longPeriod: 50,
      type: 'SMA'
    },
    risk: {
      positionSize: 0.01,
      stopLossATR: 2.5,
      takeProfitATR: 4.0,
      atrPeriod: 20,
      maxOpenPositions: 2
    },
    confirmation: {
      requiredBars: 3,
      volumeThreshold: 5000,
      trendAlignment: true
    },
    optimization: {
      enabled: true,
      adaptToMarket: true,
      learningRate: 0.1,
      minDataPoints: 200
    }
  },
  
  YOUR_MANUAL_SYSTEM: {
    rsi: {
      lookback: 2,          // Your preferred: most aggressive setting
      oversoldEntry: 28,
      oversoldExit: 35,
      overboughtEntry: 72,
      overboughtExit: 65
    },
    ma: {
      shortPeriod: 15,
      longPeriod: 40,
      type: 'EMA'
    },
    risk: {
      positionSize: 0.015,
      stopLossATR: 2.0,
      takeProfitATR: 3.0,
      atrPeriod: 10,
      maxOpenPositions: 2
    },
    confirmation: {
      requiredBars: 2,
      volumeThreshold: 2000,
      trendAlignment: true
    },
    optimization: {
      enabled: true,
      adaptToMarket: true,
      learningRate: 0.3,
      minDataPoints: 100
    }
  }
};

// Market Condition Adjustments
export interface MarketAdjustment {
  condition: string;
  parameterOverrides: Partial<UnifiedStrategyParameters>;
  reason: string;
}

export const MARKET_CONDITION_ADJUSTMENTS: MarketAdjustment[] = [
  {
    condition: 'high_volatility',
    parameterOverrides: {
      rsi: { lookback: 5 }, // Slightly longer for stability
      risk: { stopLossATR: 3.0 } // Wider stops in volatility
    },
    reason: 'Increased RSI period and wider stops for volatile conditions'
  },
  {
    condition: 'strong_trend',
    parameterOverrides: {
      rsi: { oversoldEntry: 35, overboughtEntry: 65 }, // Less extreme levels
      confirmation: { requiredBars: 1 } // Faster entry in trends
    },
    reason: 'Adjusted RSI levels and faster confirmation for trending markets'
  },
  {
    condition: 'low_volume',
    parameterOverrides: {
      risk: { positionSize: 0.005 }, // Smaller positions
      confirmation: { volumeThreshold: 500 } // Lower volume requirement
    },
    reason: 'Reduced position size and volume threshold for low liquidity'
  }
];

// Optimization Constraints
export const OPTIMIZATION_CONSTRAINTS = {
  rsi: {
    lookback: { min: 2, max: 21 },
    oversoldEntry: { min: 15, max: 35 },
    oversoldExit: { min: 20, max: 45 },
    overboughtEntry: { min: 65, max: 85 },
    overboughtExit: { min: 55, max: 80 }
  },
  ma: {
    shortPeriod: { min: 5, max: 50 },
    longPeriod: { min: 20, max: 200 }
  },
  risk: {
    positionSize: { min: 0.001, max: 0.05 },
    stopLossATR: { min: 0.5, max: 5.0 },
    takeProfitATR: { min: 1.0, max: 10.0 }
  },
  confirmation: {
    requiredBars: { min: 0, max: 10 },
    volumeThreshold: { min: 0, max: 100000 }
  }
};

// Helper function to validate parameters
export function validateParameters(params: UnifiedStrategyParameters): boolean {
  // Check RSI constraints
  const rsi = params.rsi;
  if (rsi.lookback < 2 || rsi.lookback > 50) return false;
  if (rsi.oversoldEntry >= rsi.oversoldExit) return false;
  if (rsi.overboughtEntry <= rsi.overboughtExit) return false;
  
  // Check MA constraints
  const ma = params.ma;
  if (ma.shortPeriod >= ma.longPeriod) return false;
  
  // Check risk constraints
  const risk = params.risk;
  if (risk.positionSize <= 0 || risk.positionSize > 1) return false;
  if (risk.stopLossATR <= 0) return false;
  if (risk.takeProfitATR <= 0) return false;
  
  return true;
}

// Helper function to merge parameter updates
export function mergeParameters(
  base: UnifiedStrategyParameters,
  updates: Partial<UnifiedStrategyParameters>
): UnifiedStrategyParameters {
  return {
    rsi: { ...base.rsi, ...updates.rsi },
    ma: { ...base.ma, ...updates.ma },
    risk: { ...base.risk, ...updates.risk },
    confirmation: { ...base.confirmation, ...updates.confirmation },
    optimization: { ...base.optimization, ...updates.optimization }
  };
}

// Get parameter explanation for UI
export function getParameterExplanation(paramPath: string): string {
  const explanations: Record<string, string> = {
    'rsi.lookback': 'Number of periods for RSI calculation (2 for ultra-aggressive, 3-5 for aggressive, 14+ for conservative)',
    'rsi.oversoldEntry': 'RSI level to enter long positions (lower = more selective)',
    'rsi.oversoldExit': 'RSI level to exit oversold longs',
    'rsi.overboughtEntry': 'RSI level to enter short positions (higher = more selective)',
    'rsi.overboughtExit': 'RSI level to exit overbought shorts',
    'ma.shortPeriod': 'Fast moving average period for trend detection',
    'ma.longPeriod': 'Slow moving average period for trend confirmation',
    'risk.positionSize': 'Percentage of capital to risk per trade',
    'risk.stopLossATR': 'Stop loss distance in ATR multiples',
    'risk.takeProfitATR': 'Take profit distance in ATR multiples',
    'confirmation.requiredBars': 'Number of bars to confirm signal before entry',
    'optimization.learningRate': 'How quickly to adapt to new market data (0.01-1.0)'
  };
  
  return explanations[paramPath] || 'Parameter for strategy optimization';
}
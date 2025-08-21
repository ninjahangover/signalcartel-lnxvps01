/**
 * Competition Strategy Registry with UNIQUE parameters for each strategy
 * 
 * Each strategy has its own unique approach and parameters
 */

import { CRYPTO_TRADING_PAIRS, POPULAR_PAIRS, isValidTradingPair } from './crypto-trading-pairs';

// Base interface for common strategy properties
export interface BaseStrategy {
  id: string;
  name: string;
  description: string;
  symbol: string;
  timeframe: string;
  webhookUrl: string;
  status: 'ACTIVE' | 'PAUSED' | 'OPTIMIZING' | 'ERROR';
  
  // Performance tracking (common to all)
  performance: {
    totalTrades: number;
    winningTrades: number;
    winRate: number;
    totalProfit: number;
    avgProfitPerTrade: number;
    maxDrawdown: number;
    sharpeRatio: number;
    profitFactor: number;
    lastTradeTime?: Date;
  };
  
  // Optimization metadata (common to all)
  optimization: {
    lastOptimized: Date;
    optimizationCount: number;
    currentOptimizationCycle: number;
    aiConfidence: number;
    expectedImprovement: number;
    recentOptimizations: Array<{
      timestamp: Date;
      parameter: string;
      oldValue: any;
      newValue: any;
      reason: string;
      impact: number;
    }>;
  };
  
  // Pine Script code generation (common to all)
  pineScript: {
    version: string;
    lastGenerated: Date;
    template: string;
    generatedCode: string;
  };
}

// RSI Pullback Pro Strategy - User's proven strategy
export interface RSIPullbackStrategy extends BaseStrategy {
  inputs: {
    // RSI Settings (Core to this strategy)
    rsi_length: number;
    rsi_overbought: number;
    rsi_oversold: number;
    rsi_smoothing: number;
    
    // Moving Average Confirmation
    ma_short_period: number;
    ma_long_period: number;
    ma_type: 'EMA' | 'SMA' | 'WMA';
    
    // Pullback Detection
    pullback_depth: number;      // Minimum pullback depth %
    pullback_confirmation: number; // Bars to confirm pullback
    
    // Risk Management
    stop_loss_percent: number;
    take_profit_percent: number;
    position_size_percent: number;
    
    // Entry Filters
    min_volume_ratio: number;     // Volume vs average
    trend_alignment: boolean;     // Must align with trend
    avoid_resistance: boolean;    // Avoid major resistance levels
  };
}

// Claude Quantum Oscillator Strategy - Multi-factor confluence
export interface ClaudeQuantumStrategy extends BaseStrategy {
  inputs: {
    // Quantum Oscillator (Unique to this strategy)
    quantum_period: number;       // Main oscillator period
    quantum_multiplier: number;   // Oscillator sensitivity
    quantum_threshold: number;    // Signal threshold
    
    // Multi-Factor Analysis
    confluence_factors: number;   // Required aligned factors (2-5)
    factor_weights: {
      momentum: number;          // Weight for momentum factor
      volume: number;            // Weight for volume factor  
      volatility: number;        // Weight for volatility factor
      sentiment: number;         // Weight for market sentiment
      correlation: number;       // Weight for correlation factor
    };
    
    // Wave Analysis
    wave_period_short: number;   // Short wave period
    wave_period_medium: number;  // Medium wave period
    wave_period_long: number;    // Long wave period
    wave_amplitude_min: number;  // Minimum wave amplitude
    
    // Entry Conditions
    confluence_score_min: number; // Minimum score to enter (0-100)
    hold_period_bars: number;    // Minimum hold period
    
    // Dynamic Risk Management
    dynamic_stop_loss: boolean;  // Adjust stops based on volatility
    stop_loss_atr_mult: number;  // ATR multiplier for stops
    take_profit_atr_mult: number; // ATR multiplier for targets
    position_size_percent: number;
    
    // Market Regime Filter
    regime_filter: boolean;      // Enable regime filtering
    bullish_only: boolean;       // Only trade in bullish regimes
    volatility_cap: number;      // Max volatility to trade
  };
}

// Stratus Core Neural Engine - AI-driven with neural network
export interface StratusCoreNeuralStrategy extends BaseStrategy {
  inputs: {
    // Neural Network Configuration (Unique to this strategy)
    neural_layers: number;        // Number of neural layers (2-5)
    neurons_per_layer: number;    // Neurons in each layer
    learning_rate: number;        // Neural learning rate
    training_lookback: number;    // Bars for training data
    
    // Pattern Recognition
    pattern_library_size: number; // Number of patterns to track
    pattern_match_threshold: number; // Min similarity score (0-1)
    pattern_types: {
      candlestick: boolean;       // Candlestick patterns
      harmonic: boolean;          // Harmonic patterns
      elliott_wave: boolean;      // Elliott wave patterns
      wyckoff: boolean;          // Wyckoff patterns
      fractal: boolean;          // Fractal patterns
    };
    
    // AI Prediction Engine
    prediction_horizon: number;   // Bars to predict ahead
    confidence_threshold: number; // Min confidence to trade (0-1)
    ensemble_models: number;      // Number of models in ensemble
    
    // Adaptive Parameters
    adaptive_mode: boolean;       // Enable self-adaptation
    adaptation_speed: number;     // How fast to adapt (0.01-1.0)
    memory_length: number;        // Market memory in bars
    
    // Smart Risk Management
    ml_stop_loss: boolean;        // ML-calculated stops
    ml_position_sizing: boolean;  // ML-calculated position size
    base_position_percent: number; // Base position size
    max_position_percent: number; // Max position size
    risk_per_trade: number;       // Max risk per trade %
    
    // Market Microstructure
    orderflow_analysis: boolean;  // Analyze order flow
    liquidity_threshold: number;  // Min liquidity score
    spread_filter: number;        // Max spread to trade
    
    // Sentiment Integration
    sentiment_weight: number;     // Weight of sentiment (0-1)
    news_impact_decay: number;    // News impact decay rate
  };
}

// Union type for all strategies
export type PineScriptStrategy = RSIPullbackStrategy | ClaudeQuantumStrategy | StratusCoreNeuralStrategy;

export class CompetitionStrategyRegistry {
  private static instance: CompetitionStrategyRegistry;
  private strategies: Map<string, PineScriptStrategy> = new Map();
  private listeners: Set<() => void> = new Set();

  private constructor() {
    this.initializeCompetitionStrategies();
  }

  static getInstance(): CompetitionStrategyRegistry {
    if (!CompetitionStrategyRegistry.instance) {
      CompetitionStrategyRegistry.instance = new CompetitionStrategyRegistry();
    }
    return CompetitionStrategyRegistry.instance;
  }

  // Initialize with competition strategies only
  private initializeCompetitionStrategies(): void {
    const rsiStrategy: RSIPullbackStrategy = {
      id: 'rsi-pullback-pro',
      name: 'RSI Pullback Pro',
      description: 'User\'s proven RSI strategy with ultra-aggressive 2-period RSI and tight entry levels',
      symbol: 'BTCUSD',
      timeframe: '5m',
      webhookUrl: 'https://kraken.circuitcartel.com/webhook/strategy/rsi-pullback-001',
      status: 'ACTIVE',
      inputs: {
        // RSI Settings (User's preferred ultra-aggressive settings)
        rsi_length: 2,
        rsi_overbought: 72,
        rsi_oversold: 28,
        rsi_smoothing: 3,
        
        // Moving Average Confirmation
        ma_short_period: 20,
        ma_long_period: 50,
        ma_type: 'EMA',
        
        // Pullback Detection
        pullback_depth: 3.0,      // 3% minimum pullback
        pullback_confirmation: 2,  // 2 bars to confirm
        
        // Risk Management
        stop_loss_percent: 2.0,
        take_profit_percent: 3.0,
        position_size_percent: 1.5,
        
        // Entry Filters
        min_volume_ratio: 1.2,
        trend_alignment: true,
        avoid_resistance: false
      },
      performance: {
        totalTrades: 0,
        winningTrades: 0,
        winRate: 0,
        totalProfit: 0,
        avgProfitPerTrade: 0,
        maxDrawdown: 0,
        sharpeRatio: 0,
        profitFactor: 0
      },
      optimization: {
        lastOptimized: new Date(),
        optimizationCount: 0,
        currentOptimizationCycle: 1,
        aiConfidence: 0.5,
        expectedImprovement: 0,
        recentOptimizations: []
      },
      pineScript: {
        version: '5',
        lastGenerated: new Date(),
        template: 'rsi_pullback_pro_template',
        generatedCode: ''
      }
    };

    const claudeStrategy: ClaudeQuantumStrategy = {
      id: 'claude-quantum-oscillator',
      name: 'Claude Quantum Oscillator',
      description: 'Multi-factor confluence strategy with quantum oscillator and wave analysis',
      symbol: 'BTCUSD',
      timeframe: '5m',
      webhookUrl: 'https://kraken.circuitcartel.com/webhook/strategy/claude-quantum-001',
      status: 'ACTIVE',
      inputs: {
        // Quantum Oscillator
        quantum_period: 21,
        quantum_multiplier: 2.5,
        quantum_threshold: 0.75,
        
        // Multi-Factor Analysis
        confluence_factors: 3,
        factor_weights: {
          momentum: 0.25,
          volume: 0.20,
          volatility: 0.20,
          sentiment: 0.15,
          correlation: 0.20
        },
        
        // Wave Analysis
        wave_period_short: 8,
        wave_period_medium: 21,
        wave_period_long: 55,
        wave_amplitude_min: 0.5,
        
        // Entry Conditions
        confluence_score_min: 70,
        hold_period_bars: 3,
        
        // Dynamic Risk Management
        dynamic_stop_loss: true,
        stop_loss_atr_mult: 1.5,
        take_profit_atr_mult: 3.0,
        position_size_percent: 2.0,
        
        // Market Regime Filter
        regime_filter: true,
        bullish_only: false,
        volatility_cap: 0.05
      },
      performance: {
        totalTrades: 0,
        winningTrades: 0,
        winRate: 0,
        totalProfit: 0,
        avgProfitPerTrade: 0,
        maxDrawdown: 0,
        sharpeRatio: 0,
        profitFactor: 0
      },
      optimization: {
        lastOptimized: new Date(),
        optimizationCount: 0,
        currentOptimizationCycle: 1,
        aiConfidence: 0.5,
        expectedImprovement: 0,
        recentOptimizations: []
      },
      pineScript: {
        version: '5',
        lastGenerated: new Date(),
        template: 'claude_quantum_template',
        generatedCode: ''
      }
    };

    const stratusStrategy: StratusCoreNeuralStrategy = {
      id: 'stratus-core-neural',
      name: 'Stratus Core Neural Engine',
      description: 'AI-driven strategy with 4-layer neural network and adaptive pattern recognition',
      symbol: 'BTCUSD',
      timeframe: '5m',
      webhookUrl: 'https://kraken.circuitcartel.com/webhook/strategy/stratus-neural-001',
      status: 'ACTIVE',
      inputs: {
        // Neural Network Configuration
        neural_layers: 4,
        neurons_per_layer: 32,
        learning_rate: 0.001,
        training_lookback: 500,
        
        // Pattern Recognition
        pattern_library_size: 50,
        pattern_match_threshold: 0.80,
        pattern_types: {
          candlestick: true,
          harmonic: true,
          elliott_wave: false,
          wyckoff: true,
          fractal: true
        },
        
        // AI Prediction Engine
        prediction_horizon: 5,
        confidence_threshold: 0.75,
        ensemble_models: 3,
        
        // Adaptive Parameters
        adaptive_mode: true,
        adaptation_speed: 0.1,
        memory_length: 1000,
        
        // Smart Risk Management
        ml_stop_loss: true,
        ml_position_sizing: true,
        base_position_percent: 2.5,
        max_position_percent: 5.0,
        risk_per_trade: 2.0,
        
        // Market Microstructure
        orderflow_analysis: true,
        liquidity_threshold: 0.7,
        spread_filter: 0.002,
        
        // Sentiment Integration
        sentiment_weight: 0.3,
        news_impact_decay: 0.95
      },
      performance: {
        totalTrades: 0,
        winningTrades: 0,
        winRate: 0,
        totalProfit: 0,
        avgProfitPerTrade: 0,
        maxDrawdown: 0,
        sharpeRatio: 0,
        profitFactor: 0
      },
      optimization: {
        lastOptimized: new Date(),
        optimizationCount: 0,
        currentOptimizationCycle: 1,
        aiConfidence: 0.5,
        expectedImprovement: 0,
        recentOptimizations: []
      },
      pineScript: {
        version: '5',
        lastGenerated: new Date(),
        template: 'stratus_neural_template',
        generatedCode: ''
      }
    };

    // Store all strategies
    this.strategies.set(rsiStrategy.id, rsiStrategy);
    this.strategies.set(claudeStrategy.id, claudeStrategy);
    this.strategies.set(stratusStrategy.id, stratusStrategy);

    console.log(`🎯 Competition Strategy Registry initialized with ${this.strategies.size} UNIQUE strategies`);
    console.log('📊 Strategy Types:', {
      'RSI Pullback Pro': 'RSI-based with pullback detection',
      'Claude Quantum': 'Multi-factor confluence with wave analysis',
      'Stratus Neural': 'AI neural network with pattern recognition'
    });
  }

  // Helper to identify strategy type
  getStrategyType(strategy: PineScriptStrategy): 'rsi' | 'quantum' | 'neural' {
    if ('rsi_length' in strategy.inputs) return 'rsi';
    if ('quantum_period' in strategy.inputs) return 'quantum';
    if ('neural_layers' in strategy.inputs) return 'neural';
    return 'rsi'; // default fallback
  }

  // Get all strategies
  getAllStrategies(): PineScriptStrategy[] {
    return Array.from(this.strategies.values());
  }

  // Get active strategies
  getActiveStrategies(): PineScriptStrategy[] {
    return this.getAllStrategies().filter(strategy => strategy.status === 'ACTIVE');
  }

  // Get strategy by ID
  getStrategy(strategyId: string): PineScriptStrategy | undefined {
    return this.strategies.get(strategyId);
  }

  // Get strategies that need optimization
  getOptimizationCandidates(): PineScriptStrategy[] {
    return this.getActiveStrategies();
  }

  // Update strategy inputs (type-safe)
  updateStrategyInputs(strategyId: string, newInputs: any): boolean {
    const strategy = this.strategies.get(strategyId);
    if (!strategy) return false;
    
    // Type-safe update based on strategy type
    const strategyType = this.getStrategyType(strategy);
    
    // Merge inputs appropriately based on type
    strategy.inputs = { ...strategy.inputs, ...newInputs };
    strategy.optimization.lastOptimized = new Date();
    strategy.optimization.optimizationCount++;
    
    this.strategies.set(strategyId, strategy);
    this.notifyListeners();
    return true;
  }

  // Update strategy performance
  updateStrategyPerformance(strategyId: string, tradeResult: {
    won: boolean;
    profit: number;
    entryPrice: number;
    exitPrice: number;
  }): boolean {
    const strategy = this.strategies.get(strategyId);
    if (!strategy) return false;
    
    strategy.performance.totalTrades++;
    if (tradeResult.won) {
      strategy.performance.winningTrades++;
    }
    strategy.performance.winRate = (strategy.performance.winningTrades / strategy.performance.totalTrades) * 100;
    strategy.performance.totalProfit += tradeResult.profit;
    strategy.performance.avgProfitPerTrade = strategy.performance.totalProfit / strategy.performance.totalTrades;
    strategy.performance.lastTradeTime = new Date();
    
    this.strategies.set(strategyId, strategy);
    this.notifyListeners();
    return true;
  }

  // Generate Pine Script code based on strategy type
  generatePineScriptCode(strategyId: string): string {
    const strategy = this.strategies.get(strategyId);
    if (!strategy) return '';
    
    const strategyType = this.getStrategyType(strategy);
    
    switch (strategyType) {
      case 'rsi':
        return this.generateRSIPineScript(strategy as RSIPullbackStrategy);
      case 'quantum':
        return this.generateQuantumPineScript(strategy as ClaudeQuantumStrategy);
      case 'neural':
        return this.generateNeuralPineScript(strategy as StratusCoreNeuralStrategy);
      default:
        return `// ${strategy.name}\n// Strategy ID: ${strategyId}`;
    }
  }

  private generateRSIPineScript(strategy: RSIPullbackStrategy): string {
    const inputs = strategy.inputs;
    return `
//@version=5
strategy("${strategy.name}", overlay=true)

// RSI Pullback Strategy Inputs
rsi_length = input.int(${inputs.rsi_length}, "RSI Period", minval=2, maxval=50)
rsi_oversold = input.float(${inputs.rsi_oversold}, "RSI Oversold", minval=10, maxval=40)
rsi_overbought = input.float(${inputs.rsi_overbought}, "RSI Overbought", minval=60, maxval=90)
rsi_smoothing = input.int(${inputs.rsi_smoothing}, "RSI Smoothing", minval=1, maxval=10)

// Moving Average Settings
ma_short = input.int(${inputs.ma_short_period}, "Short MA Period")
ma_long = input.int(${inputs.ma_long_period}, "Long MA Period")

// Pullback Settings
pullback_depth = input.float(${inputs.pullback_depth}, "Pullback Depth %", minval=1, maxval=10)
pullback_bars = input.int(${inputs.pullback_confirmation}, "Pullback Confirmation Bars")

// Risk Management
stop_loss = input.float(${inputs.stop_loss_percent}, "Stop Loss %", minval=0.5, maxval=10)
take_profit = input.float(${inputs.take_profit_percent}, "Take Profit %", minval=1, maxval=20)

// Calculate indicators
rsi = ta.rsi(close, rsi_length)
rsi_smooth = ta.sma(rsi, rsi_smoothing)
ma_short_val = ta.${inputs.ma_type.toLowerCase()}(close, ma_short)
ma_long_val = ta.${inputs.ma_type.toLowerCase()}(close, ma_long)

// Pullback detection
pullback = (close - ta.highest(high, 20)) / ta.highest(high, 20) * 100 < -pullback_depth

// Entry conditions
long_condition = rsi_smooth < rsi_oversold and pullback and close > ma_long_val
short_condition = rsi_smooth > rsi_overbought and close < ma_long_val

// Execute trades
if (long_condition)
    strategy.entry("Long", strategy.long)
    
if (short_condition)
    strategy.entry("Short", strategy.short)

// Exit conditions
strategy.exit("Exit Long", "Long", profit=close * (1 + take_profit/100), loss=close * (1 - stop_loss/100))
strategy.exit("Exit Short", "Short", profit=close * (1 - take_profit/100), loss=close * (1 + stop_loss/100))
`;
  }

  private generateQuantumPineScript(strategy: ClaudeQuantumStrategy): string {
    const inputs = strategy.inputs;
    return `
//@version=5
strategy("${strategy.name}", overlay=true)

// Quantum Oscillator Settings
quantum_period = input.int(${inputs.quantum_period}, "Quantum Period", minval=5, maxval=50)
quantum_mult = input.float(${inputs.quantum_multiplier}, "Quantum Multiplier", minval=1, maxval=5)
quantum_thresh = input.float(${inputs.quantum_threshold}, "Quantum Threshold", minval=0.5, maxval=1)

// Wave Analysis
wave_short = input.int(${inputs.wave_period_short}, "Short Wave Period")
wave_medium = input.int(${inputs.wave_period_medium}, "Medium Wave Period")
wave_long = input.int(${inputs.wave_period_long}, "Long Wave Period")

// Confluence Settings
confluence_min = input.float(${inputs.confluence_score_min}, "Min Confluence Score", minval=50, maxval=100)
hold_bars = input.int(${inputs.hold_period_bars}, "Minimum Hold Period")

// Calculate Quantum Oscillator
basis = ta.sma(close, quantum_period)
dev = quantum_mult * ta.stdev(close, quantum_period)
quantum_upper = basis + dev
quantum_lower = basis - dev
quantum_osc = (close - quantum_lower) / (quantum_upper - quantum_lower)

// Wave Analysis
wave1 = ta.ema(close, wave_short)
wave2 = ta.ema(close, wave_medium)
wave3 = ta.ema(close, wave_long)

// Multi-factor confluence scoring
momentum_score = ta.rsi(close, 14) > 50 ? ${inputs.factor_weights.momentum * 100} : 0
volume_score = volume > ta.sma(volume, 20) ? ${inputs.factor_weights.volume * 100} : 0
volatility_score = ta.atr(14) / close < ${inputs.volatility_cap} ? ${inputs.factor_weights.volatility * 100} : 0

confluence_score = momentum_score + volume_score + volatility_score

// Entry signals
long_signal = quantum_osc > quantum_thresh and confluence_score >= confluence_min and wave1 > wave2
short_signal = quantum_osc < (1 - quantum_thresh) and confluence_score >= confluence_min and wave1 < wave2

// Execute trades with dynamic stops
if (long_signal)
    strategy.entry("Quantum Long", strategy.long)
    
if (short_signal)
    strategy.entry("Quantum Short", strategy.short)

// Dynamic exit management
atr = ta.atr(14)
long_stop = close - (atr * ${inputs.stop_loss_atr_mult})
long_target = close + (atr * ${inputs.take_profit_atr_mult})

strategy.exit("Exit QL", "Quantum Long", stop=long_stop, limit=long_target)
`;
  }

  private generateNeuralPineScript(strategy: StratusCoreNeuralStrategy): string {
    const inputs = strategy.inputs;
    return `
//@version=5
strategy("${strategy.name}", overlay=true)

// Neural Network Configuration
lookback = input.int(${inputs.training_lookback}, "Training Lookback", minval=100, maxval=1000)
confidence_thresh = input.float(${inputs.confidence_threshold}, "Confidence Threshold", minval=0.5, maxval=1)
prediction_horizon = input.int(${inputs.prediction_horizon}, "Prediction Horizon", minval=1, maxval=10)

// Pattern Recognition
pattern_threshold = input.float(${inputs.pattern_match_threshold}, "Pattern Match Threshold", minval=0.5, maxval=1)

// Adaptive Settings
adaptive = input.bool(${inputs.adaptive_mode}, "Adaptive Mode")
adapt_speed = input.float(${inputs.adaptation_speed}, "Adaptation Speed", minval=0.01, maxval=1)

// Smart Risk Management
base_position = input.float(${inputs.base_position_percent}, "Base Position %", minval=1, maxval=10)
max_position = input.float(${inputs.max_position_percent}, "Max Position %", minval=1, maxval=20)

// Simulated Neural Network Output (in real implementation, this would be ML-calculated)
// For Pine Script, we'll use a combination of indicators to simulate neural behavior

// Feature extraction for neural network
feature1 = ta.rsi(close, 14) / 100
feature2 = (close - ta.sma(close, 20)) / ta.stdev(close, 20)
feature3 = ta.atr(14) / close
feature4 = volume / ta.sma(volume, 20)

// Simulate neural network layers (simplified)
layer1 = (feature1 * 0.3 + feature2 * 0.3 + feature3 * 0.2 + feature4 * 0.2)
layer2 = math.tanh(layer1 * 2)
layer3 = (layer2 + ta.sma(layer2, 5)) / 2
neural_output = (layer3 + 1) / 2  // Normalize to 0-1

// Pattern recognition (simplified)
bullish_pattern = ta.crossover(ta.ema(close, 9), ta.ema(close, 21))
bearish_pattern = ta.crossunder(ta.ema(close, 9), ta.ema(close, 21))

// Combine neural output with pattern recognition
bull_confidence = neural_output * (bullish_pattern ? 1 : 0.5)
bear_confidence = (1 - neural_output) * (bearish_pattern ? 1 : 0.5)

// Adaptive position sizing
volatility_factor = ta.atr(14) / close
adapted_position = adaptive ? base_position * (1 + adapt_speed * (1 - volatility_factor)) : base_position
final_position = math.min(adapted_position, max_position)

// Entry signals with confidence threshold
long_signal = bull_confidence > confidence_thresh
short_signal = bear_confidence > confidence_thresh

// Execute trades
if (long_signal)
    strategy.entry("Neural Long", strategy.long, qty=final_position)
    
if (short_signal)
    strategy.entry("Neural Short", strategy.short, qty=final_position)

// ML-based exit (simplified)
ml_stop_distance = ta.atr(14) * 2
ml_target_distance = ta.atr(14) * 4

strategy.exit("Exit NL", "Neural Long", 
    stop=close - ml_stop_distance,
    limit=close + ml_target_distance)
strategy.exit("Exit NS", "Neural Short",
    stop=close + ml_stop_distance,
    limit=close - ml_target_distance)
`;
  }

  // Update strategy status
  updateStrategyStatus(strategyId: string, newStatus: 'ACTIVE' | 'PAUSED' | 'OPTIMIZING' | 'ERROR'): boolean {
    const strategy = this.strategies.get(strategyId);
    if (!strategy) return false;
    
    strategy.status = newStatus;
    this.strategies.set(strategyId, strategy);
    this.notifyListeners();
    return true;
  }

  // Subscribe to strategy updates
  subscribe(callback: () => void): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  // Add listener (for backward compatibility)
  addListener(callback: () => void): void {
    this.listeners.add(callback);
  }

  // Remove listener (for backward compatibility)
  removeListener(callback: () => void): void {
    this.listeners.delete(callback);
  }

  private notifyListeners(): void {
    this.listeners.forEach(callback => callback());
  }
}

// Export the singleton instance and helper functions
export const competitionStrategyRegistry = CompetitionStrategyRegistry.getInstance();
export const getAllStrategies = () => competitionStrategyRegistry.getAllStrategies();
export const getActiveStrategies = () => competitionStrategyRegistry.getActiveStrategies();
export const getStrategy = (id: string) => competitionStrategyRegistry.getStrategy(id);
export const getOptimizationCandidates = () => competitionStrategyRegistry.getOptimizationCandidates();
export const updateStrategyInputs = (id: string, inputs: any) => competitionStrategyRegistry.updateStrategyInputs(id, inputs);
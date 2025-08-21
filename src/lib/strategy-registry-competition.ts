/**
 * Competition Strategy Registry
 * 
 * Contains only the 3 competition strategies for clean testing
 */

import { CRYPTO_TRADING_PAIRS, POPULAR_PAIRS, isValidTradingPair } from './crypto-trading-pairs';

export interface PineScriptStrategy {
  id: string;
  name: string;
  description: string;
  symbol: string;
  timeframe: string;
  webhookUrl: string;
  status: 'ACTIVE' | 'PAUSED' | 'OPTIMIZING' | 'ERROR';
  
  // Current strategy inputs (these get optimized by Stratus Engine)
  // Each strategy has COMPLETELY DIFFERENT parameters
  inputs: any; // Will be specific to each strategy type
  
  // Performance tracking
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
  
  // Optimization metadata
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
  
  // Pine Script code generation
  pineScript: {
    version: string;
    lastGenerated: Date;
    template: string;
    generatedCode: string;
  };
}

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
    const competitionStrategies: PineScriptStrategy[] = [
      {
        id: 'rsi-pullback-pro',
        name: 'RSI Pullback Pro',
        description: 'User\'s proven RSI strategy with ultra-aggressive 2-period RSI and tight entry levels',
        symbol: 'BTCUSD',
        timeframe: '5m',
        webhookUrl: 'https://kraken.circuitcartel.com/webhook/strategy/rsi-pullback-001',
        status: 'ACTIVE',
        inputs: {
          // RSI Settings (KEEPING ORIGINAL RSI STRATEGY)
          rsi_length: 2,      // User's preferred ultra-aggressive RSI
          rsi_overbought: 72, // User's preferred exit levels
          rsi_oversold: 28,   // User's preferred entry levels
          macd_fast: 12,
          macd_slow: 26,
          macd_signal: 9,
          ema_length: 20,
          sma_length: 50,
          stop_loss_percent: 2.0,
          take_profit_percent: 3.0,
          risk_reward_ratio: 1.5,
          position_size_percent: 1.5,
          max_positions: 3,
          momentum_threshold: 0.5,
          volume_threshold: 1.2,
          volatility_filter: 0.02,
          enable_session_filter: false,
          start_hour: 0,
          end_hour: 23,
          enable_weekend_trading: true,
          enable_pyramiding: false,
          max_pyramid_levels: 1,
          trend_filter_enabled: true,
          min_trend_strength: 0.5
        },
        performance: {
          totalTrades: 0,     // Start fresh for competition
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
      },
      {
        id: 'claude-quantum-oscillator',
        name: 'Claude Quantum Oscillator',
        description: 'Multi-factor confluence strategy with volume analysis and quantum oscillator',
        symbol: 'BTCUSD',
        timeframe: '5m',
        webhookUrl: 'https://kraken.circuitcartel.com/webhook/strategy/claude-quantum-oscillator-001',
        status: 'ACTIVE',
        inputs: {
          // UNIQUE QUANTUM OSCILLATOR PARAMETERS (NO RSI!)
          quantum_period: 21,        // Quantum oscillator main period
          quantum_multiplier: 2.5,   // Oscillator sensitivity multiplier
          quantum_threshold: 0.75,   // Signal threshold (0-1)
          
          // Multi-Factor Confluence Analysis
          confluence_factors: 3,     // Required aligned factors to trade
          momentum_weight: 0.25,     // Weight for momentum factor
          volume_weight: 0.20,       // Weight for volume analysis
          volatility_weight: 0.20,   // Weight for volatility factor
          sentiment_weight: 0.15,    // Weight for market sentiment
          correlation_weight: 0.20,  // Weight for correlation analysis
          
          // Wave Pattern Analysis
          wave_period_short: 8,      // Short wave period
          wave_period_medium: 21,    // Medium wave period  
          wave_period_long: 55,      // Long wave period
          wave_amplitude_min: 0.5,   // Minimum wave amplitude
          
          // Entry/Exit Conditions
          confluence_score_min: 70,  // Min score (0-100) to enter
          hold_period_bars: 3,       // Minimum bars to hold position
          
          // Dynamic Risk Management
          dynamic_stop_loss: true,   // Use ATR-based stops
          stop_loss_atr_mult: 1.5,   // ATR multiplier for stops
          take_profit_atr_mult: 3.0, // ATR multiplier for targets
          position_size_percent: 2.0,
          
          // Market Regime Filters
          regime_filter: true,       // Enable regime filtering
          bullish_only: false,       // Trade all market conditions
          volatility_cap: 0.05       // Max volatility to trade
        },
        performance: {
          totalTrades: 0,     // Start fresh for competition
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
          template: 'claude_quantum_oscillator_template',
          generatedCode: ''
        }
      },
      {
        id: 'stratus-core-neural',
        name: 'Stratus Core Neural Engine',
        description: 'AI-driven strategy with 4-layer neural network and adaptive parameters',
        symbol: 'BTCUSD',
        timeframe: '5m',
        webhookUrl: 'https://kraken.circuitcartel.com/webhook/strategy/stratus-core-neural-001',
        status: 'ACTIVE',
        inputs: {
          // UNIQUE NEURAL NETWORK PARAMETERS (NO RSI!)
          neural_layers: 4,          // Number of neural network layers
          neurons_per_layer: 32,     // Neurons in each layer
          learning_rate: 0.001,      // Neural network learning rate
          training_lookback: 500,    // Bars of training data
          
          // Pattern Recognition Engine
          pattern_library_size: 50,  // Number of patterns to track
          pattern_match_threshold: 0.80, // Min similarity (0-1)
          enable_candlestick: true,  // Candlestick patterns
          enable_harmonic: true,     // Harmonic patterns
          enable_elliott: false,     // Elliott wave patterns
          enable_wyckoff: true,      // Wyckoff patterns
          enable_fractal: true,      // Fractal patterns
          
          // AI Prediction Settings
          prediction_horizon: 5,     // Bars to predict ahead
          confidence_threshold: 0.75, // Min confidence to trade
          ensemble_models: 3,        // Number of models in ensemble
          
          // Adaptive Learning
          adaptive_mode: true,       // Enable self-adaptation
          adaptation_speed: 0.1,     // How fast to adapt (0.01-1.0)
          memory_length: 1000,       // Market memory in bars
          
          // Smart Risk Management
          ml_stop_loss: true,        // ML-calculated stops
          ml_position_sizing: true,  // ML-calculated position size
          base_position_percent: 2.5,
          max_position_percent: 5.0,
          risk_per_trade: 2.0,
          
          // Market Microstructure
          orderflow_analysis: true,  // Analyze order flow
          liquidity_threshold: 0.7,  // Min liquidity score (0-1)
          spread_filter: 0.002,      // Max spread to trade
          
          // Sentiment Integration
          sentiment_analysis: true,  // Use sentiment data
          sentiment_weight: 0.3,     // Weight of sentiment (0-1)
          news_impact_decay: 0.95    // News impact decay rate
        },
        performance: {
          totalTrades: 0,     // Start fresh for competition
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
          template: 'stratus_core_neural_template',
          generatedCode: ''
        }
      }
    ];

    competitionStrategies.forEach(strategy => {
      this.strategies.set(strategy.id, strategy);
    });

    console.log(`🎯 Competition Strategy Registry initialized with ${competitionStrategies.length} strategies`);
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

  // Get strategies that need optimization (simplified for competition)
  getOptimizationCandidates(): PineScriptStrategy[] {
    return this.getActiveStrategies();
  }

  // Update strategy inputs (simplified for competition)
  updateStrategyInputs(strategyId: string, newInputs: any): boolean {
    const strategy = this.strategies.get(strategyId);
    if (!strategy) return false;
    
    strategy.inputs = { ...strategy.inputs, ...newInputs };
    strategy.optimization.lastOptimized = new Date();
    strategy.optimization.optimizationCount++;
    
    this.strategies.set(strategyId, strategy);
    this.notifyListeners();
    return true;
  }

  // Generate Pine Script code (simplified for competition)
  generatePineScriptCode(strategyId: string): string {
    const strategy = this.strategies.get(strategyId);
    if (!strategy) return '';
    
    return `// ${strategy.name} - Generated for Competition\n// Strategy ID: ${strategyId}`;
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

  // Add listener (for backward compatibility)
  addListener(callback: () => void): void {
    this.listeners.add(callback);
  }

  // Remove listener (for backward compatibility)
  removeListener(callback: () => void): void {
    this.listeners.delete(callback);
  }

  // Subscribe to strategy updates
  subscribe(callback: () => void): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
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
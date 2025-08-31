/**
 * Pine Script Trading Strategies Registry
 * 
 * Contains the 3 main Pine Script trading strategies with their baseline parameters
 */

export interface PineScriptStrategy {
  id: string;
  name: string;
  description: string;
  symbol: string;
  timeframe: string;
  webhookUrl: string;
  status: 'ACTIVE' | 'PAUSED' | 'OPTIMIZING' | 'ERROR';
  
  // Baseline strategy parameters
  inputs: {
    // RSI Parameters (Your 95% win rate setup)
    rsi_lookback?: number;          // RSI Lookback = 2
    rsi_lower_barrier?: number;     // Lower Barrier = 43  
    rsi_lower_threshold?: number;   // Lower Threshold = 65
    rsi_upper_barrier?: number;     // Upper Barrier = 45
    rsi_upper_threshold?: number;   // Upper Threshold = 72
    ma_length?: number;             // MA Length = 70
    atr_stop_loss?: number;         // ATR Multiplier for Stop-Loss = 11
    atr_take_profit?: number;       // ATR Multiplier for Take-Profit = 2
    
    // Standard Technical Indicators
    rsi_length?: number;
    rsi_overbought?: number;
    rsi_oversold?: number;
    macd_fast?: number;
    macd_slow?: number;
    macd_signal?: number;
    ema_length?: number;
    sma_length?: number;
    
    // Risk Management
    stop_loss_percent?: number;
    take_profit_percent?: number;
    risk_reward_ratio?: number;
    position_size_percent?: number;
    max_positions?: number;
    
    // Advanced Parameters
    stochastic_k?: number;
    stochastic_d?: number;
    bollinger_length?: number;
    bollinger_std?: number;
    volume_threshold?: number;
    volatility_filter?: number;
    momentum_threshold?: number;
    
    // Session Filters
    enable_session_filter?: boolean;
    start_hour?: number;
    end_hour?: number;
    enable_weekend_trading?: boolean;
    
    // Strategy-specific
    enable_pyramiding?: boolean;
    max_pyramid_levels?: number;
    trend_filter_enabled?: boolean;
    min_trend_strength?: number;
  };
}

export class PineScriptStrategyRegistry {
  private static instance: PineScriptStrategyRegistry | null = null;
  private strategies: Map<string, PineScriptStrategy> = new Map();

  private constructor() {
    this.initializeStrategies();
  }

  static getInstance(): PineScriptStrategyRegistry {
    if (!PineScriptStrategyRegistry.instance) {
      PineScriptStrategyRegistry.instance = new PineScriptStrategyRegistry();
    }
    return PineScriptStrategyRegistry.instance;
  }

  private initializeStrategies(): void {
    const strategies: PineScriptStrategy[] = [
      // 1. RSI Pullback Pro - Your 95% win rate strategy
      {
        id: 'rsi-pullback-pro',
        name: 'RSI Pullback Pro',
        description: 'Your proven RSI strategy with 95% win rate parameters',
        symbol: 'BTCUSD',
        timeframe: '5m',
        webhookUrl: 'https://kraken.circuitcartel.com/webhook/strategy/rsi-pullback-pro',
        status: 'ACTIVE',
        inputs: {
          // Your exact 95% win rate RSI parameters
          rsi_lookback: 2,          // RSI Lookback = 2
          rsi_lower_barrier: 43,    // Lower Barrier = 43
          rsi_lower_threshold: 65,  // Lower Threshold = 65
          rsi_upper_barrier: 45,    // Upper Barrier = 45
          rsi_upper_threshold: 72,  // Upper Threshold = 72
          ma_length: 70,            // MA Length = 70
          atr_stop_loss: 11,        // ATR Multiplier for Stop-Loss = 11
          atr_take_profit: 2,       // ATR Multiplier for Take-Profit = 2
          
          // Standard parameters
          rsi_length: 14,
          rsi_overbought: 72,
          rsi_oversold: 43,
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
          volume_threshold: 1000,
          volatility_filter: 30,
          momentum_threshold: 1.0,
          enable_session_filter: true,
          start_hour: 9,
          end_hour: 16,
          enable_weekend_trading: false,
          enable_pyramiding: false,
          max_pyramid_levels: 1,
          trend_filter_enabled: true,
          min_trend_strength: 0.5
        }
      },
      
      // 2. Claude Quantum Oscillator
      {
        id: 'claude-quantum-oscillator',
        name: 'Claude Quantum Oscillator',
        description: 'Advanced MACD + Stochastic oscillator strategy with quantum-inspired signal processing',
        symbol: 'ETHUSD',
        timeframe: '15m',
        webhookUrl: 'https://kraken.circuitcartel.com/webhook/strategy/quantum-oscillator',
        status: 'ACTIVE',
        inputs: {
          // Quantum Oscillator specific parameters
          macd_fast: 8,              // Faster MACD for quantum signals
          macd_slow: 21,             // Fibonacci-based slow period  
          macd_signal: 5,            // Quick signal line
          stochastic_k: 14,          // Stochastic %K period
          stochastic_d: 3,           // Stochastic %D smoothing
          
          // RSI confirmation with your winning parameters
          rsi_length: 14,
          rsi_overbought: 80,
          rsi_oversold: 20,
          
          // Quantum signal processing
          ema_length: 13,            // Fibonacci EMA
          sma_length: 34,            // Fibonacci SMA
          ma_length: 34,             // Fibonacci MA for trend
          
          // Risk management
          stop_loss_percent: 2.5,
          take_profit_percent: 5.0,
          risk_reward_ratio: 2.0,
          position_size_percent: 2.5,
          max_positions: 2,
          
          // Advanced oscillator parameters
          volume_threshold: 1500,
          volatility_filter: 25,
          momentum_threshold: 1.2,
          
          // Session settings
          enable_session_filter: true,
          start_hour: 8,
          end_hour: 18,
          enable_weekend_trading: false,
          enable_pyramiding: true,
          max_pyramid_levels: 2,
          trend_filter_enabled: true,
          min_trend_strength: 0.6
        }
      },
      
      // 3. Stratus Core Neural Engine
      {
        id: 'stratus-core-neural-engine',
        name: 'Stratus Core Neural Engine',
        description: 'Multi-timeframe neural network strategy with adaptive pattern recognition',
        symbol: 'SOLUSD',
        timeframe: '30m',
        webhookUrl: 'https://kraken.circuitcartel.com/webhook/strategy/stratus-neural',
        status: 'ACTIVE',
        inputs: {
          // Neural network inspired parameters
          rsi_length: 21,            // Neural RSI period
          rsi_overbought: 78,        // Neural overbought
          rsi_oversold: 22,          // Neural oversold
          
          // Multi-timeframe MACD
          macd_fast: 9,              // Neural fast period
          macd_slow: 21,             // Neural slow period
          macd_signal: 7,            // Neural signal
          
          // Adaptive moving averages
          ema_length: 25,            // Adaptive EMA
          sma_length: 55,            // Neural SMA
          ma_length: 89,             // Fibonacci neural MA
          
          // Bollinger Bands for neural signals
          bollinger_length: 20,
          bollinger_std: 2.0,
          
          // Neural risk management
          stop_loss_percent: 3.0,
          take_profit_percent: 7.5,
          risk_reward_ratio: 2.5,
          position_size_percent: 1.8,
          max_positions: 3,
          
          // Pattern recognition parameters
          volume_threshold: 2000,
          volatility_filter: 35,
          momentum_threshold: 1.5,
          
          // Neural session filters
          enable_session_filter: false,  // 24/7 neural processing
          start_hour: 0,
          end_hour: 23,
          enable_weekend_trading: true,
          enable_pyramiding: false,
          max_pyramid_levels: 1,
          trend_filter_enabled: true,
          min_trend_strength: 0.7
        }
      }
    ];

    strategies.forEach(strategy => {
      this.strategies.set(strategy.id, strategy);
    });

    console.log(`📋 Pine Script Strategy Registry initialized with ${this.strategies.size} strategies`);
  }

  // Get all strategies
  getAllStrategies(): PineScriptStrategy[] {
    return Array.from(this.strategies.values());
  }

  // Get strategy by ID
  getStrategy(id: string): PineScriptStrategy | null {
    return this.strategies.get(id) || null;
  }

  // Get active strategies
  getActiveStrategies(): PineScriptStrategy[] {
    return this.getAllStrategies().filter(strategy => strategy.status === 'ACTIVE');
  }

  // Update strategy inputs (called by AI optimization)
  updateStrategyInputs(strategyId: string, newInputs: Partial<PineScriptStrategy['inputs']>): boolean {
    const strategy = this.strategies.get(strategyId);
    if (!strategy) return false;

    strategy.inputs = { ...strategy.inputs, ...newInputs };
    console.log(`🔄 Updated strategy inputs for: ${strategy.name}`);
    return true;
  }

  // Get strategy parameters for Pine Script generation
  getStrategyParameters(strategyId: string): PineScriptStrategy['inputs'] | null {
    const strategy = this.strategies.get(strategyId);
    return strategy?.inputs || null;
  }
}

// Export singleton instance
export const pineScriptStrategyRegistry = PineScriptStrategyRegistry.getInstance();
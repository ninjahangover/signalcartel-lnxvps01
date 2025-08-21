// Centralized strategy management singleton
interface Strategy {
  id: string;
  name: string;
  type: 'ENHANCED_RSI_PULLBACK' | 'CLAUDE_QUANTUM_OSCILLATOR' | 'STRATUS_CORE_NEURAL' | 'BOLLINGER_BREAKOUT_ENHANCED' | 'RSI_PULLBACK' | 'FIBONACCI_RETRACEMENT' | 'AI_MOMENTUM';
  status: 'active' | 'paused' | 'stopped';
  config: Record<string, number | string | boolean | number[]>;
  performance: {
    totalTrades: number;
    winRate: number;
    profitLoss: number;
    sharpeRatio: number;
  };
  lastUpdated: Date;
  symbol?: string;
  // Optional Pine Script integration fields
  pineScript?: {
    source: string;
    webhookUrl: string;
    alertPayload: Record<string, any>;
    testingMode: boolean;
    lastAlert?: Date;
    alertCount?: number;
  };
}

interface OptimizationState {
  isRunning: boolean;
  currentIteration: number;
  totalIterations: number;
  bestParameters: Record<string, number | string | boolean>;
  currentPerformance: number;
  history: Array<{
    iteration: number;
    parameters: Record<string, number | string | boolean>;
    performance: number;
    timestamp: Date;
  }>;
}

interface LiveTradingState {
  isActive: boolean;
  activeStrategies: Set<string>;
  totalTrades: number;
  totalProfit: number;
  riskLevel: 'low' | 'medium' | 'high';
  lastActivity: Date | null;
}

class StrategyManager {
  private static instance: StrategyManager;
  private strategies: Map<string, Strategy> = new Map();
  private optimizationState: OptimizationState;
  private liveTradingState: LiveTradingState;
  private listeners: Set<() => void> = new Set();

  private constructor() {
    this.optimizationState = {
      isRunning: false,
      currentIteration: 0,
      totalIterations: 100,
      bestParameters: {},
      currentPerformance: 0,
      history: []
    };

    this.liveTradingState = {
      isActive: false,
      activeStrategies: new Set(),
      totalTrades: 0,
      totalProfit: 0,
      riskLevel: 'medium',
      lastActivity: null
    };

    // Initialize demo strategies
    this.initializeDemoStrategies();
  }

  static getInstance(): StrategyManager {
    if (!StrategyManager.instance) {
      StrategyManager.instance = new StrategyManager();
    }
    return StrategyManager.instance;
  }

  private initializeDemoStrategies() {
    const aggressiveStrategies: Strategy[] = [
      {
        id: 'quantum-oscillator-aggressive-001',
        name: 'Claude Quantum Oscillator (Aggressive)',
        type: 'CLAUDE_QUANTUM_OSCILLATOR',
        status: 'active',
        symbol: 'ETH/USD',
        config: {
          fastPeriod: 3,
          slowPeriod: 8,
          signalPeriod: 3,
          overboughtLevel: 60,
          oversoldLevel: 40,
          momentumThreshold: 0.8,
          volumeMultiplier: 1.1,
          stopLoss: 2.5,
          takeProfit: 3.0
        },
        performance: {
          totalTrades: 0,
          winRate: 0,
          profitLoss: 0,
          sharpeRatio: 0
        },
        lastUpdated: new Date()
      },
      {
        id: 'neural-network-aggressive-001',
        name: 'Stratus Core Neural (Aggressive)',
        type: 'STRATUS_CORE_NEURAL',
        status: 'active',
        symbol: 'SOL/USD',
        config: {
          neuralLayers: 2,
          learningRate: 0.05,
          lookbackWindow: 10,
          confidenceThreshold: 0.4,
          adaptationPeriod: 20,
          riskMultiplier: 1.5,
          stopLoss: 3.0,
          takeProfit: 4.0
        },
        performance: {
          totalTrades: 0,
          winRate: 0,
          profitLoss: 0,
          sharpeRatio: 0
        },
        lastUpdated: new Date()
      },
      {
        id: 'bollinger-breakout-aggressive-001',
        name: 'Bollinger Breakout Enhanced (Aggressive)',
        type: 'BOLLINGER_BREAKOUT_ENHANCED',
        status: 'active',
        config: {
          rsiPeriod: 8,            // Sweet spot between fast and stable
          volumeMultiplier: 1.5,   // Volume confirmation threshold
          momentumPeriod: 12,      // Multi-timeframe momentum
          quantumOscillator: 21,   // My secret sauce oscillator period
          oversoldLevel: 25,       // Aggressive but not too risky
          overboughtLevel: 75,
          oversoldExit: 55,        // Dynamic exits based on momentum
          overboughtExit: 45,
          positionSize: 0.02,      // 2% position size - aggressive but controlled
          stopLossATR: 1.8,        // Tight stops for quick exits
          takeProfitATR: 4.5,      // Big winners when right
          volatilityFilter: 0.015, // Market condition filter
          confluenceRequired: 3    // Require multiple signals to align
        },
        performance: {
          totalTrades: 0,
          winRate: 0,
          profitLoss: 0,
          sharpeRatio: 0
        },
        lastUpdated: new Date(),
        pineScript: {
          source: '/src/strategies/claude-quantum-oscillator.pine',
          webhookUrl: 'https://kraken.circuitcartel.com/webhook/strategy/claude-quantum-oscillator-001',
          alertPayload: {
            strategy_id: 'claude-quantum-oscillator-001',
            strategy_name: 'Claude Quantum Oscillator',
            action: '{{action}}',
            symbol: '{{symbol}}',
            price: '{{price}}',
            quantity: '{{quantity}}',
            rsi: '{{rsi}}',
            quantum_signal: '{{quantum_signal}}',
            volume_confirmation: '{{volume_confirmation}}',
            momentum_score: '{{momentum_score}}',
            confluence_count: '{{confluence_count}}',
            volatility_check: '{{volatility_check}}',
            timestamp: '{{timestamp}}'
          },
          testingMode: false,
          alertCount: 0,
          lastAlert: new Date()
        }
      },
      {
        id: 'stratus-core-neural-001',
        name: 'Stratus Core Neural Engine',
        type: 'AI_MOMENTUM',
        status: 'active',
        config: {
          neuralLayers: 4,          // Deep neural network
          learningRate: 0.001,      // Adaptive learning
          memoryHorizon: 100,       // Long-term pattern memory
          predictionAccuracy: 0.72, // AI confidence threshold
          adaptiveRSI: true,        // AI adjusts RSI period dynamically
          marketRegimeDetection: true, // Detects bull/bear/sideways
          sentimentAnalysis: 0.8,   // Social sentiment weight
          volumeNeuralWeight: 1.2,  // Volume pattern recognition
          priceActionPatterns: 15,  // Candlestick pattern recognition
          neuralMomentumPeriod: 14, // AI momentum calculation
          adaptiveOversold: 30,     // AI adjusts based on regime
          adaptiveOverbought: 70,   // AI adjusts based on regime
          positionSize: 0.025,      // 2.5% - most aggressive
          stopLossNeural: 1.5,      // AI-calculated tight stops
          takeProfitNeural: 5.0,    // AI targets big moves
          riskAversion: 0.15,       // Low risk aversion (aggressive)
          neuralConfidence: 0.75    // Required AI confidence level
        },
        performance: {
          totalTrades: 0,
          winRate: 0,
          profitLoss: 0,
          sharpeRatio: 0
        },
        lastUpdated: new Date(),
        pineScript: {
          source: '/src/strategies/stratus-core-neural.pine',
          webhookUrl: 'https://kraken.circuitcartel.com/webhook/strategy/stratus-core-neural-001',
          alertPayload: {
            strategy_id: 'stratus-core-neural-001',
            strategy_name: 'Stratus Core Neural Engine',
            action: '{{action}}',
            symbol: '{{symbol}}',
            price: '{{price}}',
            quantity: '{{quantity}}',
            neural_prediction: '{{neural_prediction}}',
            ai_confidence: '{{ai_confidence}}',
            market_regime: '{{market_regime}}',
            pattern_recognition: '{{pattern_recognition}}',
            sentiment_score: '{{sentiment_score}}',
            adaptive_rsi: '{{adaptive_rsi}}',
            neural_momentum: '{{neural_momentum}}',
            risk_score: '{{risk_score}}',
            timestamp: '{{timestamp}}'
          },
          testingMode: false,
          alertCount: 0,
          lastAlert: new Date()
        }
      }
    ];

    const demoStrategies = [
      // Add any default demo strategies here if needed
    ];
    
    demoStrategies.forEach(strategy => {
      this.strategies.set(strategy.id, strategy);
    });
  }

  // Strategy management
  getStrategies(): Strategy[] {
    return Array.from(this.strategies.values());
  }

  getStrategy(id: string): Strategy | undefined {
    return this.strategies.get(id);
  }

  updateStrategy(id: string, updates: Partial<Strategy>): void {
    const strategy = this.strategies.get(id);
    if (strategy) {
      this.strategies.set(id, { ...strategy, ...updates, lastUpdated: new Date() });
      this.notifyListeners();
    }
  }

  // Optimization state management
  getOptimizationState(): OptimizationState {
    return { ...this.optimizationState };
  }

  startOptimization(strategyId: string): void {
    this.optimizationState.isRunning = true;
    this.optimizationState.currentIteration = 0;
    this.optimizationState.history = [];
    this.notifyListeners();

    // Simulate optimization process
    this.simulateOptimization();
  }

  stopOptimization(): void {
    this.optimizationState.isRunning = false;
    this.notifyListeners();
  }

  private simulateOptimization(): void {
    if (!this.optimizationState.isRunning) return;

    const interval = setInterval(() => {
      if (this.optimizationState.currentIteration >= this.optimizationState.totalIterations) {
        this.optimizationState.isRunning = false;
        clearInterval(interval);
        this.notifyListeners();
        return;
      }

      const randomParams = {
        param1: Math.random() * 100,
        param2: Math.random() * 50,
        param3: Math.random() * 200
      };

      const performance = Math.random() * 100;

      this.optimizationState.currentIteration++;
      this.optimizationState.currentPerformance = performance;

      if (performance > (this.optimizationState.bestParameters.performance as number) || !this.optimizationState.bestParameters.performance) {
        this.optimizationState.bestParameters = { ...randomParams, performance };
      }

      this.optimizationState.history.push({
        iteration: this.optimizationState.currentIteration,
        parameters: randomParams,
        performance,
        timestamp: new Date()
      });

      this.notifyListeners();
    }, 200);
  }

  // Live trading state management
  getLiveTradingState(): LiveTradingState {
    return { ...this.liveTradingState };
  }

  startLiveTrading(): void {
    this.liveTradingState.isActive = true;
    this.liveTradingState.lastActivity = new Date();
    this.notifyListeners();
  }

  stopLiveTrading(): void {
    this.liveTradingState.isActive = false;
    this.liveTradingState.activeStrategies.clear();
    this.notifyListeners();
  }

  toggleStrategyInLiveTrading(strategyId: string): void {
    if (this.liveTradingState.activeStrategies.has(strategyId)) {
      this.liveTradingState.activeStrategies.delete(strategyId);
    } else {
      this.liveTradingState.activeStrategies.add(strategyId);
    }
    this.liveTradingState.lastActivity = new Date();
    this.notifyListeners();
  }

  // Event system
  subscribe(callback: () => void): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  private notifyListeners(): void {
    this.listeners.forEach(callback => callback());
  }
}

export default StrategyManager;
export type { Strategy, OptimizationState, LiveTradingState };

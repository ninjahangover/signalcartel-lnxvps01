/**
 * Unified Strategy System
 * 
 * Single source of truth for all trading strategies
 * Ensures consistent naming and functionality across all pages
 */

import StrategyExecutionEngine from './strategy-execution-engine';
import { alpacaPaperTradingService } from './alpaca-paper-trading-service';
import { stratusEngine } from './stratus-engine-ai';
import RSIStrategyOptimizer from './rsi-strategy-optimizer';
import marketDataService from './market-data-service';

export interface UnifiedStrategy {
  // Core identification
  id: string;
  name: string;
  displayName: string; // Same name shown everywhere
  type: 'RSI' | 'MACD' | 'FIBONACCI' | 'MOMENTUM' | 'AI_HYBRID';
  
  // Status and control
  enabled: boolean;
  mode: 'paper' | 'live' | 'both';
  status: 'active' | 'inactive' | 'optimizing' | 'error';
  
  // Configuration
  config: {
    symbol: string;
    timeframe: string;
    
    // RSI Parameters
    rsiPeriod?: number;
    rsiOversold?: number;
    rsiOverbought?: number;
    
    // MACD Parameters
    macdFast?: number;
    macdSlow?: number;
    macdSignal?: number;
    
    // Fibonacci Parameters
    fibLevels?: number[];
    
    // Risk Management
    stopLoss: number;
    takeProfit: number;
    positionSize: number;
    maxPositions: number;
  };
  
  // Real Performance (not fake data)
  performance: {
    isReal: boolean; // Flag to indicate if data is real or placeholder
    totalTrades: number;
    winningTrades: number;
    losingTrades: number;
    winRate: number;
    totalProfit: number;
    todayProfit: number;
    avgProfit: number;
    maxDrawdown: number;
    sharpeRatio: number;
    lastTrade?: Date;
    lastUpdate: Date;
  };
  
  // Execution details
  execution: {
    isConnected: boolean;
    engineActive: boolean;
    hasAlpacaCredentials: boolean;
    hasKrakenCredentials: boolean;
    canExecutePaper: boolean;
    canExecuteLive: boolean;
    currentPositions: number;
    pendingOrders: number;
  };
  
  // AI Optimization
  optimization: {
    isOptimized: boolean;
    lastOptimization?: Date;
    optimizationCycles: number;
    aiConfidence: number;
    learningProgress: number;
    nextOptimization?: Date;
  };
}

export class UnifiedStrategySystem {
  private static instance: UnifiedStrategySystem;
  private strategies: Map<string, UnifiedStrategy> = new Map();
  private listeners: Set<(strategies: UnifiedStrategy[]) => void> = new Set();
  private executionEngine: typeof StrategyExecutionEngine;
  private performanceUpdateInterval: NodeJS.Timeout | null = null;
  
  private constructor() {
    this.executionEngine = StrategyExecutionEngine.getInstance();
    this.initializeStrategies();
    this.startPerformanceUpdates();
  }
  
  static getInstance(): UnifiedStrategySystem {
    if (!UnifiedStrategySystem.instance) {
      UnifiedStrategySystem.instance = new UnifiedStrategySystem();
    }
    return UnifiedStrategySystem.instance;
  }
  
  private initializeStrategies(): void {
    // Competition strategies only - 3 competitors
    const strategies: UnifiedStrategy[] = [
      {
        id: 'rsi-pullback-pro',
        name: 'rsi-pullback-pro',
        displayName: 'RSI Pullback Pro',
        type: 'RSI',
        enabled: true,
        mode: 'paper',
        status: 'active',
        config: {
          symbol: 'BTCUSD',
          timeframe: '5m',
          rsiPeriod: 2,     // User's preferred ultra-aggressive RSI
          rsiOversold: 28,  // User's preferred entry levels
          rsiOverbought: 72,
          stopLoss: 2.0,
          takeProfit: 3.0,
          positionSize: 0.015,
          maxPositions: 3
        },
        performance: {
          isReal: true,
          totalTrades: 0,
          winningTrades: 0,
          losingTrades: 0,
          winRate: 0,
          totalProfit: 0,
          todayProfit: 0,
          avgProfit: 0,
          maxDrawdown: 0,
          sharpeRatio: 0,
          lastUpdate: new Date()
        },
        execution: {
          isConnected: false,
          engineActive: false,
          hasAlpacaCredentials: false,
          hasKrakenCredentials: false,
          canExecutePaper: false,
          canExecuteLive: false,
          currentPositions: 0,
          pendingOrders: 0
        },
        optimization: {
          isOptimized: false,
          optimizationCycles: 0,
          aiConfidence: 0,
          learningProgress: 0
        }
      },
      {
        id: 'claude-quantum-oscillator',
        name: 'claude-quantum-oscillator',
        displayName: 'Claude Quantum Oscillator',
        type: 'AI_HYBRID',
        enabled: true,
        mode: 'paper',
        status: 'active',
        config: {
          symbol: 'BTCUSD',
          timeframe: '5m',
          rsiPeriod: 8,     // Sweet spot between fast and stable
          rsiOversold: 25,  // Aggressive but not too risky
          rsiOverbought: 75,
          stopLoss: 1.8,    // Tight stops for quick exits
          takeProfit: 4.5,  // Big winners when right
          positionSize: 0.02,
          maxPositions: 3
        },
        performance: {
          isReal: true,
          totalTrades: 0,
          winningTrades: 0,
          losingTrades: 0,
          winRate: 0,
          totalProfit: 0,
          todayProfit: 0,
          avgProfit: 0,
          maxDrawdown: 0,
          sharpeRatio: 0,
          lastUpdate: new Date()
        },
        execution: {
          isConnected: false,
          engineActive: false,
          hasAlpacaCredentials: false,
          hasKrakenCredentials: false,
          canExecutePaper: false,
          canExecuteLive: false,
          currentPositions: 0,
          pendingOrders: 0
        },
        optimization: {
          isOptimized: false,
          optimizationCycles: 0,
          aiConfidence: 0,
          learningProgress: 0
        }
      },
      {
        id: 'stratus-core-neural',
        name: 'stratus-core-neural',
        displayName: 'Stratus Core Neural Engine',
        type: 'AI_HYBRID',
        enabled: true,
        mode: 'paper',
        status: 'active',
        config: {
          symbol: 'BTCUSD',
          timeframe: '5m',
          rsiPeriod: 14,    // AI adjusts dynamically
          rsiOversold: 30,  // AI adjusts based on regime
          rsiOverbought: 70,
          stopLoss: 1.5,    // AI-calculated tight stops
          takeProfit: 5.0,  // AI targets big moves
          positionSize: 0.025, // Most aggressive - 2.5%
          maxPositions: 3
        },
        performance: {
          isReal: true,
          totalTrades: 0,
          winningTrades: 0,
          losingTrades: 0,
          winRate: 0,
          totalProfit: 0,
          todayProfit: 0,
          avgProfit: 0,
          maxDrawdown: 0,
          sharpeRatio: 0,
          lastUpdate: new Date()
        },
        execution: {
          isConnected: false,
          engineActive: false,
          hasAlpacaCredentials: false,
          hasKrakenCredentials: false,
          canExecutePaper: false,
          canExecuteLive: false,
          currentPositions: 0,
          pendingOrders: 0
        },
        optimization: {
          isOptimized: false,
          optimizationCycles: 0,
          aiConfidence: 0,
          learningProgress: 0
        }
      }
    ];
    
    // Store strategies
    strategies.forEach(strategy => {
      this.strategies.set(strategy.id, strategy);
    });
    
    console.log(`🎯 Unified Strategy System initialized with ${strategies.length} strategies`);
  }
  
  // Update performance with real data
  private async startPerformanceUpdates(): Promise<void> {
    // Update immediately
    await this.updatePerformanceData();
    
    // Then update every 30 seconds
    this.performanceUpdateInterval = setInterval(async () => {
      await this.updatePerformanceData();
    }, 30000);
  }
  
  private async updatePerformanceData(): Promise<void> {
    try {
      // Check execution engine status
      const engineRunning = this.executionEngine.isEngineRunning();
      const paperMode = this.executionEngine.isPaperTradingMode();
      const activeStrategies = this.executionEngine.getActiveStrategies();
      const dashboard = this.executionEngine.getPerformanceDashboard();
      
      // Check Alpaca connection
      let alpacaConnected = false;
      let alpacaPositions = 0;
      let alpacaOrders = 0;
      
      try {
        const accountInfo = await alpacaPaperTradingService.getAccountInfo();
        if (accountInfo) {
          alpacaConnected = true;
          const positions = await alpacaPaperTradingService.getPositions();
          const orders = await alpacaPaperTradingService.getOpenOrders();
          alpacaPositions = positions.length;
          alpacaOrders = orders.length;
        }
      } catch (error) {
        // Alpaca not connected
      }
      
      // Check RSI optimizer
      const optimizer = RSIStrategyOptimizer.getInstance();
      const optimizationHistory = optimizer.getOptimizationHistory();
      
      // Update each strategy
      for (const [id, strategy] of this.strategies) {
        // Update execution status
        strategy.execution.engineActive = engineRunning;
        strategy.execution.hasAlpacaCredentials = alpacaConnected;
        strategy.execution.canExecutePaper = alpacaConnected && paperMode;
        strategy.execution.isConnected = alpacaConnected || strategy.execution.hasKrakenCredentials;
        
        // Update real performance if available
        if (dashboard && dashboard.strategies && dashboard.strategies[id]) {
          const metrics = dashboard.strategies[id];
          if (metrics) {
            strategy.performance.isReal = true;
            strategy.performance.totalTrades = metrics.totalTrades || 0;
            strategy.performance.winningTrades = metrics.wins || 0;
            strategy.performance.losingTrades = metrics.losses || 0;
            strategy.performance.winRate = metrics.winRate || 0;
            strategy.performance.totalProfit = metrics.totalProfit || 0;
            strategy.performance.avgProfit = metrics.avgProfitPerTrade || 0;
            strategy.performance.maxDrawdown = metrics.maxDrawdown || 0;
            strategy.performance.sharpeRatio = metrics.sharpeRatio || 0;
            strategy.performance.lastUpdate = new Date();
          }
        }
        
        // Update optimization status for RSI strategies
        if (strategy.type === 'RSI' && optimizationHistory.length > 0) {
          strategy.optimization.isOptimized = true;
          strategy.optimization.optimizationCycles = optimizationHistory.length;
          const lastOpt = optimizationHistory[optimizationHistory.length - 1];
          strategy.optimization.lastOptimization = lastOpt.timestamp;
          strategy.optimization.aiConfidence = lastOpt.confidence * 100;
          
          // Update config with optimized parameters
          const currentParams = optimizer.getCurrentParameters();
          strategy.config.rsiPeriod = currentParams.rsi_period;
          strategy.config.rsiOversold = currentParams.oversold_level;
          strategy.config.rsiOverbought = currentParams.overbought_level;
        }
        
        // Update active status
        strategy.status = activeStrategies.includes(id) ? 'active' : 'inactive';
        
        // Update positions and orders
        if (strategy.status === 'active' && alpacaConnected) {
          strategy.execution.currentPositions = alpacaPositions;
          strategy.execution.pendingOrders = alpacaOrders;
        }
      }
      
      // Notify listeners
      this.notifyListeners();
      
    } catch (error) {
      console.error('Error updating performance data:', error);
    }
  }
  
  // Public API
  
  getAllStrategies(): UnifiedStrategy[] {
    return Array.from(this.strategies.values());
  }
  
  getStrategy(id: string): UnifiedStrategy | undefined {
    return this.strategies.get(id);
  }
  
  async enableStrategy(id: string): Promise<boolean> {
    const strategy = this.strategies.get(id);
    if (!strategy) return false;
    
    try {
      console.log(`🟢 Enabling strategy: ${strategy.displayName}`);
      
      // Add to execution engine
      const engineStrategy = {
        id: strategy.id,
        name: strategy.displayName,
        type: strategy.type as any,
        status: 'active' as const,
        config: strategy.config,
        performance: {
          totalTrades: strategy.performance.totalTrades,
          winRate: strategy.performance.winRate,
          profitLoss: strategy.performance.totalProfit,
          sharpeRatio: strategy.performance.sharpeRatio
        },
        lastUpdated: new Date(),
        pineScript: strategy.type === 'RSI' ? {
          source: 'RSI strategy',
          webhookUrl: 'https://kraken.circuitcartel.com/webhook',
          alertPayload: {},
          testingMode: false
        } : undefined
      };
      
      this.executionEngine.addStrategy(engineStrategy, strategy.config.symbol);
      
      // Subscribe to market data
      marketDataService.subscribe(strategy.config.symbol, (data) => {
        // Data will be processed by execution engine
      });
      
      strategy.enabled = true;
      strategy.status = 'active';
      
      this.notifyListeners();
      console.log(`✅ Strategy ${strategy.displayName} enabled successfully`);
      return true;
      
    } catch (error) {
      console.error(`Failed to enable strategy ${id}:`, error);
      strategy.status = 'error';
      return false;
    }
  }
  
  async disableStrategy(id: string): Promise<boolean> {
    const strategy = this.strategies.get(id);
    if (!strategy) return false;
    
    try {
      console.log(`🔴 Disabling strategy: ${strategy.displayName}`);
      
      // Remove from execution engine
      this.executionEngine.removeStrategy(id);
      
      strategy.enabled = false;
      strategy.status = 'inactive';
      
      this.notifyListeners();
      console.log(`✅ Strategy ${strategy.displayName} disabled successfully`);
      return true;
      
    } catch (error) {
      console.error(`Failed to disable strategy ${id}:`, error);
      return false;
    }
  }
  
  async toggleStrategy(id: string): Promise<boolean> {
    const strategy = this.strategies.get(id);
    if (!strategy) return false;
    
    if (strategy.enabled) {
      return await this.disableStrategy(id);
    } else {
      return await this.enableStrategy(id);
    }
  }
  
  // Trading mode management
  setStrategyMode(id: string, mode: 'paper' | 'live' | 'both'): boolean {
    const strategy = this.strategies.get(id);
    if (!strategy) return false;
    
    console.log(`🔄 Setting ${strategy.displayName} mode to: ${mode}`);
    strategy.mode = mode;
    
    // Update execution capabilities based on mode
    this.updateExecutionCapabilities(strategy);
    
    this.notifyListeners();
    return true;
  }
  
  setAllStrategiesMode(mode: 'paper' | 'live' | 'both'): void {
    console.log(`🔄 Setting all strategies to mode: ${mode}`);
    
    for (const strategy of this.strategies.values()) {
      strategy.mode = mode;
      this.updateExecutionCapabilities(strategy);
    }
    
    this.notifyListeners();
  }
  
  getStrategiesByMode(mode: 'paper' | 'live' | 'both'): UnifiedStrategy[] {
    return Array.from(this.strategies.values()).filter(s => 
      s.mode === mode || s.mode === 'both'
    );
  }
  
  getPaperTradingStrategies(): UnifiedStrategy[] {
    return this.getStrategiesByMode('paper');
  }
  
  getLiveTradingStrategies(): UnifiedStrategy[] {
    return this.getStrategiesByMode('live');
  }
  
  private updateExecutionCapabilities(strategy: UnifiedStrategy): void {
    // Update execution capabilities based on mode and credentials
    const hasAlpacaCredentials = process.env.ALPACA_API_KEY_PAPER && process.env.ALPACA_SECRET_KEY_PAPER;
    const hasKrakenCredentials = process.env.KRAKEN_API_KEY && process.env.KRAKEN_API_SECRET;
    
    strategy.execution.hasAlpacaCredentials = !!hasAlpacaCredentials;
    strategy.execution.hasKrakenCredentials = !!hasKrakenCredentials;
    
    // Set execution capabilities
    strategy.execution.canExecutePaper = (
      (strategy.mode === 'paper' || strategy.mode === 'both') && 
      hasAlpacaCredentials
    );
    
    strategy.execution.canExecuteLive = (
      (strategy.mode === 'live' || strategy.mode === 'both') && 
      hasKrakenCredentials
    );
    
    strategy.execution.isConnected = strategy.execution.canExecutePaper || strategy.execution.canExecuteLive;
  }

  // Subscribe to updates
  subscribe(callback: (strategies: UnifiedStrategy[]) => void): () => void {
    this.listeners.add(callback);
    callback(this.getAllStrategies()); // Send initial data
    
    return () => {
      this.listeners.delete(callback);
    };
  }
  
  private notifyListeners(): void {
    const strategies = this.getAllStrategies();
    this.listeners.forEach(callback => {
      try {
        callback(strategies);
      } catch (error) {
        console.error('Error in strategy listener:', error);
      }
    });
  }
  
  // Cleanup
  stop(): void {
    if (this.performanceUpdateInterval) {
      clearInterval(this.performanceUpdateInterval);
      this.performanceUpdateInterval = null;
    }
  }
}

// Export singleton instance
export const unifiedStrategySystem = UnifiedStrategySystem.getInstance();
/**
 * AI Trade Monitoring System
 * 
 * Monitors the complete data flow:
 * 1. Market Data Collection (Kraken API)
 * 2. AI Analysis & Optimization
 * 3. Trade Signal Generation
 * 4. Execution (Alpaca Paper / Kraken Live)
 * 5. Performance Tracking & Learning
 */

import marketDataService, { MarketData } from './market-data-service';
import { stratusEngine, getAITradingSignal } from './stratus-engine-ai';
import RSIStrategyOptimizer from './rsi-strategy-optimizer';
import StrategyExecutionEngine from './strategy-execution-engine';
import { alpacaPaperTradingService } from './alpaca-paper-trading-service';
import { realMarketData } from './real-market-data';

export interface MonitoringMetrics {
  // Market Data Metrics
  marketData: {
    isActive: boolean;
    lastUpdate: Date | null;
    symbolsMonitored: string[];
    dataPoints: number;
    updateFrequency: number; // seconds
    dataQuality: 'excellent' | 'good' | 'poor' | 'offline';
  };
  
  // AI Analysis Metrics
  aiAnalysis: {
    isActive: boolean;
    lastAnalysis: Date | null;
    decisionsGenerated: number;
    averageConfidence: number;
    optimizationCycles: number;
    learningProgress: number; // 0-100%
    parametersOptimized: boolean;
  };
  
  // Trade Execution Metrics
  execution: {
    mode: 'paper' | 'live';
    engineRunning: boolean;
    activeStrategies: number;
    signalsGenerated: number;
    tradesExecuted: number;
    pendingOrders: number;
    lastTrade: Date | null;
  };
  
  // Performance Metrics
  performance: {
    winRate: number;
    totalProfit: number;
    todayProfit: number;
    averageProfit: number;
    sharpeRatio: number;
    maxDrawdown: number;
    aiAccuracy: number; // How accurate AI predictions are
  };
  
  // System Health
  health: {
    overall: 'healthy' | 'degraded' | 'critical';
    issues: string[];
    recommendations: string[];
  };
}

export class AITradeMonitor {
  private static instance: AITradeMonitor;
  private metrics: MonitoringMetrics;
  private monitoringInterval: NodeJS.Timeout | null = null;
  private marketDataBuffer: Map<string, MarketData[]> = new Map();
  private tradeHistory: any[] = [];
  private listeners: Set<(metrics: MonitoringMetrics) => void> = new Set();
  
  private constructor() {
    this.metrics = this.initializeMetrics();
    this.startMonitoring();
  }
  
  static getInstance(): AITradeMonitor {
    if (!AITradeMonitor.instance) {
      AITradeMonitor.instance = new AITradeMonitor();
    }
    return AITradeMonitor.instance;
  }
  
  private initializeMetrics(): MonitoringMetrics {
    return {
      marketData: {
        isActive: false,
        lastUpdate: null,
        symbolsMonitored: [],
        dataPoints: 0,
        updateFrequency: 0,
        dataQuality: 'offline'
      },
      aiAnalysis: {
        isActive: false,
        lastAnalysis: null,
        decisionsGenerated: 0,
        averageConfidence: 0,
        optimizationCycles: 0,
        learningProgress: 0,
        parametersOptimized: false
      },
      execution: {
        mode: 'paper',
        engineRunning: false,
        activeStrategies: 0,
        signalsGenerated: 0,
        tradesExecuted: 0,
        pendingOrders: 0,
        lastTrade: null
      },
      performance: {
        winRate: 0,
        totalProfit: 0,
        todayProfit: 0,
        averageProfit: 0,
        sharpeRatio: 0,
        maxDrawdown: 0,
        aiAccuracy: 0
      },
      health: {
        overall: 'healthy',
        issues: [],
        recommendations: []
      }
    };
  }
  
  private startMonitoring(): void {
    // Monitor every 5 seconds
    this.monitoringInterval = setInterval(() => {
      this.updateMetrics();
    }, 5000);
    
    // Initial update
    this.updateMetrics();
    
    // Subscribe to market data for monitoring
    this.subscribeToMarketData();
  }
  
  private subscribeToMarketData(): void {
    const symbols = ['BTCUSD', 'ETHUSD', 'ADAUSD'];
    
    symbols.forEach(symbol => {
      marketDataService.subscribe(symbol, (data) => {
        // Buffer market data for analysis
        if (!this.marketDataBuffer.has(symbol)) {
          this.marketDataBuffer.set(symbol, []);
        }
        
        const buffer = this.marketDataBuffer.get(symbol)!;
        buffer.push(data);
        
        // Keep last 100 data points
        if (buffer.length > 100) {
          buffer.shift();
        }
        
        // Update market data metrics
        this.metrics.marketData.lastUpdate = new Date();
        this.metrics.marketData.isActive = true;
        this.metrics.marketData.dataPoints = buffer.length;
      });
    });
  }
  
  private async updateMetrics(): Promise<void> {
    try {
      // Update Market Data Metrics
      await this.updateMarketDataMetrics();
      
      // Update AI Analysis Metrics
      await this.updateAIMetrics();
      
      // Update Execution Metrics
      await this.updateExecutionMetrics();
      
      // Update Performance Metrics
      await this.updatePerformanceMetrics();
      
      // Update System Health
      this.updateSystemHealth();
      
      // Notify listeners
      this.notifyListeners();
      
    } catch (error) {
      console.error('Error updating monitoring metrics:', error);
      this.metrics.health.overall = 'critical';
      this.metrics.health.issues.push(`Monitoring error: ${error}`);
    }
  }
  
  private async updateMarketDataMetrics(): Promise<void> {
    const symbols = Array.from(this.marketDataBuffer.keys());
    this.metrics.marketData.symbolsMonitored = symbols;
    
    // Check data freshness
    if (this.metrics.marketData.lastUpdate) {
      const age = Date.now() - this.metrics.marketData.lastUpdate.getTime();
      this.metrics.marketData.isActive = age < 30000; // Active if updated in last 30 seconds
      
      // Calculate update frequency
      const buffers = Array.from(this.marketDataBuffer.values());
      if (buffers.length > 0 && buffers[0].length > 1) {
        const timestamps = buffers[0].map(d => d.timestamp);
        const avgInterval = timestamps.reduce((sum, t, i) => {
          if (i === 0) return sum;
          return sum + (t - timestamps[i-1]);
        }, 0) / (timestamps.length - 1);
        this.metrics.marketData.updateFrequency = avgInterval / 1000; // Convert to seconds
      }
      
      // Assess data quality
      if (age < 10000) {
        this.metrics.marketData.dataQuality = 'excellent';
      } else if (age < 30000) {
        this.metrics.marketData.dataQuality = 'good';
      } else if (age < 60000) {
        this.metrics.marketData.dataQuality = 'poor';
      } else {
        this.metrics.marketData.dataQuality = 'offline';
      }
    }
  }
  
  private async updateAIMetrics(): Promise<void> {
    try {
      // Get RSI optimizer status
      const optimizer = RSIStrategyOptimizer.getInstance();
      const currentParams = optimizer.getCurrentParameters();
      const optimizationHistory = optimizer.getOptimizationHistory();
      
      this.metrics.aiAnalysis.parametersOptimized = optimizationHistory.length > 0;
      this.metrics.aiAnalysis.optimizationCycles = optimizationHistory.length;
      
      // Calculate learning progress based on optimization history
      if (optimizationHistory.length > 0) {
        const recentOptimizations = optimizationHistory.slice(-10);
        const avgConfidence = recentOptimizations.reduce((sum, opt) => sum + opt.confidence, 0) / recentOptimizations.length;
        this.metrics.aiAnalysis.learningProgress = Math.min(avgConfidence * 100, 100);
      }
      
      // Check if AI is actively analyzing
      const stratusStatus = stratusEngine.getPerformanceMetrics();
      if (stratusStatus) {
        this.metrics.aiAnalysis.isActive = true;
        this.metrics.aiAnalysis.decisionsGenerated = stratusStatus.totalTrades;
        this.metrics.performance.aiAccuracy = stratusStatus.aiAccuracyScore;
      }
      
    } catch (error) {
      console.error('Error updating AI metrics:', error);
    }
  }
  
  private async updateExecutionMetrics(): Promise<void> {
    try {
      const engine = StrategyExecutionEngine.getInstance();
      
      this.metrics.execution.engineRunning = engine.isEngineRunning();
      this.metrics.execution.mode = engine.isPaperTradingMode() ? 'paper' : 'live';
      this.metrics.execution.activeStrategies = engine.getActiveStrategies().length;
      
      // Get Alpaca paper trading metrics if in paper mode
      if (this.metrics.execution.mode === 'paper') {
        const positions = await alpacaPaperTradingService.getPositions();
        const orders = await alpacaPaperTradingService.getOpenOrders();
        
        this.metrics.execution.pendingOrders = orders.length;
        this.metrics.execution.tradesExecuted = positions.length;
      }
      
    } catch (error) {
      console.error('Error updating execution metrics:', error);
    }
  }
  
  private async updatePerformanceMetrics(): Promise<void> {
    try {
      // Get performance from strategy execution engine
      const engine = StrategyExecutionEngine.getInstance();
      const dashboard = engine.getPerformanceDashboard();
      
      if (dashboard && dashboard.strategies) {
        const allMetrics = Object.values(dashboard.strategies).filter(m => m !== null);
        
        if (allMetrics.length > 0) {
          // Calculate aggregate metrics
          const totalTrades = allMetrics.reduce((sum: number, m: any) => sum + (m.totalTrades || 0), 0);
          const totalWins = allMetrics.reduce((sum: number, m: any) => sum + (m.wins || 0), 0);
          const totalProfit = allMetrics.reduce((sum: number, m: any) => sum + (m.totalProfit || 0), 0);
          
          this.metrics.performance.winRate = totalTrades > 0 ? (totalWins / totalTrades) * 100 : 0;
          this.metrics.performance.totalProfit = totalProfit;
          this.metrics.performance.averageProfit = totalTrades > 0 ? totalProfit / totalTrades : 0;
          
          // Get max values
          this.metrics.performance.sharpeRatio = Math.max(...allMetrics.map((m: any) => m.sharpeRatio || 0));
          this.metrics.performance.maxDrawdown = Math.max(...allMetrics.map((m: any) => m.maxDrawdown || 0));
        }
      }
      
      // Get Stratus AI performance
      const stratusPerf = stratusEngine.getPerformanceMetrics();
      if (stratusPerf) {
        this.metrics.performance.aiAccuracy = stratusPerf.aiAccuracyScore;
      }
      
    } catch (error) {
      console.error('Error updating performance metrics:', error);
    }
  }
  
  private updateSystemHealth(): void {
    this.metrics.health.issues = [];
    this.metrics.health.recommendations = [];
    
    // Check market data health
    if (this.metrics.marketData.dataQuality === 'offline') {
      this.metrics.health.issues.push('Market data is offline');
      this.metrics.health.recommendations.push('Check Kraken API connection');
    } else if (this.metrics.marketData.dataQuality === 'poor') {
      this.metrics.health.issues.push('Market data updates are slow');
      this.metrics.health.recommendations.push('Check network connectivity');
    }
    
    // Check AI health
    if (!this.metrics.aiAnalysis.parametersOptimized) {
      this.metrics.health.recommendations.push('Run initial AI optimization for better performance');
    }
    
    if (this.metrics.aiAnalysis.learningProgress < 50) {
      this.metrics.health.recommendations.push('AI needs more training data - let it run longer');
    }
    
    // Check execution health
    if (!this.metrics.execution.engineRunning) {
      this.metrics.health.issues.push('Trading engine is not running');
      this.metrics.health.recommendations.push('Start the Strategy Execution Engine');
    }
    
    if (this.metrics.execution.activeStrategies === 0 && this.metrics.execution.engineRunning) {
      this.metrics.health.issues.push('No active strategies');
      this.metrics.health.recommendations.push('Enable at least one strategy');
    }
    
    // Check performance health
    if (this.metrics.performance.winRate < 40 && this.metrics.performance.winRate > 0) {
      this.metrics.health.issues.push('Low win rate detected');
      this.metrics.health.recommendations.push('Review strategy parameters and market conditions');
    }
    
    if (this.metrics.performance.maxDrawdown > 20) {
      this.metrics.health.issues.push('High drawdown detected');
      this.metrics.health.recommendations.push('Consider reducing position sizes');
    }
    
    // Determine overall health
    if (this.metrics.health.issues.length === 0) {
      this.metrics.health.overall = 'healthy';
    } else if (this.metrics.health.issues.length <= 2) {
      this.metrics.health.overall = 'degraded';
    } else {
      this.metrics.health.overall = 'critical';
    }
  }
  
  // Public API
  
  getMetrics(): MonitoringMetrics {
    return { ...this.metrics };
  }
  
  subscribe(callback: (metrics: MonitoringMetrics) => void): () => void {
    this.listeners.add(callback);
    callback(this.metrics); // Send initial metrics
    
    return () => {
      this.listeners.delete(callback);
    };
  }
  
  private notifyListeners(): void {
    this.listeners.forEach(callback => {
      try {
        callback(this.metrics);
      } catch (error) {
        console.error('Error in monitor listener:', error);
      }
    });
  }
  
  // Generate status report
  generateStatusReport(): string {
    const m = this.metrics;
    
    return `
=== AI TRADE MONITORING REPORT ===
Generated: ${new Date().toISOString()}

📊 MARKET DATA
- Status: ${m.marketData.isActive ? '🟢 ACTIVE' : '🔴 INACTIVE'}
- Quality: ${m.marketData.dataQuality.toUpperCase()}
- Symbols: ${m.marketData.symbolsMonitored.join(', ')}
- Update Rate: ${m.marketData.updateFrequency.toFixed(1)}s
- Data Points: ${m.marketData.dataPoints}

🤖 AI ANALYSIS
- Status: ${m.aiAnalysis.isActive ? '🟢 ACTIVE' : '🔴 INACTIVE'}
- Parameters Optimized: ${m.aiAnalysis.parametersOptimized ? '✅' : '❌'}
- Optimization Cycles: ${m.aiAnalysis.optimizationCycles}
- Learning Progress: ${m.aiAnalysis.learningProgress.toFixed(1)}%
- Average Confidence: ${(m.aiAnalysis.averageConfidence * 100).toFixed(1)}%

⚡ EXECUTION
- Mode: ${m.execution.mode.toUpperCase()}
- Engine: ${m.execution.engineRunning ? '🟢 RUNNING' : '🔴 STOPPED'}
- Active Strategies: ${m.execution.activeStrategies}
- Trades Executed: ${m.execution.tradesExecuted}
- Pending Orders: ${m.execution.pendingOrders}

📈 PERFORMANCE
- Win Rate: ${m.performance.winRate.toFixed(1)}%
- Total Profit: $${m.performance.totalProfit.toFixed(2)}
- Avg Profit/Trade: $${m.performance.averageProfit.toFixed(2)}
- Sharpe Ratio: ${m.performance.sharpeRatio.toFixed(2)}
- Max Drawdown: ${m.performance.maxDrawdown.toFixed(1)}%
- AI Accuracy: ${m.performance.aiAccuracy.toFixed(1)}%

🏥 SYSTEM HEALTH: ${m.health.overall.toUpperCase()}
${m.health.issues.length > 0 ? `\nIssues:\n${m.health.issues.map(i => `- ${i}`).join('\n')}` : ''}
${m.health.recommendations.length > 0 ? `\nRecommendations:\n${m.health.recommendations.map(r => `- ${r}`).join('\n')}` : ''}
===================================
    `;
  }
  
  // Stop monitoring
  stop(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
  }
}

// Export singleton instance
export const aiTradeMonitor = AITradeMonitor.getInstance();
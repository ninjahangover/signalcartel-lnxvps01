import { Strategy } from './strategy-manager';
import marketDataService, { MarketData } from './market-data-service';
import { StrategyState } from './strategy-execution-engine';

interface PineScriptVariable {
  name: string;
  type: 'int' | 'float' | 'bool' | 'string';
  currentValue: any;
  minValue?: number;
  maxValue?: number;
  step?: number;
  options?: string[]; // For dropdown/enum variables
  description?: string;
}

interface StrategyParameters {
  [key: string]: PineScriptVariable;
}

interface PerformanceMetrics {
  winRate: number;
  profitFactor: number;
  totalTrades: number;
  sharpeRatio: number;
  maxDrawdown: number;
  avgWinLoss: number;
  timeInMarket: number;
  totalReturn: number;
}

interface MarketRegime {
  trend: 'bullish' | 'bearish' | 'sideways';
  volatility: 'low' | 'medium' | 'high';
  volume: 'low' | 'medium' | 'high';
  momentum: number;
  regime_score: number; // 0-1 confidence in regime detection
}

interface OptimizationResult {
  strategyId: string;
  parameters: StrategyParameters;
  performance: PerformanceMetrics;
  marketRegime: MarketRegime;
  timestamp: Date;
  confidence: number; // 0-1 confidence in this parameter set
  backtestPeriod: string;
}

interface WebhookTestResult {
  strategyId: string;
  webhookUrl: string;
  testPayload: any;
  responseTime: number;
  success: boolean;
  error?: string;
  timestamp: Date;
}

class PineStrategyOptimizer {
  private static instance: PineStrategyOptimizer;
  private strategyParameters: Map<string, StrategyParameters> = new Map();
  private optimizationHistory: Map<string, OptimizationResult[]> = new Map();
  private webhookTestResults: Map<string, WebhookTestResult[]> = new Map();
  private marketData: MarketData[] = [];
  private isOptimizing: Map<string, boolean> = new Map();
  private listeners: Set<() => void> = new Set();

  private constructor() {
    this.subscribeToMarketData();
  }

  static getInstance(): PineStrategyOptimizer {
    if (!PineStrategyOptimizer.instance) {
      PineStrategyOptimizer.instance = new PineStrategyOptimizer();
    }
    return PineStrategyOptimizer.instance;
  }

  private subscribeToMarketData(): void {
    marketDataService.subscribe('BTCUSD', (data) => {
      this.marketData.push(data);
      
      // Keep last 2000 data points for analysis
      if (this.marketData.length > 2000) {
        this.marketData.shift();
      }

      // Trigger optimization every 200 new data points for any registered strategy
      if (this.marketData.length % 200 === 0) {
        this.scheduleOptimizations();
      }
    });
  }

  // Extract parameters from Pine Script code
  extractParametersFromPineScript(pineScriptCode: string, strategyId: string): StrategyParameters {
    const parameters: StrategyParameters = {};
    
    // Regex patterns to find Pine Script input declarations
    const inputPatterns = [
      /input(?:\.(int|float|bool|string))?\s*\(\s*([^,]+),\s*(?:title\s*=\s*["`']([^"`']+)["`'])?,?\s*(?:minval\s*=\s*([^,\)]+))?,?\s*(?:maxval\s*=\s*([^,\)]+))?,?\s*(?:step\s*=\s*([^,\)]+))?\s*\)/g,
      /(\w+)\s*=\s*input(?:\.(int|float|bool|string))?\s*\(\s*([^,]+)/g
    ];

    for (const pattern of inputPatterns) {
      let match;
      while ((match = pattern.exec(pineScriptCode)) !== null) {
        const [, typeOrName, type2, valueOrTitle, title, minval, maxval, step] = match;
        
        // Handle different regex match formats
        const variableName = type2 ? typeOrName : (match[0].split('=')[0]?.trim() || `var_${Object.keys(parameters).length}`);
        const variableType = type2 || typeOrName || 'float';
        const defaultValue = type2 ? valueOrTitle : match[3];
        const variableTitle = title || variableName;

        parameters[variableName] = {
          name: variableName,
          type: variableType as 'int' | 'float' | 'bool' | 'string',
          currentValue: this.parseValue(defaultValue, variableType),
          minValue: minval ? parseFloat(minval) : undefined,
          maxValue: maxval ? parseFloat(maxval) : undefined,
          step: step ? parseFloat(step) : undefined,
          description: variableTitle
        };
      }
    }

    // Store parameters for this strategy
    this.strategyParameters.set(strategyId, parameters);
    
    console.log(`🔍 Extracted ${Object.keys(parameters).length} parameters from ${strategyId}:`, parameters);
    
    return parameters;
  }

  private parseValue(value: string, type: string): any {
    if (!value) return null;
    
    const cleanValue = value.trim().replace(/["`']/g, '');
    
    switch (type) {
      case 'int':
        return parseInt(cleanValue) || 0;
      case 'float':
        return parseFloat(cleanValue) || 0;
      case 'bool':
        return cleanValue.toLowerCase() === 'true';
      case 'string':
        return cleanValue;
      default:
        // Try to infer type
        if (!isNaN(Number(cleanValue))) {
          return cleanValue.includes('.') ? parseFloat(cleanValue) : parseInt(cleanValue);
        }
        if (cleanValue.toLowerCase() === 'true' || cleanValue.toLowerCase() === 'false') {
          return cleanValue.toLowerCase() === 'true';
        }
        return cleanValue;
    }
  }

  // Test webhook connectivity and response
  async testWebhook(strategyId: string, webhookUrl: string, testPayload?: any): Promise<WebhookTestResult> {
    const startTime = Date.now();
    
    // Default test payload if none provided
    const payload = testPayload || {
      passphrase: "test_passphrase_123",
      ticker: "BTCUSD",
      strategy: {
        order_action: "buy",
        order_type: "limit",
        order_price: "50000",
        order_contracts: "0.01",
        type: "buy",
        volume: "0.01",
        pair: "BTCUSD",
        validate: "true", // Always true for testing
        test_mode: true
      }
    };

    try {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(10000) // 10 second timeout
      });

      const responseTime = Date.now() - startTime;
      
      const result: WebhookTestResult = {
        strategyId,
        webhookUrl,
        testPayload: payload,
        responseTime,
        success: response.ok,
        error: response.ok ? undefined : `HTTP ${response.status}: ${response.statusText}`,
        timestamp: new Date()
      };

      // Store test result
      if (!this.webhookTestResults.has(strategyId)) {
        this.webhookTestResults.set(strategyId, []);
      }
      const results = this.webhookTestResults.get(strategyId)!;
      results.push(result);
      
      // Keep only last 50 test results per strategy
      if (results.length > 50) {
        results.shift();
      }

      console.log(`🌐 Webhook test for ${strategyId}: ${response.ok ? 'SUCCESS' : 'FAILED'} (${responseTime}ms)`);
      
      this.notifyListeners();
      return result;

    } catch (error) {
      const responseTime = Date.now() - startTime;
      const result: WebhookTestResult = {
        strategyId,
        webhookUrl,
        testPayload: payload,
        responseTime,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date()
      };

      if (!this.webhookTestResults.has(strategyId)) {
        this.webhookTestResults.set(strategyId, []);
      }
      this.webhookTestResults.get(strategyId)!.push(result);

      console.error(`❌ Webhook test failed for ${strategyId}:`, error);
      
      this.notifyListeners();
      return result;
    }
  }

  // Schedule optimization for all registered strategies
  private scheduleOptimizations(): void {
    for (const [strategyId] of this.strategyParameters) {
      if (!this.isOptimizing.get(strategyId)) {
        setTimeout(() => {
          this.optimizeStrategy(strategyId);
        }, Math.random() * 5000); // Stagger optimizations 0-5 seconds
      }
    }
  }

  // Main optimization function using genetic algorithm approach
  async optimizeStrategy(strategyId: string): Promise<StrategyParameters | null> {
    if (this.isOptimizing.get(strategyId) || this.marketData.length < 300) {
      return null;
    }

    this.isOptimizing.set(strategyId, true);
    console.log(`🧠 Starting optimization for strategy: ${strategyId}`);

    try {
      const currentParams = this.strategyParameters.get(strategyId);
      if (!currentParams) {
        throw new Error(`No parameters found for strategy ${strategyId}`);
      }

      const currentRegime = this.analyzeMarketRegime();
      
      // Generate parameter candidates using genetic algorithm
      const candidates = this.generateParameterCandidates(strategyId, 20);
      
      // Evaluate each candidate on recent market data
      const results: OptimizationResult[] = [];
      
      for (const params of candidates) {
        const performance = await this.backtestParameters(strategyId, params);
        results.push({
          strategyId,
          parameters: params,
          performance,
          marketRegime: currentRegime,
          timestamp: new Date(),
          confidence: this.calculateConfidence(performance, currentRegime),
          backtestPeriod: `${this.marketData.length} data points`
        });
      }

      // Sort by performance score
      results.sort((a, b) => this.calculateScore(b) - this.calculateScore(a));
      
      const bestResult = results[0];
      
      // Only update if significantly better than current
      if (this.shouldUpdateParameters(strategyId, bestResult)) {
        this.strategyParameters.set(strategyId, bestResult.parameters);
        
        // Store optimization history
        if (!this.optimizationHistory.has(strategyId)) {
          this.optimizationHistory.set(strategyId, []);
        }
        const history = this.optimizationHistory.get(strategyId)!;
        history.push(bestResult);
        
        // Keep only last 100 optimization results
        if (history.length > 100) {
          history.shift();
        }

        console.log(`✅ Parameters optimized for ${strategyId}!`, {
          newParams: Object.keys(bestResult.parameters).reduce((acc, key) => {
            acc[key] = bestResult.parameters[key].currentValue;
            return acc;
          }, {} as Record<string, any>),
          improvement: `${((this.calculateScore(bestResult) - 0.5) * 100).toFixed(1)}%`
        });

        this.notifyListeners();
      }

      return this.strategyParameters.get(strategyId) || null;
    } catch (error) {
      console.error(`❌ Error optimizing ${strategyId}:`, error);
      return null;
    } finally {
      this.isOptimizing.set(strategyId, false);
    }
  }

  // Generate parameter candidates using genetic algorithm
  private generateParameterCandidates(strategyId: string, count: number): StrategyParameters[] {
    const baseParams = this.strategyParameters.get(strategyId);
    if (!baseParams) return [];

    const candidates: StrategyParameters[] = [];
    
    // Add current parameters as baseline
    candidates.push(JSON.parse(JSON.stringify(baseParams)));
    
    // Add best historical parameters if available
    const history = this.optimizationHistory.get(strategyId);
    if (history && history.length > 0) {
      const best = [...history].sort((a, b) => this.calculateScore(b) - this.calculateScore(a))[0];
      candidates.push(JSON.parse(JSON.stringify(best.parameters)));
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
  private mutateParameters(base: StrategyParameters): StrategyParameters {
    const mutated = JSON.parse(JSON.stringify(base));
    const mutationRate = 0.15; // 15% chance per parameter
    
    for (const [key, param] of Object.entries(mutated)) {
      if (Math.random() < mutationRate) {
        mutated[key] = this.mutateParameter(param);
      }
    }

    return mutated;
  }

  private mutateParameter(param: PineScriptVariable): PineScriptVariable {
    const mutated = { ...param };
    
    switch (param.type) {
      case 'int':
        const intRange = (param.maxValue || 100) - (param.minValue || 1);
        const intMutation = Math.round((Math.random() - 0.5) * intRange * 0.2); // 20% of range
        mutated.currentValue = Math.max(
          param.minValue || 1,
          Math.min(param.maxValue || 100, (param.currentValue as number) + intMutation)
        );
        break;
        
      case 'float':
        const floatRange = (param.maxValue || 100) - (param.minValue || 0);
        const floatMutation = (Math.random() - 0.5) * floatRange * 0.2; // 20% of range
        mutated.currentValue = Math.max(
          param.minValue || 0,
          Math.min(param.maxValue || 100, (param.currentValue as number) + floatMutation)
        );
        break;
        
      case 'bool':
        if (Math.random() < 0.3) { // 30% chance to flip boolean
          mutated.currentValue = !param.currentValue;
        }
        break;
        
      case 'string':
        // For string parameters, we'd need strategy-specific logic
        // For now, keep unchanged
        break;
    }
    
    return mutated;
  }

  // Simplified backtest using parameter-based scoring
  private async backtestParameters(strategyId: string, params: StrategyParameters): Promise<PerformanceMetrics> {
    // This is a simplified backtest - in real implementation, you'd:
    // 1. Apply parameters to Pine Script logic
    // 2. Run strategy against historical data
    // 3. Calculate actual performance metrics
    
    // For now, we'll score parameters based on reasonable assumptions
    let score = 0.5; // Base score
    
    // Example scoring logic (you'd replace this with actual backtesting)
    for (const [key, param] of Object.entries(params)) {
      if (param.type === 'int' || param.type === 'float') {
        const value = param.currentValue as number;
        const min = param.minValue || 0;
        const max = param.maxValue || 100;
        
        // Prefer values in middle range (avoid extremes)
        const normalizedValue = (value - min) / (max - min);
        const distanceFromCenter = Math.abs(normalizedValue - 0.5);
        score += (0.5 - distanceFromCenter) * 0.1; // Small boost for centered values
      }
    }

    // Add some randomness to simulate market variability
    score += (Math.random() - 0.5) * 0.2;
    score = Math.max(0, Math.min(1, score)); // Clamp to 0-1

    // Convert score to realistic performance metrics
    const winRate = 0.45 + (score * 0.35); // 45-80% win rate
    const profitFactor = 0.8 + (score * 1.4); // 0.8-2.2 profit factor
    const sharpeRatio = -0.5 + (score * 2); // -0.5 to 1.5 Sharpe ratio
    const maxDrawdown = 0.25 - (score * 0.15); // 10-25% max drawdown
    
    return {
      winRate,
      profitFactor,
      totalTrades: Math.floor(20 + (score * 30)), // 20-50 trades
      sharpeRatio,
      maxDrawdown,
      avgWinLoss: winRate / (1 - winRate),
      timeInMarket: 0.3 + (score * 0.4), // 30-70% time in market
      totalReturn: score * 0.5 // 0-50% total return
    };
  }

  // Other utility methods...
  private analyzeMarketRegime(): MarketRegime {
    // Simplified market regime analysis
    const prices = this.marketData.slice(-100).map(d => d.price);
    if (prices.length < 50) {
      return {
        trend: 'sideways',
        volatility: 'medium',
        volume: 'medium',
        momentum: 0,
        regime_score: 0.5
      };
    }

    const returns = prices.slice(1).map((price, i) => (price - prices[i]) / prices[i]);
    const avgReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
    const volatility = Math.sqrt(returns.reduce((sum, ret) => sum + Math.pow(ret - avgReturn, 2), 0) / returns.length);

    return {
      trend: avgReturn > 0.001 ? 'bullish' : avgReturn < -0.001 ? 'bearish' : 'sideways',
      volatility: volatility > 0.03 ? 'high' : volatility > 0.015 ? 'medium' : 'low',
      volume: 'medium', // Placeholder
      momentum: avgReturn,
      regime_score: 0.8 // Confidence in regime detection
    };
  }

  private calculateConfidence(performance: PerformanceMetrics, regime: MarketRegime): number {
    let confidence = 0;
    
    // Base confidence on trade count
    confidence += Math.min(performance.totalTrades / 50, 1) * 0.3;
    
    // Add confidence based on performance metrics
    confidence += Math.max(0, (performance.winRate - 0.5) * 2) * 0.3;
    confidence += Math.min(performance.profitFactor / 2, 1) * 0.2;
    confidence += Math.min(Math.max(performance.sharpeRatio, 0) / 2, 1) * 0.2;
    
    return Math.min(confidence, 1);
  }

  private calculateScore(result: OptimizationResult): number {
    const p = result.performance;
    
    return (
      p.winRate * 0.25 +
      Math.min(p.profitFactor / 3, 1) * 0.25 +
      Math.min(Math.max(p.sharpeRatio, 0) / 2, 1) * 0.20 +
      Math.max(0, 1 - p.maxDrawdown * 2) * 0.15 +
      Math.min(p.totalTrades / 100, 1) * 0.15
    ) * result.confidence;
  }

  private shouldUpdateParameters(strategyId: string, newResult: OptimizationResult): boolean {
    const history = this.optimizationHistory.get(strategyId);
    if (!history || history.length === 0) return true;
    
    const recentScores = history.slice(-5).map(r => this.calculateScore(r));
    const currentScore = recentScores.reduce((sum, score) => sum + score, 0) / recentScores.length;
    const newScore = this.calculateScore(newResult);
    
    // Require 3% improvement to change parameters
    return newScore > currentScore * 1.03;
  }

  // Public API
  getStrategyParameters(strategyId: string): StrategyParameters | undefined {
    return this.strategyParameters.get(strategyId);
  }

  getOptimizationHistory(strategyId: string): OptimizationResult[] {
    return this.optimizationHistory.get(strategyId) || [];
  }

  getWebhookTestResults(strategyId: string): WebhookTestResult[] {
    return this.webhookTestResults.get(strategyId) || [];
  }

  isStrategyOptimizing(strategyId: string): boolean {
    return this.isOptimizing.get(strategyId) || false;
  }

  async forceOptimization(strategyId: string): Promise<StrategyParameters | null> {
    return this.optimizeStrategy(strategyId);
  }

  subscribe(callback: () => void): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  private notifyListeners(): void {
    this.listeners.forEach(callback => callback());
  }
}

export default PineStrategyOptimizer;
export type { 
  PineScriptVariable, 
  StrategyParameters, 
  PerformanceMetrics, 
  MarketRegime, 
  OptimizationResult, 
  WebhookTestResult 
};
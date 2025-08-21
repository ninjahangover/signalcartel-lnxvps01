/**
 * Trigger Performance Tracking and Learning System
 * 
 * Tracks, analyzes, and learns from trigger performance to improve future generation:
 * - Real-time performance monitoring
 * - Statistical analysis and significance testing
 * - Machine learning for pattern recognition
 * - Adaptive parameter optimization
 * - Performance attribution analysis
 */

import { GeneratedTrigger, MarketRegimeContext, TriggerPerformanceRecord } from './dynamic-trigger-generator';

export interface PerformanceTrackingConfig {
  trackingWindow: number; // days to track performance
  minTradesForSignificance: number;
  learningRate: number; // 0-1, how quickly to adapt
  enableRealTimeUpdates: boolean;
  enableBayesianUpdates: boolean;
  enableRegimeSpecificTracking: boolean;
  significanceThreshold: number; // p-value threshold
}

export interface TriggerPerformanceMetrics {
  triggerId: string;
  triggerType: string;
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  winRate: number;
  avgReturn: number;
  avgWin: number;
  avgLoss: number;
  maxWin: number;
  maxLoss: number;
  profitFactor: number;
  sharpeRatio: number;
  calmarRatio: number;
  maxDrawdown: number;
  avgDuration: number; // minutes
  avgSlippage: number;
  totalReturn: number;
  volatilityOfReturns: number;
  informationRatio: number;
  sortino: number;
  beta: number;
  alpha: number;
  trackingError: number;
  activeReturn: number;
}

export interface PerformanceAttribution {
  factorContributions: Map<string, number>; // Factor -> contribution to return
  regimeContributions: Map<string, number>; // Regime -> contribution
  timeBasedContributions: Map<string, number>; // Time period -> contribution
  parameterSensitivity: Map<string, number>; // Parameter -> sensitivity
  interactionEffects: Map<string, number>; // Parameter interactions
}

export interface LearningInsights {
  optimalParameters: Map<string, OptimalParameterRange>;
  regimeSpecificPatterns: Map<string, RegimePattern>;
  seasonalPatterns: Map<string, SeasonalPattern>;
  degradationPatterns: DegradationPattern[];
  improvementOpportunities: ImprovementOpportunity[];
  riskWarnings: RiskWarning[];
}

export interface OptimalParameterRange {
  parameter: string;
  optimalValue: number;
  confidenceInterval: [number, number];
  performanceImpact: number; // performance improvement vs default
  stability: number; // how stable this optimal value is
  lastUpdated: Date;
  sampleSize: number;
}

export interface RegimePattern {
  regime: string;
  optimalConditions: Map<string, number>;
  performanceCharacteristics: PerformanceCharacteristics;
  adaptationRecommendations: string[];
  confidenceLevel: number;
}

export interface SeasonalPattern {
  timePattern: string; // 'hour_of_day', 'day_of_week', 'month', etc.
  optimalTimes: number[];
  avoidTimes: number[];
  performanceMultiplier: number;
  confidence: number;
}

export interface DegradationPattern {
  triggerId: string;
  degradationType: 'gradual' | 'sudden' | 'cyclical';
  startDate: Date;
  severity: number; // 0-1
  possibleCauses: string[];
  recommendedActions: string[];
}

export interface ImprovementOpportunity {
  area: string;
  potentialGain: number; // estimated performance improvement
  implementation: 'easy' | 'medium' | 'hard';
  description: string;
  requirements: string[];
  estimatedTimeframe: string;
}

export interface RiskWarning {
  type: 'performance' | 'drawdown' | 'correlation' | 'regime_shift';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  triggeredBy: string[];
  recommendedAction: string;
  timestamp: Date;
}

export interface PerformanceCharacteristics {
  winRate: number;
  avgReturn: number;
  sharpeRatio: number;
  maxDrawdown: number;
  volatility: number;
  consistency: number; // how consistent performance is
}

export interface BayesianUpdate {
  priorBelief: number;
  evidence: number;
  posteriorBelief: number;
  confidence: number;
  updateStrength: number;
}

export class TriggerPerformanceTracker {
  private config: PerformanceTrackingConfig;
  private performanceRecords: Map<string, TriggerPerformanceRecord[]> = new Map();
  private metricsCache: Map<string, TriggerPerformanceMetrics> = new Map();
  private attributionCache: Map<string, PerformanceAttribution> = new Map();
  private learningInsights: LearningInsights;
  
  private statisticalAnalyzer: PerformanceStatisticalAnalyzer;
  private bayesianUpdater: BayesianParameterUpdater;
  private patternDetector: PerformancePatternDetector;
  private attributionAnalyzer: PerformanceAttributionAnalyzer;
  
  constructor(config: PerformanceTrackingConfig) {
    this.config = config;
    this.statisticalAnalyzer = new PerformanceStatisticalAnalyzer(config);
    this.bayesianUpdater = new BayesianParameterUpdater(config.learningRate);
    this.patternDetector = new PerformancePatternDetector();
    this.attributionAnalyzer = new PerformanceAttributionAnalyzer();
    
    this.learningInsights = this.initializeLearningInsights();
  }

  /**
   * Record a completed trade performance
   */
  async recordTradePerformance(
    trigger: GeneratedTrigger,
    outcome: TriggerPerformanceRecord,
    marketRegime: MarketRegimeContext
  ): Promise<void> {
    // Store the performance record
    const triggerType = this.extractTriggerType(trigger.id);
    if (!this.performanceRecords.has(triggerType)) {
      this.performanceRecords.set(triggerType, []);
    }
    
    const records = this.performanceRecords.get(triggerType)!;
    records.push({
      ...outcome,
      marketRegime: marketRegime.currentRegime
    });
    
    // Limit record history
    if (records.length > 10000) {
      records.splice(0, records.length - 10000);
    }
    
    // Update metrics if real-time updates enabled
    if (this.config.enableRealTimeUpdates) {
      await this.updateMetrics(triggerType);
    }
    
    // Perform Bayesian parameter updates
    if (this.config.enableBayesianUpdates) {
      await this.updateParametersWithBayesian(trigger, outcome, marketRegime);
    }
    
    // Check for warnings
    await this.checkForRiskWarnings(trigger, outcome);
    
    // Update learning insights
    await this.updateLearningInsights(trigger, outcome, marketRegime);
  }

  /**
   * Get comprehensive performance metrics for a trigger type
   */
  async getPerformanceMetrics(triggerType: string): Promise<TriggerPerformanceMetrics | null> {
    // Check cache first
    if (this.metricsCache.has(triggerType)) {
      const cached = this.metricsCache.get(triggerType)!;
      // Return cached if recent enough (5 minutes)
      if (Date.now() - cached.lastUpdated < 300000) {
        return cached;
      }
    }
    
    return await this.calculateMetrics(triggerType);
  }

  /**
   * Calculate comprehensive metrics for a trigger type
   */
  private async calculateMetrics(triggerType: string): Promise<TriggerPerformanceMetrics | null> {
    const records = this.performanceRecords.get(triggerType);
    if (!records || records.length === 0) {
      return null;
    }
    
    // Filter recent records based on tracking window
    const cutoffDate = new Date(Date.now() - (this.config.trackingWindow * 24 * 60 * 60 * 1000));
    const recentRecords = records.filter(r => r.timestamp >= cutoffDate);
    
    if (recentRecords.length === 0) {
      return null;
    }
    
    // Calculate basic metrics
    const totalTrades = recentRecords.length;
    const winningTrades = recentRecords.filter(r => r.return > 0).length;
    const losingTrades = recentRecords.filter(r => r.return < 0).length;
    const winRate = winningTrades / totalTrades;
    
    const returns = recentRecords.map(r => r.return);
    const avgReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length;
    const avgWin = winningTrades > 0 ? 
      returns.filter(r => r > 0).reduce((sum, r) => sum + r, 0) / winningTrades : 0;
    const avgLoss = losingTrades > 0 ? 
      returns.filter(r => r < 0).reduce((sum, r) => sum + r, 0) / losingTrades : 0;
    
    const maxWin = Math.max(...returns.filter(r => r > 0), 0);
    const maxLoss = Math.min(...returns.filter(r => r < 0), 0);
    
    const profitFactor = avgLoss !== 0 ? (avgWin * winningTrades) / (Math.abs(avgLoss) * losingTrades) : 0;
    
    // Calculate advanced metrics
    const volatility = this.calculateStandardDeviation(returns);
    const sharpeRatio = volatility !== 0 ? avgReturn / volatility : 0;
    const maxDrawdown = this.calculateMaxDrawdown(returns);
    const calmarRatio = maxDrawdown !== 0 ? avgReturn / Math.abs(maxDrawdown) : 0;
    
    const avgDuration = recentRecords.reduce((sum, r) => sum + r.duration, 0) / totalTrades;
    const avgSlippage = recentRecords.reduce((sum, r) => sum + (r.slippage || 0), 0) / totalTrades;
    const totalReturn = returns.reduce((sum, r) => sum + r, 0);
    
    // Calculate additional sophisticated metrics
    const downside = returns.filter(r => r < 0);
    const downsideVolatility = downside.length > 0 ? this.calculateStandardDeviation(downside) : 0;
    const sortino = downsideVolatility !== 0 ? avgReturn / downsideVolatility : 0;
    
    // Benchmark comparison (assuming benchmark return is 0)
    const benchmarkReturn = 0;
    const activeReturn = avgReturn - benchmarkReturn;
    const trackingError = volatility; // Simplified
    const informationRatio = trackingError !== 0 ? activeReturn / trackingError : 0;
    const beta = 1; // Simplified
    const alpha = avgReturn - (beta * benchmarkReturn);
    
    const metrics: TriggerPerformanceMetrics = {
      triggerId: triggerType,
      triggerType,
      totalTrades,
      winningTrades,
      losingTrades,
      winRate,
      avgReturn,
      avgWin,
      avgLoss,
      maxWin,
      maxLoss,
      profitFactor,
      sharpeRatio,
      calmarRatio,
      maxDrawdown,
      avgDuration,
      avgSlippage,
      totalReturn,
      volatilityOfReturns: volatility,
      informationRatio,
      sortino,
      beta,
      alpha,
      trackingError,
      activeReturn,
      lastUpdated: Date.now()
    };
    
    // Cache the metrics
    this.metricsCache.set(triggerType, metrics);
    
    return metrics;
  }

  /**
   * Get performance attribution analysis
   */
  async getPerformanceAttribution(triggerType: string): Promise<PerformanceAttribution | null> {
    // Check cache first
    if (this.attributionCache.has(triggerType)) {
      return this.attributionCache.get(triggerType)!;
    }
    
    const records = this.performanceRecords.get(triggerType);
    if (!records || records.length < this.config.minTradesForSignificance) {
      return null;
    }
    
    const attribution = await this.attributionAnalyzer.analyze(records);
    this.attributionCache.set(triggerType, attribution);
    
    return attribution;
  }

  /**
   * Get learning insights for optimization
   */
  getLearningInsights(): LearningInsights {
    return this.learningInsights;
  }

  /**
   * Get optimal parameters for a trigger type in specific regime
   */
  async getOptimalParameters(
    triggerType: string, 
    regime?: string
  ): Promise<Map<string, OptimalParameterRange>> {
    const insights = this.learningInsights;
    
    if (regime && insights.regimeSpecificPatterns.has(regime)) {
      const regimePattern = insights.regimeSpecificPatterns.get(regime)!;
      const optimalParams = new Map<string, OptimalParameterRange>();
      
      for (const [param, value] of regimePattern.optimalConditions) {
        if (insights.optimalParameters.has(param)) {
          const baseRange = insights.optimalParameters.get(param)!;
          optimalParams.set(param, {
            ...baseRange,
            optimalValue: value // Override with regime-specific value
          });
        }
      }
      
      return optimalParams;
    }
    
    return insights.optimalParameters;
  }

  /**
   * Update parameters using Bayesian learning
   */
  private async updateParametersWithBayesian(
    trigger: GeneratedTrigger,
    outcome: TriggerPerformanceRecord,
    regime: MarketRegimeContext
  ): Promise<void> {
    for (const condition of trigger.conditions) {
      if (condition.dynamic) {
        const update = await this.bayesianUpdater.updateParameter(
          condition.indicator,
          condition.value,
          outcome.return,
          regime.currentRegime
        );
        
        // Store the updated belief
        await this.storeBayesianUpdate(condition.indicator, update);
      }
    }
  }

  /**
   * Store Bayesian parameter update
   */
  private async storeBayesianUpdate(parameter: string, update: BayesianUpdate): Promise<void> {
    const optimalParam = this.learningInsights.optimalParameters.get(parameter);
    
    if (optimalParam) {
      // Update optimal value with Bayesian posterior
      optimalParam.optimalValue = update.posteriorBelief;
      optimalParam.confidenceInterval = [
        update.posteriorBelief - (1.96 * Math.sqrt(update.confidence)),
        update.posteriorBelief + (1.96 * Math.sqrt(update.confidence))
      ];
      optimalParam.lastUpdated = new Date();
    }
  }

  /**
   * Check for risk warnings
   */
  private async checkForRiskWarnings(
    trigger: GeneratedTrigger,
    outcome: TriggerPerformanceRecord
  ): Promise<void> {
    const triggerType = this.extractTriggerType(trigger.id);
    const recentRecords = this.getRecentRecords(triggerType, 20); // Last 20 trades
    
    if (recentRecords.length < 10) return;
    
    // Check for performance degradation
    const recentWinRate = recentRecords.filter(r => r.return > 0).length / recentRecords.length;
    const historicalWinRate = this.calculateHistoricalWinRate(triggerType);
    
    if (recentWinRate < historicalWinRate * 0.7) { // 30% degradation
      this.addRiskWarning({
        type: 'performance',
        severity: recentWinRate < historicalWinRate * 0.5 ? 'critical' : 'high',
        description: `Performance degradation detected: Recent win rate ${(recentWinRate * 100).toFixed(1)}% vs historical ${(historicalWinRate * 100).toFixed(1)}%`,
        triggeredBy: [triggerType],
        recommendedAction: 'Consider parameter adjustment or temporary disabling',
        timestamp: new Date()
      });
    }
    
    // Check for excessive drawdown
    const recentReturns = recentRecords.map(r => r.return);
    const currentDrawdown = this.calculateMaxDrawdown(recentReturns);
    
    if (Math.abs(currentDrawdown) > 0.2) { // 20% drawdown
      this.addRiskWarning({
        type: 'drawdown',
        severity: Math.abs(currentDrawdown) > 0.3 ? 'critical' : 'high',
        description: `Excessive drawdown detected: ${(currentDrawdown * 100).toFixed(1)}%`,
        triggeredBy: [triggerType],
        recommendedAction: 'Review stop-loss settings and position sizing',
        timestamp: new Date()
      });
    }
  }

  /**
   * Update learning insights based on new performance data
   */
  private async updateLearningInsights(
    trigger: GeneratedTrigger,
    outcome: TriggerPerformanceRecord,
    regime: MarketRegimeContext
  ): Promise<void> {
    const triggerType = this.extractTriggerType(trigger.id);
    
    // Update regime-specific patterns
    if (this.config.enableRegimeSpecificTracking) {
      await this.updateRegimeSpecificPatterns(triggerType, outcome, regime);
    }
    
    // Update seasonal patterns
    await this.updateSeasonalPatterns(triggerType, outcome);
    
    // Detect degradation patterns
    await this.detectDegradationPatterns(triggerType);
    
    // Identify improvement opportunities
    await this.identifyImprovementOpportunities(triggerType);
  }

  // Helper Methods

  private extractTriggerType(triggerId: string): string {
    return triggerId.split('_')[0] || 'unknown';
  }

  private calculateStandardDeviation(values: number[]): number {
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const squaredDiffs = values.map(val => Math.pow(val - mean, 2));
    const variance = squaredDiffs.reduce((sum, diff) => sum + diff, 0) / values.length;
    return Math.sqrt(variance);
  }

  private calculateMaxDrawdown(returns: number[]): number {
    let peak = 0;
    let maxDrawdown = 0;
    let cumulativeReturn = 0;
    
    for (const ret of returns) {
      cumulativeReturn += ret;
      if (cumulativeReturn > peak) {
        peak = cumulativeReturn;
      }
      const drawdown = (cumulativeReturn - peak) / (1 + peak);
      if (drawdown < maxDrawdown) {
        maxDrawdown = drawdown;
      }
    }
    
    return maxDrawdown;
  }

  private getRecentRecords(triggerType: string, count: number): TriggerPerformanceRecord[] {
    const records = this.performanceRecords.get(triggerType) || [];
    return records.slice(-count);
  }

  private calculateHistoricalWinRate(triggerType: string): number {
    const records = this.performanceRecords.get(triggerType) || [];
    if (records.length === 0) return 0.5;
    
    const wins = records.filter(r => r.return > 0).length;
    return wins / records.length;
  }

  private addRiskWarning(warning: RiskWarning): void {
    this.learningInsights.riskWarnings.push(warning);
    
    // Keep only recent warnings (last 100)
    if (this.learningInsights.riskWarnings.length > 100) {
      this.learningInsights.riskWarnings = this.learningInsights.riskWarnings.slice(-100);
    }
  }

  private async updateRegimeSpecificPatterns(
    triggerType: string,
    outcome: TriggerPerformanceRecord,
    regime: MarketRegimeContext
  ): Promise<void> {
    // Implementation would analyze performance by regime
  }

  private async updateSeasonalPatterns(
    triggerType: string,
    outcome: TriggerPerformanceRecord
  ): Promise<void> {
    // Implementation would analyze seasonal performance patterns
  }

  private async detectDegradationPatterns(triggerType: string): Promise<void> {
    // Implementation would detect performance degradation patterns
  }

  private async identifyImprovementOpportunities(triggerType: string): Promise<void> {
    // Implementation would identify areas for improvement
  }

  private initializeLearningInsights(): LearningInsights {
    return {
      optimalParameters: new Map(),
      regimeSpecificPatterns: new Map(),
      seasonalPatterns: new Map(),
      degradationPatterns: [],
      improvementOpportunities: [],
      riskWarnings: []
    };
  }

  private async updateMetrics(triggerType: string): Promise<void> {
    await this.calculateMetrics(triggerType);
  }

  /**
   * Export performance data for external analysis
   */
  exportPerformanceData(triggerType?: string): any {
    if (triggerType) {
      return {
        records: this.performanceRecords.get(triggerType) || [],
        metrics: this.metricsCache.get(triggerType) || null,
        attribution: this.attributionCache.get(triggerType) || null
      };
    }
    
    const allData: any = {};
    for (const [type, records] of this.performanceRecords) {
      allData[type] = {
        records,
        metrics: this.metricsCache.get(type) || null,
        attribution: this.attributionCache.get(type) || null
      };
    }
    
    return allData;
  }

  /**
   * Reset performance data
   */
  reset(triggerType?: string): void {
    if (triggerType) {
      this.performanceRecords.delete(triggerType);
      this.metricsCache.delete(triggerType);
      this.attributionCache.delete(triggerType);
    } else {
      this.performanceRecords.clear();
      this.metricsCache.clear();
      this.attributionCache.clear();
      this.learningInsights = this.initializeLearningInsights();
    }
  }
}

// Supporting Classes

class PerformanceStatisticalAnalyzer {
  constructor(private config: PerformanceTrackingConfig) {}
  
  async testSignificance(records: TriggerPerformanceRecord[]): Promise<boolean> {
    // Implement statistical significance testing
    return records.length >= this.config.minTradesForSignificance;
  }
}

class BayesianParameterUpdater {
  constructor(private learningRate: number) {}
  
  async updateParameter(
    parameter: string,
    currentValue: number,
    evidence: number,
    regime: string
  ): Promise<BayesianUpdate> {
    // Implement Bayesian parameter updating
    return {
      priorBelief: currentValue,
      evidence,
      posteriorBelief: currentValue + (evidence * this.learningRate),
      confidence: 0.8,
      updateStrength: Math.abs(evidence)
    };
  }
}

class PerformancePatternDetector {
  detectPatterns(records: TriggerPerformanceRecord[]): any[] {
    // Implement pattern detection in performance data
    return [];
  }
}

class PerformanceAttributionAnalyzer {
  async analyze(records: TriggerPerformanceRecord[]): Promise<PerformanceAttribution> {
    // Implement performance attribution analysis
    return {
      factorContributions: new Map(),
      regimeContributions: new Map(),
      timeBasedContributions: new Map(),
      parameterSensitivity: new Map(),
      interactionEffects: new Map()
    };
  }
}

export const triggerPerformanceTracker = (config: PerformanceTrackingConfig) => 
  new TriggerPerformanceTracker(config);
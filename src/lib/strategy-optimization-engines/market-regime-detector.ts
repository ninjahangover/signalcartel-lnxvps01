/**
 * Real-Time Market Regime Detection System
 * 
 * Identifies and tracks market regimes in real-time using:
 * - Multi-timeframe analysis
 * - Machine learning classification
 * - Statistical regime change detection
 * - Market microstructure indicators
 * - Volatility clustering analysis
 */

import { MarketDataSnapshot, MarketRegimeContext } from './dynamic-trigger-generator';

export interface RegimeDetectorConfig {
  lookbackWindow: number; // periods to analyze
  regimeChangeThreshold: number; // 0-1, sensitivity to regime changes
  confidenceThreshold: number; // minimum confidence to declare regime
  updateFrequency: number; // seconds between updates
  enableMLClassification: boolean;
  enableStatisticalTests: boolean;
  enableMicrostructureAnalysis: boolean;
}

export interface RegimeFeatures {
  trend: TrendFeatures;
  volatility: VolatilityFeatures;
  volume: VolumeFeatures;
  momentum: MomentumFeatures;
  microstructure: MicrostructureFeatures;
  cyclical: CyclicalFeatures;
}

export interface TrendFeatures {
  direction: 'up' | 'down' | 'sideways';
  strength: number; // 0-1
  consistency: number; // 0-1
  duration: number; // periods
  slope: number;
  r_squared: number; // trend line fit quality
}

export interface VolatilityFeatures {
  level: 'low' | 'medium' | 'high';
  clustering: number; // 0-1, volatility clustering measure
  regime: 'stable' | 'transitioning' | 'chaotic';
  garch_alpha: number;
  garch_beta: number;
  realized_vol: number;
  implied_vol?: number;
}

export interface VolumeFeatures {
  level: 'low' | 'medium' | 'high';
  trend: 'increasing' | 'decreasing' | 'stable';
  distribution: 'normal' | 'heavy_tailed' | 'bimodal';
  onBalanceVolume: number;
  volumeWeightedPrice: number;
  volumeRatio: number; // current vs average
}

export interface MomentumFeatures {
  shortTerm: number; // 5-period momentum
  mediumTerm: number; // 20-period momentum
  longTerm: number; // 50-period momentum
  acceleration: number;
  rsi: number;
  macd: { line: number; signal: number; histogram: number };
  divergence: 'bullish' | 'bearish' | 'none';
}

export interface MicrostructureFeatures {
  spreadTightness: number; // 0-1
  depthImbalance: number; // -1 to 1
  tradeSize: 'small' | 'medium' | 'large';
  orderFlow: 'buying' | 'selling' | 'balanced';
  informationContent: number; // 0-1
  marketImpact: number;
}

export interface CyclicalFeatures {
  dayOfWeek: number; // 0-6
  hourOfDay: number; // 0-23
  monthOfYear: number; // 0-11
  seasonality: number; // seasonal component
  cyclicalPhase: 'expansion' | 'peak' | 'contraction' | 'trough';
}

export interface RegimeClassificationResult {
  regime: MarketRegime;
  confidence: number;
  probability_distribution: Map<MarketRegime, number>;
  feature_importance: Map<string, number>;
  regime_stability: number;
  expected_duration: number;
}

export enum MarketRegime {
  TRENDING_BULL = 'trending_bull',
  TRENDING_BEAR = 'trending_bear',
  SIDEWAYS_CALM = 'sideways_calm',
  SIDEWAYS_CHOPPY = 'sideways_choppy',
  VOLATILE_UP = 'volatile_up',
  VOLATILE_DOWN = 'volatile_down',
  BREAKOUT_BULL = 'breakout_bull',
  BREAKOUT_BEAR = 'breakout_bear',
  REVERSAL_BULL = 'reversal_bull',
  REVERSAL_BEAR = 'reversal_bear'
}

export interface RegimeTransition {
  from: MarketRegime;
  to: MarketRegime;
  timestamp: Date;
  confidence: number;
  trigger_features: string[];
  expected_duration: number;
}

export class MarketRegimeDetector {
  private config: RegimeDetectorConfig;
  private marketHistory: MarketDataSnapshot[] = [];
  private regimeHistory: RegimeClassificationResult[] = [];
  private currentRegime: RegimeClassificationResult | null = null;
  
  private featureExtractor: FeatureExtractor;
  private mlClassifier: MLRegimeClassifier;
  private statisticalDetector: StatisticalRegimeDetector;
  private microstructureAnalyzer: MicrostructureAnalyzer;
  
  constructor(config: RegimeDetectorConfig) {
    this.config = config;
    this.featureExtractor = new FeatureExtractor();
    this.mlClassifier = new MLRegimeClassifier();
    this.statisticalDetector = new StatisticalRegimeDetector();
    this.microstructureAnalyzer = new MicrostructureAnalyzer();
  }

  /**
   * Detect current market regime from latest data
   */
  async detectRegime(marketData: MarketDataSnapshot): Promise<MarketRegimeContext> {
    this.updateMarketHistory(marketData);
    
    if (this.marketHistory.length < 50) {
      return this.getDefaultRegime();
    }

    // 1. Extract comprehensive features
    const features = await this.extractFeatures();
    
    // 2. Run multiple detection methods
    const classificationResults = await Promise.all([
      this.config.enableMLClassification ? this.mlClassifier.classify(features) : null,
      this.config.enableStatisticalTests ? this.statisticalDetector.detect(features) : null,
      this.config.enableMicrostructureAnalysis ? this.microstructureAnalyzer.analyze(features) : null
    ]);
    
    // 3. Combine results using ensemble method
    const ensembleResult = await this.combineClassificationResults(
      classificationResults.filter(r => r !== null) as RegimeClassificationResult[]
    );
    
    // 4. Validate regime change
    const validatedResult = await this.validateRegimeChange(ensembleResult);
    
    // 5. Update regime history
    this.updateRegimeHistory(validatedResult);
    
    // 6. Calculate additional context
    const regimeContext = await this.buildRegimeContext(validatedResult);
    
    return regimeContext;
  }

  /**
   * Extract comprehensive features from market data
   */
  private async extractFeatures(): Promise<RegimeFeatures> {
    const recentData = this.marketHistory.slice(-this.config.lookbackWindow);
    
    return {
      trend: await this.featureExtractor.extractTrendFeatures(recentData),
      volatility: await this.featureExtractor.extractVolatilityFeatures(recentData),
      volume: await this.featureExtractor.extractVolumeFeatures(recentData),
      momentum: await this.featureExtractor.extractMomentumFeatures(recentData),
      microstructure: await this.featureExtractor.extractMicrostructureFeatures(recentData),
      cyclical: await this.featureExtractor.extractCyclicalFeatures(recentData)
    };
  }

  /**
   * Combine multiple classification results using ensemble method
   */
  private async combineClassificationResults(
    results: RegimeClassificationResult[]
  ): Promise<RegimeClassificationResult> {
    if (results.length === 0) {
      throw new Error('No classification results provided');
    }
    
    if (results.length === 1) {
      return results[0];
    }
    
    // Weighted voting based on confidence
    const regimeCounts = new Map<MarketRegime, number>();
    const regimeWeights = new Map<MarketRegime, number>();
    
    for (const result of results) {
      const weight = result.confidence;
      regimeCounts.set(result.regime, (regimeCounts.get(result.regime) || 0) + 1);
      regimeWeights.set(result.regime, (regimeWeights.get(result.regime) || 0) + weight);
    }
    
    // Find regime with highest weighted vote
    let bestRegime: MarketRegime = MarketRegime.SIDEWAYS_CALM;
    let bestWeight = 0;
    
    for (const [regime, weight] of regimeWeights) {
      if (weight > bestWeight) {
        bestWeight = weight;
        bestRegime = regime;
      }
    }
    
    // Calculate ensemble confidence
    const avgConfidence = results.reduce((sum, r) => sum + r.confidence, 0) / results.length;
    const consensusBonus = (regimeCounts.get(bestRegime) || 0) / results.length;
    const ensembleConfidence = Math.min(0.95, avgConfidence * consensusBonus);
    
    // Combine probability distributions
    const combinedProbabilities = new Map<MarketRegime, number>();
    for (const regime of Object.values(MarketRegime)) {
      const avgProb = results.reduce((sum, r) => 
        sum + (r.probability_distribution.get(regime) || 0), 0) / results.length;
      combinedProbabilities.set(regime, avgProb);
    }
    
    // Combine feature importance
    const combinedImportance = new Map<string, number>();
    const allFeatures = new Set<string>();
    results.forEach(r => r.feature_importance.forEach((_, feature) => allFeatures.add(feature)));
    
    for (const feature of allFeatures) {
      const avgImportance = results.reduce((sum, r) => 
        sum + (r.feature_importance.get(feature) || 0), 0) / results.length;
      combinedImportance.set(feature, avgImportance);
    }
    
    return {
      regime: bestRegime,
      confidence: ensembleConfidence,
      probability_distribution: combinedProbabilities,
      feature_importance: combinedImportance,
      regime_stability: this.calculateRegimeStability(),
      expected_duration: this.calculateExpectedDuration(bestRegime)
    };
  }

  /**
   * Validate regime change to prevent false signals
   */
  private async validateRegimeChange(result: RegimeClassificationResult): Promise<RegimeClassificationResult> {
    if (!this.currentRegime) {
      this.currentRegime = result;
      return result;
    }
    
    // Check if regime actually changed
    if (this.currentRegime.regime === result.regime) {
      // Same regime - update confidence
      const updatedResult = { ...result };
      updatedResult.regime_stability = Math.min(0.99, this.currentRegime.regime_stability + 0.01);
      this.currentRegime = updatedResult;
      return updatedResult;
    }
    
    // Potential regime change - apply validation rules
    const changeConfidence = this.calculateRegimeChangeConfidence(this.currentRegime, result);
    
    if (changeConfidence >= this.config.regimeChangeThreshold) {
      // Valid regime change
      const transition: RegimeTransition = {
        from: this.currentRegime.regime,
        to: result.regime,
        timestamp: new Date(),
        confidence: changeConfidence,
        trigger_features: this.identifyTriggerFeatures(this.currentRegime, result),
        expected_duration: result.expected_duration
      };
      
      console.log(`Regime change detected: ${transition.from} -> ${transition.to} (confidence: ${changeConfidence.toFixed(2)})`);
      
      this.currentRegime = result;
      return result;
    } else {
      // Not confident enough in regime change - stick with current
      return this.currentRegime;
    }
  }

  /**
   * Calculate confidence in regime change
   */
  private calculateRegimeChangeConfidence(
    current: RegimeClassificationResult,
    proposed: RegimeClassificationResult
  ): number {
    // Base confidence from new classification
    let confidence = proposed.confidence;
    
    // Boost confidence if current regime has low stability
    if (current.regime_stability < 0.5) {
      confidence += 0.2;
    }
    
    // Reduce confidence if regimes are similar
    const regimeSimilarity = this.calculateRegimeSimilarity(current.regime, proposed.regime);
    confidence -= regimeSimilarity * 0.3;
    
    // Boost confidence based on feature changes
    const featureChangeScore = this.calculateFeatureChangeScore(current, proposed);
    confidence += featureChangeScore * 0.1;
    
    return Math.max(0, Math.min(1, confidence));
  }

  /**
   * Calculate similarity between two regimes
   */
  private calculateRegimeSimilarity(regime1: MarketRegime, regime2: MarketRegime): number {
    // Define regime similarity matrix
    const similarities: { [key: string]: { [key: string]: number } } = {
      [MarketRegime.TRENDING_BULL]: {
        [MarketRegime.BREAKOUT_BULL]: 0.7,
        [MarketRegime.VOLATILE_UP]: 0.5,
        [MarketRegime.REVERSAL_BULL]: 0.3
      },
      [MarketRegime.TRENDING_BEAR]: {
        [MarketRegime.BREAKOUT_BEAR]: 0.7,
        [MarketRegime.VOLATILE_DOWN]: 0.5,
        [MarketRegime.REVERSAL_BEAR]: 0.3
      },
      [MarketRegime.SIDEWAYS_CALM]: {
        [MarketRegime.SIDEWAYS_CHOPPY]: 0.6
      },
      // Add more similarities as needed
    };
    
    return similarities[regime1]?.[regime2] || 0;
  }

  /**
   * Calculate score based on feature changes
   */
  private calculateFeatureChangeScore(
    current: RegimeClassificationResult,
    proposed: RegimeClassificationResult
  ): number {
    let changeScore = 0;
    let totalFeatures = 0;
    
    for (const [feature, currentImportance] of current.feature_importance) {
      const proposedImportance = proposed.feature_importance.get(feature) || 0;
      const change = Math.abs(currentImportance - proposedImportance);
      changeScore += change * Math.max(currentImportance, proposedImportance);
      totalFeatures++;
    }
    
    return totalFeatures > 0 ? changeScore / totalFeatures : 0;
  }

  /**
   * Identify features that triggered regime change
   */
  private identifyTriggerFeatures(
    current: RegimeClassificationResult,
    proposed: RegimeClassificationResult
  ): string[] {
    const triggerFeatures: string[] = [];
    const threshold = 0.1; // Minimum change to be considered a trigger
    
    for (const [feature, currentImportance] of current.feature_importance) {
      const proposedImportance = proposed.feature_importance.get(feature) || 0;
      const change = Math.abs(currentImportance - proposedImportance);
      
      if (change > threshold) {
        triggerFeatures.push(feature);
      }
    }
    
    return triggerFeatures.sort((a, b) => {
      const aChange = Math.abs(
        (current.feature_importance.get(a) || 0) - 
        (proposed.feature_importance.get(a) || 0)
      );
      const bChange = Math.abs(
        (current.feature_importance.get(b) || 0) - 
        (proposed.feature_importance.get(b) || 0)
      );
      return bChange - aChange;
    });
  }

  /**
   * Build comprehensive regime context
   */
  private async buildRegimeContext(result: RegimeClassificationResult): Promise<MarketRegimeContext> {
    const historicalPerformance = await this.getHistoricalPerformance(result.regime);
    
    return {
      currentRegime: result.regime,
      regimeConfidence: result.confidence,
      regimeStability: result.regime_stability,
      expectedDuration: result.expected_duration,
      historicalPerformance
    };
  }

  /**
   * Get historical performance for regime
   */
  private async getHistoricalPerformance(regime: MarketRegime): Promise<{ [regime: string]: { winRate: number; avgReturn: number; maxDrawdown: number } }> {
    // This would typically query a database of historical performance
    // For now, return default values
    const defaultPerformance = {
      winRate: 0.6,
      avgReturn: 0.05,
      maxDrawdown: 0.1
    };
    
    return {
      [regime]: defaultPerformance,
      // Add other regimes with their historical performance
    };
  }

  // Helper methods

  private updateMarketHistory(data: MarketDataSnapshot): void {
    this.marketHistory.push(data);
    
    // Keep only recent history
    if (this.marketHistory.length > this.config.lookbackWindow * 2) {
      this.marketHistory = this.marketHistory.slice(-this.config.lookbackWindow);
    }
  }

  private updateRegimeHistory(result: RegimeClassificationResult): void {
    this.regimeHistory.push(result);
    
    // Keep only recent regime history
    if (this.regimeHistory.length > 100) {
      this.regimeHistory = this.regimeHistory.slice(-100);
    }
  }

  private getDefaultRegime(): MarketRegimeContext {
    return {
      currentRegime: 'sideways_calm',
      regimeConfidence: 0.5,
      regimeStability: 0.5,
      expectedDuration: 60,
      historicalPerformance: {
        sideways_calm: { winRate: 0.6, avgReturn: 0.03, maxDrawdown: 0.08 }
      }
    };
  }

  private calculateRegimeStability(): number {
    if (this.regimeHistory.length < 10) return 0.5;
    
    const recentRegimes = this.regimeHistory.slice(-10);
    const currentRegime = recentRegimes[recentRegimes.length - 1].regime;
    const sameRegimeCount = recentRegimes.filter(r => r.regime === currentRegime).length;
    
    return sameRegimeCount / recentRegimes.length;
  }

  private calculateExpectedDuration(regime: MarketRegime): number {
    // Base durations in minutes for different regimes
    const baseDurations = {
      [MarketRegime.TRENDING_BULL]: 240,
      [MarketRegime.TRENDING_BEAR]: 180,
      [MarketRegime.SIDEWAYS_CALM]: 120,
      [MarketRegime.SIDEWAYS_CHOPPY]: 60,
      [MarketRegime.VOLATILE_UP]: 30,
      [MarketRegime.VOLATILE_DOWN]: 30,
      [MarketRegime.BREAKOUT_BULL]: 90,
      [MarketRegime.BREAKOUT_BEAR]: 90,
      [MarketRegime.REVERSAL_BULL]: 45,
      [MarketRegime.REVERSAL_BEAR]: 45
    };
    
    return baseDurations[regime] || 60;
  }

  /**
   * Get current regime information
   */
  getCurrentRegime(): RegimeClassificationResult | null {
    return this.currentRegime;
  }

  /**
   * Get regime history
   */
  getRegimeHistory(limit?: number): RegimeClassificationResult[] {
    return limit ? this.regimeHistory.slice(-limit) : this.regimeHistory;
  }

  /**
   * Get regime transition history
   */
  getTransitionHistory(): RegimeTransition[] {
    const transitions: RegimeTransition[] = [];
    
    for (let i = 1; i < this.regimeHistory.length; i++) {
      const prev = this.regimeHistory[i - 1];
      const current = this.regimeHistory[i];
      
      if (prev.regime !== current.regime) {
        transitions.push({
          from: prev.regime,
          to: current.regime,
          timestamp: new Date(), // Would need actual timestamps
          confidence: current.confidence,
          trigger_features: [], // Would need to calculate
          expected_duration: current.expected_duration
        });
      }
    }
    
    return transitions;
  }
}

// Supporting Classes (implementation details would be much larger)

class FeatureExtractor {
  async extractTrendFeatures(data: MarketDataSnapshot[]): Promise<TrendFeatures> {
    // Implement comprehensive trend analysis
    return {
      direction: 'up',
      strength: 0.7,
      consistency: 0.8,
      duration: 50,
      slope: 0.05,
      r_squared: 0.85
    };
  }

  async extractVolatilityFeatures(data: MarketDataSnapshot[]): Promise<VolatilityFeatures> {
    // Implement volatility analysis including GARCH modeling
    return {
      level: 'medium',
      clustering: 0.6,
      regime: 'stable',
      garch_alpha: 0.1,
      garch_beta: 0.85,
      realized_vol: 0.02
    };
  }

  async extractVolumeFeatures(data: MarketDataSnapshot[]): Promise<VolumeFeatures> {
    // Implement volume analysis
    return {
      level: 'medium',
      trend: 'stable',
      distribution: 'normal',
      onBalanceVolume: 100000,
      volumeWeightedPrice: data[data.length - 1].price,
      volumeRatio: 1.2
    };
  }

  async extractMomentumFeatures(data: MarketDataSnapshot[]): Promise<MomentumFeatures> {
    // Implement momentum analysis
    return {
      shortTerm: 0.05,
      mediumTerm: 0.08,
      longTerm: 0.12,
      acceleration: 0.02,
      rsi: 55,
      macd: { line: 0.5, signal: 0.3, histogram: 0.2 },
      divergence: 'none'
    };
  }

  async extractMicrostructureFeatures(data: MarketDataSnapshot[]): Promise<MicrostructureFeatures> {
    // Implement microstructure analysis
    return {
      spreadTightness: 0.8,
      depthImbalance: 0.1,
      tradeSize: 'medium',
      orderFlow: 'balanced',
      informationContent: 0.6,
      marketImpact: 0.001
    };
  }

  async extractCyclicalFeatures(data: MarketDataSnapshot[]): Promise<CyclicalFeatures> {
    const latest = data[data.length - 1];
    const timestamp = latest.timestamp;
    
    return {
      dayOfWeek: timestamp.getDay(),
      hourOfDay: timestamp.getHours(),
      monthOfYear: timestamp.getMonth(),
      seasonality: 0,
      cyclicalPhase: 'expansion'
    };
  }
}

class MLRegimeClassifier {
  async classify(features: RegimeFeatures): Promise<RegimeClassificationResult> {
    // Implement ML classification (Random Forest, SVM, Neural Network, etc.)
    // This is a simplified implementation
    return {
      regime: MarketRegime.TRENDING_BULL,
      confidence: 0.75,
      probability_distribution: new Map([
        [MarketRegime.TRENDING_BULL, 0.75],
        [MarketRegime.SIDEWAYS_CALM, 0.15],
        [MarketRegime.VOLATILE_UP, 0.10]
      ]),
      feature_importance: new Map([
        ['trend_strength', 0.3],
        ['volatility_level', 0.25],
        ['momentum_short_term', 0.2],
        ['volume_trend', 0.15],
        ['microstructure_order_flow', 0.1]
      ]),
      regime_stability: 0.8,
      expected_duration: 180
    };
  }
}

class StatisticalRegimeDetector {
  async detect(features: RegimeFeatures): Promise<RegimeClassificationResult> {
    // Implement statistical regime detection (Markov switching models, change point detection)
    return {
      regime: MarketRegime.SIDEWAYS_CALM,
      confidence: 0.65,
      probability_distribution: new Map([
        [MarketRegime.SIDEWAYS_CALM, 0.65],
        [MarketRegime.TRENDING_BULL, 0.25],
        [MarketRegime.SIDEWAYS_CHOPPY, 0.10]
      ]),
      feature_importance: new Map([
        ['volatility_clustering', 0.4],
        ['trend_consistency', 0.3],
        ['momentum_divergence', 0.3]
      ]),
      regime_stability: 0.7,
      expected_duration: 120
    };
  }
}

class MicrostructureAnalyzer {
  async analyze(features: RegimeFeatures): Promise<RegimeClassificationResult> {
    // Implement microstructure-based regime analysis
    return {
      regime: MarketRegime.TRENDING_BULL,
      confidence: 0.6,
      probability_distribution: new Map([
        [MarketRegime.TRENDING_BULL, 0.6],
        [MarketRegime.BREAKOUT_BULL, 0.3],
        [MarketRegime.VOLATILE_UP, 0.1]
      ]),
      feature_importance: new Map([
        ['microstructure_order_flow', 0.4],
        ['microstructure_spread_tightness', 0.3],
        ['microstructure_depth_imbalance', 0.3]
      ]),
      regime_stability: 0.6,
      expected_duration: 90
    };
  }
}

export const marketRegimeDetector = (config: RegimeDetectorConfig) => 
  new MarketRegimeDetector(config);
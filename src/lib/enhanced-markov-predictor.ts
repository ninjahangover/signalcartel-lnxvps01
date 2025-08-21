/**
 * Enhanced Markov Chain Predictor with Multi-Symbol Analysis
 * 
 * Integrates correlation analysis, enhanced state classification, and
 * cross-market dynamics for superior prediction accuracy.
 */

// Extended MarketData for OHLC support
export interface MarketDataOHLC {
  symbol: string;
  timestamp: Date;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}
import { MarketIntelligenceData } from './market-intelligence-service';
import { 
  EnhancedMarketState, 
  MarketStateMetrics,
  enhancedMarketStateClassifier 
} from './enhanced-market-state-classifier';
import {
  marketCorrelationAnalyzer,
  CrossMarketState,
  IntermarketSignal
} from './market-correlation-analyzer';

export interface EnhancedMarkovPrediction {
  symbol: string;
  currentState: EnhancedMarketState;
  stateMetrics: MarketStateMetrics;
  
  // Single-symbol predictions
  nextStateProbabilities: Map<EnhancedMarketState, number>;
  mostLikelyNextState: EnhancedMarketState;
  expectedReturn: number;
  confidence: number;
  
  // Multi-symbol enhancements
  crossMarketInfluence: {
    adjustedProbabilities: Map<EnhancedMarketState, number>;
    influencingSymbols: Array<{
      symbol: string;
      state: EnhancedMarketState;
      influence: number;
    }>;
    correlationAdjustment: number; // How much correlations affected prediction
  };
  
  // Advanced metrics
  stateStability: number;         // How stable is current state
  transitionRisk: number;          // Risk of unexpected transition
  optimalHoldingPeriod: number;   // Minutes to hold position
  regimeConsistency: number;      // Consistency with market regime
}

export interface MultiSymbolTransition {
  primarySymbol: string;
  primaryTransition: {
    from: EnhancedMarketState;
    to: EnhancedMarketState;
    probability: number;
  };
  correlatedTransitions: Map<string, {
    from: EnhancedMarketState;
    to: EnhancedMarketState;
    probability: number;
    correlation: number;
  }>;
  jointProbability: number;       // Probability of all transitions occurring
  expectedPortfolioReturn: number;
}

interface StateTransitionRecord {
  timestamp: Date;
  fromState: EnhancedMarketState;
  toState: EnhancedMarketState;
  fromPrice: number;
  toPrice: number;
  actualReturn: number;
  duration: number;
  volumeContext: 'low' | 'normal' | 'high';
  volatilityContext: 'low' | 'normal' | 'high';
  sessionContext: string;
  correlatedStates: Map<string, EnhancedMarketState>;
}

export class EnhancedMarkovPredictor {
  private transitionHistories: Map<string, StateTransitionRecord[]> = new Map();
  private transitionMatrices: Map<string, Map<string, number>> = new Map();
  private stateSequences: Map<string, EnhancedMarketState[]> = new Map();
  private returnDistributions: Map<string, Map<EnhancedMarketState, number[]>> = new Map();
  
  // Configuration
  private readonly minTransitionsForPrediction = 20;
  private readonly correlationImpactWeight = 0.3; // How much correlations affect predictions
  private readonly adaptiveLearningRate = 0.1;   // For online learning
  
  constructor() {}
  
  /**
   * Process new market data and update predictions
   */
  public processMarketData(
    symbol: string,
    marketData: MarketDataOHLC,
    intelligence: MarketIntelligenceData,
    recentHistory: MarketDataOHLC[]
  ): EnhancedMarkovPrediction {
    // Classify current state
    const { state, metrics } = enhancedMarketStateClassifier.classifyMarketState(
      marketData,
      recentHistory
    );
    
    // Update correlation analyzer
    marketCorrelationAnalyzer.updateSymbolData(symbol, marketData, state);
    
    // Update state sequence
    this.updateStateSequence(symbol, state);
    
    // Record transition if we have previous state
    const sequence = this.stateSequences.get(symbol);
    if (sequence && sequence.length > 1) {
      const prevState = sequence[sequence.length - 2];
      this.recordTransition(symbol, prevState, state, marketData, metrics);
    }
    
    // Update transition matrix
    this.updateTransitionMatrix(symbol);
    
    // Generate base prediction
    const basePrediction = this.generateBasePrediction(symbol, state, metrics);
    
    // Enhance with correlation analysis
    const enhancedPrediction = this.enhanceWithCorrelations(symbol, basePrediction);
    
    // Calculate advanced metrics
    this.addAdvancedMetrics(enhancedPrediction);
    
    return enhancedPrediction;
  }
  
  /**
   * Update state sequence for a symbol
   */
  private updateStateSequence(symbol: string, state: EnhancedMarketState): void {
    if (!this.stateSequences.has(symbol)) {
      this.stateSequences.set(symbol, []);
    }
    
    const sequence = this.stateSequences.get(symbol)!;
    sequence.push(state);
    
    // Keep last 1000 states
    if (sequence.length > 1000) {
      sequence.shift();
    }
  }
  
  /**
   * Record a state transition
   */
  private recordTransition(
    symbol: string,
    fromState: EnhancedMarketState,
    toState: EnhancedMarketState,
    marketData: MarketDataOHLC,
    metrics: MarketStateMetrics
  ): void {
    if (!this.transitionHistories.has(symbol)) {
      this.transitionHistories.set(symbol, []);
    }
    
    const history = this.transitionHistories.get(symbol)!;
    const prevRecord = history.length > 0 ? history[history.length - 1] : null;
    
    // Calculate return and duration
    const actualReturn = prevRecord 
      ? (marketData.close - prevRecord.toPrice) / prevRecord.toPrice 
      : 0;
    const duration = prevRecord 
      ? (marketData.timestamp.getTime() - prevRecord.timestamp.getTime()) / 60000 
      : 0;
    
    // Get correlated states
    const crossMarket = marketCorrelationAnalyzer.analyzeCrossMarketState(symbol);
    const correlatedStates = new Map<string, EnhancedMarketState>();
    if (crossMarket) {
      for (const [sym, data] of crossMarket.correlatedStates) {
        correlatedStates.set(sym, data.state);
      }
    }
    
    // Record transition
    const record: StateTransitionRecord = {
      timestamp: marketData.timestamp,
      fromState,
      toState,
      fromPrice: prevRecord ? prevRecord.toPrice : marketData.close,
      toPrice: marketData.close,
      actualReturn,
      duration,
      volumeContext: this.getVolumeContext(metrics.volume.relativeVolume),
      volatilityContext: this.getVolatilityContext(metrics.volatility.relativeVolatility),
      sessionContext: metrics.session.current,
      correlatedStates
    };
    
    history.push(record);
    
    // Update return distribution
    this.updateReturnDistribution(symbol, toState, actualReturn);
    
    // Keep last 5000 transitions
    if (history.length > 5000) {
      history.shift();
    }
  }
  
  /**
   * Update transition probability matrix
   */
  private updateTransitionMatrix(symbol: string): void {
    const history = this.transitionHistories.get(symbol);
    if (!history || history.length < this.minTransitionsForPrediction) return;
    
    // Count transitions
    const transitionCounts = new Map<string, number>();
    const stateCounts = new Map<EnhancedMarketState, number>();
    
    for (const record of history) {
      const key = `${record.fromState}|${record.toState}`;
      transitionCounts.set(key, (transitionCounts.get(key) || 0) + 1);
      stateCounts.set(record.fromState, (stateCounts.get(record.fromState) || 0) + 1);
    }
    
    // Calculate probabilities with Laplace smoothing
    const matrix = new Map<string, number>();
    const states = Object.values(EnhancedMarketState);
    const smoothingFactor = 1; // Laplace smoothing
    
    for (const fromState of states) {
      const fromCount = stateCounts.get(fromState) || 0;
      const totalCount = fromCount + states.length * smoothingFactor;
      
      for (const toState of states) {
        const key = `${fromState}|${toState}`;
        const transitionCount = transitionCounts.get(key) || 0;
        const probability = (transitionCount + smoothingFactor) / totalCount;
        matrix.set(key, probability);
      }
    }
    
    this.transitionMatrices.set(symbol, matrix);
  }
  
  /**
   * Update return distribution for a state
   */
  private updateReturnDistribution(symbol: string, state: EnhancedMarketState, returnValue: number): void {
    if (!this.returnDistributions.has(symbol)) {
      this.returnDistributions.set(symbol, new Map());
    }
    
    const distributions = this.returnDistributions.get(symbol)!;
    if (!distributions.has(state)) {
      distributions.set(state, []);
    }
    
    const returns = distributions.get(state)!;
    returns.push(returnValue);
    
    // Keep last 100 returns per state
    if (returns.length > 100) {
      returns.shift();
    }
  }
  
  /**
   * Generate base prediction without correlation adjustments
   */
  private generateBasePrediction(
    symbol: string,
    currentState: EnhancedMarketState,
    metrics: MarketStateMetrics
  ): EnhancedMarkovPrediction {
    const matrix = this.transitionMatrices.get(symbol);
    const nextStateProbabilities = new Map<EnhancedMarketState, number>();
    
    if (!matrix) {
      // No history - use uniform distribution
      const states = Object.values(EnhancedMarketState);
      for (const state of states) {
        nextStateProbabilities.set(state, 1 / states.length);
      }
    } else {
      // Get probabilities from transition matrix
      const states = Object.values(EnhancedMarketState);
      for (const toState of states) {
        const key = `${currentState}|${toState}`;
        nextStateProbabilities.set(toState, matrix.get(key) || 0);
      }
    }
    
    // Find most likely next state
    let mostLikelyNextState = currentState;
    let maxProb = 0;
    for (const [state, prob] of nextStateProbabilities) {
      if (prob > maxProb) {
        maxProb = prob;
        mostLikelyNextState = state;
      }
    }
    
    // Calculate expected return
    const expectedReturn = this.calculateExpectedReturn(symbol, nextStateProbabilities);
    
    // Calculate confidence based on sample size and consistency
    const confidence = this.calculatePredictionConfidence(symbol, currentState);
    
    return {
      symbol,
      currentState,
      stateMetrics: metrics,
      nextStateProbabilities,
      mostLikelyNextState,
      expectedReturn,
      confidence,
      crossMarketInfluence: {
        adjustedProbabilities: new Map(nextStateProbabilities),
        influencingSymbols: [],
        correlationAdjustment: 0
      },
      stateStability: 0,
      transitionRisk: 0,
      optimalHoldingPeriod: 0,
      regimeConsistency: 0
    };
  }
  
  /**
   * Enhance prediction with correlation analysis
   */
  private enhanceWithCorrelations(
    symbol: string,
    basePrediction: EnhancedMarkovPrediction
  ): EnhancedMarkovPrediction {
    const crossMarket = marketCorrelationAnalyzer.analyzeCrossMarketState(symbol);
    if (!crossMarket) return basePrediction;
    
    const adjustedProbabilities = new Map<EnhancedMarketState, number>();
    const influencingSymbols: Array<{
      symbol: string;
      state: EnhancedMarketState;
      influence: number;
    }> = [];
    
    // Collect influencing symbols
    for (const [sym, data] of crossMarket.correlatedStates) {
      if (data.influence > 0.3) {
        influencingSymbols.push({
          symbol: sym,
          state: data.state,
          influence: data.influence
        });
      }
    }
    
    // Adjust probabilities based on correlated symbols
    let totalAdjustment = 0;
    for (const [state, baseProb] of basePrediction.nextStateProbabilities) {
      let adjustedProb = baseProb;
      
      for (const influencer of influencingSymbols) {
        const correlationFactor = this.getCorrelationFactor(
          state,
          influencer.state,
          influencer.influence
        );
        
        // Apply correlation adjustment
        const adjustment = correlationFactor * this.correlationImpactWeight * influencer.influence;
        adjustedProb *= (1 + adjustment);
        totalAdjustment += Math.abs(adjustment);
      }
      
      adjustedProbabilities.set(state, adjustedProb);
    }
    
    // Normalize probabilities
    const sum = Array.from(adjustedProbabilities.values()).reduce((a, b) => a + b, 0);
    for (const [state, prob] of adjustedProbabilities) {
      adjustedProbabilities.set(state, prob / sum);
    }
    
    // Update most likely state based on adjusted probabilities
    let mostLikelyNextState = basePrediction.currentState;
    let maxProb = 0;
    for (const [state, prob] of adjustedProbabilities) {
      if (prob > maxProb) {
        maxProb = prob;
        mostLikelyNextState = state;
      }
    }
    
    // Recalculate expected return with adjusted probabilities
    const expectedReturn = this.calculateExpectedReturn(symbol, adjustedProbabilities);
    
    return {
      ...basePrediction,
      nextStateProbabilities: adjustedProbabilities,
      mostLikelyNextState,
      expectedReturn,
      crossMarketInfluence: {
        adjustedProbabilities,
        influencingSymbols,
        correlationAdjustment: totalAdjustment / Math.max(1, influencingSymbols.length)
      }
    };
  }
  
  /**
   * Calculate correlation factor between states
   */
  private getCorrelationFactor(
    targetState: EnhancedMarketState,
    influencerState: EnhancedMarketState,
    correlation: number
  ): number {
    // States moving in same direction should increase probability
    const targetBullish = this.isBullishState(targetState);
    const influencerBullish = this.isBullishState(influencerState);
    
    if (targetBullish === influencerBullish) {
      return correlation; // Positive reinforcement
    } else {
      return -correlation * 0.5; // Negative but weaker
    }
  }
  
  /**
   * Check if state is bullish
   */
  private isBullishState(state: EnhancedMarketState): boolean {
    return state.includes('UPTREND') || 
           state.includes('BULLISH') || 
           state === EnhancedMarketState.CLIMAX_BUYING ||
           state === EnhancedMarketState.POWER_HOUR;
  }
  
  /**
   * Add advanced metrics to prediction
   */
  private addAdvancedMetrics(prediction: EnhancedMarkovPrediction): void {
    // Calculate state stability
    prediction.stateStability = this.calculateStateStability(
      prediction.symbol,
      prediction.currentState
    );
    
    // Calculate transition risk
    prediction.transitionRisk = this.calculateTransitionRisk(
      prediction.nextStateProbabilities,
      prediction.stateStability
    );
    
    // Calculate optimal holding period
    prediction.optimalHoldingPeriod = this.calculateOptimalHoldingPeriod(
      prediction.symbol,
      prediction.currentState
    );
    
    // Calculate regime consistency
    const crossMarket = marketCorrelationAnalyzer.analyzeCrossMarketState(prediction.symbol);
    prediction.regimeConsistency = this.calculateRegimeConsistency(
      prediction.currentState,
      crossMarket
    );
  }
  
  /**
   * Calculate how stable the current state is
   */
  private calculateStateStability(symbol: string, state: EnhancedMarketState): number {
    const sequence = this.stateSequences.get(symbol);
    if (!sequence || sequence.length < 10) return 0.5;
    
    // Count consecutive occurrences of current state
    let consecutive = 0;
    for (let i = sequence.length - 1; i >= 0; i--) {
      if (sequence[i] === state) {
        consecutive++;
      } else {
        break;
      }
    }
    
    // More consecutive states = more stable
    return Math.min(1, consecutive / 10);
  }
  
  /**
   * Calculate risk of unexpected transition
   */
  private calculateTransitionRisk(
    probabilities: Map<EnhancedMarketState, number>,
    stability: number
  ): number {
    // Calculate entropy of probability distribution
    let entropy = 0;
    for (const prob of probabilities.values()) {
      if (prob > 0) {
        entropy -= prob * Math.log2(prob);
      }
    }
    
    // Normalize entropy (max is log2(n) where n is number of states)
    const maxEntropy = Math.log2(probabilities.size);
    const normalizedEntropy = entropy / maxEntropy;
    
    // High entropy + low stability = high risk
    return normalizedEntropy * (1 - stability);
  }
  
  /**
   * Calculate optimal holding period based on state duration statistics
   */
  private calculateOptimalHoldingPeriod(symbol: string, state: EnhancedMarketState): number {
    const history = this.transitionHistories.get(symbol);
    if (!history) return 30; // Default 30 minutes
    
    // Find durations for this state
    const durations = history
      .filter(r => r.fromState === state)
      .map(r => r.duration)
      .filter(d => d > 0);
    
    if (durations.length === 0) return 30;
    
    // Use median duration
    durations.sort((a, b) => a - b);
    const median = durations[Math.floor(durations.length / 2)];
    
    // Cap between 5 and 120 minutes
    return Math.min(120, Math.max(5, median));
  }
  
  /**
   * Calculate consistency with overall market regime
   */
  private calculateRegimeConsistency(
    state: EnhancedMarketState,
    crossMarket: CrossMarketState | null
  ): number {
    if (!crossMarket) return 0.5;
    
    const isBullish = this.isBullishState(state);
    const regime = crossMarket.marketRegime;
    
    if (regime === 'risk_on' && isBullish) return 0.9;
    if (regime === 'risk_off' && !isBullish) return 0.9;
    if (regime === 'decorrelated') return 0.5;
    if (regime === 'transitioning') return 0.3;
    
    return 0.1; // State conflicts with regime
  }
  
  /**
   * Calculate expected return based on state probabilities
   */
  private calculateExpectedReturn(
    symbol: string,
    probabilities: Map<EnhancedMarketState, number>
  ): number {
    const distributions = this.returnDistributions.get(symbol);
    if (!distributions) return 0;
    
    let expectedReturn = 0;
    for (const [state, prob] of probabilities) {
      const returns = distributions.get(state);
      if (returns && returns.length > 0) {
        const avgReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
        expectedReturn += prob * avgReturn;
      }
    }
    
    return expectedReturn;
  }
  
  /**
   * Calculate prediction confidence
   */
  private calculatePredictionConfidence(symbol: string, state: EnhancedMarketState): number {
    const history = this.transitionHistories.get(symbol);
    if (!history) return 0;
    
    // Count transitions from current state
    const transitionsFromState = history.filter(r => r.fromState === state).length;
    
    // Confidence increases with more observations (Law of Large Numbers)
    const sampleConfidence = Math.min(1, transitionsFromState / this.minTransitionsForPrediction);
    
    // Also consider prediction consistency
    const matrix = this.transitionMatrices.get(symbol);
    if (!matrix) return sampleConfidence * 0.5;
    
    // Calculate max probability (how certain we are about next state)
    let maxProb = 0;
    for (const toState of Object.values(EnhancedMarketState)) {
      const key = `${state}|${toState}`;
      maxProb = Math.max(maxProb, matrix.get(key) || 0);
    }
    
    return sampleConfidence * 0.7 + maxProb * 0.3;
  }
  
  /**
   * Predict multi-symbol transitions
   */
  public predictMultiSymbolTransition(
    primarySymbol: string,
    correlatedSymbols: string[]
  ): MultiSymbolTransition | null {
    const primaryPrediction = this.getLatestPrediction(primarySymbol);
    if (!primaryPrediction) return null;
    
    const correlatedTransitions = new Map<string, {
      from: EnhancedMarketState;
      to: EnhancedMarketState;
      probability: number;
      correlation: number;
    }>();
    
    let jointProbability = primaryPrediction.confidence;
    let expectedPortfolioReturn = primaryPrediction.expectedReturn;
    
    for (const symbol of correlatedSymbols) {
      const prediction = this.getLatestPrediction(symbol);
      if (!prediction) continue;
      
      const correlation = marketCorrelationAnalyzer.getCorrelation(primarySymbol, symbol);
      if (!correlation) continue;
      
      correlatedTransitions.set(symbol, {
        from: prediction.currentState,
        to: prediction.mostLikelyNextState,
        probability: prediction.confidence,
        correlation: correlation.correlation
      });
      
      // Joint probability (simplified - assumes some independence)
      jointProbability *= (0.5 + 0.5 * prediction.confidence);
      
      // Portfolio return (equal weighting)
      expectedPortfolioReturn += prediction.expectedReturn;
    }
    
    expectedPortfolioReturn /= (1 + correlatedSymbols.length);
    
    return {
      primarySymbol,
      primaryTransition: {
        from: primaryPrediction.currentState,
        to: primaryPrediction.mostLikelyNextState,
        probability: primaryPrediction.confidence
      },
      correlatedTransitions,
      jointProbability,
      expectedPortfolioReturn
    };
  }
  
  /**
   * Get latest prediction for a symbol
   */
  private getLatestPrediction(symbol: string): EnhancedMarkovPrediction | null {
    const sequence = this.stateSequences.get(symbol);
    if (!sequence || sequence.length === 0) return null;
    
    const currentState = sequence[sequence.length - 1];
    
    // Generate quick prediction without full processing
    return this.generateBasePrediction(
      symbol,
      currentState,
      {} as MarketStateMetrics // Simplified for quick access
    );
  }
  
  /**
   * Get intermarket signals
   */
  public getIntermarketSignals(): IntermarketSignal[] {
    return marketCorrelationAnalyzer.generateIntermarketSignals();
  }
  
  /**
   * Helper functions for context classification
   */
  private getVolumeContext(relativeVolume: number): 'low' | 'normal' | 'high' {
    if (relativeVolume < 0.7) return 'low';
    if (relativeVolume > 1.3) return 'high';
    return 'normal';
  }
  
  private getVolatilityContext(relativeVolatility: number): 'low' | 'normal' | 'high' {
    if (relativeVolatility < 0.7) return 'low';
    if (relativeVolatility > 1.3) return 'high';
    return 'normal';
  }
}

export const enhancedMarkovPredictor = new EnhancedMarkovPredictor();
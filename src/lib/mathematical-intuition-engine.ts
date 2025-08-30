/**
 * MATHEMATICAL INTUITION ENGINE™
 * Revolutionary trading system that "feels" market probabilities
 * Runs in parallel with traditional expectancy calculations
 */

import { PrismaClient } from '@prisma/client';
import consolidatedDataService from './consolidated-ai-data-service';
import { BayesianProbabilityEngine } from './bayesian-probability-engine';

const prisma = new PrismaClient();

interface FlowFieldData {
  currentStrength: number;        // How strong is the probability current?
  resistancePoints: number[];     // Where does the flow meet resistance?
  accelerationZones: number[];    // Where does flow accelerate?
  harmonicResonance: number;      // Is flow in harmony with market rhythm?
}

interface IntuitiveSignal {
  mathIntuition: number;          // Pure mathematical instinct (0-1)
  flowFieldStrength: number;      // Market flow field intensity
  patternResonance: number;       // How much does pattern "feel" right?
  timingIntuition: number;        // Does timing feel optimal?
  energyAlignment: number;        // Energy alignment with market
  overallFeeling: number;         // Synthesized intuitive score
  confidence: number;             // How confident is the intuition?
  recommendation: 'BUY' | 'SELL' | 'HOLD' | 'WAIT';
  reasoning: string;              // Human-readable intuitive reasoning
}

interface ParallelTradeComparison {
  id: string;
  timestamp: Date;
  symbol: string;
  
  // Traditional calculated approach
  calculated: {
    expectancy: number;
    confidence: number;
    decision: string;
    reasoning: string;
  };
  
  // Revolutionary intuitive approach
  intuitive: {
    mathIntuition: number;
    flowField: number;
    patternResonance: number;
    timingIntuition: number;
    energyAlignment: number;
    overallFeeling: number;
    decision: string;
    reasoning: string;
  };
  
  // Execution metrics
  execution: {
    finalDecision: string;
    executionSpeed: number;        // How fast was decision made?
    confidenceLevel: number;       // Final confidence
    agreementLevel: number;        // How much did both approaches agree?
  };
  
  // Results (filled in later)
  outcome?: {
    actualPnL: number;
    calculatedCorrect: boolean;
    intuitiveCorrect: boolean;
    marginAchieved: number;
    timeToProfit: number;
  };
}

export class MathematicalIntuitionEngine {
  private static instance: MathematicalIntuitionEngine;
  
  static getInstance(): MathematicalIntuitionEngine {
    if (!MathematicalIntuitionEngine.instance) {
      MathematicalIntuitionEngine.instance = new MathematicalIntuitionEngine();
    }
    return MathematicalIntuitionEngine.instance;
  }

  /**
   * Analyze intuitively with Bayesian enhancement
   */
  private async analyzeIntuitivelyWithBayesian(
    signal: any, 
    marketData: any, 
    crossSiteData: any,
    flowField: any,
    patternResonance: number,
    timingIntuition: number,
    energyAlignment: number,
    adjustedMathIntuition: number,
    bayesianSignal: any
  ): Promise<IntuitiveSignal> {
    // Synthesize overall feeling with Bayesian-adjusted intuition
    const overallFeeling = this.synthesizeIntuitiveFeeling({
      mathIntuition: adjustedMathIntuition,
      flowField: flowField.currentStrength,
      patternResonance,
      timingIntuition,
      energyAlignment
    });
    
    // Generate recommendation considering Bayesian signal
    let recommendation: IntuitiveSignal['recommendation'];
    
    // Combine intuitive and Bayesian recommendations
    if (bayesianSignal.recommendation === 'STRONG_BUY' && overallFeeling > 0.6) {
      recommendation = 'BUY';
    } else if (bayesianSignal.recommendation === 'STRONG_SELL' && overallFeeling < 0.4) {
      recommendation = 'SELL';
    } else if (Math.abs(overallFeeling - 0.5) < 0.15 || bayesianSignal.uncertainty > 0.7) {
      recommendation = 'WAIT';
    } else {
      recommendation = this.generateIntuitiveRecommendation(overallFeeling, {
        mathIntuition: adjustedMathIntuition,
        patternResonance,
        timingIntuition
      });
    }
    
    const reasoning = `Mathematical intuition: ${(adjustedMathIntuition * 100).toFixed(1)}%, ` +
                     `Bayesian: ${bayesianSignal.mostLikelyRegime} (${(bayesianSignal.confidence * 100).toFixed(1)}%), ` +
                     `Flow field: ${(flowField.currentStrength * 100).toFixed(1)}%, ` +
                     `Pattern resonance: ${(patternResonance * 100).toFixed(1)}%`;
    
    console.log(`✨ BAYESIAN-ENHANCED INTUITIVE RESULT: ${recommendation} (feeling: ${overallFeeling.toFixed(3)})`);
    
    return {
      mathIntuition: adjustedMathIntuition,
      flowFieldStrength: flowField.currentStrength,
      patternResonance,
      timingIntuition,
      energyAlignment,
      overallFeeling,
      confidence: Math.max(bayesianSignal.confidence, Math.abs(overallFeeling - 0.5) * 2),
      recommendation,
      reasoning
    };
  }

  /**
   * Get real market price for a symbol - NO fallbacks
   */
  private async getRealPrice(symbol: string): Promise<number> {
    const { realTimePriceFetcher } = await import('@/lib/real-time-price-fetcher');
    const priceData = await realTimePriceFetcher.getCurrentPrice(symbol);
    
    if (!priceData.success || priceData.price <= 0) {
      throw new Error(`❌ Cannot get real price for ${symbol}: ${priceData.error || 'Invalid price'}`);
    }
    
    return priceData.price;
  }

  /**
   * CORE: Feel the mathematical flow field of the market
   * This is where intuition transcends calculation
   */
  async senseMarketFlowField(marketData: any, crossSiteData?: any): Promise<FlowFieldData> {
    const priceHistory = marketData.priceHistory || [];
    const volume = marketData.volume || 0;
    const volatility = this.calculateVolatility(priceHistory);
    
    // Feel the probability current strength
    const momentum = this.calculateMomentum(priceHistory);
    const volumeFlow = volume > 0 ? Math.log(volume) / 10 : 0;
    let currentStrength = this.synthesizeFlowStrength(momentum, volumeFlow, volatility);
    
    // Enhance with cross-site market insights
    if (crossSiteData && crossSiteData.marketInsights.length > 0) {
      const marketBoost = Math.min(0.15, crossSiteData.marketInsights.length * 0.03);
      currentStrength = Math.min(1.0, currentStrength + marketBoost);
      console.log(`🌐 FLOW FIELD NETWORK: Cross-site market data enhances flow by ${(marketBoost * 100).toFixed(1)}%`);
    }
    
    // Detect resistance points (where flow encounters friction)
    const resistancePoints = this.feelResistancePoints(priceHistory);
    
    // Find acceleration zones (where flow amplifies)
    const accelerationZones = this.findAccelerationZones(priceHistory, volume);
    
    // Measure harmonic resonance (is market in rhythm?)
    let harmonicResonance = this.measureHarmonicResonance(priceHistory);
    
    // Enhance harmonic resonance with cross-site performance data
    if (crossSiteData && crossSiteData.strategyPerformance.length > 0) {
      const avgPerformance = crossSiteData.strategyPerformance.reduce((sum: number, perf: any) => 
        sum + (perf.win_rate || 0.5), 0) / crossSiteData.strategyPerformance.length;
      const harmonicBonus = Math.min(0.1, (avgPerformance - 0.5) * 0.4);
      harmonicResonance = Math.max(0, Math.min(1, harmonicResonance + harmonicBonus));
      console.log(`🎵 HARMONIC NETWORK: Cross-site performance creates ${(harmonicBonus * 100).toFixed(1)}% resonance boost`);
    }
    
    return {
      currentStrength,
      resistancePoints,
      accelerationZones,
      harmonicResonance
    };
  }

  /**
   * REVOLUTIONARY: Pattern resonance - does this pattern "feel" right?
   * Beyond technical analysis - pure pattern intuition
   */
  feelPatternResonance(signal: any, marketData: any, crossSiteData?: any): number {
    const technicalPattern = signal.technicalScore || 0.5;
    const sentimentAlignment = signal.sentimentScore || 0.5;
    const volumeConfirmation = this.feelVolumeConfirmation(marketData);
    const timeframeHarmony = this.feelTimeframeHarmony(marketData);
    
    // Intuitive pattern synthesis - not mathematical, felt
    let resonance = this.synthesizePatternFeeling([
      technicalPattern * 0.3,
      sentimentAlignment * 0.3,
      volumeConfirmation * 0.2,
      timeframeHarmony * 0.2
    ]);
    
    // Enhance with cross-site historical patterns
    if (crossSiteData && crossSiteData.historicalPatterns.length > 0) {
      const patternBonus = Math.min(0.2, crossSiteData.historicalPatterns.length * 0.04);
      resonance = Math.min(1.0, resonance + patternBonus);
      console.log('🔗 PATTERN NETWORK: Cross-site patterns boost resonance by', (patternBonus * 100).toFixed(1) + '%');
    }
    
    return Math.max(0, Math.min(1, resonance));
  }

  /**
   * BREAKTHROUGH: Temporal intuition - feel the timing
   * When is the optimal moment to act?
   */
  accessTemporalIntuition(signal: any): number {
    const currentTime = new Date();
    const hour = currentTime.getHours();
    const minute = currentTime.getMinutes();
    
    // Feel market energy at this time
    const timeEnergyLevel = this.feelTimeEnergyLevel(hour, minute);
    
    // Sense urgency vs patience needed
    const urgencyLevel = this.senseUrgencyLevel(signal);
    
    // Feel market breathing rhythm
    const marketBreathing = this.feelMarketBreathingRhythm();
    
    // Synthesize temporal intuition
    const timingIntuition = (timeEnergyLevel * 0.4) + 
                           (urgencyLevel * 0.3) + 
                           (marketBreathing * 0.3);
    
    return Math.max(0, Math.min(1, timingIntuition));
  }

  /**
   * CORE INTUITIVE ANALYSIS: Synthesize all intuitive inputs
   */
  async analyzeIntuitively(signal: any, marketData: any, crossSiteData?: any): Promise<IntuitiveSignal> {
    console.log('🧠 INTUITIVE ANALYSIS: Feeling market mathematical consciousness...');
    if (crossSiteData && crossSiteData.crossSiteConfidence > 0.5) {
      console.log('🌐 NETWORK ENHANCED: Cross-site confidence:', (crossSiteData.crossSiteConfidence * 100).toFixed(1) + '%');
    }
    
    // Sense the flow field (enhanced with cross-site data)
    const flowField = await this.senseMarketFlowField(marketData, crossSiteData);
    
    // Feel pattern resonance (enhanced with historical patterns from other sites)
    const patternResonance = this.feelPatternResonance(signal, marketData, crossSiteData);
    
    // Access timing intuition
    const timingIntuition = this.accessTemporalIntuition(signal);
    
    // Measure energy alignment
    const energyAlignment = this.measureEnergeticResonance(signal, marketData);
    
    // Pure mathematical intuition (the core breakthrough)
    const mathIntuition = this.accessMathematicalInstinct(signal, marketData);
    
    // NEW: Bayesian probability analysis
    let bayesianConfidence = 0.5;
    try {
      const bayesianEngine = BayesianProbabilityEngine.getInstance();
      const evidence = await bayesianEngine.gatherMarketEvidence(signal.symbol);
      const bayesianSignal = await bayesianEngine.generateSignal(signal.symbol, evidence);
      bayesianConfidence = bayesianSignal.confidence;
      
      console.log(`🎯 BAYESIAN: ${bayesianSignal.mostLikelyRegime} regime (${(bayesianSignal.bullishProbability * 100).toFixed(1)}% bull, ${(bayesianSignal.bearishProbability * 100).toFixed(1)}% bear)`);
      
      // Weight Bayesian analysis into mathematical intuition
      const bayesianWeight = 0.3;  // 30% weight to Bayesian inference
      const adjustedMathIntuition = mathIntuition * (1 - bayesianWeight) + bayesianConfidence * bayesianWeight;
      
      return this.analyzeIntuitivelyWithBayesian(
        signal, marketData, crossSiteData, 
        flowField, patternResonance, timingIntuition, 
        energyAlignment, adjustedMathIntuition, bayesianSignal
      );
    } catch (error) {
      console.log('⚠️ Bayesian analysis unavailable, using pure intuition');
    }
    
    // Synthesize overall feeling
    const overallFeeling = this.synthesizeIntuitiveFeeling({
      mathIntuition,
      flowField: flowField.currentStrength,
      patternResonance,
      timingIntuition,
      energyAlignment
    });
    
    // Generate recommendation
    const recommendation = this.generateIntuitiveRecommendation(overallFeeling, {
      mathIntuition,
      patternResonance,
      timingIntuition
    });
    
    console.log(`✨ INTUITIVE RESULT: ${recommendation} (feeling: ${overallFeeling.toFixed(3)})`);
    
    return {
      mathIntuition,
      flowFieldStrength: flowField.currentStrength,
      patternResonance,
      timingIntuition,
      energyAlignment,
      overallFeeling,
      confidence: Math.abs(overallFeeling - 0.5) * 2, // Distance from neutral
      recommendation,
      reasoning: this.generateIntuitiveReasoning(overallFeeling, recommendation)
    };
  }

  /**
   * CROSS-SITE DATA ENHANCEMENT: Get insights from other SignalCartel instances
   */
  private async getCrossSiteEnhancedData(symbol: string, strategy?: string) {
    try {
      const [marketInsights, strategyPerformance, aiComparison, learningInsights] = await Promise.all([
        consolidatedDataService.getMarketConditionInsights(symbol),
        strategy ? consolidatedDataService.getUnifiedStrategyPerformance(strategy, symbol) : [],
        consolidatedDataService.getAISystemComparison('mathematical-intuition'),
        consolidatedDataService.getLearningInsights('pattern', symbol, 0.6)
      ]);

      return {
        marketInsights: marketInsights || [],
        strategyPerformance: strategyPerformance || [],
        aiComparison: aiComparison || [],
        learningInsights: learningInsights || [],
        crossSiteConfidence: this.calculateCrossSiteConfidence(marketInsights, strategyPerformance),
        historicalPatterns: this.extractHistoricalPatterns(learningInsights),
        networkEffect: this.calculateNetworkEffect(aiComparison)
      };
    } catch (error) {
      console.log('⚠️ Cross-site data not available, using local analysis only');
      return {
        marketInsights: [],
        strategyPerformance: [],
        aiComparison: [],
        learningInsights: [],
        crossSiteConfidence: 0.5,
        historicalPatterns: [],
        networkEffect: 0.5
      };
    }
  }

  private calculateCrossSiteConfidence(marketInsights: any[], strategyPerformance: any[]): number {
    const insightsCount = marketInsights.length;
    const performanceRecords = strategyPerformance.length;
    
    // More data from other instances = higher confidence
    const baseConfidence = Math.min(0.9, 0.3 + (insightsCount * 0.1) + (performanceRecords * 0.05));
    return baseConfidence;
  }

  private extractHistoricalPatterns(learningInsights: any[]): string[] {
    return learningInsights
      .filter(insight => insight.confidence > 0.7)
      .map(insight => insight.title || insight.description)
      .slice(0, 5); // Top 5 patterns
  }

  private calculateNetworkEffect(aiComparison: any[]): number {
    // Network effect increases with more participating instances
    const instanceCount = aiComparison.length;
    return Math.min(0.95, 0.4 + (instanceCount * 0.15));
  }

  /**
   * PARALLEL COMPARISON: Run both calculated and intuitive analysis
   */
  async runParallelAnalysis(signal: any, marketData: any, calculatedResult?: any): Promise<ParallelTradeComparison> {
    console.log('⚡ PARALLEL ANALYSIS: Running calculated vs intuitive comparison...');
    console.log('🌐 CROSS-SITE DATA: Enhancing analysis with multi-instance data...');
    
    // Enhance with cross-site data from other SignalCartel instances
    const crossSiteData = await this.getCrossSiteEnhancedData(signal.symbol || marketData.symbol, signal.strategy);
    
    const intuitiveResult = await this.analyzeIntuitively(signal, marketData, crossSiteData);
    
    // Calculate traditional metrics if not provided
    const traditionalResult = calculatedResult || await this.calculateTraditionalMetrics(signal, marketData, crossSiteData);
    
    // Measure agreement between approaches
    const agreementLevel = this.measureAgreementLevel(traditionalResult, intuitiveResult);
    
    // Determine final execution approach
    const executionPlan = this.synthesizeExecutionPlan(traditionalResult, intuitiveResult, agreementLevel);
    
    const comparison: ParallelTradeComparison = {
      id: `parallel-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      symbol: signal.symbol || 'UNKNOWN',
      
      calculated: {
        expectancy: traditionalResult.expectancy || 0,
        confidence: traditionalResult.confidence || 0.5,
        decision: traditionalResult.action || 'HOLD',
        reasoning: traditionalResult.reason || 'Standard expectancy calculation'
      },
      
      intuitive: {
        mathIntuition: intuitiveResult.mathIntuition,
        flowField: intuitiveResult.flowFieldStrength,
        patternResonance: intuitiveResult.patternResonance,
        timingIntuition: intuitiveResult.timingIntuition,
        energyAlignment: intuitiveResult.energyAlignment,
        overallFeeling: intuitiveResult.overallFeeling,
        decision: intuitiveResult.recommendation,
        reasoning: intuitiveResult.reasoning
      },
      
      execution: {
        finalDecision: executionPlan.decision,
        executionSpeed: executionPlan.speed,
        confidenceLevel: executionPlan.confidence,
        agreementLevel: agreementLevel
      }
    };
    
    // Store for analysis
    await this.storeParallelComparison(comparison);
    
    console.log(`🔄 PARALLEL RESULT: Calculated=${traditionalResult.action}, Intuitive=${intuitiveResult.recommendation}, Final=${executionPlan.decision}`);
    
    return comparison;
  }

  /**
   * Simplified interface for testing - returns formatted results
   */
  async runParallelAnalysisSimple(signal: any, marketData: any) {
    try {
      const comparison = await this.runParallelAnalysis(signal, marketData);
      
      // Defensive null checking
      if (!comparison || !comparison.intuitive || !comparison.calculated || !comparison.execution) {
        return this.getDefaultAnalysisResult();
      }
      
      return {
        intuition: {
          flowFieldResonance: comparison.intuitive?.flowField || 0,
          patternResonance: comparison.intuitive?.patternResonance || 0,
          temporalIntuition: comparison.intuitive?.timingIntuition || 0,
          overallIntuition: comparison.intuitive?.overallFeeling || 0,
        },
        traditional: {
          expectancyScore: comparison.calculated?.expectancy || 0,
          winRateProjection: comparison.calculated?.confidence || 0,
          riskRewardRatio: 2.0 // Fixed for now
        },
        recommendation: comparison.execution?.finalDecision?.toLowerCase() === 'hold' ? 'calculation' : 'intuition',
        performanceGap: comparison.execution?.agreementLevel || 0,
        confidenceGap: Math.abs((comparison.calculated?.confidence || 0) - (comparison.intuitive?.overallFeeling || 0))
      };
    } catch (error) {
      console.warn('Mathematical Intuition analysis failed:', error.message);
      return this.getDefaultAnalysisResult();
    }
  }

  private getDefaultAnalysisResult() {
    return {
      intuition: {
        flowFieldResonance: 0.3,
        patternResonance: 0.3,
        temporalIntuition: 0.3,
        overallIntuition: 0.3,
      },
      traditional: {
        expectancyScore: 0.5,
        winRateProjection: 0.5,
        riskRewardRatio: 2.0
      },
      recommendation: 'calculation',
      performanceGap: 0,
      confidenceGap: 0.2
    };
  }

  // ===== PRIVATE HELPER METHODS =====

  private calculateVolatility(prices: number[]): number {
    if (prices.length < 2) return 0;
    const returns = prices.slice(1).map((price, i) => Math.log(price / prices[i]));
    const avgReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
    const variance = returns.reduce((sum, ret) => sum + Math.pow(ret - avgReturn, 2), 0) / returns.length;
    return Math.sqrt(variance);
  }

  private calculateMomentum(prices: number[]): number {
    if (prices.length < 10) return 0.5;
    const recent = prices.slice(-5);
    const older = prices.slice(-10, -5);
    const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
    const olderAvg = older.reduce((a, b) => a + b, 0) / older.length;
    return (recentAvg - olderAvg) / olderAvg;
  }

  private synthesizeFlowStrength(momentum: number, volumeFlow: number, volatility: number): number {
    // Use vector field mathematics to calculate flow strength
    // Model as a 3D vector field where each component contributes to total flow
    
    // Normalize components
    const normalizedMomentum = Math.tanh(momentum * 2); // More sensitive to momentum
    const normalizedVolume = Math.tanh(volumeFlow);
    const normalizedVolatility = Math.tanh(volatility * 10); // Scale volatility appropriately
    
    // Calculate vector magnitude in flow space
    const vectorMagnitude = Math.sqrt(
      Math.pow(normalizedMomentum * 0.5, 2) +
      Math.pow(normalizedVolume * 0.3, 2) +
      Math.pow(normalizedVolatility * 0.2, 2)
    );
    
    // Apply sigmoid transformation for smooth 0-1 output
    return 1 / (1 + Math.exp(-4 * (vectorMagnitude - 0.5)));
  }

  private feelResistancePoints(prices: number[]): number[] {
    // Use pivot point analysis and volume profile for resistance detection
    const resistances: number[] = [];
    const priceFrequency = new Map<number, number>();
    
    // Build price frequency map (volume profile proxy)
    const bucketSize = this.calculateOptimalBucketSize(prices);
    prices.forEach(price => {
      const bucket = Math.round(price / bucketSize) * bucketSize;
      priceFrequency.set(bucket, (priceFrequency.get(bucket) || 0) + 1);
    });
    
    // Find high-frequency price levels (areas of resistance)
    const avgFrequency = Array.from(priceFrequency.values()).reduce((a, b) => a + b, 0) / priceFrequency.size;
    priceFrequency.forEach((freq, price) => {
      if (freq > avgFrequency * 1.5) {
        resistances.push(price);
      }
    });
    
    // Add pivot points
    if (prices.length >= 3) {
      const high = Math.max(...prices.slice(-20));
      const low = Math.min(...prices.slice(-20));
      const close = prices[prices.length - 1];
      
      const pivot = (high + low + close) / 3;
      const r1 = 2 * pivot - low;
      const r2 = pivot + (high - low);
      const s1 = 2 * pivot - high;
      const s2 = pivot - (high - low);
      
      resistances.push(r1, r2);
      if (close < pivot) resistances.push(pivot);
    }
    
    // Remove duplicates and sort
    return [...new Set(resistances.map(r => Math.round(r * 100) / 100))].sort((a, b) => a - b);
  }

  private calculateOptimalBucketSize(prices: number[]): number {
    if (prices.length === 0) return 1;
    const range = Math.max(...prices) - Math.min(...prices);
    // Use Sturges' rule for optimal bin count
    const binCount = Math.ceil(Math.log2(prices.length) + 1);
    return range / binCount;
  }

  private findAccelerationZones(prices: number[], volume: number): number[] {
    // Use physics-based acceleration detection (second derivative of price)
    if (prices.length < 5) return [];
    
    const zones: number[] = [];
    const accelerations: Array<{index: number, value: number, price: number}> = [];
    
    // Calculate price acceleration (second derivative)
    for (let i = 2; i < prices.length - 2; i++) {
      // Use 5-point stencil for accurate second derivative
      const d2p = (-prices[i-2] + 16*prices[i-1] - 30*prices[i] + 16*prices[i+1] - prices[i+2]) / 12;
      const normalizedAccel = d2p / prices[i]; // Normalize by price level
      
      accelerations.push({
        index: i,
        value: Math.abs(normalizedAccel),
        price: prices[i]
      });
    }
    
    // Find statistical outliers (acceleration zones)
    const accelValues = accelerations.map(a => a.value);
    const mean = accelValues.reduce((a, b) => a + b, 0) / accelValues.length;
    const stdDev = Math.sqrt(accelValues.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / accelValues.length);
    
    // Zones are where acceleration exceeds 1.5 standard deviations
    const threshold = mean + 1.5 * stdDev;
    
    accelerations.forEach(accel => {
      if (accel.value > threshold) {
        // Also check volume confirmation
        const volumeMultiplier = Math.log1p(volume / 10000);
        if (volumeMultiplier > 0.5) {
          zones.push(accel.price);
        }
      }
    });
    
    return zones;
  }

  private measureHarmonicResonance(prices: number[]): number {
    // Use Fourier analysis to detect harmonic patterns
    if (prices.length < 20) return 0.5;
    
    // Detrend the data first
    const detrended = this.detrendData(prices);
    
    // Perform simplified DFT to find dominant frequencies
    const frequencies = this.performDFT(detrended);
    
    // Find peaks in frequency spectrum
    const peaks = this.findFrequencyPeaks(frequencies);
    
    // Check for harmonic relationships (multiples of fundamental frequency)
    if (peaks.length < 2) return 0.3;
    
    const fundamental = peaks[0].frequency;
    let harmonicScore = 0;
    
    for (let i = 1; i < Math.min(peaks.length, 5); i++) {
      const ratio = peaks[i].frequency / fundamental;
      // Check if it's close to a harmonic (2x, 3x, 4x, etc.)
      const nearestHarmonic = Math.round(ratio);
      const harmonicError = Math.abs(ratio - nearestHarmonic);
      
      if (harmonicError < 0.1) {
        harmonicScore += (1 - harmonicError * 10) * peaks[i].amplitude;
      }
    }
    
    // Normalize to 0-1 range
    return Math.max(0, Math.min(1, harmonicScore / 2));
  }

  private detrendData(prices: number[]): number[] {
    const n = prices.length;
    if (n < 2) return prices;
    
    // Calculate linear trend
    const indices = Array.from({length: n}, (_, i) => i);
    const sumX = indices.reduce((a, b) => a + b, 0);
    const sumY = prices.reduce((a, b) => a + b, 0);
    const sumXY = indices.reduce((sum, i) => sum + i * prices[i], 0);
    const sumX2 = indices.reduce((sum, i) => sum + i * i, 0);
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;
    
    // Remove trend
    return prices.map((price, i) => price - (slope * i + intercept));
  }

  private performDFT(data: number[]): Array<{frequency: number, amplitude: number}> {
    const n = data.length;
    const frequencies: Array<{frequency: number, amplitude: number}> = [];
    
    // Calculate DFT for first n/2 frequencies (Nyquist limit)
    for (let k = 1; k < Math.min(n / 2, 20); k++) {
      let real = 0;
      let imag = 0;
      
      for (let t = 0; t < n; t++) {
        const angle = -2 * Math.PI * k * t / n;
        real += data[t] * Math.cos(angle);
        imag += data[t] * Math.sin(angle);
      }
      
      const amplitude = Math.sqrt(real * real + imag * imag) / n;
      frequencies.push({ frequency: k, amplitude });
    }
    
    return frequencies;
  }

  private findFrequencyPeaks(frequencies: Array<{frequency: number, amplitude: number}>): Array<{frequency: number, amplitude: number}> {
    const peaks: Array<{frequency: number, amplitude: number}> = [];
    
    for (let i = 1; i < frequencies.length - 1; i++) {
      if (frequencies[i].amplitude > frequencies[i-1].amplitude &&
          frequencies[i].amplitude > frequencies[i+1].amplitude &&
          frequencies[i].amplitude > 0.1) { // Threshold for significance
        peaks.push(frequencies[i]);
      }
    }
    
    // Sort by amplitude
    return peaks.sort((a, b) => b.amplitude - a.amplitude).slice(0, 5);
  }

  private detectCycles(prices: number[]): number[] {
    // Simple cycle detection - feel the rhythm
    const cycles: number[] = [];
    let lastDirection = prices[1] > prices[0] ? 1 : -1;
    let cycleStart = 0;
    
    for (let i = 2; i < prices.length; i++) {
      const currentDirection = prices[i] > prices[i-1] ? 1 : -1;
      if (currentDirection !== lastDirection) {
        cycles.push(i - cycleStart);
        cycleStart = i;
        lastDirection = currentDirection;
      }
    }
    
    return cycles;
  }

  private feelVolumeConfirmation(marketData: any): number {
    const volume = marketData.volume || 0;
    const avgVolume = marketData.avgVolume || volume;
    return avgVolume > 0 ? Math.min(1, volume / avgVolume) : 0.5;
  }

  private feelTimeframeHarmony(marketData: any): number {
    // Calculate cross-timeframe correlation using real analysis
    const prices = marketData.priceHistory || [];
    if (prices.length < 60) return 0.5;
    
    // Calculate short (5-period), medium (20-period), and long (60-period) EMAs
    const shortEMA = this.calculateEMA(prices.slice(-20), 5);
    const mediumEMA = this.calculateEMA(prices.slice(-40), 20);
    const longEMA = this.calculateEMA(prices, 60);
    
    // Check alignment: all EMAs should be in order for strong harmony
    const currentPrice = prices[prices.length - 1];
    const bullishAlignment = currentPrice > shortEMA && shortEMA > mediumEMA && mediumEMA > longEMA;
    const bearishAlignment = currentPrice < shortEMA && shortEMA < mediumEMA && mediumEMA < longEMA;
    
    if (bullishAlignment || bearishAlignment) {
      return 0.9; // Strong harmony across timeframes
    }
    
    // Calculate correlation coefficient between timeframes
    const shortTrend = prices.slice(-5).map((p, i) => i === 0 ? 0 : p - prices[prices.length - 6 + i]);
    const mediumTrend = prices.slice(-20, -10).map((p, i) => i === 0 ? 0 : p - prices[prices.length - 30 + i]);
    
    const correlation = this.calculateCorrelation(shortTrend, mediumTrend.slice(0, shortTrend.length));
    return Math.max(0.2, Math.min(0.9, 0.5 + correlation * 0.4));
  }

  private calculateEMA(prices: number[], period: number): number {
    if (prices.length === 0) return 0;
    if (prices.length < period) return prices.reduce((a, b) => a + b, 0) / prices.length;
    
    const multiplier = 2 / (period + 1);
    let ema = prices.slice(0, period).reduce((a, b) => a + b, 0) / period;
    
    for (let i = period; i < prices.length; i++) {
      ema = (prices[i] - ema) * multiplier + ema;
    }
    
    return ema;
  }

  private calculateCorrelation(x: number[], y: number[]): number {
    const n = Math.min(x.length, y.length);
    if (n < 2) return 0;
    
    const sumX = x.slice(0, n).reduce((a, b) => a + b, 0);
    const sumY = y.slice(0, n).reduce((a, b) => a + b, 0);
    const sumXY = x.slice(0, n).reduce((sum, xi, i) => sum + xi * y[i], 0);
    const sumX2 = x.slice(0, n).reduce((sum, xi) => sum + xi * xi, 0);
    const sumY2 = y.slice(0, n).reduce((sum, yi) => sum + yi * yi, 0);
    
    const numerator = n * sumXY - sumX * sumY;
    const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));
    
    return denominator === 0 ? 0 : numerator / denominator;
  }

  private synthesizePatternFeeling(components: number[]): number {
    // Use geometric and harmonic means for non-linear synthesis
    if (components.length === 0) return 0.5;
    
    // Filter out zero/negative values for geometric calculations
    const positiveComponents = components.map(c => Math.max(0.01, c));
    
    // Arithmetic mean
    const arithmeticMean = positiveComponents.reduce((a, b) => a + b, 0) / positiveComponents.length;
    
    // Geometric mean (better for multiplicative relationships)
    const geometricMean = Math.pow(
      positiveComponents.reduce((prod, val) => prod * val, 1),
      1 / positiveComponents.length
    );
    
    // Harmonic mean (sensitive to small values)
    const harmonicMean = positiveComponents.length / 
      positiveComponents.reduce((sum, val) => sum + 1/val, 0);
    
    // Root mean square (emphasizes larger values)
    const rms = Math.sqrt(
      positiveComponents.reduce((sum, val) => sum + val * val, 0) / positiveComponents.length
    );
    
    // Weighted synthesis favoring geometric relationships
    const synthesis = arithmeticMean * 0.25 + 
                     geometricMean * 0.35 + 
                     harmonicMean * 0.2 + 
                     rms * 0.2;
    
    return Math.max(0, Math.min(1, synthesis));
  }

  private feelTimeEnergyLevel(hour: number, minute: number): number {
    // Feel market energy at this time (intuitive time sensing)
    const marketOpen = 9.5 * 60; // 9:30 AM in minutes
    const marketClose = 16 * 60; // 4:00 PM in minutes
    const currentTime = hour * 60 + minute;
    
    if (currentTime >= marketOpen && currentTime <= marketClose) {
      const sessionProgress = (currentTime - marketOpen) / (marketClose - marketOpen);
      return 0.8 + 0.2 * Math.sin(sessionProgress * Math.PI); // Peak energy mid-session
    }
    
    return 0.3; // Lower energy outside market hours
  }

  private senseUrgencyLevel(signal: any): number {
    // Calculate urgency using time decay and opportunity cost models
    const confidence = signal.confidence || 0.5;
    const strength = signal.strength || 0.5;
    const timestamp = signal.timestamp || new Date();
    
    // Time decay factor (signals become less urgent over time)
    const ageInMinutes = (Date.now() - new Date(timestamp).getTime()) / 60000;
    const timeDecay = Math.exp(-ageInMinutes / 30); // Half-life of 30 minutes
    
    // Opportunity cost (higher confidence = higher urgency)
    const opportunityCost = Math.pow(confidence, 2);
    
    // Signal strength factor
    const strengthFactor = Math.tanh(strength * 2);
    
    // Combine factors
    const urgency = timeDecay * 0.3 + opportunityCost * 0.4 + strengthFactor * 0.3;
    
    return Math.max(0, Math.min(1, urgency));
  }

  private feelMarketBreathingRhythm(): number {
    // Model market rhythm using circadian and ultradian cycles
    const now = new Date();
    const secondsInDay = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();
    
    // Multiple market cycles superimposed
    // 1. Daily cycle (24 hours)
    const dailyCycle = Math.sin(2 * Math.PI * secondsInDay / 86400);
    
    // 2. Trading session cycle (6.5 hours for US markets)
    const sessionSeconds = secondsInDay - 9.5 * 3600; // Market opens at 9:30
    const sessionCycle = sessionSeconds >= 0 && sessionSeconds <= 6.5 * 3600 
      ? Math.sin(Math.PI * sessionSeconds / (6.5 * 3600))
      : 0;
    
    // 3. Ultradian rhythm (90-minute cycles)
    const ultradianCycle = Math.sin(2 * Math.PI * secondsInDay / 5400);
    
    // 4. Weekly pattern (lower on Monday, higher mid-week)
    const dayOfWeek = now.getDay();
    const weeklyFactor = 0.8 + 0.2 * Math.sin(Math.PI * (dayOfWeek - 1) / 4);
    
    // Combine all cycles with weights
    const rhythm = (dailyCycle * 0.3 + 
                   sessionCycle * 0.4 + 
                   ultradianCycle * 0.2) * weeklyFactor;
    
    // Normalize to 0-1
    return (rhythm + 1) / 2;
  }

  private measureEnergeticResonance(signal: any, marketData: any): number {
    // Feel energetic alignment between signal and market
    const signalEnergy = (signal.confidence || 0.5) * (signal.strength || 0.5);
    const marketEnergy = this.feelMarketEnergy(marketData);
    
    // Resonance = how aligned the energies are
    const resonance = 1 - Math.abs(signalEnergy - marketEnergy);
    return Math.max(0, Math.min(1, resonance));
  }

  private feelMarketEnergy(marketData: any): number {
    // Calculate market energy using thermodynamic principles
    const volume = marketData.volume || 0;
    const prices = marketData.priceHistory || [];
    
    if (prices.length < 2) return 0.5;
    
    // Calculate kinetic energy (momentum-based)
    const momentum = this.calculateMomentum(prices);
    const kineticEnergy = 0.5 * Math.pow(momentum, 2) * Math.log1p(volume / 1000);
    
    // Calculate potential energy (volatility-based)
    const volatility = this.calculateVolatility(prices);
    const potentialEnergy = volatility * Math.log1p(Math.abs(prices[prices.length - 1] - prices[0]));
    
    // Calculate thermal energy (trading activity)
    const returns = prices.slice(1).map((p, i) => Math.abs(p - prices[i]) / prices[i]);
    const avgReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
    const thermalEnergy = avgReturn * Math.sqrt(volume / 1000);
    
    // Total energy (normalized)
    const totalEnergy = kineticEnergy + potentialEnergy + thermalEnergy;
    return Math.tanh(totalEnergy);
  }

  private accessMathematicalInstinct(signal: any, marketData: any): number {
    // CORE BREAKTHROUGH: Pure mathematical intuition using quantum probability
    const patternComplexity = this.feelPatternComplexity(marketData);
    const mathematicalBeauty = this.feelMathematicalBeauty(signal);
    const probabilityElegance = this.feelProbabilityElegance(signal, marketData);
    
    // Add quantum probability wave function collapse simulation
    const quantumProbability = this.calculateQuantumProbability(signal, marketData);
    
    // Synthesize mathematical instinct with quantum effects
    const classicalInstinct = (patternComplexity * 0.35) + 
                             (mathematicalBeauty * 0.3) + 
                             (probabilityElegance * 0.2);
    
    // Quantum superposition of states
    const quantumInstinct = this.applyQuantumSuperposition(classicalInstinct, quantumProbability);
    
    return Math.max(0, Math.min(1, quantumInstinct));
  }

  private calculateQuantumProbability(signal: any, marketData: any): number {
    // Simulate quantum probability using wave function mathematics
    const prices = marketData.priceHistory || [];
    if (prices.length < 10) return 0.5;
    
    // Create a probability wave function based on price momentum
    const momentum = this.calculateMomentum(prices);
    const volatility = this.calculateVolatility(prices);
    
    // Wave function parameters
    const wavelength = 2 * Math.PI / (1 + Math.abs(momentum));
    const amplitude = Math.sqrt(volatility);
    const phase = signal.confidence * Math.PI;
    
    // Calculate probability amplitude (|ψ|²)
    const waveFunction = amplitude * Math.cos(wavelength * prices.length + phase);
    const probabilityAmplitude = Math.pow(waveFunction, 2);
    
    // Normalize to 0-1
    return 1 / (1 + Math.exp(-probabilityAmplitude));
  }

  private applyQuantumSuperposition(classical: number, quantum: number): number {
    // Combine classical and quantum states using superposition principle
    const alpha = Math.sqrt(classical); // Classical amplitude
    const beta = Math.sqrt(1 - classical); // Quantum amplitude
    
    // Superposition state: |ψ⟩ = α|classical⟩ + β|quantum⟩
    const superposition = Math.pow(alpha, 2) * classical + Math.pow(beta, 2) * quantum;
    
    // Add quantum interference term
    const interference = 2 * alpha * beta * Math.cos(Math.PI * (classical - quantum));
    
    return Math.max(0, Math.min(1, superposition + interference * 0.1));
  }

  private feelPatternComplexity(marketData: any): number {
    // Use entropy and fractal dimension to measure pattern complexity
    const priceHistory = marketData.priceHistory || [];
    if (priceHistory.length < 10) return 0.5;
    
    // Calculate returns
    const returns = priceHistory.slice(1).map((p, i) => (p - priceHistory[i]) / priceHistory[i]);
    
    // 1. Shannon entropy of returns
    const entropy = this.calculateShannonEntropy(returns);
    
    // 2. Hurst exponent (fractal dimension indicator)
    const hurstExponent = this.calculateHurstExponent(priceHistory);
    
    // 3. Approximate entropy (ApEn) for regularity
    const apen = this.calculateApproximateEntropy(returns, 2, 0.2);
    
    // Combine metrics: lower entropy and higher Hurst = simpler pattern
    // Hurst > 0.5 indicates trending (simpler), < 0.5 indicates mean-reverting (complex)
    const simplicityScore = (1 - entropy) * 0.4 + 
                           hurstExponent * 0.4 + 
                           (1 - apen) * 0.2;
    
    return Math.max(0, Math.min(1, simplicityScore));
  }

  private calculateShannonEntropy(returns: number[]): number {
    if (returns.length === 0) return 0;
    
    // Discretize returns into bins
    const bins = 10;
    const min = Math.min(...returns);
    const max = Math.max(...returns);
    const range = max - min;
    
    if (range === 0) return 0;
    
    const counts = new Array(bins).fill(0);
    returns.forEach(r => {
      const bin = Math.min(bins - 1, Math.floor((r - min) / range * bins));
      counts[bin]++;
    });
    
    // Calculate entropy
    let entropy = 0;
    const total = returns.length;
    counts.forEach(count => {
      if (count > 0) {
        const p = count / total;
        entropy -= p * Math.log2(p);
      }
    });
    
    // Normalize to 0-1
    return entropy / Math.log2(bins);
  }

  private calculateHurstExponent(prices: number[]): number {
    const n = prices.length;
    if (n < 20) return 0.5;
    
    const returns = prices.slice(1).map((p, i) => Math.log(p / prices[i]));
    const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
    
    // Calculate cumulative deviations
    const cumulativeDeviations = [];
    let cumSum = 0;
    for (const r of returns) {
      cumSum += (r - mean);
      cumulativeDeviations.push(cumSum);
    }
    
    // Calculate range and standard deviation
    const R = Math.max(...cumulativeDeviations) - Math.min(...cumulativeDeviations);
    const S = Math.sqrt(returns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / returns.length);
    
    // Hurst exponent approximation
    if (S === 0) return 0.5;
    const RS = R / S;
    const H = Math.log(RS) / Math.log(n);
    
    return Math.max(0, Math.min(1, H));
  }

  private calculateApproximateEntropy(data: number[], m: number, r: number): number {
    const n = data.length;
    if (n < m + 1) return 0;
    
    const phi = (m: number) => {
      const patterns = new Map<string, number>();
      
      for (let i = 0; i <= n - m; i++) {
        const pattern = data.slice(i, i + m).map(v => Math.round(v / r)).join(',');
        patterns.set(pattern, (patterns.get(pattern) || 0) + 1);
      }
      
      let sum = 0;
      patterns.forEach(count => {
        const p = count / (n - m + 1);
        sum += p * Math.log(p);
      });
      
      return sum;
    };
    
    const apen = phi(m) - phi(m + 1);
    return Math.max(0, Math.min(1, Math.abs(apen)));
  }

  private feelMathematicalBeauty(signal: any): number {
    // Evaluate signal using mathematical constants and aesthetic ratios
    const confidence = signal.confidence || 0.5;
    const strength = signal.strength || 0.5;
    
    // Mathematical constants that appear in nature and markets
    const phi = 1.618033988749895; // Golden ratio
    const e = Math.E; // Euler's number
    const pi = Math.PI;
    const sqrt2 = Math.sqrt(2); // Silver ratio
    
    // Check proximity to beautiful ratios
    const ratios = [
      { value: 1/phi, weight: 0.3 },      // 0.618 - Major Fibonacci retracement
      { value: 1/sqrt2, weight: 0.2 },    // 0.707 - Harmonic mean ratio
      { value: phi - 1, weight: 0.25 },   // 0.618 - Minor golden ratio
      { value: 2/3, weight: 0.15 },       // 0.667 - Musical fifth
      { value: 3/4, weight: 0.1 }         // 0.75 - Musical fourth
    ];
    
    let beautyScore = 0;
    
    // Evaluate confidence against beautiful ratios
    ratios.forEach(ratio => {
      const distance = Math.abs(confidence - ratio.value);
      const contribution = Math.exp(-distance * 10) * ratio.weight; // Gaussian-like scoring
      beautyScore += contribution;
    });
    
    // Check if signal parameters form Fibonacci-like relationships
    if (signal.technicalScore && signal.sentimentScore) {
      const ratio = signal.technicalScore / signal.sentimentScore;
      const fibDistance = Math.min(
        Math.abs(ratio - phi),
        Math.abs(ratio - 1/phi),
        Math.abs(ratio - 2/3)
      );
      beautyScore += Math.exp(-fibDistance * 5) * 0.3;
    }
    
    return Math.max(0, Math.min(1, beautyScore));
  }

  private feelProbabilityElegance(signal: any, marketData: any): number {
    // Evaluate probability distribution using information theory and statistical elegance
    const expectancy = signal.expectancy || 0;
    const confidence = signal.confidence || 0.5;
    const prices = marketData.priceHistory || [];
    
    if (prices.length < 20) {
      // Fallback for insufficient data
      return Math.max(0, Math.min(1, expectancy * Math.sqrt(confidence) + 0.5));
    }
    
    // Calculate return distribution
    const returns = prices.slice(1).map((p, i) => (p - prices[i]) / prices[i]);
    
    // 1. Skewness - asymmetry of distribution (prefer positive skew for longs)
    const skewness = this.calculateSkewness(returns);
    
    // 2. Kurtosis - tail heaviness (moderate kurtosis is elegant)
    const kurtosis = this.calculateKurtosis(returns);
    
    // 3. Kelly Criterion - optimal bet sizing
    const kellyFraction = this.calculateKellyCriterion(confidence, expectancy);
    
    // 4. Information ratio - risk-adjusted returns
    const sharpeRatio = this.calculateSharpeRatio(returns);
    
    // Elegant distributions have:
    // - Positive skew (asymmetric upside)
    // - Moderate kurtosis (not too fat-tailed)
    // - Reasonable Kelly fraction (not over-leveraged)
    // - Good Sharpe ratio
    
    const skewScore = Math.tanh(skewness); // Positive skew is good
    const kurtosisScore = Math.exp(-Math.abs(kurtosis - 3) / 3); // Normal kurtosis = 3
    const kellyScore = Math.min(1, kellyFraction * 4); // Cap at 25% Kelly
    const sharpeScore = Math.tanh(sharpeRatio / 2);
    
    const elegance = skewScore * 0.25 + 
                    kurtosisScore * 0.25 + 
                    kellyScore * 0.3 + 
                    sharpeScore * 0.2;
    
    return Math.max(0, Math.min(1, elegance));
  }

  private calculateSkewness(returns: number[]): number {
    const n = returns.length;
    if (n < 3) return 0;
    
    const mean = returns.reduce((a, b) => a + b, 0) / n;
    const variance = returns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / n;
    const stdDev = Math.sqrt(variance);
    
    if (stdDev === 0) return 0;
    
    const skew = returns.reduce((sum, r) => sum + Math.pow((r - mean) / stdDev, 3), 0) / n;
    return skew;
  }

  private calculateKurtosis(returns: number[]): number {
    const n = returns.length;
    if (n < 4) return 3; // Normal distribution kurtosis
    
    const mean = returns.reduce((a, b) => a + b, 0) / n;
    const variance = returns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / n;
    const stdDev = Math.sqrt(variance);
    
    if (stdDev === 0) return 3;
    
    const kurt = returns.reduce((sum, r) => sum + Math.pow((r - mean) / stdDev, 4), 0) / n;
    return kurt;
  }

  private calculateKellyCriterion(winProb: number, avgWinLoss: number): number {
    if (avgWinLoss <= 0) return 0;
    
    // Kelly formula: f = (p * b - q) / b
    // where p = win probability, q = loss probability, b = win/loss ratio
    const q = 1 - winProb;
    const b = Math.abs(avgWinLoss) + 1; // Convert expectancy to win/loss ratio
    
    const kelly = (winProb * b - q) / b;
    return Math.max(0, Math.min(0.25, kelly)); // Cap at 25% for safety
  }

  private calculateSharpeRatio(returns: number[]): number {
    if (returns.length === 0) return 0;
    
    const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
    const variance = returns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / returns.length;
    const stdDev = Math.sqrt(variance);
    
    if (stdDev === 0) return 0;
    
    // Annualized Sharpe ratio (assuming daily returns)
    const annualizedMean = mean * 252;
    const annualizedStdDev = stdDev * Math.sqrt(252);
    
    return annualizedMean / annualizedStdDev;
  }

  private synthesizeIntuitiveFeeling(inputs: any): number {
    const {
      mathIntuition,
      flowField,
      patternResonance,
      timingIntuition,
      energyAlignment
    } = inputs;
    
    // Use neural network-inspired activation for synthesis
    const components = [
      { value: mathIntuition, weight: 0.3 },
      { value: flowField, weight: 0.25 },
      { value: patternResonance, weight: 0.2 },
      { value: timingIntuition, weight: 0.15 },
      { value: energyAlignment, weight: 0.1 }
    ];
    
    // Linear combination
    const linear = components.reduce((sum, c) => sum + c.value * c.weight, 0);
    
    // Non-linear activation (swish function: x * sigmoid(x))
    const swish = linear * (1 / (1 + Math.exp(-linear)));
    
    // Add multiplicative interactions (captures synergies)
    const interactions = 
      Math.sqrt(mathIntuition * flowField) * 0.1 +
      Math.sqrt(patternResonance * timingIntuition) * 0.1 +
      Math.sqrt(flowField * energyAlignment) * 0.05;
    
    // Final synthesis with bounded output
    const synthesis = swish * 0.75 + interactions;
    
    return Math.max(0, Math.min(1, synthesis));
  }

  private generateIntuitiveRecommendation(feeling: number, components: any): 'BUY' | 'SELL' | 'HOLD' | 'WAIT' {
    const { mathIntuition, patternResonance, timingIntuition } = components;
    
    // Strong positive feeling
    if (feeling > 0.7 && mathIntuition > 0.6 && timingIntuition > 0.6) {
      return 'BUY';
    }
    
    // Strong negative feeling
    if (feeling < 0.3 && mathIntuition < 0.4 && timingIntuition > 0.6) {
      return 'SELL';
    }
    
    // Uncertain timing
    if (timingIntuition < 0.4) {
      return 'WAIT';
    }
    
    // Default to hold
    return 'HOLD';
  }

  private generateIntuitiveReasoning(feeling: number, recommendation: string): string {
    if (recommendation === 'BUY') {
      return `Mathematical intuition feels strong positive flow (${feeling.toFixed(3)}) - market consciousness aligned for upward movement`;
    } else if (recommendation === 'SELL') {
      return `Intuitive analysis senses negative probability current (${feeling.toFixed(3)}) - flow field suggests downward pressure`;
    } else if (recommendation === 'WAIT') {
      return `Temporal intuition suggests waiting - market breathing rhythm not optimal for entry`;
    }
    
    return `Neutral mathematical feeling (${feeling.toFixed(3)}) - maintaining current position feels most aligned`;
  }

  /**
   * Calculate traditional expectancy-based metrics
   */
  private async calculateTraditionalMetrics(signal: any, marketData: any, crossSiteData?: any): Promise<any> {
    // Simple expectancy calculation based on signal confidence
    let confidence = signal.confidence || 0.5;
    
    // Enhance confidence with cross-site AI comparison data
    if (crossSiteData && crossSiteData.aiComparison.length > 0) {
      const avgAiConfidence = crossSiteData.aiComparison.reduce((sum: number, ai: any) => 
        sum + (ai.avg_confidence_across_sites || 0.5), 0) / crossSiteData.aiComparison.length;
      const confidenceBoost = Math.min(0.15, (avgAiConfidence - 0.5) * 0.3);
      confidence = Math.max(0, Math.min(1, confidence + confidenceBoost));
      console.log(`🤖 AI NETWORK: Cross-site AI confidence boosts traditional metrics by ${(confidenceBoost * 100).toFixed(1)}%`);
    }
    
    // Enhanced calculation using cross-site performance data
    let winRate = confidence * 0.8; // Base assumption: 80% of confidence translates to win rate
    let avgWin = 0.02; // Base: 2% average win  
    let avgLoss = 0.01; // Base: 1% average loss
    
    // Improve metrics with cross-site strategy performance
    if (crossSiteData && crossSiteData.strategyPerformance.length > 0) {
      const crossSiteWinRate = crossSiteData.strategyPerformance.reduce((sum: number, perf: any) => 
        sum + (perf.win_rate || 0.5), 0) / crossSiteData.strategyPerformance.length;
      const crossSiteAvgPnl = crossSiteData.strategyPerformance.reduce((sum: number, perf: any) => 
        sum + (Math.abs(perf.avg_pnl) || 0.02), 0) / crossSiteData.strategyPerformance.length;
      
      // Blend local and cross-site data (70% local, 30% cross-site)
      winRate = (winRate * 0.7) + (crossSiteWinRate * 0.3);
      avgWin = (avgWin * 0.7) + (crossSiteAvgPnl * 0.3);
      console.log(`📊 TRADITIONAL NETWORK: Cross-site data improves win rate to ${(winRate * 100).toFixed(1)}%`);
    }
    
    const expectancy = (winRate * avgWin) - ((1 - winRate) * avgLoss);
    
    return {
      expectancy: expectancy,
      confidence: confidence,
      winRateProjection: winRate,
      riskRewardRatio: avgWin / avgLoss,
      action: signal.action,
      reason: crossSiteData ? 'Cross-site enhanced expectancy calculation' : 'Traditional expectancy calculation'
    };
  }

  private measureAgreementLevel(calculated: any, intuitive: any): number {
    // Measure how much both approaches agree
    const calcScore = calculated.expectancy || 0;
    const intScore = (intuitive.overallFeeling - 0.5) * 2; // Convert to -1 to 1
    
    const agreement = 1 - Math.abs(calcScore - intScore) / 2;
    return Math.max(0, Math.min(1, agreement));
  }

  private synthesizeExecutionPlan(calculated: any, intuitive: any, agreement: number): any {
    // Decide final execution based on both approaches
    let decision = 'HOLD';
    let confidence = 0.5;
    let speed = 0.5; // How fast to execute (0=patient, 1=immediate)
    
    if (agreement > 0.8) {
      // Both agree - high confidence
      decision = calculated.action || intuitive.recommendation;
      confidence = Math.max(calculated.confidence || 0.5, intuitive.confidence || 0.5);
      speed = 0.9; // Execute quickly when both agree
    } else if (intuitive.overallFeeling > 0.7 && intuitive.timingIntuition > 0.8) {
      // Intuition very strong - trust it
      decision = intuitive.recommendation;
      confidence = intuitive.confidence;
      speed = 0.95; // Very fast execution on strong intuition
    } else if (calculated.confidence > 0.8) {
      // Calculation very confident - trust it
      decision = calculated.action;
      confidence = calculated.confidence;
      speed = 0.3; // Slower, more deliberate execution
    }
    
    return { decision, confidence, speed };
  }

  private async storeParallelComparison(comparison: ParallelTradeComparison): Promise<void> {
    try {
      // Store in database for analysis using IntuitionAnalysis table
      await prisma.intuitionAnalysis.create({
        data: {
          symbol: comparison.symbol,
          strategy: 'parallel-test',
          signalType: comparison.calculated.decision,
          originalConfidence: comparison.calculated.confidence,
          signalPrice: await this.getRealPrice('BTCUSD'), // Real price only
          
          // Mathematical Intuition metrics
          flowFieldResonance: comparison.intuitive?.flowField || 0.5,
          patternResonance: comparison.intuitive?.patternResonance || 0.5,
          temporalIntuition: comparison.intuitive?.timingIntuition || 0.5,
          overallIntuition: comparison.intuitive?.overallFeeling || 0.5,
          
          // Traditional Calculation metrics
          expectancyScore: comparison.calculated.expectancy,
          winRateProjection: comparison.calculated.confidence,
          riskRewardRatio: 2.0,
          
          // Comparison and Recommendation
          recommendation: comparison.execution.finalDecision.toLowerCase() === 'hold' ? 'calculation' : 'intuition',
          performanceGap: comparison.execution.agreementLevel,
          confidenceGap: Math.abs(comparison.calculated.confidence - comparison.intuitive.overallFeeling)
        }
      });
      
      console.log(`💾 Stored parallel analysis: ${comparison.id}`);
    } catch (error) {
      console.error('Failed to store parallel comparison:', error);
    }
  }

  /**
   * ANALYSIS METHODS: Compare performance over time
   */
  async getParallelPerformanceReport(): Promise<any> {
    try {
      const analyses = await prisma.parallelAnalysis.findMany({
        orderBy: { timestamp: 'desc' },
        take: 100
      });
      
      const calculatedCorrect = analyses.filter(a => a.outcome?.calculatedCorrect).length;
      const intuitiveCorrect = analyses.filter(a => a.outcome?.intuitiveCorrect).length;
      
      return {
        totalAnalyses: analyses.length,
        calculatedAccuracy: calculatedCorrect / analyses.length,
        intuitiveAccuracy: intuitiveCorrect / analyses.length,
        averageAgreement: analyses.reduce((sum, a) => sum + a.agreementLevel, 0) / analyses.length,
        strongAgreementTrades: analyses.filter(a => a.agreementLevel > 0.8).length,
        intuitiveOnlyWins: analyses.filter(a => !a.outcome?.calculatedCorrect && a.outcome?.intuitiveCorrect).length,
        calculatedOnlyWins: analyses.filter(a => a.outcome?.calculatedCorrect && !a.outcome?.intuitiveCorrect).length
      };
    } catch (error) {
      console.error('Failed to generate performance report:', error);
      return null;
    }
  }
}

// Export the singleton instance and class
export const mathIntuitionEngine = MathematicalIntuitionEngine.getInstance();

// Default export for compatibility with existing imports
export default {
  MathematicalIntuitionEngine,
  mathIntuitionEngine
};
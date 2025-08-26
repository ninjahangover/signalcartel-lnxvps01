/**
 * MATHEMATICAL INTUITION ENGINE™
 * Revolutionary trading system that "feels" market probabilities
 * Runs in parallel with traditional expectancy calculations
 */

import { PrismaClient } from '@prisma/client';

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
   * CORE: Feel the mathematical flow field of the market
   * This is where intuition transcends calculation
   */
  async senseMarketFlowField(marketData: any): Promise<FlowFieldData> {
    const priceHistory = marketData.priceHistory || [];
    const volume = marketData.volume || 0;
    const volatility = this.calculateVolatility(priceHistory);
    
    // Feel the probability current strength
    const momentum = this.calculateMomentum(priceHistory);
    const volumeFlow = volume > 0 ? Math.log(volume) / 10 : 0;
    const currentStrength = this.synthesizeFlowStrength(momentum, volumeFlow, volatility);
    
    // Detect resistance points (where flow encounters friction)
    const resistancePoints = this.feelResistancePoints(priceHistory);
    
    // Find acceleration zones (where flow amplifies)
    const accelerationZones = this.findAccelerationZones(priceHistory, volume);
    
    // Measure harmonic resonance (is market in rhythm?)
    const harmonicResonance = this.measureHarmonicResonance(priceHistory);
    
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
  feelPatternResonance(signal: any, marketData: any): number {
    const technicalPattern = signal.technicalScore || 0.5;
    const sentimentAlignment = signal.sentimentScore || 0.5;
    const volumeConfirmation = this.feelVolumeConfirmation(marketData);
    const timeframeHarmony = this.feelTimeframeHarmony(marketData);
    
    // Intuitive pattern synthesis - not mathematical, felt
    const resonance = this.synthesizePatternFeeling([
      technicalPattern * 0.3,
      sentimentAlignment * 0.3,
      volumeConfirmation * 0.2,
      timeframeHarmony * 0.2
    ]);
    
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
  async analyzeIntuitively(signal: any, marketData: any): Promise<IntuitiveSignal> {
    console.log('🧠 INTUITIVE ANALYSIS: Feeling market mathematical consciousness...');
    
    // Sense the flow field
    const flowField = await this.senseMarketFlowField(marketData);
    
    // Feel pattern resonance
    const patternResonance = this.feelPatternResonance(signal, marketData);
    
    // Access timing intuition
    const timingIntuition = this.accessTemporalIntuition(signal);
    
    // Measure energy alignment
    const energyAlignment = this.measureEnergeticResonance(signal, marketData);
    
    // Pure mathematical intuition (the core breakthrough)
    const mathIntuition = this.accessMathematicalInstinct(signal, marketData);
    
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
   * PARALLEL COMPARISON: Run both calculated and intuitive analysis
   */
  async runParallelAnalysis(signal: any, marketData: any, calculatedResult?: any): Promise<ParallelTradeComparison> {
    console.log('⚡ PARALLEL ANALYSIS: Running calculated vs intuitive comparison...');
    
    const intuitiveResult = await this.analyzeIntuitively(signal, marketData);
    
    // Calculate traditional metrics if not provided
    const traditionalResult = calculatedResult || await this.calculateTraditionalMetrics(signal, marketData);
    
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
    // Feel the combined flow strength (intuitive synthesis)
    const rawStrength = Math.abs(momentum) * 0.5 + volumeFlow * 0.3 + volatility * 0.2;
    return Math.tanh(rawStrength); // Normalize to 0-1
  }

  private feelResistancePoints(prices: number[]): number[] {
    // Intuitive resistance detection - where does flow slow down?
    const resistances: number[] = [];
    for (let i = 5; i < prices.length - 5; i++) {
      const localMax = Math.max(...prices.slice(i-2, i+3));
      if (prices[i] === localMax) {
        resistances.push(prices[i]);
      }
    }
    return resistances;
  }

  private findAccelerationZones(prices: number[], volume: number): number[] {
    // Feel where market flow accelerates
    const zones: number[] = [];
    for (let i = 1; i < prices.length; i++) {
      const priceChange = Math.abs(prices[i] - prices[i-1]) / prices[i-1];
      if (priceChange > 0.01 && volume > 1000) { // Arbitrary thresholds for feeling
        zones.push(prices[i]);
      }
    }
    return zones;
  }

  private measureHarmonicResonance(prices: number[]): number {
    // Feel if market is in harmonic rhythm
    if (prices.length < 20) return 0.5;
    
    const cycles = this.detectCycles(prices);
    const rhythmConsistency = cycles.length > 0 ? 1 / cycles.length : 0.5;
    return Math.max(0, Math.min(1, rhythmConsistency));
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
    // Feel if different timeframes are in harmony
    return 0.7 + (Math.random() - 0.5) * 0.6; // Placeholder - feel-based
  }

  private synthesizePatternFeeling(components: number[]): number {
    // Non-linear intuitive synthesis
    const sum = components.reduce((a, b) => a + b, 0);
    const harmony = components.reduce((prod, comp) => prod * (comp + 0.1), 1);
    return (sum * 0.7) + (Math.pow(harmony, 0.2) * 0.3);
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
    // Feel how urgent this signal is
    const confidence = signal.confidence || 0.5;
    const strength = signal.strength || 0.5;
    return Math.min(1, confidence * strength * 1.5);
  }

  private feelMarketBreathingRhythm(): number {
    // Feel the market's breathing pattern
    const now = new Date();
    const secondsInDay = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();
    const breathingCycle = Math.sin(secondsInDay / 3600 * Math.PI / 12); // ~12 hour cycle
    return (breathingCycle + 1) / 2; // Normalize to 0-1
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
    // Feel the overall energy level of the market
    const volume = marketData.volume || 0;
    const volatility = marketData.volatility || 0;
    const momentum = marketData.momentum || 0;
    
    return Math.tanh((volume / 10000) + volatility * 10 + Math.abs(momentum));
  }

  private accessMathematicalInstinct(signal: any, marketData: any): number {
    // CORE BREAKTHROUGH: Pure mathematical intuition
    const patternComplexity = this.feelPatternComplexity(marketData);
    const mathematicalBeauty = this.feelMathematicalBeauty(signal);
    const probabilityElegance = this.feelProbabilityElegance(signal, marketData);
    
    // Synthesize mathematical instinct
    const instinct = (patternComplexity * 0.4) + 
                    (mathematicalBeauty * 0.35) + 
                    (probabilityElegance * 0.25);
    
    return Math.max(0, Math.min(1, instinct));
  }

  private feelPatternComplexity(marketData: any): number {
    // Feel how complex/simple the pattern is (simple often wins)
    const priceHistory = marketData.priceHistory || [];
    if (priceHistory.length < 10) return 0.5;
    
    const changes = priceHistory.slice(1).map((p, i) => p - priceHistory[i]);
    const complexity = changes.reduce((sum, change, i) => {
      if (i === 0) return 0;
      return sum + Math.abs(change - changes[i-1]);
    }, 0);
    
    // Inverse complexity - simpler patterns feel better
    return 1 / (1 + complexity / 1000);
  }

  private feelMathematicalBeauty(signal: any): number {
    // Feel the mathematical beauty of the signal (golden ratio, etc.)
    const confidence = signal.confidence || 0.5;
    const goldenRatio = 1.618;
    
    // Signals near golden ratio feel more beautiful
    const beautyScore = 1 - Math.abs(confidence - (1/goldenRatio));
    return Math.max(0, Math.min(1, beautyScore));
  }

  private feelProbabilityElegance(signal: any, marketData: any): number {
    // Feel how elegant the probability distribution is
    const expectancy = signal.expectancy || 0;
    const confidence = signal.confidence || 0.5;
    
    // Elegant probability has high expectancy with reasonable confidence
    const elegance = expectancy * Math.sqrt(confidence);
    return Math.max(0, Math.min(1, elegance + 0.5));
  }

  private synthesizeIntuitiveFeeling(inputs: any): number {
    const {
      mathIntuition,
      flowField,
      patternResonance,
      timingIntuition,
      energyAlignment
    } = inputs;
    
    // Non-linear intuitive synthesis (not simple weighted average)
    const harmonic = Math.sqrt(
      mathIntuition * flowField * patternResonance * timingIntuition * energyAlignment
    );
    
    const arithmetic = (
      mathIntuition * 0.3 +
      flowField * 0.25 +
      patternResonance * 0.2 +
      timingIntuition * 0.15 +
      energyAlignment * 0.1
    );
    
    // Blend harmonic and arithmetic means
    return (harmonic * 0.6) + (arithmetic * 0.4);
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
  private async calculateTraditionalMetrics(signal: any, marketData: any): Promise<any> {
    // Simple expectancy calculation based on signal confidence
    const confidence = signal.confidence || 0.5;
    
    // Mock traditional calculation (in real system would use historical data)
    const winRate = confidence * 0.8; // Assume 80% of confidence translates to win rate
    const avgWin = 0.02; // 2% average win
    const avgLoss = 0.01; // 1% average loss
    
    const expectancy = (winRate * avgWin) - ((1 - winRate) * avgLoss);
    
    return {
      expectancy: expectancy,
      confidence: confidence,
      winRateProjection: winRate,
      riskRewardRatio: avgWin / avgLoss,
      action: signal.action,
      reason: 'Traditional expectancy calculation'
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
          signalPrice: 65000, // Default for test
          
          // Mathematical Intuition metrics
          flowFieldResonance: comparison.intuitive.flowField,
          patternResonance: comparison.intuitive.patternResonance,
          temporalIntuition: comparison.intuitive.timingIntuition,
          overallIntuition: comparison.intuitive.overallFeeling,
          
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

export const mathIntuitionEngine = MathematicalIntuitionEngine.getInstance();
/**
 * BAYESIAN PROBABILITY ENGINE™
 * 
 * Revolutionary probabilistic inference system for cryptocurrency trading
 * Uses Bayesian updating to continuously refine market predictions
 * 
 * Core Concepts:
 * - Prior: Initial belief about market state (bullish/bearish/neutral)
 * - Likelihood: Probability of observing current data given market state
 * - Posterior: Updated belief after incorporating new evidence
 * - Evidence: Price movements, volume, sentiment, technical indicators
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Market regime states
enum MarketRegime {
  STRONG_BULL = 'STRONG_BULL',
  BULL = 'BULL', 
  NEUTRAL = 'NEUTRAL',
  BEAR = 'BEAR',
  STRONG_BEAR = 'STRONG_BEAR',
  VOLATILE = 'VOLATILE'
}

// Evidence types we can observe
interface MarketEvidence {
  priceChange: number;        // Recent price movement %
  volumeRatio: number;         // Volume vs average
  rsiValue: number;            // RSI indicator
  sentimentScore: number;      // Aggregated sentiment
  volatility: number;          // Recent volatility
  trendStrength: number;       // Trend indicator strength
  orderBookImbalance: number;  // Buy vs sell pressure
}

// Bayesian belief state
interface BayesianBelief {
  priors: Map<MarketRegime, number>;
  likelihoods: Map<MarketRegime, number>;
  posteriors: Map<MarketRegime, number>;
  evidence: MarketEvidence;
  timestamp: Date;
}

// Trading signal based on Bayesian inference
interface BayesianSignal {
  mostLikelyRegime: MarketRegime;
  regimeProbabilities: Map<MarketRegime, number>;
  bullishProbability: number;    // P(BULL | evidence)
  bearishProbability: number;    // P(BEAR | evidence)
  uncertainty: number;           // Entropy of posterior distribution
  recommendation: 'STRONG_BUY' | 'BUY' | 'HOLD' | 'SELL' | 'STRONG_SELL';
  confidence: number;
  reasoning: string;
}

export class BayesianProbabilityEngine {
  private static instance: BayesianProbabilityEngine;
  private beliefHistory: BayesianBelief[] = [];
  private currentBelief: BayesianBelief | null = null;
  
  // Prior probabilities (can be adjusted based on historical data)
  private defaultPriors = new Map<MarketRegime, number>([
    [MarketRegime.STRONG_BULL, 0.10],
    [MarketRegime.BULL, 0.25],
    [MarketRegime.NEUTRAL, 0.30],
    [MarketRegime.BEAR, 0.25],
    [MarketRegime.STRONG_BEAR, 0.10],
    [MarketRegime.VOLATILE, 0.00]  // Special state, only when detected
  ]);

  static getInstance(): BayesianProbabilityEngine {
    if (!BayesianProbabilityEngine.instance) {
      BayesianProbabilityEngine.instance = new BayesianProbabilityEngine();
    }
    return BayesianProbabilityEngine.instance;
  }

  /**
   * Initialize with historical market data to set informed priors
   */
  async initializeWithHistoricalData(symbol: string): Promise<void> {
    try {
      // Get last 100 market observations
      const historicalData = await prisma.marketDataPoint.findMany({
        where: { symbol },
        orderBy: { timestamp: 'desc' },
        take: 100
      });

      if (historicalData.length > 0) {
        // Calculate regime frequencies from historical data
        const regimeCounts = new Map<MarketRegime, number>();
        
        for (const data of historicalData) {
          const regime = this.classifyPriceMovement(data.close, data.open);
          regimeCounts.set(regime, (regimeCounts.get(regime) || 0) + 1);
        }

        // Update priors based on historical frequencies
        const total = historicalData.length;
        for (const [regime, count] of regimeCounts) {
          this.defaultPriors.set(regime, count / total);
        }

        console.log('📊 Bayesian priors initialized from historical data:', 
          Object.fromEntries(this.defaultPriors));
      }
    } catch (error) {
      console.log('⚠️ Using default uniform priors');
    }
  }

  /**
   * Calculate likelihood P(evidence | regime)
   * This is where domain knowledge about market behavior is encoded
   */
  private calculateLikelihood(evidence: MarketEvidence, regime: MarketRegime): number {
    let likelihood = 1.0;

    // Price change likelihood
    switch (regime) {
      case MarketRegime.STRONG_BULL:
        likelihood *= this.gaussianLikelihood(evidence.priceChange, 3.0, 1.5);  // Expect +3% moves
        likelihood *= this.gaussianLikelihood(evidence.volumeRatio, 1.5, 0.5);  // Higher volume
        likelihood *= this.gaussianLikelihood(evidence.rsiValue, 70, 10);      // Overbought RSI
        likelihood *= this.gaussianLikelihood(evidence.sentimentScore, 0.7, 0.2); // Positive sentiment
        break;

      case MarketRegime.BULL:
        likelihood *= this.gaussianLikelihood(evidence.priceChange, 1.0, 1.0);
        likelihood *= this.gaussianLikelihood(evidence.volumeRatio, 1.2, 0.3);
        likelihood *= this.gaussianLikelihood(evidence.rsiValue, 60, 10);
        likelihood *= this.gaussianLikelihood(evidence.sentimentScore, 0.6, 0.2);
        break;

      case MarketRegime.NEUTRAL:
        likelihood *= this.gaussianLikelihood(evidence.priceChange, 0.0, 0.5);
        likelihood *= this.gaussianLikelihood(evidence.volumeRatio, 1.0, 0.2);
        likelihood *= this.gaussianLikelihood(evidence.rsiValue, 50, 10);
        likelihood *= this.gaussianLikelihood(evidence.sentimentScore, 0.5, 0.2);
        break;

      case MarketRegime.BEAR:
        likelihood *= this.gaussianLikelihood(evidence.priceChange, -1.0, 1.0);
        likelihood *= this.gaussianLikelihood(evidence.volumeRatio, 1.2, 0.3);
        likelihood *= this.gaussianLikelihood(evidence.rsiValue, 40, 10);
        likelihood *= this.gaussianLikelihood(evidence.sentimentScore, 0.4, 0.2);
        break;

      case MarketRegime.STRONG_BEAR:
        likelihood *= this.gaussianLikelihood(evidence.priceChange, -3.0, 1.5);
        likelihood *= this.gaussianLikelihood(evidence.volumeRatio, 1.5, 0.5);
        likelihood *= this.gaussianLikelihood(evidence.rsiValue, 30, 10);
        likelihood *= this.gaussianLikelihood(evidence.sentimentScore, 0.3, 0.2);
        break;

      case MarketRegime.VOLATILE:
        // High volatility regime - wide distributions
        likelihood *= this.gaussianLikelihood(Math.abs(evidence.priceChange), 2.0, 2.0);
        likelihood *= this.gaussianLikelihood(evidence.volatility, 2.0, 0.5);
        likelihood *= this.gaussianLikelihood(evidence.volumeRatio, 1.5, 0.5);
        break;
    }

    // Order book imbalance factor
    if (evidence.orderBookImbalance > 0.2 && (regime === MarketRegime.BULL || regime === MarketRegime.STRONG_BULL)) {
      likelihood *= 1.5;  // Boost likelihood for bullish regimes with buy pressure
    } else if (evidence.orderBookImbalance < -0.2 && (regime === MarketRegime.BEAR || regime === MarketRegime.STRONG_BEAR)) {
      likelihood *= 1.5;  // Boost likelihood for bearish regimes with sell pressure
    }

    // Trend strength factor
    likelihood *= this.gaussianLikelihood(evidence.trendStrength, 
      this.getExpectedTrendStrength(regime), 0.3);

    return Math.max(0.0001, Math.min(1.0, likelihood));  // Clamp to valid probability
  }

  /**
   * Gaussian likelihood function
   * Returns P(observed | expected) assuming normal distribution
   */
  private gaussianLikelihood(observed: number, expected: number, stdDev: number): number {
    const diff = observed - expected;
    const exponent = -(diff * diff) / (2 * stdDev * stdDev);
    const coefficient = 1 / (stdDev * Math.sqrt(2 * Math.PI));
    return coefficient * Math.exp(exponent);
  }

  /**
   * Get expected trend strength for a regime
   */
  private getExpectedTrendStrength(regime: MarketRegime): number {
    switch (regime) {
      case MarketRegime.STRONG_BULL: return 0.8;
      case MarketRegime.BULL: return 0.5;
      case MarketRegime.NEUTRAL: return 0.0;
      case MarketRegime.BEAR: return -0.5;
      case MarketRegime.STRONG_BEAR: return -0.8;
      case MarketRegime.VOLATILE: return 0.0;
      default: return 0.0;
    }
  }

  /**
   * Classify price movement into regime
   * Adjusted for crypto volatility - 5% for strong moves, 2% for regular
   */
  private classifyPriceMovement(currentPrice: number, previousPrice: number): MarketRegime {
    const change = ((currentPrice - previousPrice) / previousPrice) * 100;
    
    if (change > 5) return MarketRegime.STRONG_BULL;
    if (change > 2) return MarketRegime.BULL;
    if (change < -5) return MarketRegime.STRONG_BEAR;
    if (change < -2) return MarketRegime.BEAR;
    return MarketRegime.NEUTRAL;
  }

  /**
   * Update beliefs using Bayes' theorem with decay
   * P(regime | evidence) = P(evidence | regime) * P(regime) / P(evidence)
   */
  async updateBelief(evidence: MarketEvidence): Promise<BayesianBelief> {
    // Use previous posteriors as new priors with decay factor
    // Decay prevents overconfidence buildup by gradually returning toward uniform priors
    const DECAY_FACTOR = 0.95;  // 5% decay toward uniform distribution
    const UNIFORM_PRIOR = 1 / 6;  // 6 regimes
    
    let priors: Map<MarketRegime, number>;
    if (this.currentBelief) {
      priors = new Map();
      for (const regime of Object.values(MarketRegime)) {
        const prevPosterior = this.currentBelief.posteriors.get(regime) || UNIFORM_PRIOR;
        // Apply decay: move slightly toward uniform distribution
        const decayedPrior = prevPosterior * DECAY_FACTOR + UNIFORM_PRIOR * (1 - DECAY_FACTOR);
        priors.set(regime, decayedPrior);
      }
    } else {
      priors = new Map(this.defaultPriors);
    }

    // Calculate likelihoods for each regime
    const likelihoods = new Map<MarketRegime, number>();
    for (const regime of Object.values(MarketRegime)) {
      const likelihood = this.calculateLikelihood(evidence, regime);
      likelihoods.set(regime, likelihood);
    }

    // Calculate evidence (normalization factor)
    let totalEvidence = 0;
    for (const regime of Object.values(MarketRegime)) {
      const prior = priors.get(regime) || 0;
      const likelihood = likelihoods.get(regime) || 0;
      totalEvidence += prior * likelihood;
    }

    // Calculate posteriors using Bayes' theorem
    const posteriors = new Map<MarketRegime, number>();
    for (const regime of Object.values(MarketRegime)) {
      const prior = priors.get(regime) || 0;
      const likelihood = likelihoods.get(regime) || 0;
      const posterior = (likelihood * prior) / (totalEvidence || 1);
      posteriors.set(regime, posterior);
    }

    // Create new belief state
    const newBelief: BayesianBelief = {
      priors,
      likelihoods,
      posteriors,
      evidence,
      timestamp: new Date()
    };

    // Update current belief and history
    this.currentBelief = newBelief;
    this.beliefHistory.push(newBelief);
    
    // Keep only last 100 beliefs in memory
    if (this.beliefHistory.length > 100) {
      this.beliefHistory.shift();
    }

    return newBelief;
  }

  /**
   * Generate trading signal from current belief state
   */
  async generateSignal(symbol: string, evidence: MarketEvidence): Promise<BayesianSignal> {
    // Update beliefs with new evidence
    const belief = await this.updateBelief(evidence);

    // Find most likely regime
    let mostLikelyRegime = MarketRegime.NEUTRAL;
    let maxProbability = 0;
    for (const [regime, prob] of belief.posteriors) {
      if (prob > maxProbability) {
        maxProbability = prob;
        mostLikelyRegime = regime;
      }
    }

    // Calculate aggregate probabilities
    const bullishProbability = 
      (belief.posteriors.get(MarketRegime.STRONG_BULL) || 0) +
      (belief.posteriors.get(MarketRegime.BULL) || 0);
    
    const bearishProbability = 
      (belief.posteriors.get(MarketRegime.STRONG_BEAR) || 0) +
      (belief.posteriors.get(MarketRegime.BEAR) || 0);
    
    const neutralProbability = belief.posteriors.get(MarketRegime.NEUTRAL) || 0;
    const volatileProbability = belief.posteriors.get(MarketRegime.VOLATILE) || 0;

    // Calculate uncertainty (entropy)
    let entropy = 0;
    for (const prob of belief.posteriors.values()) {
      if (prob > 0) {
        entropy -= prob * Math.log2(prob);
      }
    }
    const maxEntropy = Math.log2(6);  // 6 regimes
    const uncertainty = entropy / maxEntropy;  // Normalize to 0-1

    // Generate recommendation based on probabilities
    let recommendation: BayesianSignal['recommendation'];
    let confidence: number;

    if (bullishProbability > 0.7) {
      recommendation = 'STRONG_BUY';
      confidence = bullishProbability;
    } else if (bullishProbability > 0.55) {
      recommendation = 'BUY';
      confidence = bullishProbability;
    } else if (bearishProbability > 0.7) {
      recommendation = 'STRONG_SELL';
      confidence = bearishProbability;
    } else if (bearishProbability > 0.55) {
      recommendation = 'SELL';
      confidence = bearishProbability;
    } else {
      recommendation = 'HOLD';
      confidence = neutralProbability + volatileProbability;
    }

    // Adjust confidence based on uncertainty
    // Ensure minimum 10% uncertainty for healthy skepticism
    const adjustedUncertainty = Math.max(0.1, uncertainty);
    confidence = confidence * (1 - adjustedUncertainty * 0.5);  // High uncertainty reduces confidence
    
    // Apply natural confidence bounds (no artificial caps)
    confidence = Math.max(0.1, Math.min(0.9, confidence));  // Keep between 10-90%

    // Generate reasoning
    const reasoning = this.generateReasoning(
      mostLikelyRegime, 
      bullishProbability, 
      bearishProbability, 
      uncertainty,
      evidence
    );

    // Store Bayesian analysis
    await this.storeBayesianAnalysis(symbol, belief, recommendation, confidence);

    return {
      mostLikelyRegime,
      regimeProbabilities: belief.posteriors,
      bullishProbability,
      bearishProbability,
      uncertainty,
      recommendation,
      confidence,
      reasoning
    };
  }

  /**
   * Generate human-readable reasoning for the signal
   */
  private generateReasoning(
    regime: MarketRegime, 
    bullProb: number, 
    bearProb: number, 
    uncertainty: number,
    evidence: MarketEvidence
  ): string {
    const parts: string[] = [];

    // Regime assessment
    parts.push(`Market regime: ${regime.replace('_', ' ')} (${(bullProb * 100).toFixed(1)}% bull, ${(bearProb * 100).toFixed(1)}% bear)`);

    // Evidence interpretation
    if (evidence.priceChange > 1) {
      parts.push(`Recent price up ${evidence.priceChange.toFixed(2)}%`);
    } else if (evidence.priceChange < -1) {
      parts.push(`Recent price down ${Math.abs(evidence.priceChange).toFixed(2)}%`);
    }

    if (evidence.volumeRatio > 1.3) {
      parts.push('High volume confirming move');
    } else if (evidence.volumeRatio < 0.7) {
      parts.push('Low volume suggesting weak conviction');
    }

    if (evidence.rsiValue > 70) {
      parts.push('RSI overbought');
    } else if (evidence.rsiValue < 30) {
      parts.push('RSI oversold');
    }

    if (evidence.orderBookImbalance > 0.2) {
      parts.push('Strong buy pressure in order book');
    } else if (evidence.orderBookImbalance < -0.2) {
      parts.push('Strong sell pressure in order book');
    }

    // Uncertainty assessment
    if (uncertainty > 0.7) {
      parts.push('⚠️ High uncertainty - mixed signals');
    } else if (uncertainty < 0.3) {
      parts.push('✅ Low uncertainty - clear signals');
    }

    return parts.join('. ');
  }

  /**
   * Store Bayesian analysis in database
   */
  private async storeBayesianAnalysis(
    symbol: string,
    belief: BayesianBelief,
    recommendation: string,
    confidence: number
  ): Promise<void> {
    try {
      await prisma.intuitionAnalysis.create({
        data: {
          symbol,
          strategy: 'bayesian-probability-engine',  // Add strategy field
          flowFieldResonance: belief.posteriors.get(MarketRegime.BULL) || 0,
          patternResonance: belief.posteriors.get(MarketRegime.BEAR) || 0,
          harmonicResonance: belief.posteriors.get(MarketRegime.NEUTRAL) || 0,
          quantumProbability: confidence,
          marketEnergy: belief.evidence.volatility || 0,
          overallIntuition: confidence,
          recommendation,
          reasoning: `Bayesian inference: ${recommendation} with ${(confidence * 100).toFixed(1)}% confidence`,
          crossSiteResonance: 0,
          traditionalWinRate: 0,
          intuitionWinRate: 0,
          signalType: recommendation === 'STRONG_BUY' || recommendation === 'BUY' ? 'BUY' : 
                     recommendation === 'STRONG_SELL' || recommendation === 'SELL' ? 'SELL' : 'WAIT',
          originalConfidence: confidence  // Add missing field
        }
      });
    } catch (error) {
      console.error('Error storing Bayesian analysis:', error);
    }
  }

  /**
   * Get current market evidence from various sources
   */
  async gatherMarketEvidence(symbol: string): Promise<MarketEvidence> {
    try {
      // Get recent price data
      const recentPrices = await prisma.marketDataPoint.findMany({
        where: { symbol },
        orderBy: { timestamp: 'desc' },
        take: 20
      });

      if (recentPrices.length < 2) {
        throw new Error('Insufficient price data');
      }

      // Calculate price change
      const currentPrice = recentPrices[0].close;
      const previousPrice = recentPrices[1].close;
      const priceChange = ((currentPrice - previousPrice) / previousPrice) * 100;

      // Calculate volume ratio
      const currentVolume = recentPrices[0].volume || 1;
      const avgVolume = recentPrices.slice(1, 10).reduce((sum, p) => sum + (p.volume || 1), 0) / 9;
      const volumeRatio = currentVolume / avgVolume;

      // Calculate RSI
      const rsiValue = await this.calculateRSI(recentPrices.map(p => p.close));

      // Get sentiment (placeholder - would integrate with sentiment engine)
      const sentimentScore = 0.5;  // Neutral for now

      // Calculate volatility
      const returns = [];
      for (let i = 1; i < recentPrices.length; i++) {
        returns.push((recentPrices[i-1].close - recentPrices[i].close) / recentPrices[i].close);
      }
      const volatility = this.calculateStandardDeviation(returns) * Math.sqrt(252);  // Annualized

      // Calculate trend strength
      const trendStrength = this.calculateTrendStrength(recentPrices.map(p => p.close));

      // Order book imbalance (placeholder)
      const orderBookImbalance = 0;  // Would integrate with order book data

      return {
        priceChange,
        volumeRatio,
        rsiValue,
        sentimentScore,
        volatility,
        trendStrength,
        orderBookImbalance
      };
    } catch (error) {
      // Return neutral evidence if data gathering fails
      return {
        priceChange: 0,
        volumeRatio: 1,
        rsiValue: 50,
        sentimentScore: 0.5,
        volatility: 1,
        trendStrength: 0,
        orderBookImbalance: 0
      };
    }
  }

  /**
   * Calculate RSI indicator
   */
  private async calculateRSI(prices: number[], period: number = 14): Promise<number> {
    if (prices.length < period + 1) return 50;  // Default neutral

    let gains = 0;
    let losses = 0;

    for (let i = 1; i <= period; i++) {
      const change = prices[i-1] - prices[i];
      if (change > 0) {
        gains += change;
      } else {
        losses += Math.abs(change);
      }
    }

    const avgGain = gains / period;
    const avgLoss = losses / period;
    
    if (avgLoss === 0) return 100;  // Max RSI
    
    const rs = avgGain / avgLoss;
    const rsi = 100 - (100 / (1 + rs));
    
    return rsi;
  }

  /**
   * Calculate standard deviation
   */
  private calculateStandardDeviation(values: number[]): number {
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const squaredDiffs = values.map(val => Math.pow(val - mean, 2));
    const variance = squaredDiffs.reduce((sum, val) => sum + val, 0) / values.length;
    return Math.sqrt(variance);
  }

  /**
   * Calculate trend strength using linear regression
   */
  private calculateTrendStrength(prices: number[]): number {
    const n = prices.length;
    if (n < 2) return 0;

    // Calculate linear regression slope
    let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
    
    for (let i = 0; i < n; i++) {
      sumX += i;
      sumY += prices[i];
      sumXY += i * prices[i];
      sumX2 += i * i;
    }

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    
    // Normalize slope to -1 to 1 range
    const avgPrice = sumY / n;
    const normalizedSlope = slope / avgPrice;
    
    return Math.max(-1, Math.min(1, normalizedSlope * 100));  // Scale and clamp
  }

  /**
   * Get belief history for analysis
   */
  getBeliefHistory(): BayesianBelief[] {
    return this.beliefHistory;
  }

  /**
   * Get current belief state
   */
  getCurrentBelief(): BayesianBelief | null {
    return this.currentBelief;
  }

  /**
   * Reset beliefs to default priors
   */
  resetBeliefs(): void {
    this.currentBelief = null;
    this.beliefHistory = [];
    console.log('🔄 Bayesian beliefs reset to default priors');
  }
}
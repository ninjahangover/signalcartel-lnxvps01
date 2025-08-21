/**
 * RSI Strategy Optimization Engine
 * 
 * This engine understands RSI trading mechanics and optimizes parameters
 * based on market conditions, strategy performance, and parameter interdependencies
 */

export type MarketRegime = 'trending_up' | 'trending_down' | 'sideways' | 'high_volatility' | 'low_volatility';

export interface MarketCondition {
  regime: MarketRegime;
  volatility: number; // ATR-based volatility measure
  trendStrength: number; // ADX or similar trend strength
  meanReversionTendency: number; // How often RSI extremes reverse
  falseBreakoutRate: number; // Rate of RSI false signals
  avgRSIExtremesDuration: number; // How long RSI stays in extreme zones
}

export interface RSIParameters {
  rsi_lookback: number;
  lower_barrier: number;    // Oversold entry level
  lower_threshold: number;  // Oversold confirmation
  upper_barrier: number;    // Overbought entry level  
  upper_threshold: number;  // Overbought confirmation
  ma_length: number;
  atr_multiplier_stop: number;
  atr_multiplier_take: number;
  atr_length: number;
}

export interface RSIOptimizationContext {
  marketCondition: MarketCondition;
  recentPerformance: {
    winRate: number;
    profitFactor: number;
    avgWin: number;
    avgLoss: number;
    maxDrawdown: number;
    sharpeRatio: number;
    consecutiveLosses: number;
  };
  parameterEffectiveness: Record<keyof RSIParameters, number>; // How much each param affects performance
}

export interface OptimizationRecommendation {
  parameter: keyof RSIParameters;
  currentValue: number;
  recommendedValue: number;
  confidence: number;
  reasoning: string;
  expectedImpact: {
    winRate: number;      // Expected change in win rate
    profitFactor: number; // Expected change in profit factor
    drawdown: number;     // Expected change in max drawdown
  };
}

export class RSIOptimizationEngine {
  /**
   * Analyzes current market conditions to understand RSI behavior
   */
  analyzeMarketConditions(priceData: number[], volume?: number[]): MarketCondition {
    // Calculate ATR for volatility
    const volatility = this.calculateATRVolatility(priceData);
    
    // Determine trend strength using price momentum
    const trendStrength = this.calculateTrendStrength(priceData);
    
    // Analyze RSI mean reversion tendency
    const rsiValues = this.calculateRSI(priceData, 14);
    const meanReversionTendency = this.analyzeMeanReversionTendency(priceData, rsiValues);
    
    // Calculate false breakout rate
    const falseBreakoutRate = this.calculateFalseBreakoutRate(priceData, rsiValues);
    
    // Average time RSI spends in extreme zones
    const avgRSIExtremesDuration = this.calculateRSIExtremesDuration(rsiValues);
    
    // Determine market regime
    let regime: MarketRegime;
    if (volatility > 0.025) {
      regime = 'high_volatility';
    } else if (volatility < 0.01) {
      regime = 'low_volatility';
    } else if (trendStrength > 0.6) {
      regime = trendStrength > 0 ? 'trending_up' : 'trending_down';
    } else {
      regime = 'sideways';
    }

    return {
      regime,
      volatility,
      trendStrength: Math.abs(trendStrength),
      meanReversionTendency,
      falseBreakoutRate,
      avgRSIExtremesDuration
    };
  }

  /**
   * Core optimization logic that understands RSI strategy mechanics
   */
  optimizeParameters(
    currentParams: RSIParameters,
    context: RSIOptimizationContext
  ): OptimizationRecommendation[] {
    const recommendations: OptimizationRecommendation[] = [];
    const { marketCondition, recentPerformance } = context;

    // 1. OPTIMIZE RSI LOOKBACK PERIOD
    recommendations.push(this.optimizeRSILookback(currentParams, context));

    // 2. OPTIMIZE RSI BARRIERS (Entry Levels)
    recommendations.push(...this.optimizeRSIBarriers(currentParams, context));

    // 3. OPTIMIZE ATR STOP LOSS AND TAKE PROFIT
    recommendations.push(...this.optimizeATRMultipliers(currentParams, context));

    // 4. OPTIMIZE MOVING AVERAGE LENGTH
    recommendations.push(this.optimizeMALength(currentParams, context));

    // Sort by confidence and expected impact
    return recommendations
      .filter(rec => rec.confidence > 0.6) // Only high-confidence recommendations
      .sort((a, b) => {
        const impactA = Math.abs(a.expectedImpact.winRate) + Math.abs(a.expectedImpact.profitFactor);
        const impactB = Math.abs(b.expectedImpact.winRate) + Math.abs(b.expectedImpact.profitFactor);
        return (impactB * b.confidence) - (impactA * a.confidence);
      });
  }

  private optimizeRSILookback(params: RSIParameters, context: RSIOptimizationContext): OptimizationRecommendation {
    const { marketCondition, recentPerformance } = context;
    let recommendedValue = params.rsi_lookback;
    let reasoning = '';
    let confidence = 0.7;

    if (marketCondition.regime === 'high_volatility') {
      // In high volatility, shorter RSI period responds faster but gives more false signals
      if (recentPerformance.winRate < 0.45) {
        // Too many false signals, use longer period
        recommendedValue = Math.min(21, params.rsi_lookback + 3);
        reasoning = 'High volatility causing false signals - increasing RSI period for smoother signals';
      } else if (recentPerformance.winRate > 0.65) {
        // Good performance, might benefit from faster signals
        recommendedValue = Math.max(9, params.rsi_lookback - 2);
        reasoning = 'Good performance in volatile market - slightly shorter RSI for faster signals';
      }
    } else if (marketCondition.regime === 'trending_up' || marketCondition.regime === 'trending_down') {
      // In trending markets, RSI extremes last longer
      if (marketCondition.avgRSIExtremesDuration > 5) {
        // RSI stays extreme too long, use shorter period
        recommendedValue = Math.max(8, params.rsi_lookback - 2);
        reasoning = 'Trending market with persistent RSI extremes - shorter period for earlier signals';
        confidence = 0.8;
      }
    } else if (marketCondition.regime === 'sideways') {
      // Sideways markets are ideal for RSI mean reversion
      if (marketCondition.meanReversionTendency > 0.7) {
        // Strong mean reversion, standard period works well
        recommendedValue = 14; // Classic RSI period
        reasoning = 'Strong mean reversion in sideways market - standard 14-period RSI optimal';
        confidence = 0.9;
      }
    }

    return {
      parameter: 'rsi_lookback',
      currentValue: params.rsi_lookback,
      recommendedValue,
      confidence,
      reasoning,
      expectedImpact: {
        winRate: recommendedValue < params.rsi_lookback ? 2 : -1,
        profitFactor: 0.05,
        drawdown: recommendedValue > params.rsi_lookback ? -2 : 1
      }
    };
  }

  private optimizeRSIBarriers(params: RSIParameters, context: RSIOptimizationContext): OptimizationRecommendation[] {
    const { marketCondition, recentPerformance } = context;
    const recommendations: OptimizationRecommendation[] = [];

    // Optimize Lower Barrier (Oversold entry)
    let newLowerBarrier = params.lower_barrier;
    let lowerBarrierReasoning = '';
    let lowerBarrierConfidence = 0.7;

    if (marketCondition.regime === 'trending_up') {
      // In uptrends, RSI rarely gets very oversold
      if (recentPerformance.winRate < 0.5) {
        newLowerBarrier = Math.min(35, params.lower_barrier + 3);
        lowerBarrierReasoning = 'Uptrend: RSI rarely gets deeply oversold - raising barrier for more signals';
        lowerBarrierConfidence = 0.8;
      }
    } else if (marketCondition.regime === 'trending_down') {
      // In downtrends, wait for deeper oversold
      newLowerBarrier = Math.max(25, params.lower_barrier - 2);
      lowerBarrierReasoning = 'Downtrend: Wait for deeper oversold levels for better entries';
      lowerBarrierConfidence = 0.8;
    } else if (marketCondition.falseBreakoutRate > 0.4) {
      // High false breakout rate, be more selective
      newLowerBarrier = Math.max(25, params.lower_barrier - 3);
      lowerBarrierReasoning = 'High false breakout rate - lowering barrier for more selective entries';
      lowerBarrierConfidence = 0.9;
    }

    recommendations.push({
      parameter: 'lower_barrier',
      currentValue: params.lower_barrier,
      recommendedValue: newLowerBarrier,
      confidence: lowerBarrierConfidence,
      reasoning: lowerBarrierReasoning,
      expectedImpact: {
        winRate: newLowerBarrier < params.lower_barrier ? 3 : -2,
        profitFactor: newLowerBarrier < params.lower_barrier ? 0.1 : -0.05,
        drawdown: newLowerBarrier < params.lower_barrier ? -1 : 2
      }
    });

    // Similar logic for upper barrier...
    let newUpperBarrier = params.upper_barrier;
    let upperBarrierReasoning = '';

    if (marketCondition.regime === 'trending_down') {
      newUpperBarrier = Math.max(65, params.upper_barrier - 3);
      upperBarrierReasoning = 'Downtrend: RSI rarely gets deeply overbought - lowering barrier for more short signals';
    } else if (marketCondition.regime === 'trending_up') {
      newUpperBarrier = Math.min(75, params.upper_barrier + 2);
      upperBarrierReasoning = 'Uptrend: Wait for higher overbought levels for short entries';
    }

    recommendations.push({
      parameter: 'upper_barrier',
      currentValue: params.upper_barrier,
      recommendedValue: newUpperBarrier,
      confidence: 0.7,
      reasoning: upperBarrierReasoning,
      expectedImpact: {
        winRate: Math.abs(newUpperBarrier - params.upper_barrier) > 2 ? 2 : 0,
        profitFactor: 0.03,
        drawdown: -1
      }
    });

    return recommendations;
  }

  private optimizeATRMultipliers(params: RSIParameters, context: RSIOptimizationContext): OptimizationRecommendation[] {
    const { marketCondition, recentPerformance } = context;
    const recommendations: OptimizationRecommendation[] = [];

    // Optimize Stop Loss ATR Multiplier
    let newStopMultiplier = params.atr_multiplier_stop;
    let stopReasoning = '';
    let stopConfidence = 0.8;

    if (marketCondition.volatility > 0.025) {
      // High volatility - wider stops needed
      if (recentPerformance.consecutiveLosses > 3) {
        newStopMultiplier = Math.min(3.5, params.atr_multiplier_stop + 0.5);
        stopReasoning = 'High volatility causing stop-outs - widening stops to avoid noise';
        stopConfidence = 0.9;
      }
    } else if (marketCondition.volatility < 0.01) {
      // Low volatility - can use tighter stops
      newStopMultiplier = Math.max(1.5, params.atr_multiplier_stop - 0.3);
      stopReasoning = 'Low volatility allows tighter stops - improving risk/reward';
    }

    if (recentPerformance.avgLoss > recentPerformance.avgWin * 0.6) {
      // Losses too large relative to wins
      newStopMultiplier = Math.max(1.5, params.atr_multiplier_stop - 0.2);
      stopReasoning = 'Average losses too large - tightening stops to improve risk/reward';
      stopConfidence = 0.9;
    }

    recommendations.push({
      parameter: 'atr_multiplier_stop',
      currentValue: params.atr_multiplier_stop,
      recommendedValue: newStopMultiplier,
      confidence: stopConfidence,
      reasoning: stopReasoning,
      expectedImpact: {
        winRate: newStopMultiplier > params.atr_multiplier_stop ? -2 : 3,
        profitFactor: newStopMultiplier < params.atr_multiplier_stop ? 0.15 : -0.05,
        drawdown: newStopMultiplier > params.atr_multiplier_stop ? -3 : 2
      }
    });

    // Optimize Take Profit ATR Multiplier
    let newTakeMultiplier = params.atr_multiplier_take;
    let takeReasoning = '';

    if (marketCondition.regime === 'trending_up' || marketCondition.regime === 'trending_down') {
      // Trending markets - let winners run longer
      newTakeMultiplier = Math.min(5.0, params.atr_multiplier_take + 0.5);
      takeReasoning = 'Trending market - extending take profits to capture larger moves';
    } else if (marketCondition.meanReversionTendency > 0.8) {
      // Strong mean reversion - take profits quicker
      newTakeMultiplier = Math.max(2.0, params.atr_multiplier_take - 0.5);
      takeReasoning = 'Strong mean reversion - taking profits quicker before reversal';
    }

    recommendations.push({
      parameter: 'atr_multiplier_take',
      currentValue: params.atr_multiplier_take,
      recommendedValue: newTakeMultiplier,
      confidence: 0.7,
      reasoning: takeReasoning,
      expectedImpact: {
        winRate: newTakeMultiplier < params.atr_multiplier_take ? 2 : -1,
        profitFactor: newTakeMultiplier > params.atr_multiplier_take ? 0.1 : -0.05,
        drawdown: 0
      }
    });

    return recommendations;
  }

  private optimizeMALength(params: RSIParameters, context: RSIOptimizationContext): OptimizationRecommendation {
    const { marketCondition } = context;
    let recommendedValue = params.ma_length;
    let reasoning = '';
    let confidence = 0.6;

    if (marketCondition.regime === 'high_volatility') {
      // Longer MA for smoother trend filtering
      recommendedValue = Math.min(50, params.ma_length + 5);
      reasoning = 'High volatility - longer MA for smoother trend filtering';
      confidence = 0.7;
    } else if (marketCondition.trendStrength > 0.7) {
      // Strong trend - shorter MA for faster signals
      recommendedValue = Math.max(10, params.ma_length - 3);
      reasoning = 'Strong trend - shorter MA for faster trend confirmation';
      confidence = 0.8;
    }

    return {
      parameter: 'ma_length',
      currentValue: params.ma_length,
      recommendedValue,
      confidence,
      reasoning,
      expectedImpact: {
        winRate: Math.abs(recommendedValue - params.ma_length) > 5 ? 1 : 0,
        profitFactor: 0.02,
        drawdown: 0
      }
    };
  }

  // Helper calculation methods
  private calculateATRVolatility(prices: number[]): number {
    if (prices.length < 14) return 0.02; // Default volatility
    
    let atr = 0;
    for (let i = 1; i < Math.min(prices.length, 14); i++) {
      atr += Math.abs(prices[i] - prices[i-1]);
    }
    return (atr / 13) / prices[prices.length - 1]; // Normalize by price
  }

  private calculateTrendStrength(prices: number[]): number {
    if (prices.length < 20) return 0;
    
    const recent = prices.slice(-20);
    const slope = (recent[recent.length - 1] - recent[0]) / recent.length;
    return slope / recent[0]; // Normalize by price
  }

  private calculateRSI(prices: number[], period: number): number[] {
    const rsi: number[] = [];
    const gains: number[] = [];
    const losses: number[] = [];

    for (let i = 1; i < prices.length; i++) {
      const change = prices[i] - prices[i - 1];
      gains.push(change > 0 ? change : 0);
      losses.push(change < 0 ? Math.abs(change) : 0);
    }

    for (let i = period - 1; i < gains.length; i++) {
      const avgGain = gains.slice(i - period + 1, i + 1).reduce((sum, gain) => sum + gain, 0) / period;
      const avgLoss = losses.slice(i - period + 1, i + 1).reduce((sum, loss) => sum + loss, 0) / period;
      
      if (avgLoss === 0) {
        rsi.push(100);
      } else {
        const rs = avgGain / avgLoss;
        rsi.push(100 - (100 / (1 + rs)));
      }
    }

    return rsi;
  }

  private analyzeMeanReversionTendency(prices: number[], rsi: number[]): number {
    let reversals = 0;
    let extremes = 0;

    for (let i = 1; i < rsi.length; i++) {
      if (rsi[i-1] <= 30 || rsi[i-1] >= 70) {
        extremes++;
        // Look ahead 5 bars to see if price reversed
        for (let j = i; j < Math.min(i + 5, prices.length); j++) {
          if (rsi[i-1] <= 30 && prices[j] > prices[i-1]) {
            reversals++;
            break;
          } else if (rsi[i-1] >= 70 && prices[j] < prices[i-1]) {
            reversals++;
            break;
          }
        }
      }
    }

    return extremes > 0 ? reversals / extremes : 0.5;
  }

  private calculateFalseBreakoutRate(prices: number[], rsi: number[]): number {
    let falseBreakouts = 0;
    let totalSignals = 0;

    for (let i = 1; i < rsi.length - 5; i++) {
      if (rsi[i] <= 30 && rsi[i-1] > 30) {
        totalSignals++;
        // Check if price continues down (false signal)
        if (prices[i + 5] < prices[i]) {
          falseBreakouts++;
        }
      } else if (rsi[i] >= 70 && rsi[i-1] < 70) {
        totalSignals++;
        // Check if price continues up (false signal)
        if (prices[i + 5] > prices[i]) {
          falseBreakouts++;
        }
      }
    }

    return totalSignals > 0 ? falseBreakouts / totalSignals : 0.3;
  }

  private calculateRSIExtremesDuration(rsi: number[]): number {
    let totalDuration = 0;
    let extremePeriods = 0;
    let currentDuration = 0;
    let inExtreme = false;

    for (const value of rsi) {
      if (value <= 30 || value >= 70) {
        if (!inExtreme) {
          inExtreme = true;
          currentDuration = 1;
        } else {
          currentDuration++;
        }
      } else {
        if (inExtreme) {
          totalDuration += currentDuration;
          extremePeriods++;
          inExtreme = false;
        }
      }
    }

    return extremePeriods > 0 ? totalDuration / extremePeriods : 3;
  }
}

export const rsiOptimizationEngine = new RSIOptimizationEngine();
/**
 * Complete RSI Strategy Optimization Engine
 * 
 * This engine truly understands RSI trading mechanics:
 * - Mean reversion vs trend-following behavior
 * - Market regime impact on RSI effectiveness  
 * - Parameter interdependencies and optimal ranges
 * - Performance interpretation in market context
 */

import { 
  BaseStrategyEngine, 
  BaseParameters, 
  PerformanceMetrics, 
  MarketData, 
  OptimizationResult, 
  StrategyContext 
} from './base-strategy-engine';

export interface RSIParameters extends BaseParameters {
  rsi_lookback: number;
  lower_barrier: number;
  lower_threshold: number;
  upper_barrier: number;
  upper_threshold: number;
  ma_length: number;
  atr_multiplier_stop: number;
  atr_multiplier_take: number;
  atr_length: number;
}

export interface RSIMarketCondition {
  trendDirection: 'up' | 'down' | 'sideways';
  trendStrength: number; // 0-1
  volatility: number; // ATR as % of price
  meanReversionTendency: number; // 0-1, how often RSI extremes reverse
  rsiPersistence: number; // How long RSI stays in extreme zones
  falseBreakoutRate: number; // Rate of RSI false signals
  optimamalRSIRange: { oversold: number; overbought: number }; // Market-specific optimal levels
}

export class RSIStrategyEngine extends BaseStrategyEngine<RSIParameters> {
  constructor() {
    super('rsi', 'RSI Mean Reversion Strategy Engine');
  }

  /**
   * Identifies if Pine Script code is an RSI strategy
   */
  identifyStrategy(pineScriptCode: string): boolean {
    const rsiIndicators = [
      /ta\.rsi\(/i,
      /rsi\s*=/i,
      /input.*rsi/i,
      /rsi.*period/i,
      /(oversold|overbought)/i
    ];

    // Must have RSI calculation and oversold/overbought logic
    let rsiFound = false;
    let levelsFound = false;

    for (const pattern of rsiIndicators) {
      if (pattern.test(pineScriptCode)) {
        if (pattern.toString().includes('rsi')) rsiFound = true;
        if (pattern.toString().includes('oversold|overbought')) levelsFound = true;
      }
    }

    // Look for typical RSI entry conditions
    const entryPatterns = [
      /rsi.*<=.*30/i,
      /rsi.*>=.*70/i,
      /oversold.*barrier/i,
      /overbought.*barrier/i
    ];

    const hasRSIEntries = entryPatterns.some(pattern => pattern.test(pineScriptCode));

    return rsiFound && (levelsFound || hasRSIEntries);
  }

  /**
   * Deep analysis of market conditions for RSI strategy optimization
   */
  analyzeMarketConditions(marketData: MarketData): RSIMarketCondition {
    const { prices } = marketData;
    const rsiValues = this.calculateRSI(prices, 14);
    
    return {
      trendDirection: this.identifyTrendDirection(prices),
      trendStrength: this.calculateTrendStrength(prices),
      volatility: this.calculateVolatility(prices),
      meanReversionTendency: this.analyzeMeanReversion(prices, rsiValues),
      rsiPersistence: this.calculateRSIPersistence(rsiValues),
      falseBreakoutRate: this.calculateFalseBreakoutRate(prices, rsiValues),
      optimamalRSIRange: this.findOptimalRSILevels(prices, rsiValues)
    };
  }

  /**
   * Core optimization logic that understands RSI mechanics
   */
  async optimize(
    currentParameters: RSIParameters,
    context: StrategyContext
  ): Promise<OptimizationResult<RSIParameters>[]> {
    const marketConditions = this.analyzeMarketConditions(context.marketData);
    const { recentPerformance } = context;

    // Generate optimization candidates based on market understanding
    const candidates: RSIParameters[] = this.generateOptimizationCandidates(
      currentParameters,
      marketConditions,
      recentPerformance
    );

    // Backtest each candidate
    const results: OptimizationResult<RSIParameters>[] = [];
    
    for (const candidate of candidates) {
      const backtestResult = await this.backtest(candidate, context.marketData);
      const performance = backtestResult.performance;

      // Calculate confidence based on statistical significance and market fit
      const confidence = this.calculateOptimizationConfidence(
        candidate,
        performance,
        marketConditions,
        context.marketData.prices.length
      );

      // Generate reasoning for this optimization
      const reasoning = this.generateOptimizationReasoning(
        currentParameters,
        candidate,
        performance,
        marketConditions
      );

      results.push({
        parameters: candidate,
        performance,
        confidence,
        reasoning,
        marketContext: this.describeMarketContext(marketConditions),
        backtestPeriod: {
          start: context.marketData.timestamps[0],
          end: context.marketData.timestamps[context.marketData.timestamps.length - 1],
          totalBars: context.marketData.prices.length
        }
      });
    }

    // Sort by adjusted performance (performance * confidence)
    return results.sort((a, b) => {
      const scoreA = this.calculateOptimizationScore(a.performance, a.confidence);
      const scoreB = this.calculateOptimizationScore(b.performance, b.confidence);
      return scoreB - scoreA;
    });
  }

  /**
   * Validates RSI parameter combinations
   */
  validateParameters(parameters: RSIParameters): { valid: boolean; errors: string[]; warnings: string[] } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // RSI Lookback validation
    if (parameters.rsi_lookback < 2 || parameters.rsi_lookback > 50) {
      errors.push('RSI lookback must be between 2 and 50');
    }

    // Barrier logic validation
    if (parameters.lower_barrier >= parameters.upper_barrier) {
      errors.push('Lower barrier must be less than upper barrier');
    }

    if (parameters.lower_threshold >= parameters.lower_barrier) {
      errors.push('Lower threshold must be less than lower barrier');
    }

    if (parameters.upper_threshold <= parameters.upper_barrier) {
      errors.push('Upper threshold must be greater than upper barrier');
    }

    // RSI level warnings
    if (parameters.lower_barrier > 35) {
      warnings.push('Lower barrier > 35 may miss oversold opportunities');
    }

    if (parameters.upper_barrier < 65) {
      warnings.push('Upper barrier < 65 may miss overbought opportunities');
    }

    // ATR validation
    if (parameters.atr_multiplier_stop <= 0 || parameters.atr_multiplier_take <= 0) {
      errors.push('ATR multipliers must be positive');
    }

    if (parameters.atr_multiplier_stop >= parameters.atr_multiplier_take) {
      warnings.push('Stop loss wider than take profit - consider risk/reward ratio');
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Explains RSI parameter impact
   */
  explainParameter(parameterName: string) {
    const explanations = {
      rsi_lookback: {
        description: 'Number of periods for RSI calculation',
        impact: 'Shorter periods = more sensitive signals, more noise. Longer = smoother signals, slower response.',
        optimalRange: { min: 8, max: 21 },
        marketDependency: 'Trending markets favor shorter periods (8-14), choppy markets favor longer (14-21)'
      },
      lower_barrier: {
        description: 'RSI level considered oversold for long entries',
        impact: 'Lower values = more selective entries, higher win rate. Higher values = more frequent signals.',
        optimalRange: { min: 20, max: 35 },
        marketDependency: 'Trending markets use higher levels (30-35), mean-reverting markets use lower (20-30)'
      },
      lower_threshold: {
        description: 'RSI confirmation level below lower barrier',
        impact: 'Adds confirmation filter to reduce false signals. Lower = more selective.',
        optimalRange: { min: 15, max: 30 },
        marketDependency: 'High volatility markets need larger threshold gaps'
      },
      upper_barrier: {
        description: 'RSI level considered overbought for short entries',
        impact: 'Higher values = more selective shorts. Lower values = more frequent short signals.',
        optimalRange: { min: 65, max: 80 },
        marketDependency: 'Uptrending markets use higher levels (70-80), ranging markets use lower (65-75)'
      },
      atr_multiplier_stop: {
        description: 'Stop loss distance as multiple of ATR',
        impact: 'Higher = wider stops, fewer stop-outs but larger losses. Lower = tighter stops.',
        optimalRange: { min: 1.5, max: 3.0 },
        marketDependency: 'High volatility markets need wider stops (2.5-3.0), low volatility allows tighter (1.5-2.0)'
      },
      atr_multiplier_take: {
        description: 'Take profit distance as multiple of ATR',
        impact: 'Higher = larger profits but lower hit rate. Lower = quick profits.',
        optimalRange: { min: 2.0, max: 5.0 },
        marketDependency: 'Trending markets allow wider targets (3.0-5.0), ranging markets need quick profits (2.0-3.0)'
      }
    };

    return explanations[parameterName] || {
      description: 'Unknown parameter',
      impact: 'Parameter impact not documented',
      optimalRange: { min: 0, max: 100 },
      marketDependency: 'Market dependency not analyzed'
    };
  }

  /**
   * Calculates parameter interdependencies for RSI strategy
   */
  calculateParameterDependencies(parameters: RSIParameters) {
    return {
      rsi_lookback: {
        affectedBy: ['volatility', 'trend_strength'],
        affects: ['lower_barrier', 'upper_barrier', 'atr_length'],
        relationship: 'complex'
      },
      lower_barrier: {
        affectedBy: ['rsi_lookback', 'trend_direction', 'mean_reversion_tendency'],
        affects: ['lower_threshold'],
        relationship: 'positive'
      },
      upper_barrier: {
        affectedBy: ['rsi_lookback', 'trend_direction', 'mean_reversion_tendency'],
        affects: ['upper_threshold'],
        relationship: 'positive'
      },
      atr_multiplier_stop: {
        affectedBy: ['volatility', 'atr_length'],
        affects: ['atr_multiplier_take'],
        relationship: 'positive'
      },
      atr_multiplier_take: {
        affectedBy: ['atr_multiplier_stop', 'trend_strength'],
        affects: ['profit_factor'],
        relationship: 'complex'
      }
    };
  }

  /**
   * Interprets RSI strategy performance in market context
   */
  interpretPerformance(
    performance: PerformanceMetrics,
    parameters: RSIParameters,
    marketConditions: RSIMarketCondition
  ) {
    const strengths: string[] = [];
    const weaknesses: string[] = [];
    const recommendations: string[] = [];

    // Analyze win rate in context
    if (performance.winRate > 0.6) {
      strengths.push(`High win rate (${(performance.winRate * 100).toFixed(1)}%) indicates good entry timing`);
      if (marketConditions.meanReversionTendency > 0.7) {
        strengths.push('Strategy well-suited for mean-reverting market conditions');
      }
    } else if (performance.winRate < 0.45) {
      weaknesses.push(`Low win rate (${(performance.winRate * 100).toFixed(1)}%) suggests poor entry timing`);
      if (marketConditions.trendStrength > 0.6) {
        recommendations.push('Consider adjusting RSI barriers for trending market - RSI may stay extreme longer');
      }
    }

    // Analyze profit factor
    if (performance.profitFactor > 1.5) {
      strengths.push(`Strong profit factor (${performance.profitFactor.toFixed(2)}) shows good risk/reward management`);
    } else if (performance.profitFactor < 1.2) {
      weaknesses.push(`Low profit factor (${performance.profitFactor.toFixed(2)}) indicates poor risk/reward`);
      recommendations.push(`Consider widening take profit (current ATR: ${parameters.atr_multiplier_take}x) or tightening stop loss`);
    }

    // Market-specific insights
    if (marketConditions.falseBreakoutRate > 0.4) {
      recommendations.push('High false breakout rate detected - consider using confirmation threshold or longer RSI period');
    }

    if (marketConditions.rsiPersistence > 6 && parameters.rsi_lookback > 14) {
      recommendations.push('RSI stays in extreme zones too long - consider shorter RSI period for earlier signals');
    }

    return { strengths, weaknesses, recommendations };
  }

  /**
   * Determines if current market favors RSI strategy
   */
  isStrategyFavorable(marketConditions: RSIMarketCondition) {
    let favorabilityScore = 0;
    const reasons: string[] = [];

    // RSI works best in mean-reverting markets
    if (marketConditions.meanReversionTendency > 0.6) {
      favorabilityScore += 0.3;
      reasons.push('Strong mean reversion tendency favors RSI strategy');
    } else if (marketConditions.meanReversionTendency < 0.4) {
      favorabilityScore -= 0.2;
      reasons.push('Weak mean reversion reduces RSI effectiveness');
    }

    // Moderate volatility is ideal
    if (marketConditions.volatility > 0.01 && marketConditions.volatility < 0.03) {
      favorabilityScore += 0.2;
      reasons.push('Moderate volatility provides clear RSI signals');
    } else if (marketConditions.volatility > 0.05) {
      favorabilityScore -= 0.3;
      reasons.push('High volatility creates noisy RSI signals');
    }

    // Sideways markets are best for RSI
    if (marketConditions.trendDirection === 'sideways') {
      favorabilityScore += 0.3;
      reasons.push('Sideways market ideal for RSI mean reversion');
    } else if (marketConditions.trendStrength > 0.7) {
      favorabilityScore -= 0.2;
      reasons.push('Strong trending market may cause RSI to stay extreme');
    }

    // Low false breakout rate is favorable
    if (marketConditions.falseBreakoutRate < 0.3) {
      favorabilityScore += 0.2;
      reasons.push('Low false breakout rate supports reliable RSI signals');
    }

    const favorable = favorabilityScore > 0.3;
    const confidence = Math.min(Math.abs(favorabilityScore), 1.0);

    return {
      favorable,
      confidence,
      reasoning: reasons.join('; ')
    };
  }

  // Implementation of abstract backtest method
  async backtest(
    parameters: RSIParameters,
    marketData: MarketData,
    options = { commission: 0.075, slippage: 1, startCapital: 100000 }
  ) {
    const { prices, timestamps } = marketData;
    const { commission, slippage, startCapital } = options;

    const trades: any[] = [];
    const equityCurve: number[] = [startCapital];
    
    let capital = startCapital;
    let position: 'long' | 'short' | null = null;
    let entryPrice = 0;
    let entryIndex = 0;

    // Calculate indicators
    const rsi = this.calculateRSI(prices, parameters.rsi_lookback);
    const ma = this.calculateMA(prices, parameters.ma_length);
    const atr = this.calculateATR(prices, parameters.atr_length);

    // Simulate trading
    for (let i = Math.max(parameters.rsi_lookback, parameters.ma_length); i < prices.length; i++) {
      const currentRSI = rsi[i - parameters.rsi_lookback];
      const currentPrice = prices[i];
      const currentATR = atr[i - parameters.atr_length] || atr[atr.length - 1];

      // Entry conditions
      const longCondition = 
        currentRSI <= parameters.lower_barrier &&
        currentRSI >= parameters.lower_threshold &&
        currentPrice > ma[i - parameters.ma_length];

      const shortCondition = 
        currentRSI >= parameters.upper_barrier &&
        currentRSI <= parameters.upper_threshold &&
        currentPrice < ma[i - parameters.ma_length];

      // Exit conditions
      let exitTrade = false;
      let exitPrice = currentPrice;

      if (position === 'long') {
        const stopLoss = entryPrice - (currentATR * parameters.atr_multiplier_stop);
        const takeProfit = entryPrice + (currentATR * parameters.atr_multiplier_take);
        
        if (currentPrice <= stopLoss || currentPrice >= takeProfit || shortCondition) {
          exitTrade = true;
        }
      } else if (position === 'short') {
        const stopLoss = entryPrice + (currentATR * parameters.atr_multiplier_stop);
        const takeProfit = entryPrice - (currentATR * parameters.atr_multiplier_take);
        
        if (currentPrice >= stopLoss || currentPrice <= takeProfit || longCondition) {
          exitTrade = true;
        }
      }

      // Process exit
      if (exitTrade && position) {
        const pnl = position === 'long' 
          ? (exitPrice - entryPrice) / entryPrice
          : (entryPrice - exitPrice) / entryPrice;
        
        const pnlDollar = capital * pnl * 0.02; // 2% position size
        const commissionCost = capital * 0.02 * commission / 100 * 2; // Entry + exit
        
        capital += pnlDollar - commissionCost;
        
        trades.push({
          entry: { price: entryPrice, timestamp: timestamps[entryIndex] },
          exit: { price: exitPrice, timestamp: timestamps[i] },
          side: position,
          pnl: pnlDollar - commissionCost,
          pnlPercent: pnl
        });

        position = null;
      }

      // Process entry
      if (!position) {
        if (longCondition) {
          position = 'long';
          entryPrice = currentPrice;
          entryIndex = i;
        } else if (shortCondition) {
          position = 'short';
          entryPrice = currentPrice;
          entryIndex = i;
        }
      }

      equityCurve.push(capital);
    }

    // Calculate performance metrics
    const performance = this.calculatePerformanceMetrics(trades, equityCurve);

    return { trades, performance, equityCurve };
  }

  // Helper methods for RSI calculations
  private calculateRSI(prices: number[], period: number): number[] {
    const gains: number[] = [];
    const losses: number[] = [];

    for (let i = 1; i < prices.length; i++) {
      const change = prices[i] - prices[i - 1];
      gains.push(change > 0 ? change : 0);
      losses.push(change < 0 ? Math.abs(change) : 0);
    }

    const rsi: number[] = [];
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

  private calculateMA(prices: number[], period: number): number[] {
    const ma: number[] = [];
    for (let i = period - 1; i < prices.length; i++) {
      const sum = prices.slice(i - period + 1, i + 1).reduce((sum, price) => sum + price, 0);
      ma.push(sum / period);
    }
    return ma;
  }

  private calculateATR(prices: number[], period: number): number[] {
    const tr: number[] = [];
    for (let i = 1; i < prices.length; i++) {
      tr.push(Math.abs(prices[i] - prices[i - 1])); // Simplified TR calculation
    }

    const atr: number[] = [];
    for (let i = period - 1; i < tr.length; i++) {
      const sum = tr.slice(i - period + 1, i + 1).reduce((sum, value) => sum + value, 0);
      atr.push(sum / period);
    }
    return atr;
  }

  private identifyTrendDirection(prices: number[]): 'up' | 'down' | 'sideways' {
    const recentPrices = prices.slice(-20);
    const slope = (recentPrices[recentPrices.length - 1] - recentPrices[0]) / recentPrices.length;
    const slopePercent = slope / recentPrices[0];

    if (slopePercent > 0.001) return 'up';
    if (slopePercent < -0.001) return 'down';
    return 'sideways';
  }

  private calculateTrendStrength(prices: number[]): number {
    const recentPrices = prices.slice(-20);
    const returns = recentPrices.slice(1).map((price, i) => price / recentPrices[i] - 1);
    const avgReturn = returns.reduce((sum, ret) => sum + ret, 0) / returns.length;
    return Math.min(Math.abs(avgReturn) * 100, 1); // Normalize to 0-1
  }

  private calculateVolatility(prices: number[]): number {
    const returns = prices.slice(1).map((price, i) => Math.log(price / prices[i]));
    const variance = returns.reduce((sum, ret) => sum + ret * ret, 0) / returns.length;
    return Math.sqrt(variance * 252); // Annualized volatility
  }

  private analyzeMeanReversion(prices: number[], rsi: number[]): number {
    let reversals = 0;
    let extremes = 0;

    for (let i = 1; i < rsi.length - 5; i++) {
      if (rsi[i] <= 30 || rsi[i] >= 70) {
        extremes++;
        // Check if price reversed within 5 periods
        const futurePrice = prices[i + 5] || prices[prices.length - 1];
        if ((rsi[i] <= 30 && futurePrice > prices[i]) || (rsi[i] >= 70 && futurePrice < prices[i])) {
          reversals++;
        }
      }
    }

    return extremes > 0 ? reversals / extremes : 0.5;
  }

  private calculateRSIPersistence(rsi: number[]): number {
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

  private calculateFalseBreakoutRate(prices: number[], rsi: number[]): number {
    let falseSignals = 0;
    let totalSignals = 0;

    for (let i = 1; i < rsi.length - 5; i++) {
      if (rsi[i] <= 30 && rsi[i - 1] > 30) {
        totalSignals++;
        if (prices[i + 5] < prices[i]) falseSignals++;
      } else if (rsi[i] >= 70 && rsi[i - 1] < 70) {
        totalSignals++;
        if (prices[i + 5] > prices[i]) falseSignals++;
      }
    }

    return totalSignals > 0 ? falseSignals / totalSignals : 0.3;
  }

  private findOptimalRSILevels(prices: number[], rsi: number[]): { oversold: number; overbought: number } {
    // Analyze price reversals at different RSI levels
    const levels = [20, 25, 30, 35, 40, 60, 65, 70, 75, 80];
    let bestOversold = 30;
    let bestOverbought = 70;
    let bestReversalRate = 0;

    for (const oversold of levels.slice(0, 5)) {
      for (const overbought of levels.slice(5)) {
        let reversals = 0;
        let signals = 0;

        for (let i = 1; i < rsi.length - 3; i++) {
          if (rsi[i] <= oversold && rsi[i - 1] > oversold) {
            signals++;
            if (prices[i + 3] > prices[i]) reversals++;
          } else if (rsi[i] >= overbought && rsi[i - 1] < overbought) {
            signals++;
            if (prices[i + 3] < prices[i]) reversals++;
          }
        }

        const reversalRate = signals > 0 ? reversals / signals : 0;
        if (reversalRate > bestReversalRate) {
          bestReversalRate = reversalRate;
          bestOversold = oversold;
          bestOverbought = overbought;
        }
      }
    }

    return { oversold: bestOversold, overbought: bestOverbought };
  }

  private generateOptimizationCandidates(
    current: RSIParameters,
    market: RSIMarketCondition,
    performance: PerformanceMetrics
  ): RSIParameters[] {
    const candidates: RSIParameters[] = [];

    // Base optimization: adjust RSI period based on market conditions
    const rsiPeriods = market.trendStrength > 0.6 ? [8, 10, 12] : [14, 16, 18, 21];
    
    for (const rsiPeriod of rsiPeriods) {
      // Adjust barriers based on optimal levels found in market analysis
      const lowerBarrier = Math.max(20, Math.min(35, market.optimamalRSIRange.oversold));
      const upperBarrier = Math.max(65, Math.min(80, market.optimamalRSIRange.overbought));

      // Adjust ATR multipliers based on volatility
      const stopMultiplier = market.volatility > 0.025 ? 
        Math.min(3.0, current.atr_multiplier_stop + 0.5) :
        Math.max(1.5, current.atr_multiplier_stop - 0.2);

      const takeMultiplier = market.trendStrength > 0.6 ?
        Math.min(5.0, current.atr_multiplier_take + 0.5) :
        Math.max(2.0, current.atr_multiplier_take - 0.3);

      candidates.push({
        ...current,
        rsi_lookback: rsiPeriod,
        lower_barrier: lowerBarrier,
        lower_threshold: Math.max(15, lowerBarrier - 5),
        upper_barrier: upperBarrier,
        upper_threshold: Math.min(85, upperBarrier + 5),
        atr_multiplier_stop: stopMultiplier,
        atr_multiplier_take: takeMultiplier
      });
    }

    return candidates.slice(0, 10); // Limit to top 10 candidates
  }

  private calculateOptimizationConfidence(
    parameters: RSIParameters,
    performance: PerformanceMetrics,
    market: RSIMarketCondition,
    sampleSize: number
  ): number {
    let confidence = 0.5; // Base confidence

    // Statistical significance based on sample size
    if (sampleSize > 1000) confidence += 0.2;
    else if (sampleSize > 500) confidence += 0.1;
    else confidence -= 0.1;

    // Market fit assessment
    if (market.meanReversionTendency > 0.6) confidence += 0.15;
    if (market.falseBreakoutRate < 0.3) confidence += 0.1;
    if (market.volatility > 0.01 && market.volatility < 0.03) confidence += 0.1;

    // Performance consistency
    if (performance.winRate > 0.55 && performance.profitFactor > 1.3) confidence += 0.15;
    if (performance.maxDrawdown < 0.15) confidence += 0.1;

    return Math.min(Math.max(confidence, 0.1), 0.95);
  }

  private generateOptimizationReasoning(
    current: RSIParameters,
    optimized: RSIParameters,
    performance: PerformanceMetrics,
    market: RSIMarketCondition
  ): string {
    const changes: string[] = [];

    if (optimized.rsi_lookback !== current.rsi_lookback) {
      const direction = optimized.rsi_lookback < current.rsi_lookback ? 'shortened' : 'lengthened';
      changes.push(`RSI period ${direction} to ${optimized.rsi_lookback} for ${market.trendStrength > 0.6 ? 'faster trend signals' : 'smoother signals in choppy market'}`);
    }

    if (Math.abs(optimized.lower_barrier - current.lower_barrier) > 1) {
      const direction = optimized.lower_barrier < current.lower_barrier ? 'lowered' : 'raised';
      changes.push(`Oversold barrier ${direction} to ${optimized.lower_barrier} based on market's mean reversion profile`);
    }

    if (Math.abs(optimized.atr_multiplier_stop - current.atr_multiplier_stop) > 0.1) {
      const direction = optimized.atr_multiplier_stop > current.atr_multiplier_stop ? 'widened' : 'tightened';
      changes.push(`Stop loss ${direction} to ${optimized.atr_multiplier_stop}x ATR for ${market.volatility > 0.025 ? 'high volatility conditions' : 'better risk control'}`);
    }

    return changes.length > 0 ? changes.join('; ') : 'Parameters optimized based on market analysis and performance feedback';
  }

  private describeMarketContext(market: RSIMarketCondition): string {
    const context = [`${market.trendDirection} trend`, `${(market.volatility * 100).toFixed(1)}% volatility`];
    
    if (market.meanReversionTendency > 0.6) {
      context.push('strong mean reversion');
    } else if (market.meanReversionTendency < 0.4) {
      context.push('weak mean reversion');
    }

    return context.join(', ');
  }

  private calculateOptimizationScore(performance: PerformanceMetrics, confidence: number): number {
    // Weighted score considering multiple performance factors
    const winRateScore = performance.winRate * 0.3;
    const profitFactorScore = Math.min(performance.profitFactor / 3, 1) * 0.3;
    const sharpeScore = Math.min(performance.sharpeRatio / 2, 1) * 0.2;
    const drawdownScore = (1 - Math.min(performance.maxDrawdown, 0.5)) * 0.2;

    const performanceScore = winRateScore + profitFactorScore + sharpeScore + drawdownScore;
    return performanceScore * confidence;
  }

  private calculatePerformanceMetrics(trades: any[], equityCurve: number[]): PerformanceMetrics {
    if (trades.length === 0) {
      return {
        winRate: 0,
        profitFactor: 0,
        totalTrades: 0,
        avgWin: 0,
        avgLoss: 0,
        maxDrawdown: 0,
        sharpeRatio: 0,
        sortinoRatio: 0,
        calmarRatio: 0,
        consecutiveLosses: 0,
        consecutiveWins: 0,
        largestWin: 0,
        largestLoss: 0,
        expectancy: 0
      };
    }

    const wins = trades.filter(t => t.pnl > 0);
    const losses = trades.filter(t => t.pnl <= 0);

    const winRate = wins.length / trades.length;
    const avgWin = wins.length > 0 ? wins.reduce((sum, t) => sum + t.pnl, 0) / wins.length : 0;
    const avgLoss = losses.length > 0 ? Math.abs(losses.reduce((sum, t) => sum + t.pnl, 0) / losses.length) : 0;
    const profitFactor = losses.length > 0 ? (avgWin * wins.length) / (avgLoss * losses.length) : avgWin > 0 ? 10 : 0;

    const returns = equityCurve.slice(1).map((eq, i) => (eq - equityCurve[i]) / equityCurve[i]);
    const sharpeRatio = this.calculateSharpeRatio(returns);
    const maxDrawdown = this.calculateMaxDrawdown(equityCurve);

    return {
      winRate,
      profitFactor,
      totalTrades: trades.length,
      avgWin,
      avgLoss,
      maxDrawdown,
      sharpeRatio,
      sortinoRatio: sharpeRatio, // Simplified
      calmarRatio: maxDrawdown > 0 ? (equityCurve[equityCurve.length - 1] / equityCurve[0] - 1) / maxDrawdown : 0,
      consecutiveLosses: this.calculateMaxConsecutive(trades, false),
      consecutiveWins: this.calculateMaxConsecutive(trades, true),
      largestWin: wins.length > 0 ? Math.max(...wins.map(t => t.pnl)) : 0,
      largestLoss: losses.length > 0 ? Math.min(...losses.map(t => t.pnl)) : 0,
      expectancy: avgWin * winRate - avgLoss * (1 - winRate)
    };
  }

  private calculateMaxConsecutive(trades: any[], wins: boolean): number {
    let maxConsecutive = 0;
    let currentConsecutive = 0;

    for (const trade of trades) {
      const isWin = trade.pnl > 0;
      if (isWin === wins) {
        currentConsecutive++;
        maxConsecutive = Math.max(maxConsecutive, currentConsecutive);
      } else {
        currentConsecutive = 0;
      }
    }

    return maxConsecutive;
  }
}

// Register the RSI engine
import { StrategyEngineFactory } from './base-strategy-engine';
StrategyEngineFactory.registerEngine('rsi', () => new RSIStrategyEngine());

export const rsiStrategyEngine = new RSIStrategyEngine();
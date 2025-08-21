/**
 * Trade Trigger Analysis System
 * 
 * Understands what triggers trading alerts and predicts win probability
 * based on real-time market data, technical analysis, and momentum.
 */

export interface TradeTrigger {
  id: string;
  timestamp: Date;
  type: 'long' | 'short';
  symbol: string;
  triggerPrice: number;
  triggerConditions: {
    rsi: number;
    rsiCondition: string; // e.g., "RSI <= 30 and RSI >= 25"
    maCondition: string; // e.g., "Price > MA(20)"
    additionalFilters: string[];
  };
  marketContext: {
    trend: 'up' | 'down' | 'sideways';
    volatility: number;
    volume: number;
    timeOfDay: string;
    dayOfWeek: string;
  };
  technicalAnalysis: TechnicalContext;
  momentum: MomentumAnalysis;
  winProbability: number; // 0-1 probability of trade success
  expectedReturn: number; // Expected R:R ratio
  riskLevel: 'low' | 'medium' | 'high';
  confidenceScore: number; // 0-1 confidence in the prediction
}

export interface TechnicalContext {
  supportResistanceLevels: {
    support: number[];
    resistance: number[];
    nearestSupport: number;
    nearestResistance: number;
  };
  volumeProfile: {
    averageVolume: number;
    currentVolume: number;
    volumeRatio: number; // current vs average
    volumeTrend: 'increasing' | 'decreasing' | 'stable';
  };
  priceAction: {
    candlePattern: string;
    bodySize: number; // Size of candle body as % of total range
    wickAnalysis: {
      upperWick: number;
      lowerWick: number;
      rejectionSignal: boolean;
    };
    gapAnalysis: {
      hasGap: boolean;
      gapSize: number;
      gapType: 'up' | 'down' | 'none';
    };
  };
  multiTimeframeContext: {
    higherTimeframeTrend: 'up' | 'down' | 'sideways';
    alignment: boolean; // Is signal aligned with higher timeframe?
    conflictingSignals: string[];
  };
}

export interface MomentumAnalysis {
  rsiMomentum: {
    rsiDirection: 'rising' | 'falling' | 'flat';
    rsiVelocity: number; // Rate of RSI change
    rsiDivergence: {
      bullish: boolean;
      bearish: boolean;
      strength: number; // 0-1
    };
    rsiPattern: string; // e.g., "double bottom", "hidden divergence"
  };
  priceMonentum: {
    shortTermMomentum: number; // 5-period momentum
    mediumTermMomentum: number; // 20-period momentum
    longTermMomentum: number; // 50-period momentum
    momentumAlignment: boolean; // Are all timeframes aligned?
    accelerating: boolean;
  };
  orderFlowIndicators: {
    bidAskSpread: number;
    orderBookImbalance: number; // Ratio of buy vs sell orders
    recentTradeDirection: 'buying' | 'selling' | 'neutral';
    institutionalActivity: number; // 0-1 score
  };
}

export interface WinProbabilityModel {
  historicalAccuracy: number; // How accurate past predictions were
  confidenceInterval: [number, number]; // Lower and upper bounds
  keyFactors: {
    factor: string;
    weight: number;
    currentValue: number;
    optimalRange: [number, number];
    impact: 'positive' | 'negative' | 'neutral';
  }[];
  marketRegimeAccuracy: {
    trending: number;
    sideways: number;
    volatile: number;
  };
}

export class TradeTriggerAnalyzer {
  private historicalTriggers: TradeTrigger[] = [];
  private winProbabilityModel: WinProbabilityModel;

  constructor() {
    this.winProbabilityModel = this.initializeWinProbabilityModel();
  }

  /**
   * Analyzes a potential trade trigger and predicts win probability
   */
  async analyzeTradeTrigger(
    triggerData: {
      type: 'long' | 'short';
      symbol: string;
      currentPrice: number;
      rsi: number;
      rsiParameters: any;
      marketData: number[]; // Recent price history
      volumeData?: number[]; // Recent volume history
    }
  ): Promise<TradeTrigger> {
    const timestamp = new Date();
    
    // 1. Parse the trigger conditions
    const triggerConditions = this.parseTriggerConditions(triggerData);
    
    // 2. Analyze current market context
    const marketContext = this.analyzeMarketContext(triggerData.marketData, timestamp);
    
    // 3. Perform technical analysis
    const technicalAnalysis = await this.performTechnicalAnalysis(
      triggerData.currentPrice,
      triggerData.marketData,
      triggerData.volumeData
    );
    
    // 4. Analyze momentum factors
    const momentum = this.analyzeMomentum(
      triggerData.marketData,
      triggerData.rsi,
      triggerData.volumeData
    );
    
    // 5. Calculate win probability
    const winProbability = this.calculateWinProbability(
      triggerData,
      marketContext,
      technicalAnalysis,
      momentum
    );
    
    // 6. Calculate expected return and risk
    const { expectedReturn, riskLevel } = this.calculateRiskReturn(
      triggerData.type,
      triggerData.currentPrice,
      technicalAnalysis,
      marketContext
    );
    
    // 7. Calculate confidence score
    const confidenceScore = this.calculateConfidenceScore(
      marketContext,
      technicalAnalysis,
      momentum,
      triggerData.marketData.length
    );

    const trigger: TradeTrigger = {
      id: `${triggerData.symbol}_${timestamp.getTime()}`,
      timestamp,
      type: triggerData.type,
      symbol: triggerData.symbol,
      triggerPrice: triggerData.currentPrice,
      triggerConditions,
      marketContext,
      technicalAnalysis,
      momentum,
      winProbability,
      expectedReturn,
      riskLevel,
      confidenceScore
    };

    // Store for learning
    this.historicalTriggers.push(trigger);
    
    return trigger;
  }

  /**
   * Parses and understands the specific trigger conditions
   */
  private parseTriggerConditions(triggerData: any) {
    const { rsi, rsiParameters, type } = triggerData;
    
    let rsiCondition = '';
    let maCondition = '';
    const additionalFilters: string[] = [];

    if (type === 'long') {
      rsiCondition = `RSI(${rsi.toFixed(1)}) <= ${rsiParameters.lower_barrier}`;
      if (rsiParameters.lower_threshold) {
        rsiCondition += ` and RSI >= ${rsiParameters.lower_threshold}`;
      }
      maCondition = `Price > MA(${rsiParameters.ma_length})`;
    } else {
      rsiCondition = `RSI(${rsi.toFixed(1)}) >= ${rsiParameters.upper_barrier}`;
      if (rsiParameters.upper_threshold) {
        rsiCondition += ` and RSI <= ${rsiParameters.upper_threshold}`;
      }
      maCondition = `Price < MA(${rsiParameters.ma_length})`;
    }

    // Check for additional filters
    if (rsiParameters.volume_filter) {
      additionalFilters.push('Volume > Average Volume');
    }
    
    if (rsiParameters.time_filter) {
      additionalFilters.push('Active trading hours');
    }

    return {
      rsi,
      rsiCondition,
      maCondition,
      additionalFilters
    };
  }

  /**
   * Analyzes current market context
   */
  private analyzeMarketContext(marketData: number[], timestamp: Date) {
    const recentData = marketData.slice(-50); // Last 50 periods
    
    // Determine trend
    const shortMA = this.calculateSMA(recentData.slice(-10), 10);
    const longMA = this.calculateSMA(recentData.slice(-20), 20);
    const trend = shortMA > longMA ? 'up' : shortMA < longMA ? 'down' : 'sideways';
    
    // Calculate volatility (ATR as percentage)
    const volatility = this.calculateVolatility(recentData);
    
    // Volume analysis (if available)
    const volume = 1.0; // Default if no volume data
    
    // Time context
    const timeOfDay = this.getTimeOfDay(timestamp);
    const dayOfWeek = this.getDayOfWeek(timestamp);

    return {
      trend,
      volatility,
      volume,
      timeOfDay,
      dayOfWeek
    };
  }

  /**
   * Performs comprehensive technical analysis
   */
  private async performTechnicalAnalysis(
    currentPrice: number,
    marketData: number[],
    volumeData?: number[]
  ): Promise<TechnicalContext> {
    
    // 1. Support/Resistance Analysis
    const supportResistanceLevels = this.findSupportResistanceLevels(marketData);
    
    // 2. Volume Profile Analysis
    const volumeProfile = this.analyzeVolumeProfile(volumeData || []);
    
    // 3. Price Action Analysis
    const priceAction = this.analyzePriceAction(marketData.slice(-5)); // Last 5 candles
    
    // 4. Multi-timeframe Context
    const multiTimeframeContext = this.analyzeMultiTimeframeContext(marketData);

    return {
      supportResistanceLevels,
      volumeProfile,
      priceAction,
      multiTimeframeContext
    };
  }

  /**
   * Analyzes momentum factors that affect trade success
   */
  private analyzeMomentum(
    marketData: number[],
    currentRSI: number,
    volumeData?: number[]
  ): MomentumAnalysis {
    
    // RSI Momentum Analysis
    const rsiHistory = marketData.slice(-14).map((_, i, arr) => 
      this.calculateRSI(arr.slice(0, i + 1), 14)
    ).filter(rsi => !isNaN(rsi));

    const rsiMomentum = this.analyzeRSIMomentum(rsiHistory, marketData);
    
    // Price Momentum Analysis
    const priceMonentum = this.analyzePriceMomentum(marketData);
    
    // Order Flow Indicators (simulated - would connect to real order book data)
    const orderFlowIndicators = this.analyzeOrderFlow(marketData, volumeData);

    return {
      rsiMomentum,
      priceMonentum,
      orderFlowIndicators
    };
  }

  /**
   * Core win probability calculation based on all factors
   */
  private calculateWinProbability(
    triggerData: any,
    marketContext: any,
    technicalAnalysis: TechnicalContext,
    momentum: MomentumAnalysis
  ): number {
    let probability = 0.5; // Base 50% probability
    let factors: { name: string; weight: number; value: number; impact: number }[] = [];

    // 1. RSI Mean Reversion Factor (25% weight)
    const rsiMeanReversionFactor = this.calculateRSIMeanReversionProbability(
      triggerData.rsi,
      triggerData.type,
      marketContext.trend
    );
    factors.push({
      name: 'RSI Mean Reversion',
      weight: 0.25,
      value: rsiMeanReversionFactor,
      impact: (rsiMeanReversionFactor - 0.5) * 0.25
    });

    // 2. Technical Context Factor (20% weight)
    const technicalFactor = this.calculateTechnicalProbability(
      technicalAnalysis,
      triggerData.type,
      triggerData.currentPrice
    );
    factors.push({
      name: 'Technical Context',
      weight: 0.20,
      value: technicalFactor,
      impact: (technicalFactor - 0.5) * 0.20
    });

    // 3. Momentum Alignment Factor (20% weight)
    const momentumFactor = this.calculateMomentumProbability(momentum, triggerData.type);
    factors.push({
      name: 'Momentum Alignment',
      weight: 0.20,
      value: momentumFactor,
      impact: (momentumFactor - 0.5) * 0.20
    });

    // 4. Market Context Factor (15% weight)
    const marketFactor = this.calculateMarketContextProbability(marketContext, triggerData.type);
    factors.push({
      name: 'Market Context',
      weight: 0.15,
      value: marketFactor,
      impact: (marketFactor - 0.5) * 0.15
    });

    // 5. Volume Confirmation Factor (10% weight)
    const volumeFactor = this.calculateVolumeProbability(technicalAnalysis.volumeProfile);
    factors.push({
      name: 'Volume Confirmation',
      weight: 0.10,
      value: volumeFactor,
      impact: (volumeFactor - 0.5) * 0.10
    });

    // 6. Time Context Factor (10% weight)  
    const timeFactor = this.calculateTimeContextProbability(marketContext.timeOfDay, marketContext.dayOfWeek);
    factors.push({
      name: 'Time Context',
      weight: 0.10,
      value: timeFactor,
      impact: (timeFactor - 0.5) * 0.10
    });

    // Calculate weighted probability
    const totalImpact = factors.reduce((sum, factor) => sum + factor.impact, 0);
    probability += totalImpact;

    // Apply bounds and confidence adjustments
    probability = Math.max(0.05, Math.min(0.95, probability));

    // Store factors for explanation
    this.winProbabilityModel.keyFactors = factors.map(f => ({
      factor: f.name,
      weight: f.weight,
      currentValue: f.value,
      optimalRange: [0.6, 0.8] as [number, number],
      impact: f.impact > 0 ? 'positive' : f.impact < 0 ? 'negative' : 'neutral'
    }));

    return probability;
  }

  /**
   * Calculates RSI mean reversion probability based on market conditions
   */
  private calculateRSIMeanReversionProbability(rsi: number, type: 'long' | 'short', trend: string): number {
    let probability = 0.5;

    if (type === 'long') {
      // Long trades - looking for oversold reversal
      if (rsi <= 20) {
        probability = trend === 'up' ? 0.8 : trend === 'sideways' ? 0.75 : 0.6; // Severely oversold
      } else if (rsi <= 30) {
        probability = trend === 'up' ? 0.7 : trend === 'sideways' ? 0.65 : 0.5; // Standard oversold
      } else if (rsi <= 35) {
        probability = trend === 'up' ? 0.6 : 0.45; // Mildly oversold
      }
    } else {
      // Short trades - looking for overbought reversal
      if (rsi >= 80) {
        probability = trend === 'down' ? 0.8 : trend === 'sideways' ? 0.75 : 0.6; // Severely overbought
      } else if (rsi >= 70) {
        probability = trend === 'down' ? 0.7 : trend === 'sideways' ? 0.65 : 0.5; // Standard overbought
      } else if (rsi >= 65) {
        probability = trend === 'down' ? 0.6 : 0.45; // Mildly overbought
      }
    }

    return probability;
  }

  /**
   * Calculates technical analysis probability
   */
  private calculateTechnicalProbability(technical: TechnicalContext, type: 'long' | 'short', currentPrice: number): number {
    let probability = 0.5;

    // Support/Resistance factor
    const { nearestSupport, nearestResistance } = technical.supportResistanceLevels;
    const distanceToSupport = Math.abs(currentPrice - nearestSupport) / currentPrice;
    const distanceToResistance = Math.abs(currentPrice - nearestResistance) / currentPrice;

    if (type === 'long') {
      // Near support is good for longs
      if (distanceToSupport < 0.005) probability += 0.2; // Within 0.5%
      else if (distanceToSupport < 0.01) probability += 0.1; // Within 1%
      
      // Far from resistance is good for longs
      if (distanceToResistance > 0.02) probability += 0.1; // More than 2% away
    } else {
      // Near resistance is good for shorts
      if (distanceToResistance < 0.005) probability += 0.2;
      else if (distanceToResistance < 0.01) probability += 0.1;
      
      // Far from support is good for shorts
      if (distanceToSupport > 0.02) probability += 0.1;
    }

    // Price action factor
    const { candlePattern, wickAnalysis } = technical.priceAction;
    if (type === 'long' && wickAnalysis.rejectionSignal && wickAnalysis.lowerWick > wickAnalysis.upperWick) {
      probability += 0.15; // Lower wick rejection good for longs
    } else if (type === 'short' && wickAnalysis.rejectionSignal && wickAnalysis.upperWick > wickAnalysis.lowerWick) {
      probability += 0.15; // Upper wick rejection good for shorts
    }

    // Multi-timeframe alignment
    if (technical.multiTimeframeContext.alignment) {
      probability += 0.1;
    }

    return Math.max(0.1, Math.min(0.9, probability));
  }

  /**
   * Calculates momentum probability
   */
  private calculateMomentumProbability(momentum: MomentumAnalysis, type: 'long' | 'short'): number {
    let probability = 0.5;

    // RSI momentum alignment
    if (type === 'long' && momentum.rsiMomentum.rsiDirection === 'rising') {
      probability += 0.15;
    } else if (type === 'short' && momentum.rsiMomentum.rsiDirection === 'falling') {
      probability += 0.15;
    }

    // RSI divergence
    if (type === 'long' && momentum.rsiMomentum.rsiDivergence.bullish) {
      probability += 0.2 * momentum.rsiMomentum.rsiDivergence.strength;
    } else if (type === 'short' && momentum.rsiMomentum.rsiDivergence.bearish) {
      probability += 0.2 * momentum.rsiMomentum.rsiDivergence.strength;
    }

    // Price momentum alignment
    if (momentum.priceMonentum.momentumAlignment) {
      const shortTerm = momentum.priceMonentum.shortTermMomentum;
      if ((type === 'long' && shortTerm > 0) || (type === 'short' && shortTerm < 0)) {
        probability += 0.1;
      }
    }

    // Order flow
    if (type === 'long' && momentum.orderFlowIndicators.recentTradeDirection === 'buying') {
      probability += 0.05;
    } else if (type === 'short' && momentum.orderFlowIndicators.recentTradeDirection === 'selling') {
      probability += 0.05;
    }

    return Math.max(0.1, Math.min(0.9, probability));
  }

  // Additional helper methods for calculations...
  private calculateMarketContextProbability(context: any, type: 'long' | 'short'): number {
    let probability = 0.5;
    
    // Trend alignment
    if ((type === 'long' && context.trend === 'up') || (type === 'short' && context.trend === 'down')) {
      probability += 0.1;
    } else if ((type === 'long' && context.trend === 'down') || (type === 'short' && context.trend === 'up')) {
      probability -= 0.15; // Counter-trend trades are riskier
    }

    // Volatility impact
    if (context.volatility > 0.03) {
      probability -= 0.05; // High volatility increases noise
    } else if (context.volatility < 0.01) {
      probability += 0.05; // Low volatility good for clean signals
    }

    return Math.max(0.2, Math.min(0.8, probability));
  }

  private calculateVolumeProbability(volumeProfile: any): number {
    let probability = 0.5;

    if (volumeProfile.volumeRatio > 1.5) {
      probability += 0.1; // High volume confirmation
    } else if (volumeProfile.volumeRatio < 0.7) {
      probability -= 0.05; // Low volume warning
    }

    if (volumeProfile.volumeTrend === 'increasing') {
      probability += 0.05;
    }

    return Math.max(0.3, Math.min(0.7, probability));
  }

  private calculateTimeContextProbability(timeOfDay: string, dayOfWeek: string): number {
    let probability = 0.5;

    // Active trading hours are better
    if (timeOfDay === 'active') {
      probability += 0.05;
    } else if (timeOfDay === 'low_activity') {
      probability -= 0.05;
    }

    // Avoid Fridays and Mondays for some strategies
    if (dayOfWeek === 'Tuesday' || dayOfWeek === 'Wednesday' || dayOfWeek === 'Thursday') {
      probability += 0.02;
    }

    return probability;
  }

  // Utility methods
  private calculateSMA(data: number[], period: number): number {
    const sum = data.slice(-period).reduce((sum, value) => sum + value, 0);
    return sum / Math.min(period, data.length);
  }

  private calculateVolatility(data: number[]): number {
    const returns = data.slice(1).map((price, i) => Math.log(price / data[i]));
    const variance = returns.reduce((sum, ret) => sum + ret * ret, 0) / returns.length;
    return Math.sqrt(variance);
  }

  private calculateRSI(prices: number[], period: number): number {
    if (prices.length < period + 1) return 50; // Default neutral RSI

    const gains: number[] = [];
    const losses: number[] = [];

    for (let i = 1; i < prices.length; i++) {
      const change = prices[i] - prices[i - 1];
      gains.push(change > 0 ? change : 0);
      losses.push(change < 0 ? Math.abs(change) : 0);
    }

    const avgGain = gains.slice(-period).reduce((sum, gain) => sum + gain, 0) / period;
    const avgLoss = losses.slice(-period).reduce((sum, loss) => sum + loss, 0) / period;

    if (avgLoss === 0) return 100;
    const rs = avgGain / avgLoss;
    return 100 - (100 / (1 + rs));
  }

  private getTimeOfDay(timestamp: Date): string {
    const hour = timestamp.getHours();
    if (hour >= 9 && hour <= 16) return 'active';
    if (hour >= 17 && hour <= 20) return 'evening';
    return 'low_activity';
  }

  private getDayOfWeek(timestamp: Date): string {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[timestamp.getDay()];
  }

  // Placeholder implementations for complex analysis methods
  private findSupportResistanceLevels(marketData: number[]) {
    const support = [Math.min(...marketData.slice(-20))];
    const resistance = [Math.max(...marketData.slice(-20))];
    
    return {
      support,
      resistance,
      nearestSupport: support[0],
      nearestResistance: resistance[0]
    };
  }

  private analyzeVolumeProfile(volumeData: number[]) {
    const averageVolume = volumeData.length > 0 ? 
      volumeData.reduce((sum, vol) => sum + vol, 0) / volumeData.length : 1;
    const currentVolume = volumeData[volumeData.length - 1] || 1;
    
    return {
      averageVolume,
      currentVolume,
      volumeRatio: currentVolume / averageVolume,
      volumeTrend: currentVolume > averageVolume ? 'increasing' : 'decreasing'
    };
  }

  private analyzePriceAction(recentData: number[]) {
    const bodySize = 0.7; // Simplified
    const upperWick = 0.1;
    const lowerWick = 0.2;
    
    return {
      candlePattern: 'doji',
      bodySize,
      wickAnalysis: {
        upperWick,
        lowerWick,
        rejectionSignal: lowerWick > upperWick * 2
      },
      gapAnalysis: {
        hasGap: false,
        gapSize: 0,
        gapType: 'none' as const
      }
    };
  }

  private analyzeMultiTimeframeContext(marketData: number[]) {
    return {
      higherTimeframeTrend: 'up' as const,
      alignment: true,
      conflictingSignals: []
    };
  }

  private analyzeRSIMomentum(rsiHistory: number[], priceData: number[]) {
    const currentRSI = rsiHistory[rsiHistory.length - 1];
    const prevRSI = rsiHistory[rsiHistory.length - 2] || currentRSI;
    
    return {
      rsiDirection: currentRSI > prevRSI ? 'rising' : currentRSI < prevRSI ? 'falling' : 'flat',
      rsiVelocity: Math.abs(currentRSI - prevRSI),
      rsiDivergence: {
        bullish: false,
        bearish: false,
        strength: 0
      },
      rsiPattern: 'normal'
    } as const;
  }

  private analyzePriceMomentum(marketData: number[]) {
    const recent = marketData.slice(-5);
    const shortTermMomentum = recent[recent.length - 1] / recent[0] - 1;
    
    return {
      shortTermMomentum,
      mediumTermMomentum: shortTermMomentum * 0.8,
      longTermMomentum: shortTermMomentum * 0.6,
      momentumAlignment: true,
      accelerating: shortTermMomentum > 0
    };
  }

  private analyzeOrderFlow(marketData: number[], volumeData?: number[]) {
    return {
      bidAskSpread: 0.001,
      orderBookImbalance: 0.6,
      recentTradeDirection: 'buying' as const,
      institutionalActivity: 0.5
    };
  }

  private calculateRiskReturn(type: string, currentPrice: number, technical: TechnicalContext, market: any) {
    const expectedReturn = type === 'long' ? 1.5 : 1.3; // R:R ratio
    const riskLevel = market.volatility > 0.03 ? 'high' : market.volatility > 0.015 ? 'medium' : 'low';
    
    return { expectedReturn, riskLevel };
  }

  private calculateConfidenceScore(market: any, technical: TechnicalContext, momentum: MomentumAnalysis, dataPoints: number): number {
    let confidence = 0.5;
    
    if (dataPoints > 100) confidence += 0.2;
    if (technical.multiTimeframeContext.alignment) confidence += 0.1;
    if (momentum.priceMonentum.momentumAlignment) confidence += 0.1;
    
    return Math.min(0.95, confidence);
  }

  private initializeWinProbabilityModel(): WinProbabilityModel {
    return {
      historicalAccuracy: 0.65,
      confidenceInterval: [0.6, 0.7],
      keyFactors: [],
      marketRegimeAccuracy: {
        trending: 0.7,
        sideways: 0.8,
        volatile: 0.55
      }
    };
  }
}

export const tradeTriggerAnalyzer = new TradeTriggerAnalyzer();
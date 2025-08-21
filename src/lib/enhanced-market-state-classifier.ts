/**
 * Enhanced Market State Classifier
 * 
 * Advanced market regime detection using multiple technical indicators,
 * volume analysis, volatility measurements, and session-based context.
 * This provides much more accurate states for Markov chain analysis.
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

// Enhanced market states with more granular classification
export enum EnhancedMarketState {
  // Trending States (with strength and volume context)
  STRONG_UPTREND_HIGH_VOL = 'STRONG_UPTREND_HIGH_VOL',
  STRONG_UPTREND_LOW_VOL = 'STRONG_UPTREND_LOW_VOL',
  WEAK_UPTREND_HIGH_VOL = 'WEAK_UPTREND_HIGH_VOL',
  WEAK_UPTREND_LOW_VOL = 'WEAK_UPTREND_LOW_VOL',
  
  STRONG_DOWNTREND_HIGH_VOL = 'STRONG_DOWNTREND_HIGH_VOL',
  STRONG_DOWNTREND_LOW_VOL = 'STRONG_DOWNTREND_LOW_VOL',
  WEAK_DOWNTREND_HIGH_VOL = 'WEAK_DOWNTREND_HIGH_VOL',
  WEAK_DOWNTREND_LOW_VOL = 'WEAK_DOWNTREND_LOW_VOL',
  
  // Ranging States
  TIGHT_RANGE_LOW_VOL = 'TIGHT_RANGE_LOW_VOL',          // Compression
  TIGHT_RANGE_HIGH_VOL = 'TIGHT_RANGE_HIGH_VOL',        // Building energy
  WIDE_RANGE_LOW_VOL = 'WIDE_RANGE_LOW_VOL',            // Indecision
  WIDE_RANGE_HIGH_VOL = 'WIDE_RANGE_HIGH_VOL',          // Battle zone
  
  // Breakout States
  BULLISH_BREAKOUT_CONFIRMED = 'BULLISH_BREAKOUT_CONFIRMED',   // Volume + momentum
  BULLISH_BREAKOUT_WEAK = 'BULLISH_BREAKOUT_WEAK',             // Price only
  BEARISH_BREAKOUT_CONFIRMED = 'BEARISH_BREAKOUT_CONFIRMED',   // Volume + momentum
  BEARISH_BREAKOUT_WEAK = 'BEARISH_BREAKOUT_WEAK',             // Price only
  
  // Reversal States
  BULLISH_REVERSAL_FORMING = 'BULLISH_REVERSAL_FORMING',       // Early signals
  BULLISH_REVERSAL_CONFIRMED = 'BULLISH_REVERSAL_CONFIRMED',   // Confirmed reversal
  BEARISH_REVERSAL_FORMING = 'BEARISH_REVERSAL_FORMING',       // Early signals
  BEARISH_REVERSAL_CONFIRMED = 'BEARISH_REVERSAL_CONFIRMED',   // Confirmed reversal
  
  // Special States
  SQUEEZE_FORMING = 'SQUEEZE_FORMING',                 // Pre-breakout compression
  CLIMAX_BUYING = 'CLIMAX_BUYING',                     // Exhaustion buying
  CLIMAX_SELLING = 'CLIMAX_SELLING',                   // Exhaustion selling
  WHIPSAW_ZONE = 'WHIPSAW_ZONE',                       // High noise, avoid
  
  // Session-based states
  OPENING_VOLATILITY = 'OPENING_VOLATILITY',           // Market open chaos
  LUNCH_DOLDRUMS = 'LUNCH_DOLDRUMS',                   // Low activity period
  POWER_HOUR = 'POWER_HOUR',                           // End of day push
  OVERNIGHT_DRIFT = 'OVERNIGHT_DRIFT'                  // After hours movement
}

export interface MarketStateMetrics {
  // Trend Analysis
  trend: {
    direction: 'up' | 'down' | 'sideways';
    strength: number;        // 0-100
    consistency: number;     // How stable the trend is
    duration: number;        // Minutes in current trend
  };
  
  // Volume Analysis
  volume: {
    current: number;
    average20: number;
    relativeVolume: number;  // Current vs average
    buyingPressure: number;  // 0-100, estimated from price/volume
    sellingPressure: number; // 0-100, estimated from price/volume
    volumeProfile: 'accumulation' | 'distribution' | 'neutral';
  };
  
  // Volatility Analysis
  volatility: {
    current: number;         // Current volatility
    average20: number;       // 20-period average
    relativeVolatility: number; // Current vs average
    atr: number;            // Average True Range
    volatilityRank: number; // 0-100 rank over recent periods
  };
  
  // Range Analysis
  range: {
    current: number;         // High - Low for current period
    average: number;         // Average range
    rangeExpansion: boolean; // Breaking out of normal range
    rangeContraction: boolean; // Compressing into tight range
    supportLevel: number;    // Key support
    resistanceLevel: number; // Key resistance
  };
  
  // Session Context
  session: {
    current: 'asia' | 'europe' | 'us' | 'overnight';
    openMinutes: number;     // Minutes since session open
    typical: boolean;        // Is behavior typical for this session?
  };
  
  // Market Structure
  structure: {
    higherHighs: boolean;
    higherLows: boolean;
    lowerHighs: boolean;
    lowerLows: boolean;
    keyLevel: number | null;     // Important price level nearby
    levelType: 'support' | 'resistance' | 'pivot' | null;
  };
}

export class EnhancedMarketStateClassifier {
  private priceHistory: MarketDataOHLC[] = [];
  private maxHistoryLength = 100; // Keep last 100 periods
  
  constructor() {}
  
  /**
   * Classify market state based on comprehensive analysis
   */
  public classifyMarketState(
    currentData: MarketDataOHLC, 
    recentHistory: MarketDataOHLC[]
  ): { state: EnhancedMarketState; metrics: MarketStateMetrics } {
    
    // Update internal history
    this.updateHistory(currentData, recentHistory);
    
    // Calculate comprehensive metrics
    const metrics = this.calculateMarketMetrics(currentData, this.priceHistory);
    
    // Determine state based on metrics
    const state = this.determineStateFromMetrics(metrics);
    
    return { state, metrics };
  }
  
  private updateHistory(current: MarketDataOHLC, recent: MarketDataOHLC[]): void {
    // Combine current with recent history
    const combined = [...recent, current];
    
    // Keep only the most recent data
    this.priceHistory = combined
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())
      .slice(-this.maxHistoryLength);
  }
  
  private calculateMarketMetrics(current: MarketDataOHLC, history: MarketDataOHLC[]): MarketStateMetrics {
    const prices = history.map(d => d.close);
    const volumes = history.map(d => d.volume);
    const highs = history.map(d => d.high);
    const lows = history.map(d => d.low);
    
    return {
      trend: this.analyzeTrend(prices),
      volume: this.analyzeVolume(current.volume, volumes, prices),
      volatility: this.analyzeVolatility(prices, highs, lows),
      range: this.analyzeRange(current, history),
      session: this.analyzeSession(current.timestamp),
      structure: this.analyzeMarketStructure(history)
    };
  }
  
  private analyzeTrend(prices: number[]): MarketStateMetrics['trend'] {
    if (prices.length < 10) {
      return { direction: 'sideways', strength: 0, consistency: 0, duration: 0 };
    }
    
    // Calculate trend using multiple methods
    const sma20 = this.calculateSMA(prices, 20);
    const ema12 = this.calculateEMA(prices, 12);
    const ema26 = this.calculateEMA(prices, 26);
    
    const currentPrice = prices[prices.length - 1];
    const sma20Current = sma20[sma20.length - 1];
    
    // Trend direction
    let direction: 'up' | 'down' | 'sideways' = 'sideways';
    if (currentPrice > sma20Current && ema12[ema12.length - 1] > ema26[ema26.length - 1]) {
      direction = 'up';
    } else if (currentPrice < sma20Current && ema12[ema12.length - 1] < ema26[ema26.length - 1]) {
      direction = 'down';
    }
    
    // Trend strength (0-100)
    const priceDeviation = Math.abs(currentPrice - sma20Current) / sma20Current;
    const strength = Math.min(100, priceDeviation * 1000);
    
    // Trend consistency (how stable the trend has been)
    const recentPrices = prices.slice(-10);
    const priceChanges = recentPrices.slice(1).map((price, i) => price - recentPrices[i]);
    const consistentDirection = priceChanges.filter(change => 
      direction === 'up' ? change > 0 : direction === 'down' ? change < 0 : Math.abs(change) < 0.001
    ).length;
    const consistency = (consistentDirection / priceChanges.length) * 100;
    
    // Estimate trend duration (simplified)
    let duration = 1;
    for (let i = prices.length - 2; i >= 0; i--) {
      const prevDirection = this.getPriceDirection(prices[i], sma20[i] || prices[i]);
      if (prevDirection === direction) {
        duration++;
      } else {
        break;
      }
    }
    
    return { direction, strength, consistency, duration };
  }
  
  private analyzeVolume(currentVol: number, volumes: number[], prices: number[]): MarketStateMetrics['volume'] {
    const average20 = volumes.slice(-20).reduce((sum, vol) => sum + vol, 0) / Math.min(volumes.length, 20);
    const relativeVolume = currentVol / average20;
    
    // Estimate buying/selling pressure from price-volume relationship
    const recentPrices = prices.slice(-5);
    const recentVolumes = volumes.slice(-5);
    
    let buyingPressure = 50; // Neutral start
    let sellingPressure = 50;
    
    for (let i = 1; i < recentPrices.length; i++) {
      const priceChange = recentPrices[i] - recentPrices[i - 1];
      const volumeWeight = recentVolumes[i] / average20;
      
      if (priceChange > 0) {
        buyingPressure += volumeWeight * 10;
        sellingPressure -= volumeWeight * 5;
      } else if (priceChange < 0) {
        sellingPressure += volumeWeight * 10;
        buyingPressure -= volumeWeight * 5;
      }
    }
    
    buyingPressure = Math.max(0, Math.min(100, buyingPressure));
    sellingPressure = Math.max(0, Math.min(100, sellingPressure));
    
    // Volume profile
    let volumeProfile: 'accumulation' | 'distribution' | 'neutral' = 'neutral';
    if (buyingPressure > 65) volumeProfile = 'accumulation';
    else if (sellingPressure > 65) volumeProfile = 'distribution';
    
    return {
      current: currentVol,
      average20,
      relativeVolume,
      buyingPressure,
      sellingPressure,
      volumeProfile
    };
  }
  
  private analyzeVolatility(prices: number[], highs: number[], lows: number[]): MarketStateMetrics['volatility'] {
    // Calculate ATR (Average True Range)
    const trueRanges = [];
    for (let i = 1; i < prices.length; i++) {
      const high = highs[i];
      const low = lows[i];
      const prevClose = prices[i - 1];
      
      const tr = Math.max(
        high - low,
        Math.abs(high - prevClose),
        Math.abs(low - prevClose)
      );
      trueRanges.push(tr);
    }
    
    const atr = trueRanges.slice(-14).reduce((sum, tr) => sum + tr, 0) / Math.min(trueRanges.length, 14);
    
    // Calculate price volatility
    const returns = prices.slice(1).map((price, i) => (price - prices[i]) / prices[i]);
    const recentReturns = returns.slice(-20);
    
    const variance = recentReturns.reduce((sum, ret) => sum + ret * ret, 0) / recentReturns.length;
    const current = Math.sqrt(variance);
    
    // Historical volatility for comparison
    const historicalReturns = returns.slice(-50);
    const historicalVariance = historicalReturns.reduce((sum, ret) => sum + ret * ret, 0) / historicalReturns.length;
    const average20 = Math.sqrt(historicalVariance);
    
    const relativeVolatility = current / average20;
    
    // Volatility rank (0-100)
    const sortedVolatilities = returns.slice(-100).map((_, i) => {
      const subReturns = returns.slice(i, i + 20);
      const subVariance = subReturns.reduce((sum, ret) => sum + ret * ret, 0) / subReturns.length;
      return Math.sqrt(subVariance);
    }).sort((a, b) => a - b);
    
    const volatilityRank = (sortedVolatilities.findIndex(vol => vol >= current) / sortedVolatilities.length) * 100;
    
    return {
      current,
      average20,
      relativeVolatility,
      atr,
      volatilityRank
    };
  }
  
  private analyzeRange(current: MarketDataOHLC, history: MarketDataOHLC[]): MarketStateMetrics['range'] {
    const currentRange = current.high - current.low;
    const recentRanges = history.slice(-20).map(d => d.high - d.low);
    const average = recentRanges.reduce((sum, range) => sum + range, 0) / recentRanges.length;
    
    const rangeExpansion = currentRange > average * 1.5;
    const rangeContraction = currentRange < average * 0.5;
    
    // Find key levels (simplified - would use more sophisticated level detection in production)
    const recentHighs = history.slice(-50).map(d => d.high);
    const recentLows = history.slice(-50).map(d => d.low);
    
    const resistanceLevel = Math.max(...recentHighs);
    const supportLevel = Math.min(...recentLows);
    
    return {
      current: currentRange,
      average,
      rangeExpansion,
      rangeContraction,
      supportLevel,
      resistanceLevel
    };
  }
  
  private analyzeSession(timestamp: Date): MarketStateMetrics['session'] {
    const hour = timestamp.getUTCHours();
    const minutes = timestamp.getUTCMinutes();
    const totalMinutes = hour * 60 + minutes;
    
    let current: 'asia' | 'europe' | 'us' | 'overnight';
    let openMinutes: number;
    
    // Simplified session detection (UTC-based)
    if (totalMinutes >= 0 && totalMinutes < 480) {      // 00:00-08:00 UTC
      current = 'asia';
      openMinutes = totalMinutes;
    } else if (totalMinutes >= 480 && totalMinutes < 960) { // 08:00-16:00 UTC
      current = 'europe';
      openMinutes = totalMinutes - 480;
    } else if (totalMinutes >= 960 && totalMinutes < 1320) { // 16:00-22:00 UTC
      current = 'us';
      openMinutes = totalMinutes - 960;
    } else {                                           // 22:00-00:00 UTC
      current = 'overnight';
      openMinutes = totalMinutes - 1320;
    }
    
    // Typical behavior check (simplified)
    const typical = true; // Would implement more sophisticated analysis
    
    return { current, openMinutes, typical };
  }
  
  private analyzeMarketStructure(history: MarketDataOHLC[]): MarketStateMetrics['structure'] {
    if (history.length < 10) {
      return {
        higherHighs: false,
        higherLows: false,
        lowerHighs: false,
        lowerLows: false,
        keyLevel: null,
        levelType: null
      };
    }
    
    const recentData = history.slice(-10);
    const highs = recentData.map(d => d.high);
    const lows = recentData.map(d => d.low);
    
    // Check for higher highs/lows pattern
    const recentHighs = highs.slice(-3);
    const recentLows = lows.slice(-3);
    
    const higherHighs = recentHighs.every((high, i) => i === 0 || high > recentHighs[i - 1]);
    const higherLows = recentLows.every((low, i) => i === 0 || low > recentLows[i - 1]);
    const lowerHighs = recentHighs.every((high, i) => i === 0 || high < recentHighs[i - 1]);
    const lowerLows = recentLows.every((low, i) => i === 0 || low < recentLows[i - 1]);
    
    // Find nearest key level (simplified)
    const currentPrice = history[history.length - 1].close;
    const allHighs = history.map(d => d.high);
    const allLows = history.map(d => d.low);
    
    const nearestHigh = allHighs.reduce((prev, curr) => 
      Math.abs(curr - currentPrice) < Math.abs(prev - currentPrice) ? curr : prev
    );
    const nearestLow = allLows.reduce((prev, curr) => 
      Math.abs(curr - currentPrice) < Math.abs(prev - currentPrice) ? curr : prev
    );
    
    const keyLevel = Math.abs(nearestHigh - currentPrice) < Math.abs(nearestLow - currentPrice) 
      ? nearestHigh : nearestLow;
    const levelType = keyLevel === nearestHigh ? 'resistance' : 'support';
    
    return {
      higherHighs,
      higherLows,
      lowerHighs,
      lowerLows,
      keyLevel,
      levelType
    };
  }
  
  private determineStateFromMetrics(metrics: MarketStateMetrics): EnhancedMarketState {
    const { trend, volume, volatility, range, session, structure } = metrics;
    
    // Session-based states first
    if (session.openMinutes < 30) {
      return EnhancedMarketState.OPENING_VOLATILITY;
    }
    
    if (session.current === 'us' && session.openMinutes > 300) {
      return EnhancedMarketState.POWER_HOUR;
    }
    
    if (session.current === 'overnight') {
      return EnhancedMarketState.OVERNIGHT_DRIFT;
    }
    
    // Squeeze detection
    if (range.rangeContraction && volatility.current < volatility.average20 * 0.7) {
      return EnhancedMarketState.SQUEEZE_FORMING;
    }
    
    // Climax states
    if (volume.relativeVolume > 2.0 && volatility.volatilityRank > 90) {
      if (trend.direction === 'up') return EnhancedMarketState.CLIMAX_BUYING;
      if (trend.direction === 'down') return EnhancedMarketState.CLIMAX_SELLING;
    }
    
    // Whipsaw detection
    if (trend.consistency < 30 && volatility.volatilityRank > 80) {
      return EnhancedMarketState.WHIPSAW_ZONE;
    }
    
    // Breakout states
    if (range.rangeExpansion && volume.relativeVolume > 1.5) {
      if (trend.direction === 'up') {
        return volume.relativeVolume > 2.0 
          ? EnhancedMarketState.BULLISH_BREAKOUT_CONFIRMED 
          : EnhancedMarketState.BULLISH_BREAKOUT_WEAK;
      } else if (trend.direction === 'down') {
        return volume.relativeVolume > 2.0 
          ? EnhancedMarketState.BEARISH_BREAKOUT_CONFIRMED 
          : EnhancedMarketState.BEARISH_BREAKOUT_WEAK;
      }
    }
    
    // Reversal states
    if ((structure.higherLows && trend.direction === 'down') || 
        (structure.lowerHighs && trend.direction === 'up')) {
      if (volume.volumeProfile !== 'neutral') {
        return trend.direction === 'down' 
          ? EnhancedMarketState.BULLISH_REVERSAL_CONFIRMED
          : EnhancedMarketState.BEARISH_REVERSAL_CONFIRMED;
      } else {
        return trend.direction === 'down' 
          ? EnhancedMarketState.BULLISH_REVERSAL_FORMING
          : EnhancedMarketState.BEARISH_REVERSAL_FORMING;
      }
    }
    
    // Trending states
    if (trend.direction === 'up') {
      const isStrong = trend.strength > 50 && trend.consistency > 70;
      const isHighVol = volume.relativeVolume > 1.2;
      
      if (isStrong && isHighVol) return EnhancedMarketState.STRONG_UPTREND_HIGH_VOL;
      if (isStrong && !isHighVol) return EnhancedMarketState.STRONG_UPTREND_LOW_VOL;
      if (!isStrong && isHighVol) return EnhancedMarketState.WEAK_UPTREND_HIGH_VOL;
      return EnhancedMarketState.WEAK_UPTREND_LOW_VOL;
    }
    
    if (trend.direction === 'down') {
      const isStrong = trend.strength > 50 && trend.consistency > 70;
      const isHighVol = volume.relativeVolume > 1.2;
      
      if (isStrong && isHighVol) return EnhancedMarketState.STRONG_DOWNTREND_HIGH_VOL;
      if (isStrong && !isHighVol) return EnhancedMarketState.STRONG_DOWNTREND_LOW_VOL;
      if (!isStrong && isHighVol) return EnhancedMarketState.WEAK_DOWNTREND_HIGH_VOL;
      return EnhancedMarketState.WEAK_DOWNTREND_LOW_VOL;
    }
    
    // Ranging states
    const isTightRange = range.current < range.average * 0.8;
    const isHighVol = volume.relativeVolume > 1.2;
    
    if (isTightRange && isHighVol) return EnhancedMarketState.TIGHT_RANGE_HIGH_VOL;
    if (isTightRange && !isHighVol) return EnhancedMarketState.TIGHT_RANGE_LOW_VOL;
    if (!isTightRange && isHighVol) return EnhancedMarketState.WIDE_RANGE_HIGH_VOL;
    return EnhancedMarketState.WIDE_RANGE_LOW_VOL;
  }
  
  // Helper functions
  private calculateSMA(values: number[], period: number): number[] {
    const result = [];
    for (let i = period - 1; i < values.length; i++) {
      const sum = values.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0);
      result.push(sum / period);
    }
    return result;
  }
  
  private calculateEMA(values: number[], period: number): number[] {
    const multiplier = 2 / (period + 1);
    const result = [values[0]]; // Start with first value
    
    for (let i = 1; i < values.length; i++) {
      result.push((values[i] * multiplier) + (result[i - 1] * (1 - multiplier)));
    }
    return result;
  }
  
  private getPriceDirection(price: number, reference: number): 'up' | 'down' | 'sideways' {
    const threshold = 0.001; // 0.1% threshold
    if (price > reference * (1 + threshold)) return 'up';
    if (price < reference * (1 - threshold)) return 'down';
    return 'sideways';
  }
}

export const enhancedMarketStateClassifier = new EnhancedMarketStateClassifier();
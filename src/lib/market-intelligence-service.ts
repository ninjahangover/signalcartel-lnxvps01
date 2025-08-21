import { realMarketData } from './real-market-data';

export interface MarketDataPoint {
  timestamp: Date;
  symbol: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  price: number;
}

export interface TechnicalPattern {
  pattern: string;
  confidence: number;
  signal: 'bullish' | 'bearish' | 'neutral';
  timeframe: string;
  detectedAt: Date;
  description: string;
}

export interface MarketMomentum {
  symbol: string;
  timeframe: '1h' | '4h' | '1d' | '7d';
  momentum: number; // -1 to 1 scale
  volume_trend: 'increasing' | 'decreasing' | 'stable';
  price_velocity: number; // % change per hour
  volatility: number; // standard deviation
  support_level: number;
  resistance_level: number;
  trend_strength: number; // 0-100
}

export interface MarketRegime {
  regime: 'trending_up' | 'trending_down' | 'sideways' | 'volatile' | 'breakout';
  confidence: number;
  duration_hours: number;
  key_levels: {
    support: number[];
    resistance: number[];
    pivot: number;
  };
  volume_profile: 'high' | 'medium' | 'low';
  volatility_level: 'high' | 'medium' | 'low';
}

export interface MarketIntelligenceData {
  symbol: string;
  captureStartTime: Date;
  captureEndTime: Date;
  dataPoints: MarketDataPoint[];
  patterns: TechnicalPattern[];
  momentum: MarketMomentum;
  regime: MarketRegime;
  predictiveSignals: {
    next_1h: 'bullish' | 'bearish' | 'neutral';
    next_4h: 'bullish' | 'bearish' | 'neutral';
    next_24h: 'bullish' | 'bearish' | 'neutral';
    confidence: number;
  };
  tradingAdjustments: {
    position_sizing: number; // multiplier 0.5-2.0
    stop_loss_adjustment: number; // percentage adjustment
    take_profit_adjustment: number; // percentage adjustment
    entry_timing: 'immediate' | 'wait_pullback' | 'wait_breakout';
  };
}

class MarketIntelligenceService {
  private static instance: MarketIntelligenceService | null = null;
  private dataStore: Map<string, MarketIntelligenceData> = new Map();
  private captureIntervals: Map<string, NodeJS.Timeout> = new Map();
  private readonly CAPTURE_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days
  private readonly DATA_POINT_INTERVAL = 5 * 60 * 1000; // 5 minutes

  static getInstance(): MarketIntelligenceService {
    if (!MarketIntelligenceService.instance) {
      MarketIntelligenceService.instance = new MarketIntelligenceService();
    }
    return MarketIntelligenceService.instance;
  }

  // Start capturing market data for a symbol
  async startMarketCapture(symbol: string): Promise<void> {
    console.log(`📊 Starting 7-day market intelligence capture for ${symbol}`);
    
    // Initialize data structure
    const intelligenceData: MarketIntelligenceData = {
      symbol,
      captureStartTime: new Date(),
      captureEndTime: new Date(Date.now() + this.CAPTURE_DURATION),
      dataPoints: [],
      patterns: [],
      momentum: await this.calculateInitialMomentum(symbol),
      regime: await this.detectMarketRegime(symbol, []),
      predictiveSignals: {
        next_1h: 'neutral',
        next_4h: 'neutral',
        next_24h: 'neutral',
        confidence: 0.5
      },
      tradingAdjustments: {
        position_sizing: 1.0,
        stop_loss_adjustment: 0,
        take_profit_adjustment: 0,
        entry_timing: 'immediate'
      }
    };

    this.dataStore.set(symbol, intelligenceData);

    // Start data collection interval
    const interval = setInterval(async () => {
      await this.captureDataPoint(symbol);
    }, this.DATA_POINT_INTERVAL);

    this.captureIntervals.set(symbol, interval);

    // Initial data capture
    await this.captureDataPoint(symbol);
  }

  // Capture a single market data point
  private async captureDataPoint(symbol: string): Promise<void> {
    try {
      const intelligence = this.dataStore.get(symbol);
      if (!intelligence) return;

      // Get current market data
      const currentPrice = await realMarketData.getCurrentPrice(symbol);
      
      // Simulate OHLCV data (in production, you'd get this from a proper API)
      const dataPoint: MarketDataPoint = {
        timestamp: new Date(),
        symbol,
        open: currentPrice * (0.999 + Math.random() * 0.002), // ±0.1%
        high: currentPrice * (1.001 + Math.random() * 0.004), // +0.1% to +0.5%
        low: currentPrice * (0.999 - Math.random() * 0.004), // -0.1% to -0.5%
        close: currentPrice,
        volume: Math.floor(1000000 + Math.random() * 5000000), // Simulated volume
        price: currentPrice
      };

      intelligence.dataPoints.push(dataPoint);

      // Keep only last 7 days of data
      const sevenDaysAgo = new Date(Date.now() - this.CAPTURE_DURATION);
      intelligence.dataPoints = intelligence.dataPoints.filter(
        dp => dp.timestamp > sevenDaysAgo
      );

      // Update analysis every hour or when we have enough data
      if (intelligence.dataPoints.length % 12 === 0) { // Every hour (12 * 5min intervals)
        await this.updateMarketAnalysis(symbol);
      }

    } catch (error) {
      console.error(`Error capturing data point for ${symbol}:`, error);
    }
  }

  // Update comprehensive market analysis
  private async updateMarketAnalysis(symbol: string): Promise<void> {
    const intelligence = this.dataStore.get(symbol);
    if (!intelligence || intelligence.dataPoints.length < 20) return;

    console.log(`🧠 Updating market intelligence for ${symbol} with ${intelligence.dataPoints.length} data points`);

    // Update patterns
    intelligence.patterns = await this.detectTechnicalPatterns(intelligence.dataPoints);
    
    // Update momentum
    intelligence.momentum = await this.calculateMarketMomentum(symbol, intelligence.dataPoints);
    
    // Update market regime
    intelligence.regime = await this.detectMarketRegime(symbol, intelligence.dataPoints);
    
    // Generate predictive signals
    intelligence.predictiveSignals = await this.generatePredictiveSignals(intelligence);
    
    // Calculate trading adjustments
    intelligence.tradingAdjustments = await this.calculateTradingAdjustments(intelligence);

    console.log(`📈 Market Intelligence Update for ${symbol}:`, {
      regime: intelligence.regime.regime,
      momentum: intelligence.momentum.momentum.toFixed(3),
      patterns: intelligence.patterns.length,
      next_1h_signal: intelligence.predictiveSignals.next_1h,
      position_sizing: intelligence.tradingAdjustments.position_sizing
    });
  }

  // Detect technical patterns
  private async detectTechnicalPatterns(dataPoints: MarketDataPoint[]): Promise<TechnicalPattern[]> {
    const patterns: TechnicalPattern[] = [];
    
    if (dataPoints.length < 50) return patterns;

    const prices = dataPoints.map(dp => dp.close);
    const volumes = dataPoints.map(dp => dp.volume);
    
    // Moving Average Crossovers
    const sma20 = this.calculateSMA(prices, 20);
    const sma50 = this.calculateSMA(prices, 50);
    
    if (sma20.length >= 2 && sma50.length >= 2) {
      const currentSMA20 = sma20[sma20.length - 1];
      const currentSMA50 = sma50[sma50.length - 1];
      const prevSMA20 = sma20[sma20.length - 2];
      const prevSMA50 = sma50[sma50.length - 2];
      
      if (prevSMA20 <= prevSMA50 && currentSMA20 > currentSMA50) {
        patterns.push({
          pattern: 'Golden Cross',
          confidence: 0.8,
          signal: 'bullish',
          timeframe: '1h',
          detectedAt: new Date(),
          description: 'SMA20 crossed above SMA50 - bullish momentum'
        });
      }
      
      if (prevSMA20 >= prevSMA50 && currentSMA20 < currentSMA50) {
        patterns.push({
          pattern: 'Death Cross',
          confidence: 0.8,
          signal: 'bearish',
          timeframe: '1h',
          detectedAt: new Date(),
          description: 'SMA20 crossed below SMA50 - bearish momentum'
        });
      }
    }

    // RSI Divergence
    const rsi = this.calculateRSI(prices, 14);
    if (rsi.length >= 20) {
      const recentRSI = rsi.slice(-20);
      const recentPrices = prices.slice(-20);
      
      if (this.detectDivergence(recentPrices, recentRSI)) {
        patterns.push({
          pattern: 'RSI Divergence',
          confidence: 0.7,
          signal: recentRSI[recentRSI.length - 1] > 70 ? 'bearish' : 'bullish',
          timeframe: '4h',
          detectedAt: new Date(),
          description: 'Price and RSI showing divergence - potential reversal'
        });
      }
    }

    // Volume Breakout
    const avgVolume = volumes.slice(-20).reduce((sum, v) => sum + v, 0) / 20;
    const currentVolume = volumes[volumes.length - 1];
    
    if (currentVolume > avgVolume * 2) {
      const priceChange = (prices[prices.length - 1] - prices[prices.length - 2]) / prices[prices.length - 2];
      
      patterns.push({
        pattern: 'Volume Breakout',
        confidence: 0.75,
        signal: priceChange > 0 ? 'bullish' : 'bearish',
        timeframe: '1h',
        detectedAt: new Date(),
        description: `High volume ${priceChange > 0 ? 'buying' : 'selling'} pressure detected`
      });
    }

    // Support/Resistance Breaks
    const supportResistance = this.findSupportResistanceLevels(prices);
    const currentPrice = prices[prices.length - 1];
    
    for (const level of supportResistance.resistance) {
      if (currentPrice > level && prices[prices.length - 2] <= level) {
        patterns.push({
          pattern: 'Resistance Breakout',
          confidence: 0.65,
          signal: 'bullish',
          timeframe: '1h',
          detectedAt: new Date(),
          description: `Price broke above resistance at $${level.toFixed(2)}`
        });
      }
    }

    return patterns;
  }

  // Calculate market momentum
  private async calculateMarketMomentum(symbol: string, dataPoints: MarketDataPoint[]): Promise<MarketMomentum> {
    const prices = dataPoints.map(dp => dp.close);
    const volumes = dataPoints.map(dp => dp.volume);
    
    // Price velocity (% change per hour)
    const priceVelocity = dataPoints.length >= 12 ? 
      ((prices[prices.length - 1] - prices[prices.length - 12]) / prices[prices.length - 12] * 100) : 0;
    
    // Momentum calculation (-1 to 1)
    const momentum = Math.tanh(priceVelocity / 5); // Normalize to -1 to 1
    
    // Volume trend
    const recentVolumes = volumes.slice(-20);
    const olderVolumes = volumes.slice(-40, -20);
    const avgRecentVolume = recentVolumes.reduce((sum, v) => sum + v, 0) / recentVolumes.length;
    const avgOlderVolume = olderVolumes.reduce((sum, v) => sum + v, 0) / olderVolumes.length;
    
    const volumeTrend = avgRecentVolume > avgOlderVolume * 1.1 ? 'increasing' :
                       avgRecentVolume < avgOlderVolume * 0.9 ? 'decreasing' : 'stable';
    
    // Volatility (standard deviation)
    const returns = prices.slice(1).map((price, i) => (price - prices[i]) / prices[i]);
    const avgReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length;
    const variance = returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / returns.length;
    const volatility = Math.sqrt(variance) * 100;
    
    // Support/Resistance levels
    const supportResistance = this.findSupportResistanceLevels(prices);
    
    // Trend strength
    const trendStrength = Math.min(Math.abs(momentum) * 100, 100);

    return {
      symbol,
      timeframe: '7d',
      momentum,
      volume_trend: volumeTrend,
      price_velocity: priceVelocity,
      volatility,
      support_level: supportResistance.support[0] || prices[prices.length - 1] * 0.95,
      resistance_level: supportResistance.resistance[0] || prices[prices.length - 1] * 1.05,
      trend_strength: trendStrength
    };
  }

  // Detect market regime
  private async detectMarketRegime(symbol: string, dataPoints: MarketDataPoint[]): Promise<MarketRegime> {
    if (dataPoints.length < 20) {
      return {
        regime: 'sideways',
        confidence: 0.5,
        duration_hours: 0,
        key_levels: { support: [], resistance: [], pivot: 0 },
        volume_profile: 'medium',
        volatility_level: 'medium'
      };
    }

    const prices = dataPoints.map(dp => dp.close);
    const volumes = dataPoints.map(dp => dp.volume);
    
    // Calculate price trend
    const priceChange = (prices[prices.length - 1] - prices[0]) / prices[0];
    const trendStrength = Math.abs(priceChange);
    
    // Volatility analysis
    const returns = prices.slice(1).map((price, i) => (price - prices[i]) / prices[i]);
    const volatility = Math.sqrt(returns.reduce((sum, r) => sum + r * r, 0) / returns.length);
    
    // Volume analysis
    const avgVolume = volumes.reduce((sum, v) => sum + v, 0) / volumes.length;
    const recentAvgVolume = volumes.slice(-12).reduce((sum, v) => sum + v, 0) / 12;
    
    let regime: MarketRegime['regime'];
    let confidence: number;
    
    if (trendStrength > 0.05 && priceChange > 0) {
      regime = 'trending_up';
      confidence = Math.min(trendStrength * 10, 0.95);
    } else if (trendStrength > 0.05 && priceChange < 0) {
      regime = 'trending_down';
      confidence = Math.min(trendStrength * 10, 0.95);
    } else if (volatility > 0.03) {
      regime = 'volatile';
      confidence = Math.min(volatility * 20, 0.9);
    } else if (recentAvgVolume > avgVolume * 1.5 && trendStrength > 0.02) {
      regime = 'breakout';
      confidence = 0.8;
    } else {
      regime = 'sideways';
      confidence = 0.6;
    }

    const supportResistance = this.findSupportResistanceLevels(prices);
    const pivot = (Math.max(...prices) + Math.min(...prices)) / 2;

    return {
      regime,
      confidence,
      duration_hours: dataPoints.length * 5 / 60, // 5-minute intervals to hours
      key_levels: {
        support: supportResistance.support.slice(0, 3),
        resistance: supportResistance.resistance.slice(0, 3),
        pivot
      },
      volume_profile: recentAvgVolume > avgVolume * 1.2 ? 'high' : 
                     recentAvgVolume < avgVolume * 0.8 ? 'low' : 'medium',
      volatility_level: volatility > 0.03 ? 'high' : 
                       volatility < 0.01 ? 'low' : 'medium'
    };
  }

  // Generate predictive signals
  private async generatePredictiveSignals(intelligence: MarketIntelligenceData): Promise<MarketIntelligenceData['predictiveSignals']> {
    const { patterns, momentum, regime } = intelligence;
    
    // Weight different factors
    let bullishScore = 0;
    let bearishScore = 0;
    
    // Pattern-based signals
    patterns.forEach(pattern => {
      const weight = pattern.confidence;
      if (pattern.signal === 'bullish') bullishScore += weight;
      if (pattern.signal === 'bearish') bearishScore += weight;
    });
    
    // Momentum-based signals
    if (momentum.momentum > 0.3) bullishScore += 0.6;
    if (momentum.momentum < -0.3) bearishScore += 0.6;
    if (momentum.volume_trend === 'increasing') bullishScore += 0.3;
    
    // Regime-based signals
    if (regime.regime === 'trending_up') bullishScore += regime.confidence;
    if (regime.regime === 'trending_down') bearishScore += regime.confidence;
    if (regime.regime === 'breakout' && momentum.momentum > 0) bullishScore += 0.5;
    
    const totalScore = bullishScore + bearishScore;
    const confidence = Math.min(totalScore, 1.0);
    
    const signal = bullishScore > bearishScore ? 'bullish' : 
                  bearishScore > bullishScore ? 'bearish' : 'neutral';

    return {
      next_1h: signal,
      next_4h: signal, // For now, same signal across timeframes
      next_24h: momentum.trend_strength > 70 ? signal : 'neutral',
      confidence
    };
  }

  // Calculate trading adjustments based on analysis
  private async calculateTradingAdjustments(intelligence: MarketIntelligenceData): Promise<MarketIntelligenceData['tradingAdjustments']> {
    const { momentum, regime, predictiveSignals } = intelligence;
    
    // Position sizing based on confidence and volatility
    let positionSizing = 1.0;
    if (predictiveSignals.confidence > 0.8) {
      positionSizing = 1.5; // Increase position size for high-confidence signals
    } else if (predictiveSignals.confidence < 0.4) {
      positionSizing = 0.5; // Reduce position size for low-confidence signals
    }
    
    // Adjust for volatility
    if (regime.volatility_level === 'high') {
      positionSizing *= 0.7; // Reduce size in high volatility
    } else if (regime.volatility_level === 'low') {
      positionSizing *= 1.2; // Increase size in low volatility
    }
    
    // Stop loss adjustment based on volatility
    const stopLossAdjustment = regime.volatility_level === 'high' ? 2.0 : 
                              regime.volatility_level === 'low' ? 0.5 : 0;
    
    // Take profit adjustment based on trend strength
    const takeProfitAdjustment = momentum.trend_strength > 70 ? 1.5 : 
                                momentum.trend_strength < 30 ? -0.5 : 0;
    
    // Entry timing based on regime and momentum
    let entryTiming: 'immediate' | 'wait_pullback' | 'wait_breakout' = 'immediate';
    
    if (regime.regime === 'trending_up' && momentum.momentum > 0.5) {
      entryTiming = 'wait_pullback'; // Wait for pullback in strong uptrend
    } else if (regime.regime === 'sideways' && predictiveSignals.confidence > 0.7) {
      entryTiming = 'wait_breakout'; // Wait for breakout in sideways market
    }

    return {
      position_sizing: Math.max(0.1, Math.min(2.0, positionSizing)),
      stop_loss_adjustment: stopLossAdjustment,
      take_profit_adjustment: takeProfitAdjustment,
      entry_timing: entryTiming
    };
  }

  // Technical analysis helper functions
  private calculateSMA(prices: number[], period: number): number[] {
    const sma: number[] = [];
    for (let i = period - 1; i < prices.length; i++) {
      const sum = prices.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0);
      sma.push(sum / period);
    }
    return sma;
  }

  private calculateRSI(prices: number[], period: number): number[] {
    const rsi: number[] = [];
    const changes = prices.slice(1).map((price, i) => price - prices[i]);
    
    for (let i = period; i < changes.length; i++) {
      const periodChanges = changes.slice(i - period, i);
      const gains = periodChanges.filter(c => c > 0).reduce((sum, c) => sum + c, 0) / period;
      const losses = Math.abs(periodChanges.filter(c => c < 0).reduce((sum, c) => sum + c, 0)) / period;
      
      const rs = gains / (losses || 0.01);
      rsi.push(100 - (100 / (1 + rs)));
    }
    
    return rsi;
  }

  private detectDivergence(prices: number[], indicator: number[]): boolean {
    if (prices.length < 10 || indicator.length < 10) return false;
    
    const priceSlope = (prices[prices.length - 1] - prices[0]) / prices.length;
    const indicatorSlope = (indicator[indicator.length - 1] - indicator[0]) / indicator.length;
    
    // Divergence when price and indicator move in opposite directions
    return (priceSlope > 0 && indicatorSlope < 0) || (priceSlope < 0 && indicatorSlope > 0);
  }

  private findSupportResistanceLevels(prices: number[]): { support: number[], resistance: number[] } {
    const support: number[] = [];
    const resistance: number[] = [];
    
    // Simple pivot point detection
    for (let i = 2; i < prices.length - 2; i++) {
      const current = prices[i];
      const left1 = prices[i - 1];
      const left2 = prices[i - 2];
      const right1 = prices[i + 1];
      const right2 = prices[i + 2];
      
      // Resistance (local high)
      if (current > left1 && current > left2 && current > right1 && current > right2) {
        resistance.push(current);
      }
      
      // Support (local low)
      if (current < left1 && current < left2 && current < right1 && current < right2) {
        support.push(current);
      }
    }
    
    return {
      support: support.sort((a, b) => b - a), // Highest support first
      resistance: resistance.sort((a, b) => a - b) // Lowest resistance first
    };
  }

  // Public API methods
  
  // Get market intelligence for a symbol
  getMarketIntelligence(symbol: string): MarketIntelligenceData | null {
    return this.dataStore.get(symbol) || null;
  }

  // Get trading adjustments for a symbol
  getTradingAdjustments(symbol: string): MarketIntelligenceData['tradingAdjustments'] | null {
    const intelligence = this.dataStore.get(symbol);
    return intelligence?.tradingAdjustments || null;
  }

  // Get predictive signals
  getPredictiveSignals(symbol: string): MarketIntelligenceData['predictiveSignals'] | null {
    const intelligence = this.dataStore.get(symbol);
    return intelligence?.predictiveSignals || null;
  }

  // Stop market capture for a symbol
  stopMarketCapture(symbol: string): void {
    const interval = this.captureIntervals.get(symbol);
    if (interval) {
      clearInterval(interval);
      this.captureIntervals.delete(symbol);
      console.log(`⏹️ Stopped market intelligence capture for ${symbol}`);
    }
  }

  // Get all active captures
  getActiveCaptureSymbols(): string[] {
    return Array.from(this.captureIntervals.keys());
  }

  // Calculate initial momentum for new captures
  private async calculateInitialMomentum(symbol: string): Promise<MarketMomentum> {
    const currentPrice = await realMarketData.getCurrentPrice(symbol);
    
    return {
      symbol,
      timeframe: '1h',
      momentum: 0,
      volume_trend: 'stable',
      price_velocity: 0,
      volatility: 0.02,
      support_level: currentPrice * 0.95,
      resistance_level: currentPrice * 1.05,
      trend_strength: 50
    };
  }
}

// Export singleton instance
export const marketIntelligence = MarketIntelligenceService.getInstance();

// Export helper functions
export async function startIntelligenceCapture(symbols: string[]): Promise<void> {
  console.log('🧠 Starting market intelligence capture for symbols:', symbols);
  
  const promises = symbols.map(symbol => 
    marketIntelligence.startMarketCapture(symbol)
  );
  
  await Promise.all(promises);
}

export function getQuickTradingAdjustments(symbol: string): {
  positionSizing: number;
  signal: string;
  confidence: number;
} | null {
  const adjustments = marketIntelligence.getTradingAdjustments(symbol);
  const signals = marketIntelligence.getPredictiveSignals(symbol);
  
  if (!adjustments || !signals) return null;
  
  return {
    positionSizing: adjustments.position_sizing,
    signal: signals.next_1h,
    confidence: signals.confidence
  };
}

// Export types
export type { MarketIntelligenceData, TechnicalPattern, MarketMomentum, MarketRegime };
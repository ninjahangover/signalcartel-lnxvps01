/**
 * Strategy Implementations
 * 
 * Actual trading logic for each strategy type
 * These connect to the unified strategy system and execution engine
 */

import marketDataService, { MarketData } from './market-data-service';

export interface TechnicalIndicators {
  rsi: number[];
  sma20: number[];
  sma50: number[];
  ema20: number[];
  ema50: number[];
  macd: {
    macd: number[];
    signal: number[];
    histogram: number[];
  };
  fibonacciLevels?: {
    level: number;
    price: number;
    type: 'support' | 'resistance';
  }[];
}

export interface StrategyState {
  strategyId: string;
  symbol: string;
  position: 'none' | 'long' | 'short';
  entryPrice: number | null;
  indicators: TechnicalIndicators;
  priceHistory: number[];
  lastSignal: Date | null;
  confirmationBars: number;
}

export interface TradingSignal {
  action: 'BUY' | 'SELL' | 'CLOSE' | 'HOLD';
  confidence: number;
  price: number;
  quantity: number;
  reason: string;
  stopLoss: number;
  takeProfit: number;
  metadata: Record<string, any>;
}

export abstract class BaseStrategy {
  protected state: StrategyState;
  
  constructor(strategyId: string, symbol: string) {
    this.state = {
      strategyId,
      symbol,
      position: 'none',
      entryPrice: null,
      indicators: {
        rsi: [],
        sma20: [],
        sma50: [],
        ema20: [],
        ema50: [],
        macd: {
          macd: [],
          signal: [],
          histogram: []
        }
      },
      priceHistory: [],
      lastSignal: null,
      confirmationBars: 0
    };
  }
  
  abstract analyzeMarket(marketData: MarketData): TradingSignal;
  
  updateIndicators(price: number): void {
    // Add new price to history
    this.state.priceHistory.push(price);
    
    // Keep last 200 bars for calculations
    if (this.state.priceHistory.length > 200) {
      this.state.priceHistory.shift();
    }
    
    // Calculate all indicators
    this.calculateRSI();
    this.calculateMovingAverages();
    this.calculateMACD();
  }
  
  protected calculateRSI(period: number = 14): void {
    if (this.state.priceHistory.length < period + 1) return;
    
    const prices = this.state.priceHistory;
    let gains = 0;
    let losses = 0;
    
    // Calculate initial average gain/loss
    for (let i = prices.length - period; i < prices.length; i++) {
      const change = prices[i] - prices[i - 1];
      if (change > 0) {
        gains += change;
      } else {
        losses -= change;
      }
    }
    
    const avgGain = gains / period;
    const avgLoss = losses / period;
    
    if (avgLoss === 0) {
      this.state.indicators.rsi.push(100);
      return;
    }
    
    const rs = avgGain / avgLoss;
    const rsi = 100 - (100 / (1 + rs));
    
    this.state.indicators.rsi.push(rsi);
    
    // Keep only last 100 values
    if (this.state.indicators.rsi.length > 100) {
      this.state.indicators.rsi.shift();
    }
  }
  
  protected calculateMovingAverages(): void {
    const prices = this.state.priceHistory;
    
    // SMA 20
    if (prices.length >= 20) {
      const sma20 = prices.slice(-20).reduce((sum, price) => sum + price, 0) / 20;
      this.state.indicators.sma20.push(sma20);
      if (this.state.indicators.sma20.length > 100) {
        this.state.indicators.sma20.shift();
      }
    }
    
    // SMA 50
    if (prices.length >= 50) {
      const sma50 = prices.slice(-50).reduce((sum, price) => sum + price, 0) / 50;
      this.state.indicators.sma50.push(sma50);
      if (this.state.indicators.sma50.length > 100) {
        this.state.indicators.sma50.shift();
      }
    }
    
    // EMA 20
    if (prices.length >= 20) {
      const multiplier = 2 / (20 + 1);
      if (this.state.indicators.ema20.length === 0) {
        // First EMA is SMA
        const sma = prices.slice(-20).reduce((sum, price) => sum + price, 0) / 20;
        this.state.indicators.ema20.push(sma);
      } else {
        const lastEma = this.state.indicators.ema20[this.state.indicators.ema20.length - 1];
        const currentPrice = prices[prices.length - 1];
        const ema = (currentPrice - lastEma) * multiplier + lastEma;
        this.state.indicators.ema20.push(ema);
      }
      
      if (this.state.indicators.ema20.length > 100) {
        this.state.indicators.ema20.shift();
      }
    }
    
    // EMA 50
    if (prices.length >= 50) {
      const multiplier = 2 / (50 + 1);
      if (this.state.indicators.ema50.length === 0) {
        const sma = prices.slice(-50).reduce((sum, price) => sum + price, 0) / 50;
        this.state.indicators.ema50.push(sma);
      } else {
        const lastEma = this.state.indicators.ema50[this.state.indicators.ema50.length - 1];
        const currentPrice = prices[prices.length - 1];
        const ema = (currentPrice - lastEma) * multiplier + lastEma;
        this.state.indicators.ema50.push(ema);
      }
      
      if (this.state.indicators.ema50.length > 100) {
        this.state.indicators.ema50.shift();
      }
    }
  }
  
  protected calculateMACD(fastPeriod: number = 12, slowPeriod: number = 26, signalPeriod: number = 9): void {
    if (this.state.indicators.ema20.length < 2 || this.state.indicators.ema50.length < 2) return;
    
    // Use existing EMAs as approximation for MACD calculation
    const fastEma = this.state.indicators.ema20[this.state.indicators.ema20.length - 1];
    const slowEma = this.state.indicators.ema50[this.state.indicators.ema50.length - 1];
    
    const macdLine = fastEma - slowEma;
    this.state.indicators.macd.macd.push(macdLine);
    
    // Calculate signal line (EMA of MACD)
    if (this.state.indicators.macd.macd.length >= signalPeriod) {
      const macdValues = this.state.indicators.macd.macd.slice(-signalPeriod);
      const signalValue = macdValues.reduce((sum, val) => sum + val, 0) / signalPeriod;
      this.state.indicators.macd.signal.push(signalValue);
      
      // Calculate histogram
      const histogram = macdLine - signalValue;
      this.state.indicators.macd.histogram.push(histogram);
    }
    
    // Keep only last 100 values
    ['macd', 'signal', 'histogram'].forEach(key => {
      if (this.state.indicators.macd[key].length > 100) {
        this.state.indicators.macd[key].shift();
      }
    });
  }
}

export class RSIStrategy extends BaseStrategy {
  private config: {
    rsiPeriod: number;
    oversoldLevel: number;
    overboughtLevel: number;
    confirmationPeriod: number;
    stopLoss: number;
    takeProfit: number;
  };
  
  constructor(strategyId: string, symbol: string, config: any) {
    super(strategyId, symbol);
    this.config = {
      rsiPeriod: config.rsiPeriod || 14,
      oversoldLevel: config.rsiOversold || 30,
      overboughtLevel: config.rsiOverbought || 70,
      confirmationPeriod: config.confirmationPeriod || 2,
      stopLoss: config.stopLoss || 2.0,
      takeProfit: config.takeProfit || 4.0
    };
  }
  
  analyzeMarket(marketData: MarketData): TradingSignal {
    this.updateIndicators(marketData.price);
    
    const rsi = this.state.indicators.rsi;
    const sma20 = this.state.indicators.sma20;
    const sma50 = this.state.indicators.sma50;
    
    if (rsi.length < 2 || sma20.length < 2 || sma50.length < 2) {
      return {
        action: 'HOLD',
        confidence: 0,
        price: marketData.price,
        quantity: 0,
        reason: 'Insufficient data for analysis',
        stopLoss: 0,
        takeProfit: 0,
        metadata: {}
      };
    }
    
    const currentRSI = rsi[rsi.length - 1];
    const currentSMA20 = sma20[sma20.length - 1];
    const currentSMA50 = sma50[sma50.length - 1];
    const price = marketData.price;
    
    // RSI Pullback Strategy Logic
    const oversold = currentRSI <= this.config.oversoldLevel;
    const overbought = currentRSI >= this.config.overboughtLevel;
    const uptrend = currentSMA20 > currentSMA50;
    const downtrend = currentSMA20 < currentSMA50;
    const priceAboveLongMA = price > currentSMA50;
    const priceBelowLongMA = price < currentSMA50;
    
    // Long Entry Conditions
    if (this.state.position === 'none' && oversold && priceAboveLongMA && uptrend) {
      this.state.confirmationBars++;
      
      if (this.state.confirmationBars >= this.config.confirmationPeriod) {
        return {
          action: 'BUY',
          confidence: 0.8,
          price,
          quantity: 0.01,
          reason: `RSI oversold (${currentRSI.toFixed(1)}) + uptrend + price above SMA50`,
          stopLoss: price * (1 - this.config.stopLoss / 100),
          takeProfit: price * (1 + this.config.takeProfit / 100),
          metadata: {
            rsi: currentRSI,
            sma20: currentSMA20,
            sma50: currentSMA50,
            confirmationBars: this.state.confirmationBars
          }
        };
      }
    }
    
    // Short Entry Conditions
    else if (this.state.position === 'none' && overbought && priceBelowLongMA && downtrend) {
      this.state.confirmationBars++;
      
      if (this.state.confirmationBars >= this.config.confirmationPeriod) {
        return {
          action: 'SELL',
          confidence: 0.8,
          price,
          quantity: 0.01,
          reason: `RSI overbought (${currentRSI.toFixed(1)}) + downtrend + price below SMA50`,
          stopLoss: price * (1 + this.config.stopLoss / 100),
          takeProfit: price * (1 - this.config.takeProfit / 100),
          metadata: {
            rsi: currentRSI,
            sma20: currentSMA20,
            sma50: currentSMA50,
            confirmationBars: this.state.confirmationBars
          }
        };
      }
    }
    
    // Exit Conditions
    else if (this.state.position === 'long' && (overbought || price < currentSMA20)) {
      return {
        action: 'CLOSE',
        confidence: 0.9,
        price,
        quantity: 0,
        reason: overbought ? `RSI overbought (${currentRSI.toFixed(1)})` : 'Price below SMA20',
        stopLoss: 0,
        takeProfit: 0,
        metadata: { rsi: currentRSI }
      };
    }
    
    else if (this.state.position === 'short' && (oversold || price > currentSMA20)) {
      return {
        action: 'CLOSE',
        confidence: 0.9,
        price,
        quantity: 0,
        reason: oversold ? `RSI oversold (${currentRSI.toFixed(1)})` : 'Price above SMA20',
        stopLoss: 0,
        takeProfit: 0,
        metadata: { rsi: currentRSI }
      };
    }
    
    // Reset confirmation if conditions not met
    else {
      this.state.confirmationBars = 0;
    }
    
    return {
      action: 'HOLD',
      confidence: 0.3,
      price,
      quantity: 0,
      reason: `RSI: ${currentRSI.toFixed(1)}, trend analysis ongoing`,
      stopLoss: 0,
      takeProfit: 0,
      metadata: { rsi: currentRSI }
    };
  }
}

export class MACDStrategy extends BaseStrategy {
  private config: {
    macdFast: number;
    macdSlow: number;
    macdSignal: number;
    stopLoss: number;
    takeProfit: number;
  };
  
  constructor(strategyId: string, symbol: string, config: any) {
    super(strategyId, symbol);
    this.config = {
      macdFast: config.macdFast || 12,
      macdSlow: config.macdSlow || 26,
      macdSignal: config.macdSignal || 9,
      stopLoss: config.stopLoss || 3.0,
      takeProfit: config.takeProfit || 6.0
    };
  }
  
  analyzeMarket(marketData: MarketData): TradingSignal {
    this.updateIndicators(marketData.price);
    
    const macd = this.state.indicators.macd;
    const price = marketData.price;
    
    if (macd.macd.length < 2 || macd.signal.length < 2 || macd.histogram.length < 2) {
      return {
        action: 'HOLD',
        confidence: 0,
        price,
        quantity: 0,
        reason: 'Insufficient MACD data',
        stopLoss: 0,
        takeProfit: 0,
        metadata: {}
      };
    }
    
    const currentMACD = macd.macd[macd.macd.length - 1];
    const currentSignal = macd.signal[macd.signal.length - 1];
    const currentHistogram = macd.histogram[macd.histogram.length - 1];
    const previousHistogram = macd.histogram[macd.histogram.length - 2];
    
    // MACD Crossover Strategy
    const bullishCrossover = currentHistogram > 0 && previousHistogram <= 0;
    const bearishCrossover = currentHistogram < 0 && previousHistogram >= 0;
    const macdAboveZero = currentMACD > 0;
    const macdBelowZero = currentMACD < 0;
    
    // Long Entry: Bullish crossover above zero line
    if (this.state.position === 'none' && bullishCrossover && macdAboveZero) {
      return {
        action: 'BUY',
        confidence: 0.75,
        price,
        quantity: 0.02,
        reason: `MACD bullish crossover above zero (${currentMACD.toFixed(4)})`,
        stopLoss: price * (1 - this.config.stopLoss / 100),
        takeProfit: price * (1 + this.config.takeProfit / 100),
        metadata: {
          macd: currentMACD,
          signal: currentSignal,
          histogram: currentHistogram
        }
      };
    }
    
    // Short Entry: Bearish crossover below zero line
    else if (this.state.position === 'none' && bearishCrossover && macdBelowZero) {
      return {
        action: 'SELL',
        confidence: 0.75,
        price,
        quantity: 0.02,
        reason: `MACD bearish crossover below zero (${currentMACD.toFixed(4)})`,
        stopLoss: price * (1 + this.config.stopLoss / 100),
        takeProfit: price * (1 - this.config.takeProfit / 100),
        metadata: {
          macd: currentMACD,
          signal: currentSignal,
          histogram: currentHistogram
        }
      };
    }
    
    // Exit Conditions
    else if (this.state.position === 'long' && bearishCrossover) {
      return {
        action: 'CLOSE',
        confidence: 0.8,
        price,
        quantity: 0,
        reason: 'MACD bearish crossover - exit long',
        stopLoss: 0,
        takeProfit: 0,
        metadata: { macd: currentMACD }
      };
    }
    
    else if (this.state.position === 'short' && bullishCrossover) {
      return {
        action: 'CLOSE',
        confidence: 0.8,
        price,
        quantity: 0,
        reason: 'MACD bullish crossover - exit short',
        stopLoss: 0,
        takeProfit: 0,
        metadata: { macd: currentMACD }
      };
    }
    
    return {
      action: 'HOLD',
      confidence: 0.2,
      price,
      quantity: 0,
      reason: `MACD analysis: ${currentMACD.toFixed(4)}, waiting for crossover`,
      stopLoss: 0,
      takeProfit: 0,
      metadata: {
        macd: currentMACD,
        signal: currentSignal,
        histogram: currentHistogram
      }
    };
  }
}

export class FibonacciStrategy extends BaseStrategy {
  private config: {
    fibLevels: number[];
    lookbackPeriod: number;
    stopLoss: number;
    takeProfit: number;
  };
  
  constructor(strategyId: string, symbol: string, config: any) {
    super(strategyId, symbol);
    this.config = {
      fibLevels: config.fibLevels || [0.236, 0.382, 0.5, 0.618, 0.786],
      lookbackPeriod: config.lookbackPeriod || 50,
      stopLoss: config.stopLoss || 2.5,
      takeProfit: config.takeProfit || 5.0
    };
  }
  
  analyzeMarket(marketData: MarketData): TradingSignal {
    this.updateIndicators(marketData.price);
    
    if (this.state.priceHistory.length < this.config.lookbackPeriod) {
      return {
        action: 'HOLD',
        confidence: 0,
        price: marketData.price,
        quantity: 0,
        reason: 'Building price history for Fibonacci analysis',
        stopLoss: 0,
        takeProfit: 0,
        metadata: {}
      };
    }
    
    const prices = this.state.priceHistory.slice(-this.config.lookbackPeriod);
    const high = Math.max(...prices);
    const low = Math.min(...prices);
    const range = high - low;
    const currentPrice = marketData.price;
    
    // Calculate Fibonacci levels
    const fibLevels = this.config.fibLevels.map(level => ({
      level,
      price: high - (range * level),
      type: currentPrice < (high - range * level) ? 'resistance' : 'support'
    }));
    
    this.state.indicators.fibonacciLevels = fibLevels;
    
    // Find nearest Fibonacci level
    const nearestLevel = fibLevels.reduce((nearest, current) => 
      Math.abs(current.price - currentPrice) < Math.abs(nearest.price - currentPrice) 
        ? current 
        : nearest
    );
    
    const distanceToLevel = Math.abs(nearestLevel.price - currentPrice) / currentPrice * 100;
    
    // Strategy: Buy at support, sell at resistance
    if (distanceToLevel < 0.5) { // Within 0.5% of Fibonacci level
      if (nearestLevel.type === 'support' && this.state.position === 'none') {
        return {
          action: 'BUY',
          confidence: 0.7,
          price: currentPrice,
          quantity: 0.015,
          reason: `Price near Fibonacci support ${nearestLevel.level} at ${nearestLevel.price.toFixed(2)}`,
          stopLoss: currentPrice * (1 - this.config.stopLoss / 100),
          takeProfit: currentPrice * (1 + this.config.takeProfit / 100),
          metadata: {
            fibLevel: nearestLevel.level,
            fibPrice: nearestLevel.price,
            distanceToLevel
          }
        };
      }
      
      else if (nearestLevel.type === 'resistance' && this.state.position === 'none') {
        return {
          action: 'SELL',
          confidence: 0.7,
          price: currentPrice,
          quantity: 0.015,
          reason: `Price near Fibonacci resistance ${nearestLevel.level} at ${nearestLevel.price.toFixed(2)}`,
          stopLoss: currentPrice * (1 + this.config.stopLoss / 100),
          takeProfit: currentPrice * (1 - this.config.takeProfit / 100),
          metadata: {
            fibLevel: nearestLevel.level,
            fibPrice: nearestLevel.price,
            distanceToLevel
          }
        };
      }
    }
    
    // Exit conditions based on price moving away from Fibonacci levels
    if (this.state.position !== 'none' && distanceToLevel > 2.0) {
      return {
        action: 'CLOSE',
        confidence: 0.6,
        price: currentPrice,
        quantity: 0,
        reason: 'Price moved away from Fibonacci level',
        stopLoss: 0,
        takeProfit: 0,
        metadata: { distanceToLevel }
      };
    }
    
    return {
      action: 'HOLD',
      confidence: 0.3,
      price: currentPrice,
      quantity: 0,
      reason: `Monitoring Fibonacci levels, nearest: ${nearestLevel.level} (${distanceToLevel.toFixed(2)}% away)`,
      stopLoss: 0,
      takeProfit: 0,
      metadata: {
        nearestFibLevel: nearestLevel.level,
        distanceToLevel
      }
    };
  }
}

export class ClaudeQuantumOscillatorStrategy extends BaseStrategy {
  private config: {
    fastPeriod: number;
    slowPeriod: number;
    signalPeriod: number;
    overboughtLevel: number;
    oversoldLevel: number;
    momentumThreshold: number;
    volumeMultiplier: number;
    stopLoss: number;
    takeProfit: number;
  };
  
  private oscillatorValues: number[] = [];
  private signalLine: number[] = [];
  private momentumValues: number[] = [];
  
  constructor(strategyId: string, symbol: string, config: any) {
    super(strategyId, symbol);
    this.config = {
      fastPeriod: config.fastPeriod || 12,
      slowPeriod: config.slowPeriod || 26,
      signalPeriod: config.signalPeriod || 9,
      overboughtLevel: config.overboughtLevel || 75,
      oversoldLevel: config.oversoldLevel || 25,
      momentumThreshold: config.momentumThreshold || 1.5,
      volumeMultiplier: config.volumeMultiplier || 1.2,
      stopLoss: config.stopLoss || 2.0,
      takeProfit: config.takeProfit || 4.0
    };
  }
  
  analyzeMarket(marketData: MarketData): TradingSignal {
    this.updateIndicators(marketData.price);
    this.updateQuantumOscillator(marketData);
    
    const price = marketData.price;
    
    if (this.oscillatorValues.length < 2 || this.signalLine.length < 2) {
      return {
        action: 'HOLD',
        confidence: 0,
        price,
        quantity: 0,
        reason: 'Building quantum oscillator data',
        stopLoss: 0,
        takeProfit: 0,
        metadata: {}
      };
    }
    
    const currentOsc = this.oscillatorValues[this.oscillatorValues.length - 1];
    const currentSignal = this.signalLine[this.signalLine.length - 1];
    const prevOsc = this.oscillatorValues[this.oscillatorValues.length - 2];
    const prevSignal = this.signalLine[this.signalLine.length - 2];
    
    // Quantum crossover detection
    const bullishCrossover = currentOsc > currentSignal && prevOsc <= prevSignal;
    const bearishCrossover = currentOsc < currentSignal && prevOsc >= prevSignal;
    
    // Volume confirmation
    const volumeConfirmed = !marketData.volume || marketData.volume > (marketData.avgVolume || 0) * this.config.volumeMultiplier;
    
    // Momentum filter
    const momentum = this.momentumValues.length > 0 ? this.momentumValues[this.momentumValues.length - 1] : 0;
    const strongMomentum = Math.abs(momentum) > this.config.momentumThreshold;
    
    // Long Entry: Bullish crossover in oversold region with volume and momentum
    if (this.state.position === 'none' && bullishCrossover && currentOsc < this.config.oversoldLevel && volumeConfirmed && strongMomentum) {
      return {
        action: 'BUY',
        confidence: 0.8,
        price,
        quantity: 0.025,
        reason: `Quantum oscillator bullish crossover in oversold (${currentOsc.toFixed(2)}) with volume/momentum confirmation`,
        stopLoss: price * (1 - this.config.stopLoss / 100),
        takeProfit: price * (1 + this.config.takeProfit / 100),
        metadata: {
          oscillator: currentOsc,
          signal: currentSignal,
          momentum,
          volumeConfirmed
        }
      };
    }
    
    // Short Entry: Bearish crossover in overbought region with volume and momentum
    else if (this.state.position === 'none' && bearishCrossover && currentOsc > this.config.overboughtLevel && volumeConfirmed && strongMomentum) {
      return {
        action: 'SELL',
        confidence: 0.8,
        price,
        quantity: 0.025,
        reason: `Quantum oscillator bearish crossover in overbought (${currentOsc.toFixed(2)}) with volume/momentum confirmation`,
        stopLoss: price * (1 + this.config.stopLoss / 100),
        takeProfit: price * (1 - this.config.takeProfit / 100),
        metadata: {
          oscillator: currentOsc,
          signal: currentSignal,
          momentum,
          volumeConfirmed
        }
      };
    }
    
    // Exit conditions
    else if (this.state.position === 'long' && bearishCrossover) {
      return {
        action: 'CLOSE',
        confidence: 0.9,
        price,
        quantity: 0,
        reason: 'Quantum oscillator bearish crossover - exit long',
        stopLoss: 0,
        takeProfit: 0,
        metadata: { oscillator: currentOsc }
      };
    }
    
    else if (this.state.position === 'short' && bullishCrossover) {
      return {
        action: 'CLOSE',
        confidence: 0.9,
        price,
        quantity: 0,
        reason: 'Quantum oscillator bullish crossover - exit short',
        stopLoss: 0,
        takeProfit: 0,
        metadata: { oscillator: currentOsc }
      };
    }
    
    return {
      action: 'HOLD',
      confidence: 0.3,
      price,
      quantity: 0,
      reason: `Quantum oscillator: ${currentOsc.toFixed(2)}, awaiting crossover`,
      stopLoss: 0,
      takeProfit: 0,
      metadata: { oscillator: currentOsc, signal: currentSignal }
    };
  }
  
  private updateQuantumOscillator(marketData: MarketData): void {
    if (this.state.priceHistory.length < Math.max(this.config.fastPeriod, this.config.slowPeriod)) return;
    
    const prices = this.state.priceHistory;
    
    // Calculate fast and slow EMAs
    const fastEMA = this.calculateEMA(prices, this.config.fastPeriod);
    const slowEMA = this.calculateEMA(prices, this.config.slowPeriod);
    
    // Quantum oscillator = (FastEMA - SlowEMA) / SlowEMA * 100
    const oscillator = ((fastEMA - slowEMA) / slowEMA) * 100;
    this.oscillatorValues.push(oscillator);
    
    // Signal line (EMA of oscillator)
    if (this.oscillatorValues.length >= this.config.signalPeriod) {
      const signal = this.calculateEMA(this.oscillatorValues, this.config.signalPeriod);
      this.signalLine.push(signal);
    }
    
    // Momentum calculation
    if (prices.length >= 5) {
      const momentum = ((prices[prices.length - 1] - prices[prices.length - 5]) / prices[prices.length - 5]) * 100;
      this.momentumValues.push(momentum);
    }
    
    // Keep arrays manageable
    if (this.oscillatorValues.length > 100) this.oscillatorValues.shift();
    if (this.signalLine.length > 100) this.signalLine.shift();
    if (this.momentumValues.length > 100) this.momentumValues.shift();
  }
  
  private calculateEMA(values: number[], period: number): number {
    if (values.length < period) return values[values.length - 1] || 0;
    
    const multiplier = 2 / (period + 1);
    let ema = values.slice(0, period).reduce((sum, val) => sum + val, 0) / period;
    
    for (let i = period; i < values.length; i++) {
      ema = (values[i] * multiplier) + (ema * (1 - multiplier));
    }
    
    return ema;
  }
}

export class BollingerBreakoutEnhancedStrategy extends BaseStrategy {
  private config: {
    smaLength: number;
    stdLength: number;
    ubOffset: number;
    lbOffset: number;
    maxRiskPerTrade: number;
    stopLossATRMultiplier: number;
    takeProfitATRMultiplier: number;
    useRSIFilter: boolean;
    rsiPeriod: number;
    rsiOverbought: number;
    rsiOversold: number;
    useVolFilter: boolean;
    volSMALength: number;
    trendStrengthPeriod: number;
  };
  
  private bollingerBands: {
    upperBand: number[];
    lowerBand: number[];
    smaValue: number[];
  } = {
    upperBand: [],
    lowerBand: [],
    smaValue: []
  };
  
  private atrValues: number[] = [];
  private ema200Values: number[] = [];
  private volumeSMA: number[] = [];
  private longTrailingStop: number = 0;
  private shortTrailingStop: number = 0;
  
  constructor(strategyId: string, symbol: string, config: any) {
    super(strategyId, symbol);
    this.config = {
      smaLength: config.smaLength || 350,
      stdLength: config.stdLength || 350,
      ubOffset: config.ubOffset || 2.5,
      lbOffset: config.lbOffset || 2.5,
      maxRiskPerTrade: config.maxRiskPerTrade || 5.0,
      stopLossATRMultiplier: config.stopLossATRMultiplier || 2.0,
      takeProfitATRMultiplier: config.takeProfitATRMultiplier || 2.0,
      useRSIFilter: config.useRSIFilter !== false,
      rsiPeriod: config.rsiPeriod || 14,
      rsiOverbought: config.rsiOverbought || 70,
      rsiOversold: config.rsiOversold || 30,
      useVolFilter: config.useVolFilter !== false,
      volSMALength: config.volSMALength || 20,
      trendStrengthPeriod: config.trendStrengthPeriod || 200
    };
  }
  
  analyzeMarket(marketData: MarketData): TradingSignal {
    this.updateIndicators(marketData.price);
    this.updateBollingerBands(marketData);
    this.updateATR(marketData);
    this.updateEMA200(marketData.price);
    this.updateVolumeSMA(marketData);
    
    const price = marketData.price;
    
    if (this.state.priceHistory.length < Math.max(this.config.smaLength, this.config.stdLength, this.config.trendStrengthPeriod)) {
      return {
        action: 'HOLD',
        confidence: 0,
        price,
        quantity: 0,
        reason: 'Building Bollinger Band data',
        stopLoss: 0,
        takeProfit: 0,
        metadata: {}
      };
    }
    
    const currentUpperBand = this.bollingerBands.upperBand[this.bollingerBands.upperBand.length - 1];
    const currentLowerBand = this.bollingerBands.lowerBand[this.bollingerBands.lowerBand.length - 1];
    const currentSMA = this.bollingerBands.smaValue[this.bollingerBands.smaValue.length - 1];
    const currentATR = this.atrValues[this.atrValues.length - 1] || 0;
    const currentEMA200 = this.ema200Values[this.ema200Values.length - 1];
    const currentRSI = this.state.indicators.rsi[this.state.indicators.rsi.length - 1] || 50;
    const currentVolSMA = this.volumeSMA[this.volumeSMA.length - 1] || 0;
    
    // Trend filters
    const isBullishTrend = price > currentEMA200;
    const isBearishTrend = price < currentEMA200;
    
    // Crossover detection
    const prevPrice = this.state.priceHistory[this.state.priceHistory.length - 2];
    const prevUpperBand = this.bollingerBands.upperBand[this.bollingerBands.upperBand.length - 2];
    const prevLowerBand = this.bollingerBands.lowerBand[this.bollingerBands.lowerBand.length - 2];
    
    const crossoverUpperBand = price > currentUpperBand && prevPrice <= prevUpperBand;
    const crossunderLowerBand = price < currentLowerBand && prevPrice >= prevLowerBand;
    const crossunderSMA = price < currentSMA && prevPrice >= currentSMA;
    const crossoverSMA = price > currentSMA && prevPrice <= currentSMA;
    
    // Filter conditions
    const rsiFilterLong = !this.config.useRSIFilter || currentRSI > this.config.rsiOversold;
    const rsiFilterShort = !this.config.useRSIFilter || currentRSI < this.config.rsiOverbought;
    const volumeFilter = !this.config.useVolFilter || !marketData.volume || marketData.volume > currentVolSMA;
    
    // Position sizing calculation
    const stopLossDistance = currentATR * this.config.stopLossATRMultiplier;
    const riskPerShare = stopLossDistance;
    const maxShares = Math.floor(this.config.maxRiskPerTrade / riskPerShare);
    const quantity = Math.min(maxShares * 0.001, 0.05); // Convert to reasonable crypto quantities
    
    // Long Entry: Breakout above upper band
    if (this.state.position === 'none' && crossoverUpperBand && isBullishTrend && rsiFilterLong && volumeFilter) {
      const longStopLoss = price - stopLossDistance;
      const longTakeProfit = price + (currentATR * this.config.takeProfitATRMultiplier);
      
      this.longTrailingStop = longStopLoss;
      
      return {
        action: 'BUY',
        confidence: 0.8,
        price,
        quantity,
        reason: `Bollinger breakout above upper band (${currentUpperBand.toFixed(2)}) in bullish trend`,
        stopLoss: longStopLoss,
        takeProfit: longTakeProfit,
        metadata: {
          upperBand: currentUpperBand,
          lowerBand: currentLowerBand,
          sma: currentSMA,
          ema200: currentEMA200,
          rsi: currentRSI,
          atr: currentATR,
          volumeConfirmed: volumeFilter
        }
      };
    }
    
    // Short Entry: Breakout below lower band
    else if (this.state.position === 'none' && crossunderLowerBand && isBearishTrend && rsiFilterShort && volumeFilter) {
      const shortStopLoss = price + stopLossDistance;
      const shortTakeProfit = price - (currentATR * this.config.takeProfitATRMultiplier);
      
      this.shortTrailingStop = shortStopLoss;
      
      return {
        action: 'SELL',
        confidence: 0.8,
        price,
        quantity,
        reason: `Bollinger breakout below lower band (${currentLowerBand.toFixed(2)}) in bearish trend`,
        stopLoss: shortStopLoss,
        takeProfit: shortTakeProfit,
        metadata: {
          upperBand: currentUpperBand,
          lowerBand: currentLowerBand,
          sma: currentSMA,
          ema200: currentEMA200,
          rsi: currentRSI,
          atr: currentATR,
          volumeConfirmed: volumeFilter
        }
      };
    }
    
    // Exit Conditions
    else if (this.state.position === 'long') {
      // Update trailing stop
      this.longTrailingStop = Math.max(this.longTrailingStop, price - stopLossDistance);
      
      if (crossunderSMA) {
        return {
          action: 'CLOSE',
          confidence: 0.9,
          price,
          quantity: 0,
          reason: 'Price crossed under SMA - exit long',
          stopLoss: 0,
          takeProfit: 0,
          metadata: { sma: currentSMA }
        };
      }
    }
    
    else if (this.state.position === 'short') {
      // Update trailing stop
      this.shortTrailingStop = Math.min(this.shortTrailingStop, price + stopLossDistance);
      
      if (crossoverSMA) {
        return {
          action: 'CLOSE',
          confidence: 0.9,
          price,
          quantity: 0,
          reason: 'Price crossed over SMA - exit short',
          stopLoss: 0,
          takeProfit: 0,
          metadata: { sma: currentSMA }
        };
      }
    }
    
    return {
      action: 'HOLD',
      confidence: 0.3,
      price,
      quantity: 0,
      reason: `Monitoring Bollinger bands: ${currentLowerBand.toFixed(2)} < ${price.toFixed(2)} < ${currentUpperBand.toFixed(2)}`,
      stopLoss: 0,
      takeProfit: 0,
      metadata: {
        upperBand: currentUpperBand,
        lowerBand: currentLowerBand,
        sma: currentSMA,
        isBullishTrend,
        isBearishTrend
      }
    };
  }
  
  private updateBollingerBands(marketData: MarketData): void {
    if (this.state.priceHistory.length < Math.max(this.config.smaLength, this.config.stdLength)) return;
    
    const prices = this.state.priceHistory;
    
    // Calculate SMA
    const smaValue = prices.slice(-this.config.smaLength).reduce((sum, p) => sum + p, 0) / this.config.smaLength;
    this.bollingerBands.smaValue.push(smaValue);
    
    // Calculate Standard Deviation
    const stdPrices = prices.slice(-this.config.stdLength);
    const mean = stdPrices.reduce((sum, p) => sum + p, 0) / this.config.stdLength;
    const variance = stdPrices.reduce((sum, p) => sum + Math.pow(p - mean, 2), 0) / this.config.stdLength;
    const stdDev = Math.sqrt(variance);
    
    // Dynamic multiplier based on volatility
    const currentATR = this.atrValues[this.atrValues.length - 1] || stdDev;
    const atr50 = this.atrValues.length >= 50 ? 
      this.atrValues.slice(-50).reduce((sum, atr) => sum + atr, 0) / 50 : currentATR;
    const volatilityRatio = currentATR / atr50;
    const dynamicMultiplier = Math.max(this.config.ubOffset * volatilityRatio, 1.5);
    
    // Calculate bands
    const upperBand = smaValue + (stdDev * dynamicMultiplier);
    const lowerBand = smaValue - (stdDev * dynamicMultiplier);
    
    this.bollingerBands.upperBand.push(upperBand);
    this.bollingerBands.lowerBand.push(lowerBand);
    
    // Keep arrays manageable
    if (this.bollingerBands.upperBand.length > 100) {
      this.bollingerBands.upperBand.shift();
      this.bollingerBands.lowerBand.shift();
      this.bollingerBands.smaValue.shift();
    }
  }
  
  private updateATR(marketData: MarketData): void {
    if (this.state.priceHistory.length < 2) return;
    
    const high = marketData.high || marketData.price;
    const low = marketData.low || marketData.price;
    const prevClose = this.state.priceHistory[this.state.priceHistory.length - 2];
    
    const tr1 = high - low;
    const tr2 = Math.abs(high - prevClose);
    const tr3 = Math.abs(low - prevClose);
    const trueRange = Math.max(tr1, tr2, tr3);
    
    this.atrValues.push(trueRange);
    
    // Calculate ATR (14-period average)
    if (this.atrValues.length >= 14) {
      const atr = this.atrValues.slice(-14).reduce((sum, tr) => sum + tr, 0) / 14;
      this.atrValues[this.atrValues.length - 1] = atr;
    }
    
    if (this.atrValues.length > 100) {
      this.atrValues.shift();
    }
  }
  
  private updateEMA200(price: number): void {
    if (this.state.priceHistory.length < this.config.trendStrengthPeriod) return;
    
    const prices = this.state.priceHistory;
    const multiplier = 2 / (this.config.trendStrengthPeriod + 1);
    
    if (this.ema200Values.length === 0) {
      // Initialize with SMA
      const initialSMA = prices.slice(-this.config.trendStrengthPeriod).reduce((sum, p) => sum + p, 0) / this.config.trendStrengthPeriod;
      this.ema200Values.push(initialSMA);
    } else {
      const prevEMA = this.ema200Values[this.ema200Values.length - 1];
      const newEMA = (price * multiplier) + (prevEMA * (1 - multiplier));
      this.ema200Values.push(newEMA);
    }
    
    if (this.ema200Values.length > 100) {
      this.ema200Values.shift();
    }
  }
  
  private updateVolumeSMA(marketData: MarketData): void {
    if (!marketData.volume) return;
    
    // This would be implemented if we had volume history
    // For now, we'll use a simplified approach
    this.volumeSMA.push(marketData.volume);
    
    if (this.volumeSMA.length > this.config.volSMALength) {
      this.volumeSMA.shift();
    }
  }
}

export class StratusCoreNeuralStrategy extends BaseStrategy {
  private config: {
    neuralLayers: number;
    learningRate: number;
    lookbackWindow: number;
    confidenceThreshold: number;
    adaptationPeriod: number;
    riskMultiplier: number;
    stopLoss: number;
    takeProfit: number;
  };
  
  private neuralWeights: number[][] = [];
  private predictionHistory: number[] = [];
  private adaptationCounter: number = 0;
  private marketRegime: 'trending' | 'ranging' | 'volatile' = 'ranging';
  
  constructor(strategyId: string, symbol: string, config: any) {
    super(strategyId, symbol);
    this.config = {
      neuralLayers: config.neuralLayers || 3,
      learningRate: config.learningRate || 0.01,
      lookbackWindow: config.lookbackWindow || 20,
      confidenceThreshold: config.confidenceThreshold || 0.7,
      adaptationPeriod: config.adaptationPeriod || 50,
      riskMultiplier: config.riskMultiplier || 1.0,
      stopLoss: config.stopLoss || 2.5,
      takeProfit: config.takeProfit || 5.0
    };
    
    this.initializeNeuralNetwork();
  }
  
  analyzeMarket(marketData: MarketData): TradingSignal {
    this.updateIndicators(marketData.price);
    this.updateMarketRegime(marketData);
    
    const price = marketData.price;
    
    if (this.state.priceHistory.length < this.config.lookbackWindow) {
      return {
        action: 'HOLD',
        confidence: 0,
        price,
        quantity: 0,
        reason: 'Neural network learning market patterns',
        stopLoss: 0,
        takeProfit: 0,
        metadata: {}
      };
    }
    
    const prediction = this.generateNeuralPrediction();
    const confidence = this.calculateConfidence(prediction);
    
    // Adapt network periodically
    this.adaptationCounter++;
    if (this.adaptationCounter >= this.config.adaptationPeriod) {
      this.adaptNeuralNetwork();
      this.adaptationCounter = 0;
    }
    
    const rsi = this.state.indicators.rsi[this.state.indicators.rsi.length - 1] || 50;
    const sma20 = this.state.indicators.sma20[this.state.indicators.sma20.length - 1] || price;
    
    // Neural signal with regime-based adjustments
    const regimeMultiplier = this.getRegimeMultiplier();
    const adjustedConfidence = confidence * regimeMultiplier;
    
    // Long Entry: Neural prediction bullish with high confidence
    if (this.state.position === 'none' && prediction > 0.5 && adjustedConfidence > this.config.confidenceThreshold && price > sma20) {
      return {
        action: 'BUY',
        confidence: adjustedConfidence,
        price,
        quantity: 0.02 * this.config.riskMultiplier,
        reason: `Neural network bullish prediction (${(prediction * 100).toFixed(1)}%) in ${this.marketRegime} market`,
        stopLoss: price * (1 - this.config.stopLoss / 100),
        takeProfit: price * (1 + this.config.takeProfit / 100),
        metadata: {
          neuralPrediction: prediction,
          confidence: adjustedConfidence,
          marketRegime: this.marketRegime,
          rsi,
          adaptationCycle: this.adaptationCounter
        }
      };
    }
    
    // Short Entry: Neural prediction bearish with high confidence
    else if (this.state.position === 'none' && prediction < -0.5 && adjustedConfidence > this.config.confidenceThreshold && price < sma20) {
      return {
        action: 'SELL',
        confidence: adjustedConfidence,
        price,
        quantity: 0.02 * this.config.riskMultiplier,
        reason: `Neural network bearish prediction (${(prediction * 100).toFixed(1)}%) in ${this.marketRegime} market`,
        stopLoss: price * (1 + this.config.stopLoss / 100),
        takeProfit: price * (1 - this.config.takeProfit / 100),
        metadata: {
          neuralPrediction: prediction,
          confidence: adjustedConfidence,
          marketRegime: this.marketRegime,
          rsi,
          adaptationCycle: this.adaptationCounter
        }
      };
    }
    
    // Exit based on neural signal reversal
    else if (this.state.position === 'long' && prediction < 0 && adjustedConfidence > 0.6) {
      return {
        action: 'CLOSE',
        confidence: adjustedConfidence,
        price,
        quantity: 0,
        reason: 'Neural network signal reversal - exit long',
        stopLoss: 0,
        takeProfit: 0,
        metadata: { neuralPrediction: prediction }
      };
    }
    
    else if (this.state.position === 'short' && prediction > 0 && adjustedConfidence > 0.6) {
      return {
        action: 'CLOSE',
        confidence: adjustedConfidence,
        price,
        quantity: 0,
        reason: 'Neural network signal reversal - exit short',
        stopLoss: 0,
        takeProfit: 0,
        metadata: { neuralPrediction: prediction }
      };
    }
    
    return {
      action: 'HOLD',
      confidence: adjustedConfidence,
      price,
      quantity: 0,
      reason: `Neural analysis: ${(prediction * 100).toFixed(1)}% (${this.marketRegime} regime)`,
      stopLoss: 0,
      takeProfit: 0,
      metadata: {
        neuralPrediction: prediction,
        confidence: adjustedConfidence,
        marketRegime: this.marketRegime
      }
    };
  }
  
  private initializeNeuralNetwork(): void {
    // Initialize simple feed-forward network weights
    for (let layer = 0; layer < this.config.neuralLayers; layer++) {
      const layerWeights: number[] = [];
      const inputSize = layer === 0 ? this.config.lookbackWindow : 10;
      const outputSize = layer === this.config.neuralLayers - 1 ? 1 : 10;
      
      for (let i = 0; i < inputSize * outputSize; i++) {
        layerWeights.push((Math.random() - 0.5) * 2); // Random weights between -1 and 1
      }
      
      this.neuralWeights.push(layerWeights);
    }
  }
  
  private generateNeuralPrediction(): number {
    const inputs = this.prepareInputFeatures();
    let layerOutput = inputs;
    
    // Forward pass through network
    for (let layer = 0; layer < this.neuralWeights.length; layer++) {
      layerOutput = this.forwardPass(layerOutput, this.neuralWeights[layer]);
    }
    
    const prediction = layerOutput[0]; // Single output neuron
    this.predictionHistory.push(prediction);
    
    // Keep prediction history manageable
    if (this.predictionHistory.length > 100) {
      this.predictionHistory.shift();
    }
    
    return Math.tanh(prediction); // Normalize to [-1, 1]
  }
  
  private prepareInputFeatures(): number[] {
    const prices = this.state.priceHistory.slice(-this.config.lookbackWindow);
    const rsi = this.state.indicators.rsi.slice(-5);
    const sma20 = this.state.indicators.sma20.slice(-5);
    
    // Normalize features
    const normalizedPrices = this.normalizeArray(prices);
    const normalizedRSI = rsi.map(r => (r - 50) / 50); // Center around 0
    const normalizedSMA = this.normalizeArray(sma20);
    
    return [...normalizedPrices, ...normalizedRSI, ...normalizedSMA].slice(0, this.config.lookbackWindow);
  }
  
  private forwardPass(inputs: number[], weights: number[]): number[] {
    const outputs: number[] = [];
    const inputSize = inputs.length;
    const outputSize = weights.length / inputSize;
    
    for (let i = 0; i < outputSize; i++) {
      let sum = 0;
      for (let j = 0; j < inputSize; j++) {
        sum += inputs[j] * weights[i * inputSize + j];
      }
      outputs.push(Math.tanh(sum)); // Activation function
    }
    
    return outputs;
  }
  
  private calculateConfidence(prediction: number): number {
    // Higher confidence for stronger predictions
    return Math.abs(prediction);
  }
  
  private updateMarketRegime(marketData: MarketData): void {
    if (this.state.priceHistory.length < 50) return;
    
    const prices = this.state.priceHistory.slice(-50);
    const returns = [];
    
    for (let i = 1; i < prices.length; i++) {
      returns.push((prices[i] - prices[i - 1]) / prices[i - 1]);
    }
    
    const volatility = this.calculateStandardDeviation(returns);
    const trend = (prices[prices.length - 1] - prices[0]) / prices[0];
    
    if (volatility > 0.02) {
      this.marketRegime = 'volatile';
    } else if (Math.abs(trend) > 0.1) {
      this.marketRegime = 'trending';
    } else {
      this.marketRegime = 'ranging';
    }
  }
  
  private getRegimeMultiplier(): number {
    switch (this.marketRegime) {
      case 'trending': return 1.2;
      case 'volatile': return 0.8;
      case 'ranging': return 1.0;
      default: return 1.0;
    }
  }
  
  private adaptNeuralNetwork(): void {
    // Simple adaptation: adjust weights based on recent prediction accuracy
    if (this.predictionHistory.length < 10) return;
    
    const recentPredictions = this.predictionHistory.slice(-10);
    const accuracy = this.calculatePredictionAccuracy(recentPredictions);
    
    // Adjust learning rate based on accuracy
    const adaptationRate = accuracy < 0.5 ? this.config.learningRate * 2 : this.config.learningRate * 0.5;
    
    // Simple weight adjustment (in real implementation, this would use backpropagation)
    for (let layer = 0; layer < this.neuralWeights.length; layer++) {
      for (let i = 0; i < this.neuralWeights[layer].length; i++) {
        const adjustment = (Math.random() - 0.5) * adaptationRate;
        this.neuralWeights[layer][i] += adjustment;
      }
    }
  }
  
  private calculatePredictionAccuracy(predictions: number[]): number {
    // Simplified accuracy calculation
    return predictions.reduce((sum, pred) => sum + Math.abs(pred), 0) / predictions.length;
  }
  
  private normalizeArray(arr: number[]): number[] {
    const min = Math.min(...arr);
    const max = Math.max(...arr);
    const range = max - min;
    
    if (range === 0) return arr.map(() => 0);
    
    return arr.map(val => (val - min) / range * 2 - 1); // Normalize to [-1, 1]
  }
  
  private calculateStandardDeviation(values: number[]): number {
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const squaredDiffs = values.map(val => Math.pow(val - mean, 2));
    const avgSquaredDiff = squaredDiffs.reduce((sum, val) => sum + val, 0) / values.length;
    return Math.sqrt(avgSquaredDiff);
  }
}

export class EnhancedRSIPullBackStrategy extends BaseStrategy {
  private config: {
    lookback: number;
    lowerBarrier: number;
    lowerThreshold: number;
    upperBarrier: number;
    upperThreshold: number;
    maLength: number;
    atrMultSL: number;
    atrMultTP: number;
    initialCapital: number;
    tradePercentage: number;
  };
  
  private atrValues: number[] = [];
  private volumeHistory: number[] = [];
  
  constructor(strategyId: string, symbol: string, config: any) {
    super(strategyId, symbol);
    this.config = {
      lookback: config.lookback || 5,
      lowerBarrier: config.lowerBarrier || 20,
      lowerThreshold: config.lowerThreshold || 33,
      upperBarrier: config.upperBarrier || 80,
      upperThreshold: config.upperThreshold || 67,
      maLength: config.maLength || 50,
      atrMultSL: config.atrMultSL || 1.5,
      atrMultTP: config.atrMultTP || 2.0,
      initialCapital: config.initialCapital || 50,
      tradePercentage: config.tradePercentage || 20
    };
  }
  
  analyzeMarket(marketData: MarketData): TradingSignal {
    this.updateIndicators(marketData.price);
    this.updateATR(marketData);
    this.updateVolume(marketData);
    
    const price = marketData.price;
    const rsiValues = this.state.indicators.rsi;
    const ma50Values = this.state.indicators.sma50;
    
    if (rsiValues.length < 3 || ma50Values.length < 1 || this.atrValues.length < 1) {
      return {
        action: 'HOLD',
        confidence: 0,
        price,
        quantity: 0,
        reason: 'Building indicator history',
        stopLoss: 0,
        takeProfit: 0,
        metadata: {}
      };
    }
    
    const currentRSI = rsiValues[rsiValues.length - 1];
    const prevRSI = rsiValues[rsiValues.length - 2];
    const prevRSI2 = rsiValues[rsiValues.length - 3];
    const currentMA50 = ma50Values[ma50Values.length - 1];
    const currentATR = this.atrValues[this.atrValues.length - 1];
    
    // Dynamic barrier adjustment based on volume
    let lowerBarrier = this.config.lowerBarrier;
    let upperBarrier = this.config.upperBarrier;
    
    if (this.volumeHistory.length >= 50) {
      const recentVolume = this.volumeHistory.slice(-20).reduce((sum, vol) => sum + vol, 0) / 20;
      const longerVolume = this.volumeHistory.slice(-50).reduce((sum, vol) => sum + vol, 0) / 50;
      
      if (recentVolume > longerVolume) {
        lowerBarrier = 25;
        upperBarrier = 75;
      }
    }
    
    // Calculate trade value and position size
    const tradeValue = (this.config.initialCapital * this.config.tradePercentage) / 100;
    const quantity = tradeValue / price;
    
    // Calculate stop-loss and take-profit levels
    const longSL = price - (currentATR * this.config.atrMultSL);
    const longTP = price + (currentATR * this.config.atrMultTP);
    const shortSL = price + (currentATR * this.config.atrMultSL);
    const shortTP = price - (currentATR * this.config.atrMultTP);
    
    // Buy Signal Logic: RSI pullback from oversold + trend filter
    const buySignal = currentRSI >= lowerBarrier && 
                      currentRSI < prevRSI && 
                      prevRSI > lowerBarrier && 
                      prevRSI < this.config.lowerThreshold && 
                      prevRSI2 < lowerBarrier && 
                      price > currentMA50;
    
    // Sell Signal Logic: RSI pullback from overbought + trend filter  
    const sellSignal = currentRSI <= upperBarrier && 
                       currentRSI > prevRSI && 
                       prevRSI < upperBarrier && 
                       prevRSI > this.config.upperThreshold && 
                       prevRSI2 > upperBarrier && 
                       price < currentMA50;
    
    // Long Entry
    if (this.state.position === 'none' && buySignal) {
      return {
        action: 'BUY',
        confidence: 0.85,
        price,
        quantity: Math.min(quantity, 0.2), // Max 20% position size
        reason: `RSI pullback buy signal: RSI=${currentRSI.toFixed(1)}, above MA50, barriers=${lowerBarrier}`,
        stopLoss: longSL,
        takeProfit: longTP,
        metadata: {
          rsi: currentRSI,
          prevRSI: prevRSI,
          prevRSI2: prevRSI2,
          ma50: currentMA50,
          atr: currentATR,
          dynamicBarriers: { lower: lowerBarrier, upper: upperBarrier }
        }
      };
    }
    
    // Short Entry
    else if (this.state.position === 'none' && sellSignal) {
      return {
        action: 'SELL',
        confidence: 0.85,
        price,
        quantity: Math.min(quantity, 0.2), // Max 20% position size
        reason: `RSI pullback sell signal: RSI=${currentRSI.toFixed(1)}, below MA50, barriers=${upperBarrier}`,
        stopLoss: shortSL,
        takeProfit: shortTP,
        metadata: {
          rsi: currentRSI,
          prevRSI: prevRSI,
          prevRSI2: prevRSI2,
          ma50: currentMA50,
          atr: currentATR,
          dynamicBarriers: { lower: lowerBarrier, upper: upperBarrier }
        }
      };
    }
    
    // Exit conditions are handled by stop-loss/take-profit levels set at entry
    
    return {
      action: 'HOLD',
      confidence: 0.3,
      price,
      quantity: 0,
      reason: `Monitoring RSI pullback: RSI=${currentRSI.toFixed(1)}, barriers=${lowerBarrier}/${upperBarrier}`,
      stopLoss: 0,
      takeProfit: 0,
      metadata: {
        rsi: currentRSI,
        ma50: currentMA50,
        dynamicBarriers: { lower: lowerBarrier, upper: upperBarrier }
      }
    };
  }
  
  private updateATR(marketData: MarketData): void {
    if (this.state.priceHistory.length < 2) return;
    
    const high = marketData.high || marketData.price;
    const low = marketData.low || marketData.price;
    const prevClose = this.state.priceHistory[this.state.priceHistory.length - 2];
    
    const tr1 = high - low;
    const tr2 = Math.abs(high - prevClose);
    const tr3 = Math.abs(low - prevClose);
    const trueRange = Math.max(tr1, tr2, tr3);
    
    this.atrValues.push(trueRange);
    
    // Calculate ATR (14-period average)
    if (this.atrValues.length >= 14) {
      const atr = this.atrValues.slice(-14).reduce((sum, tr) => sum + tr, 0) / 14;
      this.atrValues[this.atrValues.length - 1] = atr;
    }
    
    // Keep only last 100 values
    if (this.atrValues.length > 100) {
      this.atrValues.shift();
    }
  }
  
  private updateVolume(marketData: MarketData): void {
    if (marketData.volume) {
      this.volumeHistory.push(marketData.volume);
      
      // Keep only last 100 values
      if (this.volumeHistory.length > 100) {
        this.volumeHistory.shift();
      }
    }
  }
}

// Strategy Factory
export class StrategyFactory {
  static createStrategy(strategyType: string, strategyId: string, symbol: string, config: any): BaseStrategy {
    // Check for GPU acceleration preference
    const useGPU = config?.useGPU || process.env.ENABLE_GPU_STRATEGIES === 'true';
    
    // GPU strategy imports (only available in Node.js environment, not browser)
    let GPURSIStrategy, GPUBollingerStrategy, GPUNeuralStrategy, GPUQuantumOscillatorStrategy;
    
    if (useGPU && typeof window === 'undefined') {
      try {
        ({ GPURSIStrategy } = require('./gpu-rsi-strategy'));
        ({ GPUBollingerStrategy } = require('./gpu-bollinger-strategy'));
        ({ GPUNeuralStrategy } = require('./gpu-neural-strategy'));
        ({ GPUQuantumOscillatorStrategy } = require('./gpu-quantum-oscillator-strategy'));
      } catch (error) {
        console.log('⚠️  GPU strategies not available, falling back to CPU:', error.message);
      }
    }
    
    switch (strategyType) {
      case 'RSI':
        if (useGPU && GPURSIStrategy) {
          return new GPURSIStrategy(strategyId, symbol, config);
        }
        return new RSIStrategy(strategyId, symbol, config);
      case 'GPU_RSI':
        if (!GPURSIStrategy) throw new Error('GPU RSI strategy not available');
        return new GPURSIStrategy(strategyId, symbol, config);
      case 'ENHANCED_RSI_PULLBACK':
      case 'RSI Pullback Pro':
        if (useGPU && GPURSIStrategy) {
          return new GPURSIStrategy(strategyId, symbol, config);
        }
        return new EnhancedRSIPullBackStrategy(strategyId, symbol, config);
      case 'GPU_ENHANCED_RSI':
        if (!GPURSIStrategy) throw new Error('GPU Enhanced RSI strategy not available');
        return new GPURSIStrategy(strategyId, symbol, config);
      case 'CLAUDE_QUANTUM_OSCILLATOR':
      case 'Claude Quantum Oscillator':
        if (useGPU && GPUQuantumOscillatorStrategy) {
          return new GPUQuantumOscillatorStrategy(strategyId, symbol, config);
        }
        return new ClaudeQuantumOscillatorStrategy(strategyId, symbol, config);
      case 'GPU_QUANTUM_OSCILLATOR':
        if (!GPUQuantumOscillatorStrategy) throw new Error('GPU Quantum Oscillator strategy not available');
        return new GPUQuantumOscillatorStrategy(strategyId, symbol, config);
      case 'STRATUS_CORE_NEURAL':
      case 'Stratus Core Neural':
        if (useGPU && GPUNeuralStrategy) {
          return new GPUNeuralStrategy(strategyId, symbol, config);
        }
        return new StratusCoreNeuralStrategy(strategyId, symbol, config);
      case 'GPU_NEURAL':
        if (!GPUNeuralStrategy) throw new Error('GPU Neural strategy not available');
        return new GPUNeuralStrategy(strategyId, symbol, config);
      case 'BOLLINGER_BREAKOUT_ENHANCED':
      case 'Bollinger Breakout Enhanced':
        if (useGPU && GPUBollingerStrategy) {
          return new GPUBollingerStrategy(strategyId, symbol, config);
        }
        return new BollingerBreakoutEnhancedStrategy(strategyId, symbol, config);
      case 'GPU_BOLLINGER':
        if (!GPUBollingerStrategy) throw new Error('GPU Bollinger strategy not available');
        return new GPUBollingerStrategy(strategyId, symbol, config);
      case 'MACD':
        return new MACDStrategy(strategyId, symbol, config);
      case 'FIBONACCI':
        return new FibonacciStrategy(strategyId, symbol, config);
      default:
        throw new Error(`Unknown strategy type: ${strategyType}`);
    }
  }
}
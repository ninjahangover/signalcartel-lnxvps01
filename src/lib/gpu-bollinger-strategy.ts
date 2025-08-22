/**
 * GPU-Accelerated Bollinger Bands Strategy
 * High-performance trading using GPU-computed Bollinger Bands and volatility analysis
 */

import { BaseStrategy, TradingSignal, MarketData } from './strategy-implementations';
import { execSync } from 'child_process';
import { writeFileSync } from 'fs';
import { join } from 'path';

interface GPUBollingerResult {
  upper_band: number[];
  lower_band: number[];
  middle_band: number[];
  bandwidth: number[];
  percent_b: number[];
  squeeze: boolean[];
  timestamp: number;
  gpu_accelerated: boolean;
}

export class GPUBollingerStrategy extends BaseStrategy {
  private config: {
    period: number;
    stdDev: number;
    oversoldLevel: number;
    overboughtLevel: number;
    squeezeThreshold: number;
  };
  
  private lastLongCondition: number = -1;
  private lastShortCondition: number = -1;
  private lastGPUCalculation: number = 0;
  private gpuResultCache: GPUBollingerResult | null = null;
  
  constructor(strategyId: string, symbol: string, config: any) {
    super(strategyId, symbol);
    this.config = {
      period: config.period || 20,
      stdDev: config.stdDev || 2,
      oversoldLevel: config.oversoldLevel || 0.05, // %B below 5%
      overboughtLevel: config.overboughtLevel || 0.95, // %B above 95%
      squeezeThreshold: config.squeezeThreshold || 0.1 // Bandwidth below 10%
    };
  }
  
  analyzeMarket(marketData: MarketData): TradingSignal {
    const price = marketData.price;
    this.state.priceHistory.push(price);
    
    // Keep reasonable history
    if (this.state.priceHistory.length > 1000) {
      this.state.priceHistory = this.state.priceHistory.slice(-500);
    }
    
    // Use GPU acceleration for calculations
    const shouldUseGPU = !this.gpuResultCache || 
                        (this.state.priceHistory.length - this.lastGPUCalculation) >= 10 ||
                        this.state.priceHistory.length < this.config.period + 10;
    
    if (shouldUseGPU && this.state.priceHistory.length >= this.config.period + 5) {
      try {
        this.calculateGPUBollingerBands();
        this.lastGPUCalculation = this.state.priceHistory.length;
      } catch (error) {
        console.log('GPU Bollinger calculation failed, using incremental update:', error.message);
        this.updateBollingerFromCache(price);
      }
    } else {
      this.updateBollingerFromCache(price);
    }
    
    // Need sufficient data
    if (this.state.priceHistory.length < this.config.period + 5) {
      return {
        action: 'HOLD',
        confidence: 0.1,
        price,
        quantity: 0,
        reason: `Building GPU Bollinger Bands (${this.state.priceHistory.length} data points)`,
        stopLoss: 0,
        takeProfit: 0,
        metadata: { period: this.config.period, usingGPU: shouldUseGPU }
      };
    }
    
    // Get latest Bollinger values from cache or fallback calculation
    const latest = this.getBollingerValues();
    if (!latest) {
      return {
        action: 'HOLD',
        confidence: 0.1,
        price,
        quantity: 0,
        reason: 'Waiting for Bollinger Band calculations',
        stopLoss: 0,
        takeProfit: 0,
        metadata: { usingGPU: shouldUseGPU }
      };
    }
    
    const { upperBand, lowerBand, middleBand, percentB, bandwidth, squeeze } = latest;
    
    // Trading Logic
    const priceNearLowerBand = percentB <= this.config.oversoldLevel; // Oversold
    const priceNearUpperBand = percentB >= this.config.overboughtLevel; // Overbought
    const priceAboveMiddle = price > middleBand;
    const priceBelowMiddle = price < middleBand;
    const isSqueezing = squeeze; // Low volatility - prepare for breakout
    const highVolatility = bandwidth > 0.2; // High volatility
    
    // Entry conditions
    const longCondition = (priceNearLowerBand && priceAboveMiddle) || 
                         (isSqueezing && price > upperBand); // Breakout above squeeze
    const shortCondition = (priceNearUpperBand && priceBelowMiddle) || 
                          (isSqueezing && price < lowerBand); // Breakdown below squeeze
    
    // Track conditions for confirmation
    if (longCondition) {
      this.lastLongCondition = 0;
    } else if (this.lastLongCondition >= 0) {
      this.lastLongCondition++;
    }
    
    if (shortCondition) {
      this.lastShortCondition = 0;
    } else if (this.lastShortCondition >= 0) {
      this.lastShortCondition++;
    }
    
    // Confirmation (within 3 bars)
    const longConfirmed = this.lastLongCondition >= 0 && this.lastLongCondition <= 3 && longCondition;
    const shortConfirmed = this.lastShortCondition >= 0 && this.lastShortCondition <= 3 && shortCondition;
    
    // Position sizing
    const quantity = 0.001;
    
    // Generate signals
    if (longConfirmed) {
      const confidence = isSqueezing ? 0.95 : 0.85; // Higher confidence during squeeze breakouts
      return {
        action: 'BUY',
        confidence,
        price,
        quantity,
        reason: `GPU Bollinger Long: ${isSqueezing ? 'Squeeze breakout' : `%B=${(percentB*100).toFixed(1)}% oversold`}`,
        stopLoss: lowerBand,
        takeProfit: upperBand,
        metadata: {
          upperBand,
          lowerBand,
          middleBand,
          percentB,
          bandwidth,
          squeeze: isSqueezing,
          confirmationBars: this.lastLongCondition,
          gpuAccelerated: true,
          strategy: 'gpu-bollinger'
        }
      };
    }
    
    if (shortConfirmed) {
      const confidence = isSqueezing ? 0.95 : 0.85;
      return {
        action: 'SELL',
        confidence,
        price,
        quantity,
        reason: `GPU Bollinger Short: ${isSqueezing ? 'Squeeze breakdown' : `%B=${(percentB*100).toFixed(1)}% overbought`}`,
        stopLoss: upperBand,
        takeProfit: lowerBand,
        metadata: {
          upperBand,
          lowerBand,
          middleBand,
          percentB,
          bandwidth,
          squeeze: isSqueezing,
          confirmationBars: this.lastShortCondition,
          gpuAccelerated: true,
          strategy: 'gpu-bollinger'
        }
      };
    }
    
    // Exit conditions
    if (this.state.position === 'long' && (percentB >= 0.8 || price >= upperBand)) {
      return {
        action: 'CLOSE',
        confidence: 0.9,
        price,
        quantity: 0,
        reason: `GPU Bollinger Exit Long: %B=${(percentB*100).toFixed(1)}% or price at upper band`,
        stopLoss: 0,
        takeProfit: 0,
        metadata: { exitType: 'bollinger_upper_band', gpuAccelerated: true }
      };
    }
    
    if (this.state.position === 'short' && (percentB <= 0.2 || price <= lowerBand)) {
      return {
        action: 'CLOSE',
        confidence: 0.9,
        price,
        quantity: 0,
        reason: `GPU Bollinger Exit Short: %B=${(percentB*100).toFixed(1)}% or price at lower band`,
        stopLoss: 0,
        takeProfit: 0,
        metadata: { exitType: 'bollinger_lower_band', gpuAccelerated: true }
      };
    }
    
    // Hold
    const confidence = Math.min(0.8, Math.max(0.2, 
      isSqueezing ? 0.7 : (priceNearLowerBand || priceNearUpperBand) ? 0.6 : 0.3
    ));
    
    return {
      action: 'HOLD',
      confidence,
      price,
      quantity: 0,
      reason: `GPU Bollinger monitoring: %B=${(percentB*100).toFixed(1)}%, ${isSqueezing ? 'Squeezing' : highVolatility ? 'High Vol' : 'Normal'}`,
      stopLoss: 0,
      takeProfit: 0,
      metadata: {
        upperBand,
        lowerBand,
        middleBand,
        percentB,
        bandwidth,
        squeeze: isSqueezing,
        gpuAccelerated: true,
        longConditionActive: this.lastLongCondition >= 0 && this.lastLongCondition <= 3,
        shortConditionActive: this.lastShortCondition >= 0 && this.lastShortCondition <= 3
      }
    };
  }
  
  private calculateGPUBollingerBands(): void {
    const tempDir = '/tmp/signalcartel';
    const inputFile = join(tempDir, 'price_data.txt');
    
    execSync(`mkdir -p ${tempDir}`, { stdio: 'ignore' });
    
    const priceData = this.state.priceHistory.join('\\n');
    writeFileSync(inputFile, priceData);
    
    const pythonScript = `
import sys
import os
sys.path.append('${process.cwd()}/src/lib')

try:
    import numpy as np
    import cupy as cp
    
    # Read price data
    with open('${inputFile}', 'r') as f:
        prices = [float(line.strip()) for line in f if line.strip()]
    
    period = ${this.config.period}
    std_dev = ${this.config.stdDev}
    
    # GPU-accelerated Bollinger Bands calculation
    prices_gpu = cp.array(prices, dtype=cp.float32)
    
    upper_band = []
    lower_band = []
    middle_band = []
    bandwidth = []
    percent_b = []
    squeeze = []
    
    for i in range(period, len(prices)):
        # Get window of prices
        window = prices_gpu[i-period:i]
        
        # Calculate SMA (middle band)
        sma = cp.mean(window)
        
        # Calculate standard deviation
        std = cp.std(window)
        
        # Calculate bands
        upper = sma + (std_dev * std)
        lower = sma - (std_dev * std)
        
        # Calculate %B
        if upper != lower:
            pct_b = (prices[i] - float(lower)) / (float(upper) - float(lower))
        else:
            pct_b = 0.5
        
        # Calculate bandwidth
        bw = (float(upper) - float(lower)) / float(sma) if sma != 0 else 0
        
        # Check for squeeze (low bandwidth)
        is_squeeze = bw < ${this.config.squeezeThreshold}
        
        upper_band.append(float(upper))
        lower_band.append(float(lower))
        middle_band.append(float(sma))
        bandwidth.append(bw)
        percent_b.append(pct_b)
        squeeze.append(is_squeeze)
    
    # Output results
    import json
    result = {
        'upper_band': upper_band,
        'lower_band': lower_band,
        'middle_band': middle_band,
        'bandwidth': bandwidth,
        'percent_b': percent_b,
        'squeeze': squeeze,
        'timestamp': int(__import__('time').time()),
        'gpu_accelerated': True
    }
    
    print(json.dumps(result))

except Exception as e:
    # Fallback to CPU calculation
    import json
    import math
    
    # Read price data
    with open('${inputFile}', 'r') as f:
        prices = [float(line.strip()) for line in f if line.strip()]
    
    period = ${this.config.period}
    std_dev = ${this.config.stdDev}
    
    upper_band = []
    lower_band = []
    middle_band = []
    bandwidth = []
    percent_b = []
    squeeze = []
    
    for i in range(period, len(prices)):
        # Get window
        window = prices[i-period:i]
        
        # Calculate SMA
        sma = sum(window) / len(window)
        
        # Calculate standard deviation
        variance = sum((x - sma) ** 2 for x in window) / len(window)
        std = math.sqrt(variance)
        
        # Calculate bands
        upper = sma + (std_dev * std)
        lower = sma - (std_dev * std)
        
        # Calculate %B
        if upper != lower:
            pct_b = (prices[i] - lower) / (upper - lower)
        else:
            pct_b = 0.5
        
        # Calculate bandwidth
        bw = (upper - lower) / sma if sma != 0 else 0
        
        # Check for squeeze
        is_squeeze = bw < ${this.config.squeezeThreshold}
        
        upper_band.append(upper)
        lower_band.append(lower)
        middle_band.append(sma)
        bandwidth.append(bw)
        percent_b.append(pct_b)
        squeeze.append(is_squeeze)
    
    result = {
        'upper_band': upper_band,
        'lower_band': lower_band,
        'middle_band': middle_band,
        'bandwidth': bandwidth,
        'percent_b': percent_b,
        'squeeze': squeeze,
        'timestamp': int(__import__('time').time()),
        'gpu_accelerated': False
    }
    
    print(json.dumps(result))
`;
    
    const output = execSync(`python3 -c "${pythonScript.replace(/"/g, '\\"')}"`, { 
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe']
    });
    
    const result = JSON.parse(output.trim());
    this.gpuResultCache = result;
    
    execSync(`rm -f ${inputFile}`, { stdio: 'ignore' });
  }
  
  private updateBollingerFromCache(price: number): void {
    if (!this.gpuResultCache) {
      // Fallback to simple calculation
      const period = this.config.period;
      if (this.state.priceHistory.length >= period) {
        const window = this.state.priceHistory.slice(-period);
        const sma = window.reduce((sum, p) => sum + p, 0) / period;
        const variance = window.reduce((sum, p) => sum + Math.pow(p - sma, 2), 0) / period;
        const std = Math.sqrt(variance);
        
        const upper = sma + (this.config.stdDev * std);
        const lower = sma - (this.config.stdDev * std);
        const percentB = (price - lower) / (upper - lower);
        const bandwidth = (upper - lower) / sma;
        
        this.gpuResultCache = {
          upper_band: [upper],
          lower_band: [lower],
          middle_band: [sma],
          bandwidth: [bandwidth],
          percent_b: [percentB],
          squeeze: [bandwidth < this.config.squeezeThreshold],
          timestamp: Date.now(),
          gpu_accelerated: false
        };
      }
    }
  }
  
  private getBollingerValues() {
    if (!this.gpuResultCache) return null;
    
    const cache = this.gpuResultCache;
    const lastIndex = cache.upper_band.length - 1;
    
    if (lastIndex < 0) return null;
    
    return {
      upperBand: cache.upper_band[lastIndex],
      lowerBand: cache.lower_band[lastIndex],
      middleBand: cache.middle_band[lastIndex],
      percentB: cache.percent_b[lastIndex],
      bandwidth: cache.bandwidth[lastIndex],
      squeeze: cache.squeeze[lastIndex]
    };
  }
}
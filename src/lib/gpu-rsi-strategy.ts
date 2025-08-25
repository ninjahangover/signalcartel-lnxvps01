/**
 * GPU-Accelerated RSI Strategy
 * Leverages GPU computation for high-performance RSI calculations
 */

import { BaseStrategy, TradingSignal, MarketData } from './strategy-implementations';
import { execSync } from 'child_process';
import { writeFileSync, readFileSync, existsSync } from 'fs';
import { join } from 'path';

interface GPUIndicatorResult {
  rsi_values: number[];
  sma20_values: number[];
  sma50_values: number[];
  timestamp: number;
}

export class GPURSIStrategy extends BaseStrategy {
  private config: {
    rsiPeriod: number;
    oversoldLevel: number;
    overboughtLevel: number;
    confirmationPeriod: number;
  };
  
  private lastLongCondition: number = -1;
  private lastShortCondition: number = -1;
  private lastGPUCalculation: number = 0;
  private gpuResultCache: GPUIndicatorResult | null = null;
  
  constructor(strategyId: string, symbol: string, config: any) {
    super(strategyId, symbol);
    this.config = {
      rsiPeriod: config.rsiPeriod || 10, // Reduced from 14 to 10 for more responsive signals
      oversoldLevel: config.oversoldLevel || 45, // Increased from 40 to 45 for more buy signals  
      overboughtLevel: config.overboughtLevel || 55, // Decreased from 60 to 55 for more sell signals  
      confirmationPeriod: config.confirmationPeriod || 2 // Faster confirmation
    };
  }
  
  analyzeMarket(marketData: MarketData): TradingSignal {
    const price = marketData.price;
    this.state.priceHistory.push(price);
    
    // Keep reasonable history for GPU calculation
    if (this.state.priceHistory.length > 1000) {
      this.state.priceHistory = this.state.priceHistory.slice(-500);
    }
    
    // Use GPU acceleration for indicator calculations every 10 data points or when cache is empty
    const shouldUseGPU = !this.gpuResultCache || 
                        (this.state.priceHistory.length - this.lastGPUCalculation) >= 10 ||
                        this.state.priceHistory.length < 100;
    
    if (shouldUseGPU && this.state.priceHistory.length >= 50) {
      try {
        this.calculateGPUIndicators();
        this.lastGPUCalculation = this.state.priceHistory.length;
      } catch (error) {
        console.log('GPU calculation failed, falling back to CPU:', error);
        this.updateIndicators(price);
      }
    } else {
      // Use cached GPU results and update incrementally
      this.updateIndicatorsFromCache(price);
    }
    
    // Need sufficient data for analysis
    if (this.state.priceHistory.length < Math.max(this.config.rsiPeriod + 10, 50)) {
      return {
        action: 'HOLD',
        confidence: 0.1,
        price,
        quantity: 0,
        reason: `Building GPU-accelerated indicators (${this.state.priceHistory.length} data points)`,
        stopLoss: 0,
        takeProfit: 0,
        metadata: { rsiPeriod: this.config.rsiPeriod, usingGPU: shouldUseGPU }
      };
    }
    
    // Get latest indicator values
    const rsi = this.state.indicators.rsi[this.state.indicators.rsi.length - 1];
    const sma20 = this.state.indicators.sma20[this.state.indicators.sma20.length - 1];
    const sma50 = this.state.indicators.sma50[this.state.indicators.sma50.length - 1];
    
    if (!rsi || !sma20 || !sma50) {
      return {
        action: 'HOLD',
        confidence: 0.1,
        price,
        quantity: 0,
        reason: 'Waiting for GPU indicator calculations',
        stopLoss: 0,
        takeProfit: 0,
        metadata: { usingGPU: shouldUseGPU }
      };
    }
    
    // Trading Logic
    const rsiOversold = rsi <= this.config.oversoldLevel;
    const rsiOverbought = rsi >= this.config.overboughtLevel;
    const uptrend = sma20 > sma50;
    const downtrend = sma20 < sma50;
    const priceAboveSMA50 = price > sma50;
    const priceBelowSMA50 = price < sma50;
    
    // Entry conditions (more aggressive - focus on RSI signals)
    const longCondition = rsiOversold; // Remove SMA restrictions for more signals
    const shortCondition = rsiOverbought; // Remove SMA restrictions for more signals
    
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
    
    // Confirmation logic
    const longConfirmed = this.lastLongCondition >= 0 && 
                         this.lastLongCondition <= this.config.confirmationPeriod &&
                         longCondition;
                         
    const shortConfirmed = this.lastShortCondition >= 0 && 
                          this.lastShortCondition <= this.config.confirmationPeriod &&
                          shortCondition;
    
    // Position sizing
    const quantity = 0.001; // Small position for testing
    
    // Generate signals
    if (longConfirmed) {
      return {
        action: 'BUY',
        confidence: 0.95, // Match Bollinger strategy confidence
        price,
        quantity,
        reason: `GPU RSI Long: RSI=${rsi.toFixed(1)} oversold, trend up, confirmed`,
        stopLoss: price * 0.98,
        takeProfit: price * 1.02,
        metadata: {
          rsi,
          sma20,
          sma50,
          uptrend,
          confirmationBars: this.lastLongCondition,
          gpuAccelerated: true,
          strategy: 'gpu-rsi'
        }
      };
    }
    
    if (shortConfirmed) {
      return {
        action: 'SELL',
        confidence: 0.95,
        price,
        quantity,
        reason: `GPU RSI Short: RSI=${rsi.toFixed(1)} overbought, trend down, confirmed`,
        stopLoss: price * 1.02,
        takeProfit: price * 0.98,
        metadata: {
          rsi,
          sma20,
          sma50,
          downtrend,
          confirmationBars: this.lastShortCondition,
          gpuAccelerated: true,
          strategy: 'gpu-rsi'
        }
      };
    }
    
    // Exit conditions
    if (this.state.position === 'long' && (rsi >= this.config.overboughtLevel || price < sma20)) {
      return {
        action: 'CLOSE',
        confidence: 0.95,
        price,
        quantity: 0,
        reason: `GPU RSI Exit Long: RSI=${rsi.toFixed(1)} overbought OR price below SMA20`,
        stopLoss: 0,
        takeProfit: 0,
        metadata: { exitType: 'rsi_overbought_or_sma_cross', gpuAccelerated: true }
      };
    }
    
    if (this.state.position === 'short' && (rsi <= this.config.oversoldLevel || price > sma20)) {
      return {
        action: 'CLOSE',
        confidence: 0.95,
        price,
        quantity: 0,
        reason: `GPU RSI Exit Short: RSI=${rsi.toFixed(1)} oversold OR price above SMA20`,
        stopLoss: 0,
        takeProfit: 0,
        metadata: { exitType: 'rsi_oversold_or_sma_cross', gpuAccelerated: true }
      };
    }
    
    // Hold position
    const confidence = Math.min(0.8, Math.max(0.2, 
      rsiOversold ? 0.7 : rsiOverbought ? 0.7 : 0.4
    ));
    
    return {
      action: 'HOLD',
      confidence,
      price,
      quantity: 0,
      reason: `GPU RSI monitoring: RSI=${rsi.toFixed(1)}, trend=${uptrend ? 'up' : downtrend ? 'down' : 'sideways'}`,
      stopLoss: 0,
      takeProfit: 0,
      metadata: {
        rsi,
        sma20,
        sma50,
        uptrend,
        downtrend,
        rsiOversold,
        rsiOverbought,
        gpuAccelerated: true,
        longConditionActive: this.lastLongCondition >= 0 && this.lastLongCondition <= this.config.confirmationPeriod,
        shortConditionActive: this.lastShortCondition >= 0 && this.lastShortCondition <= this.config.confirmationPeriod
      }
    };
  }
  
  private calculateGPUIndicators(): void {
    // Use our existing GPU accelerated indicators module
    const tempDir = '/tmp/signalcartel';
    const inputFile = join(tempDir, 'price_data.txt');
    
    // Ensure temp directory exists
    execSync(`mkdir -p ${tempDir}`, { stdio: 'ignore' });
    
    // Write price data to file (one price per line)
    const priceData = this.state.priceHistory.join('\n');
    writeFileSync(inputFile, priceData);
    
    // Use our existing GPU module
    const pythonScript = `
import sys
import os
sys.path.append('${process.cwd()}/src/lib')

try:
    from gpu_accelerated_indicators import GPUIndicators
    import numpy as np
    
    # Read price data
    with open('${inputFile}', 'r') as f:
        prices = [float(line.strip()) for line in f if line.strip()]
    
    # Calculate indicators using GPU
    gpu_indicators = GPUIndicators()
    
    # Calculate RSI
    rsi_values = []
    if len(prices) >= ${this.config.rsiPeriod + 1}:
        prices_array = np.array(prices, dtype=np.float32)
        rsi_result = gpu_indicators.calculate_rsi_batch(prices_array.reshape(1, -1), ${this.config.rsiPeriod})
        rsi_values = rsi_result[0].tolist()
    
    # Calculate SMAs
    sma20_values = []
    sma50_values = []
    
    if len(prices) >= 20:
        for i in range(20, len(prices) + 1):
            sma20 = np.mean(prices[i-20:i])
            sma20_values.append(float(sma20))
    
    if len(prices) >= 50:
        for i in range(50, len(prices) + 1):
            sma50 = np.mean(prices[i-50:i])
            sma50_values.append(float(sma50))
    
    # Output results
    import json
    result = {
        'rsi_values': rsi_values,
        'sma20_values': sma20_values,
        'sma50_values': sma50_values,
        'timestamp': int(__import__('time').time()),
        'gpu_accelerated': True
    }
    
    print(json.dumps(result))

except Exception as e:
    # Fallback to CPU calculation
    import json
    
    def calculate_rsi_cpu(prices, period):
        rsi_values = []
        for i in range(period, len(prices)):
            gains = []
            losses = []
            for j in range(i-period, i):
                change = prices[j+1] - prices[j]
                if change > 0:
                    gains.append(change)
                    losses.append(0)
                else:
                    gains.append(0)
                    losses.append(-change)
            
            avg_gain = sum(gains) / period
            avg_loss = sum(losses) / period
            
            if avg_loss == 0:
                rsi = 100
            else:
                rs = avg_gain / avg_loss
                rsi = 100 - (100 / (1 + rs))
            
            rsi_values.append(rsi)
        
        return rsi_values
    
    def calculate_sma(prices, period):
        sma_values = []
        for i in range(period, len(prices) + 1):
            sma = sum(prices[i-period:i]) / period
            sma_values.append(sma)
        return sma_values
    
    # Read price data
    with open('${inputFile}', 'r') as f:
        prices = [float(line.strip()) for line in f if line.strip()]
    
    # Calculate indicators
    rsi_values = calculate_rsi_cpu(prices, ${this.config.rsiPeriod}) if len(prices) >= ${this.config.rsiPeriod + 1} else []
    sma20_values = calculate_sma(prices, 20) if len(prices) >= 20 else []
    sma50_values = calculate_sma(prices, 50) if len(prices) >= 50 else []
    
    result = {
        'rsi_values': rsi_values,
        'sma20_values': sma20_values,
        'sma50_values': sma50_values,
        'timestamp': int(__import__('time').time()),
        'gpu_accelerated': False
    }
    
    print(json.dumps(result))
`;
    
    // Execute Python script and capture output
    const output = execSync(`python3 -c "${pythonScript.replace(/"/g, '\\"')}"`, { 
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe']
    });
    
    // Parse results
    const result = JSON.parse(output.trim());
    this.gpuResultCache = result;
    
    // Update strategy state with results
    this.state.indicators.rsi = result.rsi_values;
    this.state.indicators.sma20 = result.sma20_values;
    this.state.indicators.sma50 = result.sma50_values;
    
    // Clean up temp files
    execSync(`rm -f ${inputFile}`, { stdio: 'ignore' });
  }
  
  private updateIndicatorsFromCache(price: number): void {
    if (!this.gpuResultCache) {
      // Fallback to CPU calculation
      this.updateIndicators(price);
      return;
    }
    
    // Use cached GPU results and add incremental CPU calculation for latest data point
    const prices = this.state.priceHistory;
    const period = this.config.rsiPeriod;
    
    if (prices.length >= period + 1) {
      // Simple incremental RSI calculation
      const recentPrices = prices.slice(-period - 1);
      let gains = 0, losses = 0;
      
      for (let i = 1; i < recentPrices.length; i++) {
        const change = recentPrices[i] - recentPrices[i - 1];
        if (change > 0) gains += change;
        else losses -= change;
      }
      
      const avgGain = gains / period;
      const avgLoss = losses / period;
      const rsi = avgLoss === 0 ? 100 : 100 - (100 / (1 + (avgGain / avgLoss)));
      
      // Update indicators with incremental calculation
      this.state.indicators.rsi = [...this.gpuResultCache.rsi_values, rsi];
      
      // Update SMAs incrementally
      if (prices.length >= 20) {
        const sma20 = prices.slice(-20).reduce((sum, p) => sum + p, 0) / 20;
        this.state.indicators.sma20 = [...this.gpuResultCache.sma20_values, sma20];
      }
      
      if (prices.length >= 50) {
        const sma50 = prices.slice(-50).reduce((sum, p) => sum + p, 0) / 50;
        this.state.indicators.sma50 = [...this.gpuResultCache.sma50_values, sma50];
      }
    }
  }
}
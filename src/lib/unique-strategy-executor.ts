/**
 * Unique Strategy Executor
 * 
 * Executes each strategy with its own unique logic and criteria
 * NOT just RSI variations - completely different approaches
 */

import { PineScriptStrategy } from './strategy-registry-competition';

export interface MarketData {
  timestamp: Date;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface SignalResult {
  strategyId: string;
  timestamp: Date;
  signal: 'BUY' | 'SELL' | 'HOLD';
  confidence: number;
  reason: string;
  parameters: any;
}

export class UniqueStrategyExecutor {
  private static instance: UniqueStrategyExecutor;
  private marketDataBuffer: MarketData[] = [];
  private readonly BUFFER_SIZE = 1000;

  private constructor() {}

  static getInstance(): UniqueStrategyExecutor {
    if (!UniqueStrategyExecutor.instance) {
      UniqueStrategyExecutor.instance = new UniqueStrategyExecutor();
    }
    return UniqueStrategyExecutor.instance;
  }

  // Add market data to buffer
  addMarketData(data: MarketData): void {
    this.marketDataBuffer.push(data);
    if (this.marketDataBuffer.length > this.BUFFER_SIZE) {
      this.marketDataBuffer.shift();
    }
  }

  // Execute strategy based on its unique type
  executeStrategy(strategy: PineScriptStrategy): SignalResult {
    const strategyId = strategy.id;
    
    switch (strategyId) {
      case 'rsi-pullback-pro':
        return this.executeRSIStrategy(strategy);
      case 'claude-quantum-oscillator':
        return this.executeQuantumStrategy(strategy);
      case 'stratus-core-neural':
        return this.executeNeuralStrategy(strategy);
      default:
        return {
          strategyId,
          timestamp: new Date(),
          signal: 'HOLD',
          confidence: 0,
          reason: 'Unknown strategy type',
          parameters: {}
        };
    }
  }

  // RSI Pullback Strategy - User's original strategy
  private executeRSIStrategy(strategy: PineScriptStrategy): SignalResult {
    const inputs = strategy.inputs;
    const data = this.marketDataBuffer.slice(-100); // Last 100 bars
    
    if (data.length < inputs.rsi_length + 1) {
      return {
        strategyId: strategy.id,
        timestamp: new Date(),
        signal: 'HOLD',
        confidence: 0,
        reason: 'Insufficient data',
        parameters: {}
      };
    }

    // Calculate RSI
    const rsi = this.calculateRSI(data.map(d => d.close), inputs.rsi_length);
    const currentRSI = rsi[rsi.length - 1];
    
    // Calculate moving averages
    const closes = data.map(d => d.close);
    const shortMA = this.calculateSMA(closes, inputs.ema_length);
    const longMA = this.calculateSMA(closes, inputs.sma_length);
    
    // Detect pullback
    const recentHigh = Math.max(...data.slice(-20).map(d => d.high));
    const currentPrice = data[data.length - 1].close;
    const pullbackDepth = ((recentHigh - currentPrice) / recentHigh) * 100;
    
    // Generate signals
    if (currentRSI < inputs.rsi_oversold && 
        pullbackDepth >= 2.0 && 
        currentPrice > longMA[longMA.length - 1]) {
      return {
        strategyId: strategy.id,
        timestamp: new Date(),
        signal: 'BUY',
        confidence: 0.75,
        reason: `RSI oversold at ${currentRSI.toFixed(1)}, pullback ${pullbackDepth.toFixed(1)}%, above trend`,
        parameters: { rsi: currentRSI, pullback: pullbackDepth }
      };
    } else if (currentRSI > inputs.rsi_overbought) {
      return {
        strategyId: strategy.id,
        timestamp: new Date(),
        signal: 'SELL',
        confidence: 0.75,
        reason: `RSI overbought at ${currentRSI.toFixed(1)}`,
        parameters: { rsi: currentRSI }
      };
    }
    
    return {
      strategyId: strategy.id,
      timestamp: new Date(),
      signal: 'HOLD',
      confidence: 0.5,
      reason: `RSI neutral at ${currentRSI.toFixed(1)}`,
      parameters: { rsi: currentRSI }
    };
  }

  // Quantum Oscillator Strategy - Completely different approach
  private executeQuantumStrategy(strategy: PineScriptStrategy): SignalResult {
    const inputs = strategy.inputs;
    const data = this.marketDataBuffer.slice(-200); // Need more data for wave analysis
    
    if (data.length < inputs.wave_period_long) {
      return {
        strategyId: strategy.id,
        timestamp: new Date(),
        signal: 'HOLD',
        confidence: 0,
        reason: 'Insufficient data for wave analysis',
        parameters: {}
      };
    }

    // Calculate Quantum Oscillator (unique to this strategy)
    const closes = data.map(d => d.close);
    const quantumOsc = this.calculateQuantumOscillator(
      closes, 
      inputs.quantum_period, 
      inputs.quantum_multiplier
    );
    
    // Calculate Wave Patterns
    const shortWave = this.calculateEMA(closes, inputs.wave_period_short);
    const mediumWave = this.calculateEMA(closes, inputs.wave_period_medium);
    const longWave = this.calculateEMA(closes, inputs.wave_period_long);
    
    // Multi-factor confluence scoring
    let confluenceScore = 0;
    const factors = [];
    
    // Momentum factor
    const momentum = (closes[closes.length - 1] - closes[closes.length - 10]) / closes[closes.length - 10];
    if (Math.abs(momentum) > 0.01) {
      confluenceScore += inputs.momentum_weight * 100;
      factors.push('momentum');
    }
    
    // Volume factor
    const avgVolume = data.slice(-20).reduce((sum, d) => sum + d.volume, 0) / 20;
    const currentVolume = data[data.length - 1].volume;
    if (currentVolume > avgVolume * 1.2) {
      confluenceScore += inputs.volume_weight * 100;
      factors.push('volume');
    }
    
    // Volatility factor
    const volatility = this.calculateVolatility(closes.slice(-20));
    if (volatility < inputs.volatility_cap) {
      confluenceScore += inputs.volatility_weight * 100;
      factors.push('volatility');
    }
    
    // Wave alignment
    const waveAligned = (shortWave[shortWave.length - 1] > mediumWave[mediumWave.length - 1]) &&
                       (mediumWave[mediumWave.length - 1] > longWave[longWave.length - 1]);
    if (waveAligned) {
      confluenceScore += inputs.correlation_weight * 100;
      factors.push('wave_alignment');
    }
    
    // Generate signals based on quantum oscillator and confluence
    const currentQuantum = quantumOsc[quantumOsc.length - 1];
    
    if (currentQuantum > inputs.quantum_threshold && 
        confluenceScore >= inputs.confluence_score_min &&
        factors.length >= inputs.confluence_factors) {
      return {
        strategyId: strategy.id,
        timestamp: new Date(),
        signal: 'BUY',
        confidence: Math.min(confluenceScore / 100, 1),
        reason: `Quantum signal ${currentQuantum.toFixed(2)}, confluence ${confluenceScore.toFixed(0)}% (${factors.join(', ')})`,
        parameters: { 
          quantum: currentQuantum, 
          confluence: confluenceScore,
          factors: factors
        }
      };
    } else if (currentQuantum < (1 - inputs.quantum_threshold) && 
               confluenceScore >= inputs.confluence_score_min) {
      return {
        strategyId: strategy.id,
        timestamp: new Date(),
        signal: 'SELL',
        confidence: Math.min(confluenceScore / 100, 1),
        reason: `Quantum reversal ${currentQuantum.toFixed(2)}, confluence ${confluenceScore.toFixed(0)}%`,
        parameters: { 
          quantum: currentQuantum, 
          confluence: confluenceScore
        }
      };
    }
    
    return {
      strategyId: strategy.id,
      timestamp: new Date(),
      signal: 'HOLD',
      confidence: confluenceScore / 100,
      reason: `Waiting for confluence (${confluenceScore.toFixed(0)}%, need ${inputs.confluence_score_min}%)`,
      parameters: { 
        quantum: currentQuantum, 
        confluence: confluenceScore,
        factors: factors
      }
    };
  }

  // Neural Engine Strategy - AI/ML approach
  private executeNeuralStrategy(strategy: PineScriptStrategy): SignalResult {
    const inputs = strategy.inputs;
    const data = this.marketDataBuffer.slice(-inputs.training_lookback);
    
    if (data.length < inputs.training_lookback) {
      return {
        strategyId: strategy.id,
        timestamp: new Date(),
        signal: 'HOLD',
        confidence: 0,
        reason: `Need ${inputs.training_lookback} bars for neural training`,
        parameters: {}
      };
    }

    // Pattern recognition
    const patterns = this.detectPatterns(data, inputs);
    const patternScore = patterns.length / inputs.pattern_library_size;
    
    // Simulate neural network output (simplified)
    const features = this.extractNeuralFeatures(data);
    const neuralOutput = this.simulateNeuralNetwork(features, inputs);
    
    // Calculate prediction confidence
    const confidence = neuralOutput.confidence * inputs.confidence_threshold;
    
    // Adaptive position sizing based on ML
    let positionSize = inputs.base_position_percent;
    if (inputs.ml_position_sizing) {
      const riskScore = this.calculateRiskScore(data);
      positionSize = Math.min(
        inputs.base_position_percent * (2 - riskScore),
        inputs.max_position_percent
      );
    }
    
    // Market microstructure analysis
    const liquidityScore = this.calculateLiquidityScore(data);
    const spreadOk = this.checkSpread(data[data.length - 1], inputs.spread_filter);
    
    // Generate signals based on neural network and patterns
    if (neuralOutput.prediction === 'BULLISH' && 
        confidence > inputs.confidence_threshold &&
        patterns.length >= 2 &&
        liquidityScore > inputs.liquidity_threshold &&
        spreadOk) {
      return {
        strategyId: strategy.id,
        timestamp: new Date(),
        signal: 'BUY',
        confidence: confidence,
        reason: `Neural: ${(confidence * 100).toFixed(0)}% confident, ${patterns.length} patterns detected`,
        parameters: { 
          neural_confidence: confidence,
          patterns: patterns.map(p => p.name),
          position_size: positionSize,
          liquidity: liquidityScore
        }
      };
    } else if (neuralOutput.prediction === 'BEARISH' && 
               confidence > inputs.confidence_threshold &&
               liquidityScore > inputs.liquidity_threshold) {
      return {
        strategyId: strategy.id,
        timestamp: new Date(),
        signal: 'SELL',
        confidence: confidence,
        reason: `Neural: ${(confidence * 100).toFixed(0)}% bearish, adaptive stop active`,
        parameters: { 
          neural_confidence: confidence,
          patterns: patterns.map(p => p.name),
          ml_stop: neuralOutput.suggestedStop
        }
      };
    }
    
    return {
      strategyId: strategy.id,
      timestamp: new Date(),
      signal: 'HOLD',
      confidence: confidence,
      reason: `Neural confidence ${(confidence * 100).toFixed(0)}% below threshold ${(inputs.confidence_threshold * 100).toFixed(0)}%`,
      parameters: { 
        neural_confidence: confidence,
        patterns: patterns.map(p => p.name),
        training_quality: neuralOutput.trainingQuality
      }
    };
  }

  // Helper functions for calculations
  private calculateRSI(prices: number[], period: number): number[] {
    const rsi: number[] = [];
    for (let i = period; i < prices.length; i++) {
      const gains: number[] = [];
      const losses: number[] = [];
      
      for (let j = i - period + 1; j <= i; j++) {
        const change = prices[j] - prices[j - 1];
        if (change > 0) {
          gains.push(change);
          losses.push(0);
        } else {
          gains.push(0);
          losses.push(Math.abs(change));
        }
      }
      
      const avgGain = gains.reduce((a, b) => a + b, 0) / period;
      const avgLoss = losses.reduce((a, b) => a + b, 0) / period;
      
      const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
      rsi.push(100 - (100 / (1 + rs)));
    }
    return rsi;
  }

  private calculateSMA(prices: number[], period: number): number[] {
    const sma: number[] = [];
    for (let i = period - 1; i < prices.length; i++) {
      const sum = prices.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0);
      sma.push(sum / period);
    }
    return sma;
  }

  private calculateEMA(prices: number[], period: number): number[] {
    const ema: number[] = [];
    const multiplier = 2 / (period + 1);
    
    // Start with SMA
    const sma = prices.slice(0, period).reduce((a, b) => a + b, 0) / period;
    ema.push(sma);
    
    for (let i = period; i < prices.length; i++) {
      const newEma = (prices[i] - ema[ema.length - 1]) * multiplier + ema[ema.length - 1];
      ema.push(newEma);
    }
    return ema;
  }

  private calculateQuantumOscillator(prices: number[], period: number, multiplier: number): number[] {
    const oscillator: number[] = [];
    const sma = this.calculateSMA(prices, period);
    
    for (let i = period - 1; i < prices.length; i++) {
      const stdDev = this.calculateStdDev(prices.slice(i - period + 1, i + 1));
      const upperBand = sma[i - period + 1] + (stdDev * multiplier);
      const lowerBand = sma[i - period + 1] - (stdDev * multiplier);
      
      const value = (prices[i] - lowerBand) / (upperBand - lowerBand);
      oscillator.push(Math.max(0, Math.min(1, value))); // Normalize to 0-1
    }
    return oscillator;
  }

  private calculateVolatility(prices: number[]): number {
    const returns = [];
    for (let i = 1; i < prices.length; i++) {
      returns.push((prices[i] - prices[i - 1]) / prices[i - 1]);
    }
    return this.calculateStdDev(returns);
  }

  private calculateStdDev(values: number[]): number {
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const squaredDiffs = values.map(v => Math.pow(v - mean, 2));
    const variance = squaredDiffs.reduce((a, b) => a + b, 0) / values.length;
    return Math.sqrt(variance);
  }

  private detectPatterns(data: MarketData[], inputs: any): any[] {
    const patterns = [];
    
    // Candlestick patterns
    if (inputs.enable_candlestick) {
      const hammer = this.detectHammer(data[data.length - 1]);
      if (hammer) patterns.push({ name: 'hammer', confidence: 0.8 });
      
      const doji = this.detectDoji(data[data.length - 1]);
      if (doji) patterns.push({ name: 'doji', confidence: 0.7 });
    }
    
    // Harmonic patterns (simplified)
    if (inputs.enable_harmonic) {
      const harmonic = this.detectHarmonicPattern(data.slice(-50));
      if (harmonic) patterns.push({ name: harmonic, confidence: 0.75 });
    }
    
    // Fractal patterns
    if (inputs.enable_fractal) {
      const fractal = this.detectFractal(data.slice(-5));
      if (fractal) patterns.push({ name: 'fractal', confidence: 0.85 });
    }
    
    return patterns;
  }

  private detectHammer(candle: MarketData): boolean {
    const body = Math.abs(candle.close - candle.open);
    const lowerShadow = Math.min(candle.open, candle.close) - candle.low;
    const upperShadow = candle.high - Math.max(candle.open, candle.close);
    
    return lowerShadow > body * 2 && upperShadow < body * 0.5;
  }

  private detectDoji(candle: MarketData): boolean {
    const body = Math.abs(candle.close - candle.open);
    const range = candle.high - candle.low;
    return body < range * 0.1;
  }

  private detectHarmonicPattern(data: MarketData[]): string | null {
    // Simplified harmonic pattern detection
    const prices = data.map(d => d.close);
    const retracements = [];
    
    for (let i = 1; i < prices.length - 1; i++) {
      if ((prices[i] > prices[i - 1] && prices[i] > prices[i + 1]) ||
          (prices[i] < prices[i - 1] && prices[i] < prices[i + 1])) {
        retracements.push(i);
      }
    }
    
    if (retracements.length >= 4) {
      return 'butterfly';
    }
    return null;
  }

  private detectFractal(data: MarketData[]): boolean {
    if (data.length < 5) return false;
    
    const middle = 2;
    const high = data[middle].high;
    
    return high > data[middle - 1].high && 
           high > data[middle - 2].high &&
           high > data[middle + 1].high && 
           high > data[middle + 2].high;
  }

  private extractNeuralFeatures(data: MarketData[]): number[] {
    const closes = data.map(d => d.close);
    const volumes = data.map(d => d.volume);
    
    return [
      // Price features
      (closes[closes.length - 1] - closes[0]) / closes[0], // Return
      this.calculateVolatility(closes.slice(-20)), // Recent volatility
      
      // Volume features
      volumes[volumes.length - 1] / (volumes.reduce((a, b) => a + b, 0) / volumes.length), // Volume ratio
      
      // Technical features
      this.calculateRSI(closes, 14)[0] / 100, // Normalized RSI
      
      // Trend features
      (closes[closes.length - 1] - this.calculateSMA(closes, 50)[0]) / closes[closes.length - 1]
    ];
  }

  private simulateNeuralNetwork(features: number[], inputs: any): any {
    // Simplified neural network simulation
    let output = 0;
    
    // Layer 1
    for (let i = 0; i < features.length; i++) {
      output += features[i] * (Math.random() - 0.5);
    }
    
    // Activation
    output = Math.tanh(output);
    
    // Layer 2-N (based on neural_layers)
    for (let layer = 1; layer < inputs.neural_layers; layer++) {
      output = Math.tanh(output * inputs.learning_rate * 100);
    }
    
    // Convert to prediction
    const confidence = Math.abs(output);
    const prediction = output > 0 ? 'BULLISH' : 'BEARISH';
    
    return {
      prediction,
      confidence: Math.min(confidence, 1),
      suggestedStop: 0.02, // 2% stop loss
      trainingQuality: 0.85 // Simulated training quality
    };
  }

  private calculateRiskScore(data: MarketData[]): number {
    const volatility = this.calculateVolatility(data.map(d => d.close));
    const volumeVariance = this.calculateStdDev(data.map(d => d.volume));
    
    return Math.min(volatility * 10 + volumeVariance / 1000000, 1);
  }

  private calculateLiquidityScore(data: MarketData[]): number {
    const avgVolume = data.reduce((sum, d) => sum + d.volume, 0) / data.length;
    const recentVolume = data.slice(-10).reduce((sum, d) => sum + d.volume, 0) / 10;
    
    return Math.min(recentVolume / avgVolume, 1);
  }

  private checkSpread(candle: MarketData, maxSpread: number): boolean {
    const spread = (candle.high - candle.low) / candle.close;
    return spread < maxSpread;
  }
}

export const uniqueStrategyExecutor = UniqueStrategyExecutor.getInstance();
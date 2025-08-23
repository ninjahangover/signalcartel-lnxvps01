/**
 * Multi-Strategy Sentiment Integration
 * Applies sentiment validation to ALL existing QUANTUM FORGE strategies
 * Provides statistical significance across entire trading platform
 */

import { universalSentimentEnhancer, BaseStrategySignal, SentimentEnhancedSignal } from './universal-sentiment-enhancer';

export interface StrategySignalGenerator {
  strategy: string;
  generateSignal: (symbol: string, marketData: any) => Promise<BaseStrategySignal>;
}

export class MultiStrategySentimentIntegration {
  private strategies: StrategySignalGenerator[] = [];
  
  /**
   * Register all your existing strategies for sentiment enhancement
   */
  registerStrategies() {
    // TODO: Replace these with your actual strategy implementations
    
    this.strategies = [
      {
        strategy: 'Enhanced RSI Pullback Strategy',
        generateSignal: this.simulateRSIStrategy.bind(this)
      },
      {
        strategy: 'Bollinger Breakout Enhanced Strategy', 
        generateSignal: this.simulateBollingerStrategy.bind(this)
      },
      {
        strategy: 'Stratus Core Neural Strategy',
        generateSignal: this.simulateNeuralStrategy.bind(this)
      },
      {
        strategy: 'Claude Quantum Oscillator Strategy',
        generateSignal: this.simulateQuantumStrategy.bind(this)
      }
    ];
    
    console.log(`✅ Registered ${this.strategies.length} strategies for sentiment enhancement`);
  }

  /**
   * Generate sentiment-enhanced signals from ALL strategies
   * This is your main trading signal generation with sentiment validation
   */
  async generateAllEnhancedSignals(symbol: string, marketData: any): Promise<{
    enhancedSignals: SentimentEnhancedSignal[];
    executionRecommendations: {
      strategy: string;
      shouldExecute: boolean;
      confidence: number;
      reason: string;
    }[];
    consensusSignal: 'BUY' | 'SELL' | 'HOLD' | 'MIXED';
    overallConfidence: number;
  }> {
    
    console.log(`🎯 Generating sentiment-enhanced signals for ${symbol} across ${this.strategies.length} strategies`);
    
    // Generate base signals from all strategies
    const baseSignals: BaseStrategySignal[] = [];
    for (const strategyGen of this.strategies) {
      try {
        const signal = await strategyGen.generateSignal(symbol, marketData);
        baseSignals.push(signal);
      } catch (error) {
        console.error(`Error generating signal from ${strategyGen.strategy}:`, error);
      }
    }
    
    // Apply sentiment enhancement to all signals
    const enhancedSignals = await universalSentimentEnhancer.enhanceMultipleSignals(baseSignals);
    
    // Generate execution recommendations
    const executionRecommendations = enhancedSignals.map(signal => ({
      strategy: signal.strategy,
      shouldExecute: signal.shouldExecute,
      confidence: signal.confidence,
      reason: signal.executionReason
    }));
    
    // Calculate consensus signal
    const { consensusSignal, overallConfidence } = this.calculateConsensus(enhancedSignals);
    
    return {
      enhancedSignals,
      executionRecommendations,
      consensusSignal,
      overallConfidence
    };
  }

  /**
   * Calculate consensus across all sentiment-enhanced strategies
   */
  private calculateConsensus(signals: SentimentEnhancedSignal[]): {
    consensusSignal: 'BUY' | 'SELL' | 'HOLD' | 'MIXED';
    overallConfidence: number;
  } {
    const validSignals = signals.filter(s => s.shouldExecute);
    
    if (validSignals.length === 0) {
      return { consensusSignal: 'HOLD', overallConfidence: 0 };
    }
    
    const buySignals = validSignals.filter(s => s.finalAction === 'BUY');
    const sellSignals = validSignals.filter(s => s.finalAction === 'SELL');
    
    // Calculate weighted consensus
    const buyWeight = buySignals.reduce((sum, s) => sum + s.confidence, 0);
    const sellWeight = sellSignals.reduce((sum, s) => sum + s.confidence, 0);
    
    let consensusSignal: 'BUY' | 'SELL' | 'HOLD' | 'MIXED';
    let overallConfidence: number;
    
    if (buyWeight > sellWeight * 1.5) {
      consensusSignal = 'BUY';
      overallConfidence = buyWeight / buySignals.length;
    } else if (sellWeight > buyWeight * 1.5) {
      consensusSignal = 'SELL';
      overallConfidence = sellWeight / sellSignals.length;
    } else if (Math.abs(buyWeight - sellWeight) < 0.1) {
      consensusSignal = 'HOLD';
      overallConfidence = 0.5;
    } else {
      consensusSignal = 'MIXED';
      overallConfidence = Math.max(buyWeight, sellWeight) / Math.max(buySignals.length, sellSignals.length);
    }
    
    return { consensusSignal, overallConfidence };
  }

  /**
   * Get comprehensive performance analysis across all strategies
   */
  async getComprehensiveAnalysis(days: number = 7) {
    const analysis = await universalSentimentEnhancer.getMultiStrategyPerformanceAnalysis(days);
    
    console.log('\n📊 MULTI-STRATEGY SENTIMENT ANALYSIS REPORT');
    console.log('===========================================');
    console.log(`Analysis Period: Last ${days} days`);
    console.log(`Total Enhanced Signals: ${analysis.totalSignals}`);
    console.log(`Strategies Analyzed: ${analysis.strategiesAnalyzed}`);
    console.log(`Overall Conflict Rate: ${analysis.overallConflictRate.toFixed(1)}%`);
    console.log(`Overall Boost Rate: ${analysis.overallBoostRate.toFixed(1)}%`);
    
    console.log('\nPER-STRATEGY BREAKDOWN:');
    console.log('------------------------');
    
    analysis.strategies.forEach(strategy => {
      console.log(`\n${strategy.strategy}:`);
      console.log(`  Total Signals: ${strategy.totalSignals}`);
      console.log(`  Sentiment Conflicts: ${strategy.conflictSignals} (${strategy.conflictRate.toFixed(1)}%)`);
      console.log(`  Confidence Boosts: ${strategy.boostedSignals} (${strategy.boostRate.toFixed(1)}%)`);
      console.log(`  Execution Rate: ${strategy.executionRate.toFixed(1)}%`);
      console.log(`  Avg Confidence Change: ${strategy.avgBoost > 0 ? '+' : ''}${strategy.avgBoost.toFixed(2)}%`);
    });
    
    // Identify best performing strategy with sentiment
    const bestStrategy = analysis.strategies.reduce((best, current) => 
      (current.boostRate - current.conflictRate) > (best.boostRate - best.conflictRate) ? current : best
    );
    
    console.log(`\n🏆 BEST SENTIMENT-ENHANCED STRATEGY: ${bestStrategy.strategy}`);
    console.log(`   Net Benefit: ${((bestStrategy.boostRate - bestStrategy.conflictRate)).toFixed(1)}%`);
    
    return analysis;
  }

  // === TEMPORARY STRATEGY SIMULATORS ===
  // TODO: Replace these with your actual strategy implementations
  
  private async simulateRSIStrategy(symbol: string, marketData: any): Promise<BaseStrategySignal> {
    // Simulate RSI-based signal generation
    const rsiValue = 25 + Math.random() * 50; // Random RSI between 25-75
    
    let action: 'BUY' | 'SELL' | 'HOLD' = 'HOLD';
    let confidence = 0;
    
    if (rsiValue < 30) {
      action = 'BUY';
      confidence = 0.7 + (30 - rsiValue) / 100; // Higher confidence for lower RSI
    } else if (rsiValue > 70) {
      action = 'SELL';
      confidence = 0.7 + (rsiValue - 70) / 100; // Higher confidence for higher RSI
    }
    
    return {
      symbol,
      action,
      confidence: Math.min(confidence, 0.95),
      price: 97000 + (Math.random() - 0.5) * 1000, // Simulate BTC price
      strategy: 'Enhanced RSI Pullback Strategy',
      reason: `RSI ${action.toLowerCase()} signal at ${rsiValue.toFixed(1)}`,
      metadata: { rsiValue }
    };
  }
  
  private async simulateBollingerStrategy(symbol: string, marketData: any): Promise<BaseStrategySignal> {
    // Simulate Bollinger Bands signal
    const pricePosition = Math.random(); // 0 = lower band, 1 = upper band
    
    let action: 'BUY' | 'SELL' | 'HOLD' = 'HOLD';
    let confidence = 0;
    
    if (pricePosition < 0.1) {
      action = 'BUY';
      confidence = 0.8; // High confidence for band breakout
    } else if (pricePosition > 0.9) {
      action = 'SELL'; 
      confidence = 0.8; // High confidence for band breakout
    }
    
    return {
      symbol,
      action,
      confidence,
      price: 97000 + (Math.random() - 0.5) * 1000,
      strategy: 'Bollinger Breakout Enhanced Strategy',
      reason: `Bollinger ${action.toLowerCase()} at ${(pricePosition * 100).toFixed(1)}% band position`,
      metadata: { bandPosition: pricePosition }
    };
  }
  
  private async simulateNeuralStrategy(symbol: string, marketData: any): Promise<BaseStrategySignal> {
    // Simulate Neural Network prediction
    const prediction = Math.random() - 0.5; // -0.5 to +0.5
    const confidence = Math.abs(prediction) * 2; // 0 to 1.0
    
    let action: 'BUY' | 'SELL' | 'HOLD' = 'HOLD';
    
    if (prediction > 0.2) {
      action = 'BUY';
    } else if (prediction < -0.2) {
      action = 'SELL';
    }
    
    return {
      symbol,
      action,
      confidence: confidence * 0.85, // Neural networks are more conservative
      price: 97000 + (Math.random() - 0.5) * 1000,
      strategy: 'Stratus Core Neural Strategy', 
      reason: `Neural prediction: ${prediction > 0 ? 'bullish' : 'bearish'} (${prediction.toFixed(3)})`,
      metadata: { prediction, neuralConfidence: confidence }
    };
  }
  
  private async simulateQuantumStrategy(symbol: string, marketData: any): Promise<BaseStrategySignal> {
    // Simulate Quantum Oscillator
    const oscillator = Math.sin(Date.now() / 100000) * Math.random(); // -1 to +1
    const confidence = Math.abs(oscillator) * 0.9;
    
    let action: 'BUY' | 'SELL' | 'HOLD' = 'HOLD';
    
    if (oscillator > 0.3) {
      action = 'BUY';
    } else if (oscillator < -0.3) {
      action = 'SELL';
    }
    
    return {
      symbol,
      action,
      confidence,
      price: 97000 + (Math.random() - 0.5) * 1000,
      strategy: 'Claude Quantum Oscillator Strategy',
      reason: `Quantum oscillator ${action.toLowerCase()} at ${oscillator.toFixed(3)}`,
      metadata: { oscillator }
    };
  }
}

export const multiStrategySentimentIntegration = new MultiStrategySentimentIntegration();
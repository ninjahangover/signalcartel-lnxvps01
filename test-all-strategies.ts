/**
 * Test All Strategy Implementations with Aggressive Settings
 * Designed to generate first trades quickly for pipeline validation
 */

import { StrategyFactory } from './src/lib/strategy-implementations';
import { MarketData } from './src/lib/market-data-service';

// All aggressive configurations
const strategyConfigs = {
  rsi: {
    lookback: 2,
    lowerBarrier: 43,
    lowerThreshold: 65,
    upperBarrier: 45,
    upperThreshold: 72,
    maLength: 70,
    atrMultSL: 11,
    atrMultTP: 2,
    initialCapital: 50,
    tradePercentage: 20
  },
  
  quantumOscillator: {
    fastPeriod: 3,
    slowPeriod: 8,
    signalPeriod: 3,
    overboughtLevel: 60,
    oversoldLevel: 40,
    momentumThreshold: 0.8,
    volumeMultiplier: 1.1,
    stopLoss: 2.5,
    takeProfit: 3.0
  },
  
  neural: {
    neuralLayers: 2,
    learningRate: 0.05,
    lookbackWindow: 10,
    confidenceThreshold: 0.4,
    adaptationPeriod: 20,
    riskMultiplier: 1.5,
    stopLoss: 3.0,
    takeProfit: 4.0
  },
  
  bollinger: {
    smaLength: 50,
    stdLength: 50,
    ubOffset: 1.5,
    lbOffset: 1.5,
    maxRiskPerTrade: 10.0,
    stopLossATRMultiplier: 2.0,
    takeProfitATRMultiplier: 3.0,
    useRSIFilter: false,
    rsiPeriod: 14,
    rsiOverbought: 70,
    rsiOversold: 30,
    useVolFilter: false,
    volSMALength: 20,
    trendStrengthPeriod: 100
  }
};

// Create strategy instances
const strategies = {
  rsi: StrategyFactory.createStrategy('ENHANCED_RSI_PULLBACK', 'rsi-001', 'BTC/USD', strategyConfigs.rsi),
  quantum: StrategyFactory.createStrategy('CLAUDE_QUANTUM_OSCILLATOR', 'quantum-001', 'BTC/USD', strategyConfigs.quantumOscillator),
  neural: StrategyFactory.createStrategy('STRATUS_CORE_NEURAL', 'neural-001', 'BTC/USD', strategyConfigs.neural),
  bollinger: StrategyFactory.createStrategy('BOLLINGER_BREAKOUT_ENHANCED', 'bollinger-001', 'BTC/USD', strategyConfigs.bollinger)
};

// Generate test market data with volatility to trigger signals
function generateTestData(): MarketData[] {
  const basePrice = 50000;
  const testData: MarketData[] = [];
  
  // Create volatile price action over 100 periods
  for (let i = 0; i < 100; i++) {
    // Simulate different market phases
    let price: number;
    const phase = Math.floor(i / 25); // 4 phases of 25 periods each
    
    switch (phase) {
      case 0: // Downtrend with volatility
        price = basePrice - (i * 30) + (Math.sin(i * 0.3) * 200);
        break;
      case 1: // Sharp recovery
        price = basePrice - 750 + ((i - 25) * 50) + (Math.random() * 300 - 150);
        break;
      case 2: // Sideways with breakouts
        price = basePrice + (Math.sin(i * 0.5) * 400) + (Math.random() * 200 - 100);
        break;
      case 3: // Strong uptrend
        price = basePrice + ((i - 75) * 40) + (Math.random() * 250 - 125);
        break;
      default:
        price = basePrice;
    }
    
    const volatility = 100 + (Math.random() * 100);
    
    testData.push({
      symbol: 'BTC/USD',
      price: Math.round(price),
      high: Math.round(price + volatility),
      low: Math.round(price - volatility),
      volume: 500000 + (Math.random() * 1000000),
      avgVolume: 750000,
      timestamp: new Date(Date.now() + i * 60000) // 1-minute intervals
    });
  }
  
  return testData;
}

// Test all strategies
function testAllStrategies() {
  console.log('🚀 TESTING ALL STRATEGIES WITH AGGRESSIVE SETTINGS');
  console.log('=' + '='.repeat(80) + '=\\n');
  
  const testData = generateTestData();
  const signals: { [key: string]: any[] } = {
    rsi: [],
    quantum: [],
    neural: [],
    bollinger: []
  };
  
  console.log('📊 Processing 100 periods of volatile market data...\\n');
  
  // Process each period
  testData.forEach((marketData, index) => {
    Object.entries(strategies).forEach(([name, strategy]) => {
      const signal = strategy.analyzeMarket(marketData);
      
      if (signal.action !== 'HOLD') {
        signals[name].push({
          period: index + 1,
          price: marketData.price,
          signal
        });
      }
    });
  });
  
  // Report results
  console.log('📈 STRATEGY PERFORMANCE SUMMARY\\n');
  
  Object.entries(signals).forEach(([strategyName, strategySignals]) => {
    console.log(`🎯 ${strategyName.toUpperCase()} STRATEGY:`);
    console.log(`   📊 Total Signals: ${strategySignals.length}`);
    
    if (strategySignals.length > 0) {
      console.log(`   🚨 First Signal: Period ${strategySignals[0].period} at $${strategySignals[0].price.toLocaleString()}`);
      console.log(`   💪 Action: ${strategySignals[0].signal.action}`);
      console.log(`   🎯 Confidence: ${(strategySignals[0].signal.confidence * 100).toFixed(1)}%`);
      console.log(`   📝 Reason: ${strategySignals[0].signal.reason}`);
      
      const buySignals = strategySignals.filter(s => s.signal.action === 'BUY').length;
      const sellSignals = strategySignals.filter(s => s.signal.action === 'SELL').length;
      const closeSignals = strategySignals.filter(s => s.signal.action === 'CLOSE').length;
      
      console.log(`   📊 Signal Breakdown: ${buySignals} BUY, ${sellSignals} SELL, ${closeSignals} CLOSE`);
    } else {
      console.log(`   ⚠️  No signals generated - may need more aggressive settings`);
    }
    console.log('');
  });
  
  // Overall readiness assessment
  const totalSignals = Object.values(signals).reduce((sum, s) => sum + s.length, 0);
  console.log(`🎯 READINESS ASSESSMENT:`);
  console.log(`   📊 Total Signals Across All Strategies: ${totalSignals}`);
  console.log(`   ✅ Strategies Ready for Paper Trading: ${Object.values(signals).filter(s => s.length > 0).length}/4`);
  console.log(`   🚀 Pipeline Status: ${totalSignals > 0 ? 'READY FOR LIVE TESTING' : 'NEEDS MORE AGGRESSIVE SETTINGS'}`);
}

// Configuration summary
console.log('⚙️  AGGRESSIVE CONFIGURATION SUMMARY:\\n');
console.log('RSI Strategy: 2-period RSI, barriers 43/45, thresholds 65/72');
console.log('Quantum Oscillator: 3/8/3 periods, levels 40/60, low momentum threshold');
console.log('Neural Network: 2 layers, 0.4 confidence, 10-period lookback');
console.log('Bollinger Bands: 50-period, 1.5x offset, filters disabled\\n');

// Run the comprehensive test
testAllStrategies();
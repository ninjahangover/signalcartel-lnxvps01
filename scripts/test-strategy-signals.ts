/**
 * Direct Strategy Signal Testing
 * Tests all four strategies with aggressive settings using live market data simulation
 */

import { StrategyFactory } from '../src/lib/strategy-implementations';
import marketDataService, { MarketData } from '../src/lib/market-data-service';

// Aggressive configurations
const configs = {
  rsi: {
    lookback: 2,
    lowerBarrier: 43,
    lowerThreshold: 65,
    upperBarrier: 45,
    upperThreshold: 72,
    maLength: 70,
    atrMultSL: 11,
    atrMultTP: 2,
    initialCapital: 250,
    tradePercentage: 20
  },
  quantum: {
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
    useVolFilter: false,
    trendStrengthPeriod: 100
  }
};

// Create strategy instances
const strategies = {
  rsi: StrategyFactory.createStrategy('ENHANCED_RSI_PULLBACK', 'test-rsi', 'BTC/USD', configs.rsi),
  quantum: StrategyFactory.createStrategy('CLAUDE_QUANTUM_OSCILLATOR', 'test-quantum', 'ETH/USD', configs.quantum),
  neural: StrategyFactory.createStrategy('STRATUS_CORE_NEURAL', 'test-neural', 'SOL/USD', configs.neural),
  bollinger: StrategyFactory.createStrategy('BOLLINGER_BREAKOUT_ENHANCED', 'test-bollinger', 'AVAX/USD', configs.bollinger)
};

// Generate realistic market data with different phases
function generateMarketData(symbol: string, basePrice: number): MarketData[] {
  const data: MarketData[] = [];
  let currentPrice = basePrice;
  
  for (let i = 0; i < 200; i++) {
    // Different market phases every 50 periods
    const phase = Math.floor(i / 50);
    let priceChange: number;
    
    switch (phase) {
      case 0: // Downtrend with pullbacks
        priceChange = -Math.random() * 50 + (i % 10 === 0 ? 30 : 0);
        break;
      case 1: // Sharp recovery
        priceChange = Math.random() * 80 - 10;
        break;
      case 2: // Volatile sideways
        priceChange = (Math.random() - 0.5) * 100;
        break;
      case 3: // Strong uptrend
        priceChange = Math.random() * 60 - 5;
        break;
      default:
        priceChange = (Math.random() - 0.5) * 40;
    }
    
    currentPrice += priceChange;
    currentPrice = Math.max(currentPrice, basePrice * 0.5); // Don't go below 50% of base
    
    const volatility = 20 + Math.random() * 30;
    
    data.push({
      symbol,
      price: Math.round(currentPrice * 100) / 100,
      high: Math.round((currentPrice + volatility) * 100) / 100,
      low: Math.round((currentPrice - volatility) * 100) / 100,
      volume: 500000 + Math.random() * 1000000,
      avgVolume: 750000,
      timestamp: new Date(Date.now() + i * 60000)
    });
  }
  
  return data;
}

async function testAllStrategies() {
  console.log('🎯 TESTING ALL STRATEGIES WITH AGGRESSIVE SETTINGS');
  console.log('=' + '='.repeat(80) + '=\\n');
  
  const symbols = ['BTC/USD', 'ETH/USD', 'SOL/USD', 'AVAX/USD'];
  const basePrices = [50000, 3000, 100, 25];
  const strategyNames = ['rsi', 'quantum', 'neural', 'bollinger'];
  
  const allSignals: { [key: string]: any[] } = {};
  
  for (let i = 0; i < strategyNames.length; i++) {
    const strategyName = strategyNames[i];
    const symbol = symbols[i];
    const basePrice = basePrices[i];
    const strategy = strategies[strategyName as keyof typeof strategies];
    
    console.log(`\\n📊 Testing ${strategyName.toUpperCase()} strategy on ${symbol}:`);
    console.log('-'.repeat(60));
    
    const marketData = generateMarketData(symbol, basePrice);
    const signals: any[] = [];
    
    let signalCount = 0;
    
    for (const data of marketData) {
      const signal = strategy.analyzeMarket(data);
      
      if (signal.action !== 'HOLD') {
        signalCount++;
        signals.push({
          period: marketData.indexOf(data) + 1,
          price: data.price,
          signal
        });
        
        // Log first few signals immediately
        if (signalCount <= 3) {
          console.log(`\\n🚨 SIGNAL #${signalCount} - Period ${marketData.indexOf(data) + 1}:`);
          console.log(`   💰 Price: $${data.price.toLocaleString()}`);
          console.log(`   🎯 Action: ${signal.action}`);
          console.log(`   💪 Confidence: ${(signal.confidence * 100).toFixed(1)}%`);
          console.log(`   📝 Reason: ${signal.reason}`);
          console.log(`   📊 Quantity: ${signal.quantity.toFixed(4)}`);
          
          if (signal.stopLoss > 0) {
            console.log(`   🛑 Stop Loss: $${signal.stopLoss.toLocaleString()}`);
          }
          if (signal.takeProfit > 0) {
            console.log(`   🎯 Take Profit: $${signal.takeProfit.toLocaleString()}`);
          }
        }
      }
    }
    
    allSignals[strategyName] = signals;
    
    console.log(`\\n📈 ${strategyName.toUpperCase()} SUMMARY:`);
    console.log(`   📊 Total Signals: ${signals.length}`);
    
    if (signals.length > 0) {
      const buySignals = signals.filter(s => s.signal.action === 'BUY').length;
      const sellSignals = signals.filter(s => s.signal.action === 'SELL').length;
      const closeSignals = signals.filter(s => s.signal.action === 'CLOSE').length;
      
      console.log(`   📊 Breakdown: ${buySignals} BUY, ${sellSignals} SELL, ${closeSignals} CLOSE`);
      console.log(`   ⚡ First Signal: Period ${signals[0].period} at $${signals[0].price.toLocaleString()}`);
      console.log(`   ⏱️  Signal Frequency: Every ${Math.round(200 / signals.length)} periods avg`);
      console.log(`   ✅ STATUS: READY FOR PAPER TRADING`);
    } else {
      console.log(`   ⚠️  No signals generated - consider more aggressive settings`);
      console.log(`   ❌ STATUS: NEEDS OPTIMIZATION`);
    }
  }
  
  // Overall summary
  console.log('\\n' + '='.repeat(80));
  console.log('🎯 FINAL READINESS ASSESSMENT:');
  console.log('='.repeat(80));
  
  const totalSignals = Object.values(allSignals).reduce((sum, signals) => sum + signals.length, 0);
  const activeStrategies = Object.values(allSignals).filter(signals => signals.length > 0).length;
  
  console.log(`\\n📊 OVERALL STATISTICS:`);
  console.log(`   🔢 Total Signals Generated: ${totalSignals}`);
  console.log(`   ✅ Active Strategies: ${activeStrategies}/4`);
  console.log(`   📈 Average Signals per Strategy: ${Math.round(totalSignals / 4)}`);
  
  console.log(`\\n🚀 DEPLOYMENT READINESS:`);
  if (activeStrategies >= 3 && totalSignals >= 20) {
    console.log(`   ✅ EXCELLENT - Ready for immediate paper trading deployment`);
    console.log(`   🎯 Expected first trades within 1-2 hours`);
  } else if (activeStrategies >= 2 && totalSignals >= 10) {
    console.log(`   ⚠️  GOOD - Ready with moderate signal generation`);
    console.log(`   🎯 Expected first trades within 2-4 hours`);
  } else {
    console.log(`   ❌ NEEDS WORK - Insufficient signal generation`);
    console.log(`   🔧 Recommend more aggressive parameter tuning`);
  }
  
  console.log(`\\n🎪 NEXT STEPS:`);
  console.log(`   1. Deploy strategies to trading engine`);
  console.log(`   2. Enable real-time market data feeds`);
  console.log(`   3. Monitor for first trade execution`);
  console.log(`   4. Begin optimization after first trade (win/loss)`);
  console.log(`   5. Scale successful strategies gradually\\n`);
}

// Run the test
if (require.main === module) {
  testAllStrategies().catch(console.error);
}

export default testAllStrategies;
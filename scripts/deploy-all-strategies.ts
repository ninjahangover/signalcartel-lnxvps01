/**
 * Complete Strategy Deployment - All 4 Strategies Including RSI
 * Includes RSI strategy that was missing from quick-deploy
 */

import StrategyExecutionEngine from '../src/lib/strategy-execution-engine';

async function deployAllStrategies() {
  console.log('🚀 COMPLETE STRATEGY DEPLOYMENT: ALL 4 STRATEGIES INCLUDING RSI');
  console.log('=' + '='.repeat(80) + '=\n');
  
  try {
    const engine = StrategyExecutionEngine.getInstance();
    engine.setPaperTradingMode(true);
    console.log('✅ Paper trading mode enabled\n');
    
    // Complete strategy suite including the missing RSI strategy
    const strategies = [
      {
        id: 'rsi-aggressive-live-001',
        name: 'Enhanced RSI Pull-Back LIVE',
        type: 'ENHANCED_RSI_PULLBACK',
        config: {
          lookback: 2,           // Ultra-fast RSI
          lowerBarrier: 43,      // Close to neutral 50
          lowerThreshold: 65,    // Easier conditions
          upperBarrier: 45,      // Close to neutral 50
          upperThreshold: 72,    // Wider range
          maLength: 70,          // Medium-term filter
          atrMultSL: 11,         // Very wide stops
          atrMultTP: 2,          // Quick profits
          maxRiskPerTrade: 5.0,
          positionSizing: 0.02   // 2% of account per trade
        },
        isActive: true
      },
      {
        id: 'quantum-aggressive-live-001',
        name: 'Claude Quantum Oscillator LIVE',
        type: 'CLAUDE_QUANTUM_OSCILLATOR',
        config: {
          fastPeriod: 3,
          slowPeriod: 8,
          signalPeriod: 3,
          overboughtLevel: 60,
          oversoldLevel: 40,
          momentumThreshold: 0.8,
          volumeMultiplier: 1.1,
          stopLoss: 2.5,
          takeProfit: 3.0,
          maxRiskPerTrade: 5.0
        },
        isActive: true
      },
      {
        id: 'neural-aggressive-live-001', 
        name: 'Stratus Core Neural LIVE',
        type: 'STRATUS_CORE_NEURAL',
        config: {
          neuralLayers: 2,
          learningRate: 0.05,
          lookbackWindow: 10,
          confidenceThreshold: 0.4,
          adaptationPeriod: 20,
          riskMultiplier: 1.5,
          stopLoss: 3.0,
          takeProfit: 4.0,
          maxRiskPerTrade: 5.0
        },
        isActive: true
      },
      {
        id: 'bollinger-aggressive-live-001',
        name: 'Bollinger Breakout LIVE', 
        type: 'BOLLINGER_BREAKOUT_ENHANCED',
        config: {
          smaLength: 50,
          stdLength: 50,
          ubOffset: 1.5,
          lbOffset: 1.5,
          maxRiskPerTrade: 5.0,
          stopLossATRMultiplier: 2.0,
          takeProfitATRMultiplier: 3.0,
          useRSIFilter: false,
          useVolFilter: false,
          trendStrengthPeriod: 100
        },
        isActive: true
      }
    ];
    
    console.log('📊 Loading ALL 4 aggressive strategies:\n');
    
    for (const strategy of strategies) {
      console.log(`🎯 Loading: ${strategy.name}`);
      console.log(`   🔧 Type: ${strategy.type}`);
      console.log(`   📊 Symbol: BTCUSD`);
      
      engine.addStrategy(strategy, 'BTCUSD');
      console.log(`   ✅ Added to execution engine\n`);
    }
    
    console.log('🔥 Starting COMPLETE strategy engine...\n');
    engine.startEngine();
    
    console.log('🎉 COMPLETE TRADING ENGINE STARTED!');
    console.log('📊 ALL 4 strategies monitoring BTC:');
    console.log('   1️⃣ RSI Pull-Back Strategy (the one sending your alerts!)');
    console.log('   2️⃣ Quantum Oscillator Strategy');
    console.log('   3️⃣ Neural Network Strategy'); 
    console.log('   4️⃣ Bollinger Breakout Strategy');
    console.log('⚡ Expecting signals from all strategies within 30-60 minutes');
    console.log('🎯 Watch for BUY/SELL alerts in real-time\n');
    
    // Enhanced monitoring with strategy details
    let tickCount = 0;
    setInterval(() => {
      tickCount++;
      const timestamp = new Date().toISOString();
      console.log(`[${timestamp}] ⚡ Tick ${tickCount}: ALL 4 strategies analyzing live BTC data`);
      
      if (tickCount % 10 === 0) {
        console.log(`\n🎯 STATUS UPDATE (${tickCount * 30} seconds elapsed):`);
        console.log('   📊 Strategies: 4 active (RSI + Quantum + Neural + Bollinger)');
        console.log('   📈 Data Source: Kraken real-time BTC prices');
        console.log('   🎪 Mode: Ultra-aggressive for maximum signal generation');
        console.log('   ⏳ Expected Trade: Any moment now...\n');
      }
    }, 30000);
    
  } catch (error) {
    console.error('❌ Failed to start strategies:', error);
  }
}

// Start deployment
deployAllStrategies();
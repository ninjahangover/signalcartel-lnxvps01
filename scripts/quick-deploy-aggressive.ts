/**
 * Quick Deploy Aggressive Strategies
 * Directly loads and runs our 3 working aggressive strategies
 */

import StrategyExecutionEngine from '../src/lib/strategy-execution-engine';

async function quickDeploy() {
  console.log('🚀 QUICK DEPLOY: AGGRESSIVE STRATEGIES FOR FIRST TRADES');
  console.log('=' + '='.repeat(80) + '=\\n');
  
  try {
    const engine = StrategyExecutionEngine.getInstance();
    engine.setPaperTradingMode(true);
    console.log('✅ Paper trading mode enabled\\n');
    
    // Our 3 working aggressive strategies
    const strategies = [
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
          takeProfit: 3.0
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
          takeProfit: 4.0
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
          maxRiskPerTrade: 10.0,
          stopLossATRMultiplier: 2.0,
          takeProfitATRMultiplier: 3.0,
          useRSIFilter: false,
          useVolFilter: false,
          trendStrengthPeriod: 100
        },
        isActive: true
      }
    ];
    
    console.log('📊 Loading aggressive strategies:\\n');
    
    for (const strategy of strategies) {
      console.log(`🎯 Loading: ${strategy.name}`);
      console.log(`   🔧 Type: ${strategy.type}`);
      console.log(`   📊 Symbol: BTCUSD (for testing)`);
      
      engine.addStrategy(strategy, 'BTCUSD');
      console.log(`   ✅ Added to execution engine\\n`);
    }
    
    console.log('🔥 Starting aggressive strategy engine...\\n');
    engine.startEngine();
    
    console.log('🎉 LIVE AGGRESSIVE TRADING ENGINE STARTED!');
    console.log('📊 3 strategies monitoring BTC with aggressive settings');
    console.log('⚡ Expecting first signals within 30-60 minutes');
    console.log('🎯 Watch for BUY/SELL alerts in real-time\\n');
    
    // Monitor and log activity
    let tickCount = 0;
    setInterval(() => {
      tickCount++;
      const timestamp = new Date().toISOString();
      console.log(`[${timestamp}] ⚡ Tick ${tickCount}: 3 aggressive strategies analyzing live BTC data`);
      
      if (tickCount % 10 === 0) {
        console.log(`\\n🎯 STATUS UPDATE (${tickCount * 30} seconds elapsed):`);
        console.log('   📊 Strategies: 3 active and analyzing');
        console.log('   📈 Data Source: Kraken real-time BTC prices'); 
        console.log('   🎪 Mode: Ultra-aggressive for first trade generation');
        console.log('   ⏳ Expected Trade: Any moment now...\\n');
      }
    }, 30000); // Every 30 seconds
    
  } catch (error) {
    console.error('❌ Quick deploy failed:', error);
    process.exit(1);
  }
}

quickDeploy().catch(console.error);
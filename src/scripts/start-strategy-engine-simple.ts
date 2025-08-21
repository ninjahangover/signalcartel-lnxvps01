import StrategyExecutionEngine from '../lib/strategy-execution-engine';

async function start() {
  console.log('⚡ Starting Strategy Execution Engine (Simple Mode)...');
  
  try {
    const engine = StrategyExecutionEngine.getInstance();
    engine.setPaperTradingMode(true);
    
    // Create some default strategies manually
    const defaultStrategies = [
      {
        id: 'rsi_macd_scalper_v3',
        name: 'RSI MACD Scalper v3',
        type: 'RSI_PULLBACK',
        symbol: 'BTCUSD',
        isActive: true,
        config: {
          rsi_period: 14,
          oversold_level: 30,
          overbought_level: 70,
          ma_short_period: 20,
          ma_long_period: 50
        }
      },
      {
        id: 'momentum_breakout_v2',
        name: 'Momentum Breakout v2',
        type: 'MOMENTUM',
        symbol: 'ETHUSD',
        isActive: true,
        config: {
          rsi_period: 14,
          momentum_threshold: 5,
          volume_multiplier: 1.5
        }
      },
      {
        id: 'ai_fibonacci_hunter',
        name: 'AI Fibonacci Hunter',
        type: 'FIBONACCI',
        symbol: 'SOLUSD',
        isActive: true,
        config: {
          fib_levels: [0.236, 0.382, 0.5, 0.618, 0.786],
          lookback_period: 50
        }
      }
    ];
    
    console.log(`📋 Loading ${defaultStrategies.length} default strategies`);
    
    for (const strategy of defaultStrategies) {
      engine.addStrategy(strategy as any, strategy.symbol);
      console.log(`✅ Added strategy: ${strategy.name} (${strategy.symbol})`);
    }
    
    // Start the engine
    engine.startEngine();
    console.log(`✅ Strategy engine started with ${defaultStrategies.length} strategies`);
    
    // Status check every 5 minutes
    setInterval(() => {
      const status = engine.isEngineRunning() ? 'RUNNING' : 'STOPPED';
      console.log(`[${new Date().toISOString()}] ⚡ Engine: ${status}`);
    }, 300000);
    
  } catch (error) {
    console.error('❌ Failed to start strategy engine:', error);
    process.exit(1);
  }
}

// Handle shutdown gracefully
process.on('SIGTERM', () => {
  console.log('⚡ Stopping strategy engine...');
  const engine = StrategyExecutionEngine.getInstance();
  engine.stopEngine();
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('⚡ Stopping strategy engine...');
  const engine = StrategyExecutionEngine.getInstance();
  engine.stopEngine();
  process.exit(0);
});

start();
import StrategyExecutionEngine from '../lib/strategy-execution-engine';
import StrategyManager from '../lib/strategy-manager';

async function start() {
  console.log('⚡ Starting Strategy Execution Engine...');
  
  try {
    const engine = StrategyExecutionEngine.getInstance();
    engine.setPaperTradingMode(true);
    
    // Load all active strategies
    const strategyManagerInstance = StrategyManager.getInstance();
    const strategies = strategyManagerInstance.getStrategies();
    const activeStrategies = strategies.filter(s => s.isActive);
    
    console.log(`📋 Found ${activeStrategies.length} active strategies`);
    
    for (const strategy of activeStrategies) {
      const symbol = strategy.symbol || 'BTCUSD';
      engine.addStrategy(strategy, symbol);
      console.log(`✅ Added strategy: ${strategy.name} (${symbol})`);
    }
    
    // Start the engine
    engine.startEngine();
    console.log(`✅ Strategy engine started with ${activeStrategies.length} strategies`);
    
    // Status check every 5 minutes
    setInterval(() => {
      const status = engine.isEngineRunning() ? 'RUNNING' : 'STOPPED';
      const strategyCount = engine.getActiveStrategies().length;
      console.log(`[${new Date().toISOString()}] ⚡ Engine: ${status} | Strategies: ${strategyCount}`);
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
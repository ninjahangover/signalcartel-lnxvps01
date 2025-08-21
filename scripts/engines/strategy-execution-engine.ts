import StrategyExecutionEngine from '../../src/lib/strategy-execution-engine.ts';
import StrategyManager from '../../src/lib/strategy-manager.ts';

async function main() {
    const engine = StrategyExecutionEngine.getInstance();
    engine.setPaperTradingMode(true);
    
    // Load all active strategies
    const strategyManager = StrategyManager.getInstance();
    const strategies = strategyManager.getStrategies();
    const activeStrategies = strategies.filter(s => s.status === 'active');
    
    console.log(`Loading ${activeStrategies.length} active strategies...`);
    for (const strategy of activeStrategies) {
        // Convert strategy manager format to engine format
        const engineStrategy = {
            id: strategy.id,
            name: strategy.name,
            type: strategy.type,
            config: strategy.config,
            isActive: strategy.status === 'active'
        };
        engine.addStrategy(engineStrategy, 'BTCUSD'); // Use BTCUSD as default symbol
        console.log(`Added strategy: ${strategy.name} (ID: ${strategy.id})`);
    }
    
    engine.startEngine();
    console.log(`Strategy engine started with ${activeStrategies.length} strategies`);
    
    setInterval(() => {
        console.log(`[${new Date().toISOString()}] Strategy engine running`);
    }, 300000);
}

main().catch(console.error);
import { startInputOptimization, pineScriptInputOptimizer } from '../../src/lib/pine-script-input-optimizer.ts';

async function main() {
    await startInputOptimization();
    console.log('AI optimization started');
    
    setInterval(() => {
        const history = pineScriptInputOptimizer.getOptimizationHistory();
        console.log(`[${new Date().toISOString()}] Optimizations: ${history.length}`);
    }, 300000);
}

main().catch(console.error);
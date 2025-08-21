import { startGlobalStratusEngine, getStratusEngineStatus } from '../lib/global-stratus-engine-service';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

async function start() {
  console.log('🎯 Starting Stratus Engine (Master Controller)...');
  
  try {
    await startGlobalStratusEngine();
    console.log('✅ Stratus Engine started');
    
    // Run comprehensive health check after startup
    setTimeout(async () => {
      console.log('\n🏥 Running Stratus Engine Health Check...');
      try {
        const { stdout, stderr } = await execAsync('npx ts-node stratus-health-check.ts');
        console.log(stdout);
        if (stderr) {
          console.error('Health check warnings:', stderr);
        }
      } catch (error) {
        console.error('❌ Health check failed:', error.message);
        
        // Fallback to basic status check
        console.log('\n📊 Fallback Status Check:');
        const status = await getStratusEngineStatus();
        console.log('🎯 Stratus Engine Status:');
        console.log(`  - Engine Running: ${status.isRunning}`);
        console.log(`  - Input Optimizer: ${status.components.inputOptimizer.active ? '✅ ACTIVE' : '❌ STOPPED'}`);
        console.log(`  - Market Monitor: ${status.components.marketMonitor.active ? '✅ ACTIVE' : '❌ STOPPED'}`);
        console.log(`  - Market Data: ${status.components.marketData.active ? '✅ ACTIVE' : '❌ STOPPED'}`);
        console.log(`  - Alpaca Integration: ${status.components.alpacaIntegration.active ? '✅ ACTIVE' : '❌ STOPPED'}`);
        console.log(`  - Markov Predictor: ${status.components.markovPredictor.active ? '✅ ACTIVE' : '❌ STOPPED'} (${status.components.markovPredictor.convergenceStatus}, ${(status.components.markovPredictor.reliability * 100).toFixed(1)}% reliable)`);
      }
    }, 10000); // Give system 10 seconds to fully start
    
    // Status check every 5 minutes
    setInterval(async () => {
      const status = await getStratusEngineStatus();
      const activeComponents = Object.values(status.components).filter(c => c.active).length;
      const engineStatus = status.isRunning ? 'RUNNING' : 'STOPPED';
      const markovStatus = status.components.markovPredictor ? ` | Neural: ${status.components.markovPredictor.convergenceStatus} (${(status.components.markovPredictor.reliability * 100).toFixed(0)}%)` : '';
      console.log(`[${new Date().toISOString()}] 🎯 Stratus Engine: ${engineStatus} | ${activeComponents}/5 components active${markovStatus}`);
      
      // Run mini health check every 30 minutes
      const now = new Date();
      if (now.getMinutes() % 30 === 0 && now.getSeconds() < 30) {
        console.log('\n🔍 Running periodic health check...');
        try {
          await execAsync('npx ts-node stratus-health-check.ts');
        } catch (error) {
          console.log('⚠️ Periodic health check detected issues');
        }
      }
    }, 300000);
    
  } catch (error) {
    console.error('❌ Failed to start Stratus Engine:', error);
    process.exit(1);
  }
}

// Handle shutdown gracefully
process.on('SIGTERM', () => {
  console.log('🎯 Stopping Stratus Engine...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🎯 Stopping Stratus Engine...');
  process.exit(0);
});

start();
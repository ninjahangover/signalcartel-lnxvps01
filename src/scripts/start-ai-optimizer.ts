import { startInputOptimization, pineScriptInputOptimizer } from '../lib/pine-script-input-optimizer';

async function start() {
  console.log('🧠 Starting AI Optimization Engine...');
  
  try {
    await startInputOptimization();
    console.log('✅ AI optimization started');
    
    // Verify it's running
    setTimeout(() => {
      if (pineScriptInputOptimizer.isRunning()) {
        console.log('✅ AI Optimization Engine confirmed ACTIVE');
        const history = pineScriptInputOptimizer.getOptimizationHistory();
        console.log(`📊 Optimization history: ${history.length} entries`);
      } else {
        console.log('⚠️ AI Optimization Engine may not be running properly');
      }
    }, 3000);
    
    // Status check every 5 minutes
    setInterval(() => {
      const isRunning = pineScriptInputOptimizer.isRunning();
      const history = pineScriptInputOptimizer.getOptimizationHistory();
      const status = isRunning ? 'ACTIVE' : 'STOPPED';
      console.log(`[${new Date().toISOString()}] 🧠 AI Optimization: ${status} | ${history.length} optimizations completed`);
    }, 300000);
    
  } catch (error) {
    console.error('❌ Failed to start AI optimizer:', error);
    process.exit(1);
  }
}

// Handle shutdown gracefully
process.on('SIGTERM', () => {
  console.log('🧠 Stopping AI optimization engine...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🧠 Stopping AI optimization engine...');
  process.exit(0);
});

start();
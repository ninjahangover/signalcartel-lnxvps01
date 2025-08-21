/**
 * Simple test of input optimizer status
 */

async function testSimpleStatus() {
  console.log('🧪 Testing simple input optimizer status...');

  try {
    // Import just what we need
    const { pineScriptInputOptimizer } = await import('./src/lib/pine-script-input-optimizer');
    
    // Check status
    const isRunning = pineScriptInputOptimizer.isRunning();
    console.log(`🔍 Input optimizer status: ${isRunning ? 'RUNNING' : 'STOPPED'}`);
    
    if (isRunning) {
      console.log('✅ Input optimizer is running!');
      const history = pineScriptInputOptimizer.getOptimizationHistory();
      console.log(`📊 Optimization history: ${history.length} entries`);
    } else {
      console.log('❌ Input optimizer is not running');
    }
    
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

// Run immediately
testSimpleStatus();
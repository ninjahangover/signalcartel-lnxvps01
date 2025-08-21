/**
 * Direct test of the Pine Script Input Optimizer
 * This bypasses any UI/API layers and tests the optimizer directly
 */

async function testInputOptimizer() {
  console.log('🧪 Testing Pine Script Input Optimizer directly...');

  try {
    // Import the optimizer
    const { pineScriptInputOptimizer, startInputOptimization } = await import('./src/lib/pine-script-input-optimizer');
    
    console.log('📦 Imported input optimizer successfully');
    
    // Check initial status
    const initialStatus = pineScriptInputOptimizer.isRunning();
    console.log(`🔍 Initial status: ${initialStatus ? 'RUNNING' : 'STOPPED'}`);
    
    if (initialStatus) {
      console.log('✅ Input optimizer is already running!');
      return;
    }
    
    // Attempt to start
    console.log('🚀 Starting input optimization...');
    await startInputOptimization();
    
    // Check status after start
    const afterStatus = pineScriptInputOptimizer.isRunning();
    console.log(`🔍 After start status: ${afterStatus ? 'RUNNING' : 'STOPPED'}`);
    
    if (afterStatus) {
      console.log('✅ Input optimizer started successfully!');
      
      // Get some info
      const history = pineScriptInputOptimizer.getOptimizationHistory();
      console.log(`📊 Optimization history: ${history.length} entries`);
      
      // Check if it stays running
      setTimeout(() => {
        const finalStatus = pineScriptInputOptimizer.isRunning();
        console.log(`🔍 Final status (after delay): ${finalStatus ? 'RUNNING' : 'STOPPED'}`);
        
        if (finalStatus) {
          console.log('🎉 Input optimizer is stable and running!');
        } else {
          console.log('⚠️ Input optimizer stopped after starting');
        }
      }, 3000);
      
    } else {
      console.log('❌ Input optimizer failed to start');
      console.log('💡 This might indicate a dependency issue');
    }
    
  } catch (error) {
    console.error('❌ Error testing input optimizer:', error);
    console.error('Stack:', error.stack);
  }
}

// Run the test
testInputOptimizer().catch(console.error);
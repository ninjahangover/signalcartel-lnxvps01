/**
 * Test the global engine status reporting
 */

async function testGlobalEngineStatus() {
  console.log('🧪 Testing Global Engine Status Reporting...');

  try {
    // Import services
    const { globalStratusEngine, getStratusEngineStatus } = await import('./src/lib/global-stratus-engine-service');
    const { pineScriptInputOptimizer } = await import('./src/lib/pine-script-input-optimizer');
    
    console.log('📦 Imported services successfully');
    
    // Check direct optimizer status
    const directOptimizerStatus = pineScriptInputOptimizer.isRunning();
    console.log(`🔍 Direct optimizer status: ${directOptimizerStatus ? 'RUNNING' : 'STOPPED'}`);
    
    // Check global engine status
    console.log('🔍 Getting global engine status...');
    const globalStatus = await getStratusEngineStatus();
    
    console.log('📊 Global Engine Status:');
    console.log(`  - Engine Running: ${globalStatus.isRunning}`);
    console.log(`  - Input Optimizer Active: ${globalStatus.components.inputOptimizer.active}`);
    console.log(`  - Strategy Count: ${globalStatus.components.inputOptimizer.strategyCount}`);
    console.log(`  - Optimization Count: ${globalStatus.components.inputOptimizer.optimizationCount}`);
    
    // Compare direct vs global status
    if (directOptimizerStatus !== globalStatus.components.inputOptimizer.active) {
      console.log('⚠️ STATUS MISMATCH DETECTED!');
      console.log(`   Direct check: ${directOptimizerStatus}`);
      console.log(`   Global check: ${globalStatus.components.inputOptimizer.active}`);
      console.log('💡 This explains why the dashboard shows STOPPED');
    } else {
      console.log('✅ Status checks are consistent');
    }
    
  } catch (error) {
    console.error('❌ Error testing global engine status:', error);
    console.error('Stack:', error.stack);
  }
}

// Run the test
testGlobalEngineStatus().catch(console.error);
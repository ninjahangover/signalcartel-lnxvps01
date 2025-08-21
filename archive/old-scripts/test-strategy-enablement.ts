/**
 * Test and fix strategy enablement
 */

async function testStrategyEnablement() {
  console.log('🧪 Testing Strategy Enablement...');

  try {
    // Check current strategies
    const { getAllStrategies, getActiveStrategies } = await import('./src/lib/strategy-registry');
    
    const allStrategies = getAllStrategies();
    const activeStrategies = getActiveStrategies();
    
    console.log(`📋 Total strategies: ${allStrategies.length}`);
    console.log(`📋 Active strategies: ${activeStrategies.length}`);
    
    console.log('\n📊 Strategy Status:');
    allStrategies.forEach(strategy => {
      console.log(`  - ${strategy.name}: ${strategy.status} (${strategy.symbol})`);
    });
    
    if (activeStrategies.length === 0) {
      console.log('\n⚠️ NO ACTIVE STRATEGIES FOUND!');
      console.log('💡 This explains why no alerts are being generated');
      
      // Try to activate one strategy for testing
      console.log('\n🔧 Attempting to activate first strategy for testing...');
      
      if (allStrategies.length > 0) {
        const firstStrategy = allStrategies[0];
        console.log(`🚀 Activating: ${firstStrategy.name}`);
        
        // Update strategy status
        firstStrategy.status = 'ACTIVE';
        
        // Verify it's now active
        const newActiveStrategies = getActiveStrategies();
        console.log(`✅ Active strategies after update: ${newActiveStrategies.length}`);
        
        if (newActiveStrategies.length > 0) {
          console.log('🎉 Strategy successfully activated!');
          
          // Test alert generation with active strategy
          console.log('\n🚨 Testing alert generation with active strategy...');
          
          const AlertGenerationEngine = (await import('./src/lib/alert-generation-engine')).default;
          const alertEngine = AlertGenerationEngine.getInstance();
          
          // Initialize the active strategy
          alertEngine.initializeStrategy(newActiveStrategies[0], newActiveStrategies[0].symbol);
          alertEngine.startEngine();
          
          console.log('✅ Alert generation initialized with active strategy');
          
          // Check if alerts can be generated
          const stats = alertEngine.getAlertStats();
          console.log(`📊 Alert engine stats:`, {
            totalAlerts: stats.totalAlerts,
            engineRunning: stats.engineRunning
          });
          
        } else {
          console.log('❌ Failed to activate strategy');
        }
      }
      
    } else {
      console.log('\n✅ Active strategies found!');
      
      activeStrategies.forEach(strategy => {
        console.log(`  ✅ ${strategy.name} (${strategy.symbol}) - Status: ${strategy.status}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Strategy enablement test failed:', error);
    console.error('Stack:', error.stack);
  }
}

// Run the test
testStrategyEnablement().catch(console.error);
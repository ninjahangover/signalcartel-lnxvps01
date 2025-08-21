/**
 * Debug alert generation with active strategies
 */

async function testAlertGenerationDebug() {
  console.log('🧪 Debugging Alert Generation with Active Strategies...');

  try {
    // 1. Get active strategies
    const { getActiveStrategies } = await import('./src/lib/strategy-registry');
    const activeStrategies = getActiveStrategies();
    
    console.log(`📋 Found ${activeStrategies.length} active strategies`);
    
    // 2. Initialize alert generation engine
    const AlertGenerationEngine = (await import('./src/lib/alert-generation-engine')).default;
    const alertEngine = AlertGenerationEngine.getInstance();
    
    console.log('🚨 Starting alert generation engine...');
    alertEngine.startEngine();
    
    // 3. Initialize strategies in alert engine
    console.log('📋 Initializing strategies in alert engine...');
    for (const strategy of activeStrategies) {
      try {
        alertEngine.initializeStrategy(strategy, strategy.symbol);
        console.log(`✅ Initialized: ${strategy.name} for ${strategy.symbol}`);
      } catch (error) {
        console.error(`❌ Failed to initialize ${strategy.name}:`, error.message);
      }
    }
    
    // 4. Check market data service
    console.log('📊 Checking market data service...');
    const marketDataService = await import('./src/lib/market-data-service');
    console.log('✅ Market data service imported');
    
    // 5. Simulate market data to trigger alerts
    console.log('🎯 Simulating market conditions to trigger alerts...');
    
    // Create test market data that should trigger RSI conditions
    const testMarketData = {
      symbol: 'BTCUSD',
      price: 50000, // Low price to potentially trigger oversold
      timestamp: new Date(),
      volume: 1000000,
      high: 51000,
      low: 49000,
      close: 50000,
      open: 50500
    };
    
    console.log(`📊 Simulating market data for ${testMarketData.symbol}: $${testMarketData.price}`);
    
    // Trigger market data processing manually
    // Note: This is to test if the alert logic works with specific market conditions
    try {
      // Get the first RSI strategy
      const rsiStrategy = activeStrategies.find(s => s.name.includes('RSI'));
      if (rsiStrategy) {
        console.log(`🧪 Testing alert conditions for: ${rsiStrategy.name}`);
        
        // Check current strategy inputs
        console.log('📋 Strategy inputs:', {
          rsi_length: rsiStrategy.inputs.rsi_length,
          rsi_overbought: rsiStrategy.inputs.rsi_overbought,
          rsi_oversold: rsiStrategy.inputs.rsi_oversold
        });
        
        // Check if alert engine has this strategy configured
        const stats = alertEngine.getAlertStats();
        console.log('📊 Alert engine stats:', {
          totalAlerts: stats.totalAlerts,
          recentAlerts: stats.recentAlerts.length,
          engineRunning: stats.engineRunning
        });
        
      } else {
        console.log('⚠️ No RSI strategy found in active strategies');
      }
      
    } catch (error) {
      console.error('❌ Error during alert testing:', error);
    }
    
    // 6. Wait for potential alerts
    console.log('⏰ Waiting 10 seconds for alert generation...');
    await new Promise(resolve => setTimeout(resolve, 10000));
    
    // 7. Check final results
    const finalStats = alertEngine.getAlertStats();
    console.log('\n📊 FINAL RESULTS:');
    console.log('=================');
    console.log(`🚨 Total alerts: ${finalStats.totalAlerts}`);
    console.log(`🚨 Recent alerts: ${finalStats.recentAlerts.length}`);
    console.log(`🔧 Engine running: ${finalStats.engineRunning}`);
    
    if (finalStats.recentAlerts.length > 0) {
      console.log('\n🎉 ALERTS GENERATED!');
      finalStats.recentAlerts.forEach(alert => {
        console.log(`  - ${alert.action} ${alert.symbol} at $${alert.price} (${alert.confidence}%)`);
      });
    } else {
      console.log('\n⚠️ NO ALERTS GENERATED');
      console.log('💡 Possible reasons:');
      console.log('   - Market conditions not triggering strategy signals');
      console.log('   - Alert engine not receiving market data');
      console.log('   - Strategy evaluation logic not working');
      console.log('   - Market data subscription not active');
    }
    
  } catch (error) {
    console.error('❌ Alert generation debug failed:', error);
    console.error('Stack:', error.stack);
  }
}

// Run the test
testAlertGenerationDebug().catch(console.error);
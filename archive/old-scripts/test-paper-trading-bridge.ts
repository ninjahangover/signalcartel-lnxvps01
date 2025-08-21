/**
 * Test the bridge between alert generation and paper trading
 */

async function testPaperTradingBridge() {
  console.log('🧪 Testing Paper Trading Bridge...');

  try {
    // Import the alert generation engine
    const AlertGenerationEngine = (await import('./src/lib/alert-generation-engine')).default;
    const alertEngine = AlertGenerationEngine.getInstance();
    
    console.log('📦 Alert generation engine imported');
    
    // Start the engine
    alertEngine.startEngine();
    console.log('🚀 Alert generation engine started');
    
    // Check if it's running
    const isRunning = alertEngine.isEngineRunning();
    console.log(`🔍 Engine running: ${isRunning}`);
    
    // Get alert stats
    const stats = alertEngine.getAlertStats();
    console.log('📊 Alert stats:', {
      totalAlerts: stats.totalAlerts,
      recentAlerts: stats.recentAlerts.length,
      engineRunning: stats.engineRunning
    });
    
    // Check Alpaca integration
    const { alpacaStratusIntegration } = await import('./src/lib/alpaca-stratus-integration');
    console.log('📦 Alpaca integration imported');
    
    // Test a simulated webhook payload
    const testPayload = {
      strategy_id: 'test-strategy',
      action: 'BUY',
      ticker: 'AAPL',
      symbol: 'AAPL',
      price: 150.0,
      quantity: 1,
      confidence: 85,
      strategy: {
        order_action: 'buy',
        order_type: 'market',
        order_price: '150.0',
        order_contracts: '1',
        type: 'buy',
        volume: '1',
        pair: 'AAPL',
        validate: 'false'
      }
    };
    
    console.log('🧪 Testing paper trade execution...');
    const execution = await alpacaStratusIntegration.processWebhookTrade(testPayload);
    
    if (execution) {
      console.log('✅ Paper trade executed successfully!');
      console.log(`📊 Trade details:`, {
        symbol: execution.symbol,
        action: execution.action,
        quantity: execution.quantity,
        price: execution.price,
        alpacaOrderId: execution.alpacaOrderId
      });
    } else {
      console.log('❌ Paper trade execution failed');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    console.error('Stack:', error.stack);
  }
}

// Run the test
testPaperTradingBridge().catch(console.error);
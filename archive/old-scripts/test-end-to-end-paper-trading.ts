/**
 * Complete end-to-end test of paper trading system
 */

async function testEndToEndPaperTrading() {
  console.log('🧪 Testing End-to-End Paper Trading System...');

  try {
    // 1. Initialize Alpaca Integration
    console.log('🦙 Step 1: Initialize Alpaca Integration...');
    const { alpacaStratusIntegration } = await import('./src/lib/alpaca-stratus-integration');
    
    await alpacaStratusIntegration.initialize('test-user-123');
    console.log('✅ Alpaca integration initialized');
    
    // 2. Start optimization engine
    console.log('⚡ Step 2: Start optimization engine...');
    await alpacaStratusIntegration.startOptimizationEngine();
    console.log('✅ Optimization engine started');
    
    // 3. Set up a test strategy
    console.log('📋 Step 3: Set up test strategy...');
    const testStrategy = {
      strategyId: 'rsi-test-strategy',
      name: 'RSI Test Strategy',
      symbol: 'AAPL',
      timeframe: '1m',
      rsiPeriod: 14,
      rsiOverbought: 70,
      rsiOversold: 30,
      macdFast: 12,
      macdSlow: 26,
      macdSignal: 9,
      stopLossPercent: 2.0,
      takeProfitPercent: 4.0,
      positionSize: 1,
      enabled: true,
      lastOptimized: new Date()
    };
    
    // Add strategy to the integration
    await alpacaStratusIntegration.addStrategy(testStrategy);
    console.log('✅ Test strategy added');
    
    // 4. Test trade execution
    console.log('📈 Step 4: Test trade execution...');
    const testTrade = {
      strategy_id: 'rsi-test-strategy',
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
    
    const execution = await alpacaStratusIntegration.processWebhookTrade(testTrade);
    
    if (execution) {
      console.log('🎉 SUCCESS! End-to-end paper trading is working!');
      console.log(`📊 Trade executed:`, {
        symbol: execution.symbol,
        action: execution.action,
        quantity: execution.quantity,
        price: execution.price,
        alpacaOrderId: execution.alpacaOrderId
      });
    } else {
      console.log('❌ Trade execution failed');
    }
    
    // 5. Get trade history
    console.log('📋 Step 5: Check trade history...');
    const history = alpacaStratusIntegration.getTradeHistory();
    console.log(`📊 Trade history: ${history ? history.length : 0} trades`);
    
    process.exit(0);
    
  } catch (error) {
    console.error('❌ End-to-end test failed:', error);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

// Run the test
testEndToEndPaperTrading();
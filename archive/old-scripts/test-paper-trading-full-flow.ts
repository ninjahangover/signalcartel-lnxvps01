/**
 * Test the complete paper trading flow with real credentials
 */

async function testFullPaperTradingFlow() {
  console.log('🧪 Testing Full Paper Trading Flow with Credentials...');

  try {
    // Check environment variables
    console.log('🔍 Step 1: Check credentials...');
    const hasKey = !!process.env.NEXT_PUBLIC_ALPACA_PAPER_API_KEY;
    const hasSecret = !!process.env.NEXT_PUBLIC_ALPACA_PAPER_API_SECRET;
    console.log(`📋 API Key present: ${hasKey}`);
    console.log(`📋 API Secret present: ${hasSecret}`);
    
    if (!hasKey || !hasSecret) {
      console.log('❌ Missing credentials in environment');
      return;
    }

    // Test Alpaca paper trading service directly
    console.log('🦙 Step 2: Test Alpaca service...');
    const { alpacaPaperTradingService } = await import('./src/lib/alpaca-paper-trading-service');
    
    // Initialize account
    const account = await alpacaPaperTradingService.initializeAccount(
      'test-user-123',
      process.env.NEXT_PUBLIC_ALPACA_PAPER_API_KEY!,
      process.env.NEXT_PUBLIC_ALPACA_PAPER_API_SECRET!
    );
    
    if (account) {
      console.log('✅ Alpaca account initialized successfully');
      console.log(`💰 Account balance: $${account.currentBalance.toLocaleString()}`);
      console.log(`💳 Account ID: ${account.alpacaAccountId}`);
    } else {
      console.log('❌ Failed to initialize Alpaca account');
      return;
    }

    // Test Alpaca-Stratus Integration
    console.log('⚡ Step 3: Test Alpaca-Stratus Integration...');
    const { alpacaStratusIntegration } = await import('./src/lib/alpaca-stratus-integration');
    
    await alpacaStratusIntegration.initialize('test-user-123');
    console.log('✅ Alpaca-Stratus integration initialized');

    // Test a paper trade execution
    console.log('📈 Step 4: Test paper trade execution...');
    const testTradePayload = {
      strategy_id: 'default', // Use default strategy
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

    const execution = await alpacaStratusIntegration.processWebhookTrade(testTradePayload);
    
    if (execution) {
      console.log('🎉 SUCCESS! Paper trade executed!');
      console.log('📊 Execution details:', {
        symbol: execution.symbol,
        action: execution.action,
        quantity: execution.quantity,
        price: execution.price,
        alpacaOrderId: execution.alpacaOrderId,
        executionTime: execution.executionTime
      });
    } else {
      console.log('❌ Paper trade execution failed');
    }

    // Test Alert Generation Engine
    console.log('🚨 Step 5: Test Alert Generation Engine...');
    const AlertGenerationEngine = (await import('./src/lib/alert-generation-engine')).default;
    const alertEngine = AlertGenerationEngine.getInstance();
    
    alertEngine.startEngine();
    console.log('✅ Alert generation engine started');
    
    const stats = alertEngine.getAlertStats();
    console.log('📊 Alert stats:', {
      totalAlerts: stats.totalAlerts,
      recentAlerts: stats.recentAlerts.length,
      engineRunning: stats.engineRunning
    });

    // Check if strategies are initialized
    console.log('📋 Step 6: Check strategy initialization...');
    const { getAllStrategies } = await import('./src/lib/strategy-registry');
    const strategies = getAllStrategies();
    console.log(`📊 Registered strategies: ${strategies.length}`);
    
    strategies.forEach(strategy => {
      console.log(`  - ${strategy.name} (${strategy.id}): ${strategy.enabled ? 'ENABLED' : 'DISABLED'}`);
    });

    if (strategies.length === 0) {
      console.log('⚠️ No strategies found - this might prevent signal generation');
    }

    console.log('\n🎯 SUMMARY:');
    console.log('=================');
    console.log(`✅ Alpaca credentials: Working`);
    console.log(`✅ Paper trading service: Working`);
    console.log(`✅ Alpaca-Stratus integration: Working`);
    console.log(`${execution ? '✅' : '❌'} Trade execution: ${execution ? 'Working' : 'Failed'}`);
    console.log(`✅ Alert generation engine: Working`);
    console.log(`${strategies.length > 0 ? '✅' : '⚠️'} Strategies registered: ${strategies.length}`);
    
    if (execution && strategies.length > 0) {
      console.log('\n🚀 PAPER TRADING SYSTEM IS READY!');
      console.log('The system should now automatically:');
      console.log('1. Monitor market data');
      console.log('2. Evaluate strategy conditions');
      console.log('3. Generate alerts when conditions are met');
      console.log('4. Execute paper trades via Alpaca API');
    } else {
      console.log('\n⚠️ Some components need attention for full automation');
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
    console.error('Stack:', error.stack);
  }
}

// Run the test
testFullPaperTradingFlow().catch(console.error);
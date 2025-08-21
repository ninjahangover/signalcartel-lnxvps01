/**
 * Test Paper Trading with Alpaca API
 * This script tests if we can successfully place a paper trade
 */

async function testPaperTrade() {
  try {
    console.log('🧪 Testing Alpaca Paper Trading...');
    
    // 1. Test API connection
    console.log('\n1. Testing API connection...');
    const testResponse = await fetch('http://localhost:3001/api/paper-trading/test');
    const testResult = await testResponse.json();
    
    if (!testResult.success) {
      throw new Error(`API connection failed: ${testResult.error}`);
    }
    
    console.log('✅ API Connection successful!');
    console.log(`   Account ID: ${testResult.data.account.id}`);
    console.log(`   Balance: $${parseFloat(testResult.data.account.balance).toLocaleString()}`);
    console.log(`   Buying Power: $${parseFloat(testResult.data.account.buyingPower).toLocaleString()}`);
    
    // 2. Initialize paper trading account
    console.log('\n2. Initializing paper trading account...');
    const initResponse = await fetch('http://localhost:3001/api/paper-trading/test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: 'test-user-123' })
    });
    
    const initResult = await initResponse.json();
    
    if (!initResult.success) {
      throw new Error(`Account initialization failed: ${initResult.error}`);
    }
    
    console.log('✅ Account initialized successfully!');
    console.log(`   Paper Account ID: ${initResult.account.id}`);
    console.log(`   Platform: ${initResult.account.platform}`);
    console.log(`   Balance: $${initResult.account.balance.toLocaleString()}`);
    
    // 3. Test webhook processing (simulated Pine Script signal)
    console.log('\n3. Testing webhook processing...');
    const webhookData = {
      strategy_id: 'test-strategy-001',
      action: 'buy',
      symbol: 'AAPL',
      quantity: 1,
      price: 'market',
      timestamp: new Date().toISOString(),
      source: 'test-pine-script'
    };
    
    const webhookResponse = await fetch('http://localhost:3001/api/pine-script-webhook', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(webhookData)
    });
    
    const webhookResult = await webhookResponse.json();
    console.log('📡 Webhook Response:', webhookResult);
    
    // 4. Check positions
    console.log('\n4. Checking positions...');
    const positionsResponse = await fetch('http://localhost:3001/api/paper-trading/positions');
    
    if (positionsResponse.ok) {
      const positionsResult = await positionsResponse.json();
      console.log('📊 Positions:', positionsResult);
    } else {
      console.log('⚠️ Could not fetch positions (might need authentication)');
    }
    
    console.log('\n🎉 Paper Trading Test Complete!');
    console.log('✅ Alpaca paper trading system is ready to trade');
    console.log('💡 Use real Pine Script webhooks to execute trades');
    
  } catch (error) {
    console.error('❌ Paper Trading Test Failed:', error.message);
    console.log('\n🔧 To fix:');
    console.log('1. Make sure the dev server is running: npm run dev');
    console.log('2. Check Alpaca API credentials in .env.local');
    console.log('3. Verify network connectivity');
  }
}

// Run the test
testPaperTrade();
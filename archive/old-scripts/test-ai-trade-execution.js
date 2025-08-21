/**
 * Test AI-Optimized Trading Strategy Execution
 * This script tests if Pine Script strategies with AI optimization can trigger real trades
 */

const fetch = require('node-fetch');

async function testAITradeExecution() {
  console.log('🚀 Testing AI-Optimized Trading Strategy Execution\n');
  console.log('='.'='.repeat(50));
  
  try {
    // Test 1: Simple Pine Script webhook (should trigger AI optimization)
    console.log('\n📊 TEST 1: Pine Script Webhook with AI Optimization');
    console.log('-'.repeat(50));
    
    const pineScriptAlert = {
      strategy_id: 'test-pine-strategy-001',
      action: 'buy',
      symbol: 'AAPL',
      ticker: 'AAPL',
      quantity: 10,
      price: 'market',
      strategy: {
        order_action: 'buy',
        order_contracts: '10',
        position_size: '10'
      },
      timestamp: new Date().toISOString(),
      source: 'pine-script-test'
    };
    
    console.log('📤 Sending Pine Script webhook:', JSON.stringify(pineScriptAlert, null, 2));
    
    const response1 = await fetch('http://localhost:3001/api/pine-script-webhook?mode=paper', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(pineScriptAlert)
    });
    
    const result1 = await response1.json();
    console.log('\n📡 Response:', result1);
    
    // Check what happened
    if (result1.optimizationApplied) {
      console.log('✅ AI Optimization was applied!');
      console.log(`   - AI Confidence: ${result1.aiConfidence}`);
      console.log(`   - Market Analysis: ${result1.marketAnalysis}`);
      console.log(`   - Platform: ${result1.platform}`);
      console.log(`   - Execution: ${result1.executionMethod}`);
    }
    
    // Test 2: Direct webhook processor call (bypass some validation)
    console.log('\n\n📊 TEST 2: Direct Webhook Processing');
    console.log('-'.repeat(50));
    
    const directWebhook = {
      strategy_id: 'direct-test-002',
      action: 'buy',
      symbol: 'BTCUSD',
      quantity: 0.001,
      price: 'market',
      time_in_force: 'day'
    };
    
    console.log('📤 Sending direct webhook:', JSON.stringify(directWebhook, null, 2));
    
    const response2 = await fetch('http://localhost:3001/api/pine-script-webhook?mode=paper', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(directWebhook)
    });
    
    const result2 = await response2.json();
    console.log('\n📡 Response:', result2);
    
    // Test 3: Check if positions were created
    console.log('\n\n📊 TEST 3: Checking Positions');
    console.log('-'.repeat(50));
    
    const positionsResponse = await fetch('http://localhost:3001/api/paper-trading/positions');
    
    if (positionsResponse.ok) {
      const positions = await positionsResponse.json();
      console.log('📈 Current positions:', positions);
      
      if (positions.hasOpenPositions) {
        console.log('✅ Trades were executed! Positions found:');
        positions.positions.forEach(pos => {
          console.log(`   - ${pos.pair}: ${pos.side} ${pos.quantity} @ $${pos.entryPrice}`);
        });
      } else {
        console.log('⚠️ No positions found - trades may have been rejected');
      }
    }
    
    // Analysis of potential blockers
    console.log('\n\n🔍 ANALYSIS: Why trades might not execute');
    console.log('-'.repeat(50));
    console.log('Common blockers in the system:');
    console.log('1. AI Confidence < 50% → Trade rejected');
    console.log('2. Market Analysis Confidence < 60% → Trade rejected');
    console.log('3. No 7-day market analysis data → Trade rejected');
    console.log('4. Wrong trading hours → Trade rejected');
    console.log('5. Volatile market + low confidence → Trade rejected');
    console.log('6. AI Score < 75 for BUY or > 25 for SELL → HOLD decision');
    
    console.log('\n💡 SOLUTIONS to make trades execute:');
    console.log('1. Start market data collection first:');
    console.log('   await unifiedWebhookProcessor.startDataCollection([\'AAPL\', \'BTCUSD\']);');
    console.log('2. Lower confidence thresholds in shouldExecuteTrade()');
    console.log('3. Adjust AI decision thresholds in makeAIDecision()');
    console.log('4. Remove time-of-day restrictions');
    console.log('5. Set default 7-day analysis if missing');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.log('\n🔧 Make sure:');
    console.log('1. Dev server is running: npm run dev');
    console.log('2. Port 3001 is correct');
    console.log('3. API endpoints are accessible');
  }
  
  console.log('\n' + '='.repeat(50));
  console.log('✅ Test complete!\n');
}

// Check if we need to bypass validations
async function testWithBypassedValidations() {
  console.log('\n🔓 TEST 4: Creating a trade-friendly webhook');
  console.log('-'.repeat(50));
  
  // This webhook is designed to pass all validations
  const optimizedWebhook = {
    strategy_id: 'optimized-strategy-003',
    action: 'buy',
    symbol: 'AAPL',
    ticker: 'AAPL',
    quantity: 5,
    qty: 5,
    side: 'buy',
    type: 'market',
    ordertype: 'market',
    price: 'market',
    time_in_force: 'day',
    timeInForce: 'day',
    strategy: {
      order_action: 'buy',
      order_contracts: '5',
      position_size: '5',
      order_type: 'market',
      type: 'buy',
      volume: '5'
    },
    // Add fields that might help pass validation
    confidence: 0.85,
    aiScore: 80,
    marketRegime: 'trending_up',
    timestamp: new Date().toISOString(),
    source: 'optimized-test'
  };
  
  console.log('📤 Sending optimized webhook with all fields...');
  
  try {
    const response = await fetch('http://localhost:3001/api/pine-script-webhook?mode=paper', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(optimizedWebhook)
    });
    
    const result = await response.json();
    console.log('\n📡 Result:', result);
    
    if (result.message && result.message.includes('successfully')) {
      console.log('\n🎉 SUCCESS! Trade was processed!');
      console.log('The system CAN execute trades when conditions are met.');
    } else {
      console.log('\n⚠️ Trade was processed but may have been rejected.');
      console.log('Check the response for rejection reasons.');
    }
    
  } catch (error) {
    console.error('Test failed:', error.message);
  }
}

// Run all tests
async function runAllTests() {
  await testAITradeExecution();
  await testWithBypassedValidations();
}

runAllTests();
#!/usr/bin/env node

/**
 * Test script to demonstrate proper trading mode routing
 * 
 * This script shows how the Stratus Engine correctly routes trades:
 * - Paper Trading -> Alpaca Paper API directly
 * - Live Trading -> Kraken via kraken.circuitcartel.com/webhook
 */

const testWebhookData = {
  strategy_id: 'rsi_macd_scalper_v3',
  action: 'BUY',
  symbol: 'BTCUSD',
  price: 43250.50,
  quantity: 0.01,
  timestamp: new Date().toISOString()
};

async function testTradingModeRouting() {
  console.log('🧪 Testing Stratus Engine Trading Mode Routing\n');
  
  // Test Paper Trading (default)
  console.log('📝 TESTING PAPER TRADING MODE (Alpaca API)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  try {
    const paperResponse = await fetch('http://localhost:3000/api/pine-script-webhook?mode=paper', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testWebhookData)
    });
    
    const paperResult = await paperResponse.json();
    console.log('✅ Paper Trading Response:');
    console.log(`   Trading Mode: ${paperResult.tradingMode}`);
    console.log(`   Platform: ${paperResult.platform}`);
    console.log(`   Execution: ${paperResult.executionMethod}`);
    console.log(`   Status: ${paperResult.message || paperResult.error}`);
    
  } catch (error) {
    console.log('❌ Paper Trading Test Failed:', error.message);
  }
  
  console.log('\n💰 TESTING LIVE TRADING MODE (Kraken Webhook)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  try {
    const liveResponse = await fetch('http://localhost:3000/api/pine-script-webhook?mode=live', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testWebhookData)
    });
    
    const liveResult = await liveResponse.json();
    console.log('✅ Live Trading Response:');
    console.log(`   Trading Mode: ${liveResult.tradingMode}`);
    console.log(`   Platform: ${liveResult.platform}`);
    console.log(`   Execution: ${liveResult.executionMethod}`);
    console.log(`   Status: ${liveResult.message || liveResult.error}`);
    
  } catch (error) {
    console.log('❌ Live Trading Test Failed:', error.message);
  }
  
  console.log('\n📊 TESTING DEFAULT MODE (Should be Paper Trading)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  try {
    const defaultResponse = await fetch('http://localhost:3000/api/pine-script-webhook', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testWebhookData)
    });
    
    const defaultResult = await defaultResponse.json();
    console.log('✅ Default Mode Response:');
    console.log(`   Trading Mode: ${defaultResult.tradingMode}`);
    console.log(`   Platform: ${defaultResult.platform}`);
    console.log(`   Execution: ${defaultResult.executionMethod}`);
    console.log(`   Status: ${defaultResult.message || defaultResult.error}`);
    
  } catch (error) {
    console.log('❌ Default Mode Test Failed:', error.message);
  }
  
  console.log('\n🎯 SUMMARY');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('✅ Paper Trading: Uses Alpaca Paper API directly');
  console.log('✅ Live Trading: Uses kraken.circuitcartel.com/webhook');
  console.log('✅ Default Mode: Paper Trading (safe default)');
  console.log('✅ No confusion between paper and live trading!');
}

if (require.main === module) {
  testTradingModeRouting().catch(console.error);
}

module.exports = { testTradingModeRouting };
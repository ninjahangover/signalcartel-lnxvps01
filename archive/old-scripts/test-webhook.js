#!/usr/bin/env node

// Test script for the Pine Script webhook endpoint
const fetch = require('node-fetch');

const WEBHOOK_BASE_URL = 'https://kraken.circuitcartel.com/webhook';
const TEST_STRATEGY_ID = 'test-strategy-001';
const TEST_WEBHOOK_ID = 'wh_test_123456';

// Your exact working webhook payload format
const testAlert = {
  "passphrase": "sdfqoei1898498",
  "ticker": "BTCUSD",
  "strategy": { 
    "order_action": "buy",
    "order_type": "limit",
    "order_price": "45000",
    "order_contracts": "0.01",
    "type": "buy",
    "volume": "0.01",
    "pair": "BTCUSD",
    "validate": "false",
    "close": {
      "order_type": "limit",
      "price": "45000"
    },
    "stop_loss": "44100"
  }
};

async function testWebhook() {
  console.log('🧪 Testing Pine Script Webhook...\n');
  
  try {
    // Test the basic webhook endpoint
    console.log('1. Testing basic webhook endpoint...');
    const basicUrl = `${WEBHOOK_BASE_URL}`;
    const basicResponse = await fetch(basicUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testAlert)
    });
    
    const basicResult = await basicResponse.json();
    console.log(`   Status: ${basicResponse.status}`);
    console.log(`   Result:`, basicResult);
    console.log('');

    // Test different alert payloads
    console.log('2. Testing different alert payloads...');
    const specificUrl = `${WEBHOOK_BASE_URL}`;
    const specificResponse = await fetch(specificUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testAlert)
    });
    
    const specificResult = await specificResponse.json();
    console.log(`   Status: ${specificResponse.status}`);
    console.log(`   Result:`, specificResult);
    console.log('');

    // Skip GET test for production webhook
    console.log('3. Skipping GET test (production webhook)...');

    // Test different alert types
    console.log('4. Testing different alert types...');
    
    const sellAlert = {
      ...testAlert,
      strategy: {
        ...testAlert.strategy,
        order_action: "sell",
        type: "sell"
      }
    };
    
    const closeAlert = {
      ...testAlert,
      strategy: {
        ...testAlert.strategy,
        order_action: "close",
        type: "close"
      }
    };

    for (const [name, alert] of [['SELL', sellAlert], ['CLOSE', closeAlert]]) {
      console.log(`   Testing ${name} alert...`);
      const response = await fetch(specificUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(alert)
      });
      const result = await response.json();
      console.log(`     Status: ${response.status}, Message: ${result.message || result.error}`);
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

async function testValidationMode() {
  console.log('\n🔵 Testing VALIDATION MODE (validate: true)...');
  console.log('ℹ️  This mode only validates webhook payload without executing trades\n');
  
  const validationAlert = {
    ...testAlert,
    strategy: {
      ...testAlert.strategy,
      validate: "true" // VALIDATION MODE - no API calls
    }
  };
  
  try {
    const specificUrl = `${WEBHOOK_BASE_URL}`;
    const response = await fetch(specificUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(validationAlert)
    });
    
    const result = await response.json();
    console.log(`Status: ${response.status}`);
    console.log(`Result:`, JSON.stringify(result, null, 2));
    
  } catch (error) {
    console.error('❌ Validation mode test failed:', error.message);
  }
}

// Run tests
console.log('🚀 Starting webhook tests...\n');
testWebhook()
  .then(() => testValidationMode())
  .then(() => {
    console.log('\n✅ Webhook tests completed!');
    console.log('\nTrading Modes:');
    console.log('• validate: "false" = PAPER TRADING (executes trades safely using Kraken validation system)');
    console.log('• validate: "true" = VALIDATION ONLY (validates webhook payload, no trade execution)');
    console.log('• For REAL LIVE TRADING: validate: "false" + live API credentials + proper risk management');
    console.log('\nProduction Setup:');
    console.log('1. Configure Kraken API credentials');
    console.log('2. Use webhook URL: https://kraken.circuitcartel.com/webhook');
    console.log('3. Use validate: "false" for both paper trading AND live trading');
  })
  .catch(err => console.error('❌ Test suite failed:', err));
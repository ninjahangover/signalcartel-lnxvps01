/**
 * Test NTFY Alerts - Super Simple!
 */

import { ntfyAlerts } from './src/lib/ntfy-alerts';

async function testNtfy() {
  console.log('📱 TESTING NTFY ALERTS');
  console.log('=' + '='.repeat(30));

  // Show setup instructions
  console.log(ntfyAlerts.getSetupInstructions());
  
  console.log('\n🧪 Sending test alert...');
  const success = await ntfyAlerts.sendTestAlert();
  
  if (success) {
    console.log('✅ Test alert sent! Check your phone!');
  } else {
    console.log('❌ Test alert failed');
  }

  // Test trade alert
  console.log('\n📈 Sending test trade alert...');
  const tradeSuccess = await ntfyAlerts.sendTradeAlert({
    action: 'BUY',
    symbol: 'BTCUSD',
    price: 114000,
    quantity: 0.001,
    strategy: 'Claude Quantum Oscillator',
    confidence: 85,
    mode: 'paper',
    orderId: 'test_123'
  });

  if (tradeSuccess) {
    console.log('✅ Trade alert sent! Check your phone for the BUY signal!');
  } else {
    console.log('❌ Trade alert failed');
  }

  console.log('\n🎉 NTFY setup complete! No more Telegram headaches!');
}

testNtfy();
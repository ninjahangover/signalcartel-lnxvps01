#!/usr/bin/env node
// Test SigNoz Integration
// Sends sample metrics to verify telemetry is working

import { 
  initTelemetry, 
  trackTradeExecution, 
  trackAIPerformance, 
  trackDatabaseQuery,
  updateSystemHealth,
  updateTradingPhase,
  updateWinRate,
  updateProfitLoss 
} from '../../src/lib/telemetry/signoz-telemetry';

console.log('🧪 Testing SigNoz Integration...\n');

// Initialize telemetry
const sdk = initTelemetry();

async function runTests() {
  console.log('📊 Sending test metrics to SigNoz...\n');
  
  // Test 1: Trading metrics
  console.log('1️⃣ Testing trading metrics...');
  trackTradeExecution('test-strategy', 'BTC/USD', 'buy', 0.1, 65000, true);
  trackTradeExecution('test-strategy', 'ETH/USD', 'sell', 0.5, 3200, true);
  trackTradeExecution('test-strategy', 'SOL/USD', 'buy', 10, 135, false);
  console.log('   ✅ Sent 3 test trades\n');
  
  // Test 2: AI Performance metrics
  console.log('2️⃣ Testing AI performance metrics...');
  trackAIPerformance('sentiment-analysis', 250, 0.85, 0.72);
  trackAIPerformance('mathematical-intuition', 180, 0.92, 0.68);
  trackAIPerformance('orderbook-intelligence', 320, 0.78);
  console.log('   ✅ Sent AI performance data\n');
  
  // Test 3: Database metrics
  console.log('3️⃣ Testing database metrics...');
  trackDatabaseQuery('select_strategies', 45, true);
  trackDatabaseQuery('insert_trade', 12, true);
  trackDatabaseQuery('update_position', 89, false);
  trackDatabaseQuery('complex_aggregation', 234, true);
  console.log('   ✅ Sent database query metrics\n');
  
  // Test 4: System health
  console.log('4️⃣ Testing system health metrics...');
  updateSystemHealth(65.5, 42.3, 8);
  console.log('   ✅ Sent system health data\n');
  
  // Test 5: Business KPIs
  console.log('5️⃣ Testing business KPIs...');
  updateTradingPhase(3);
  updateWinRate('quantum-oscillator', 0.73);
  updateWinRate('bollinger-breakout', 0.68);
  updateProfitLoss(1500.75, 'quantum-oscillator');
  updateProfitLoss(-250.50, 'rsi-pullback');
  console.log('   ✅ Sent business KPIs\n');
  
  // Wait for metrics to be exported
  console.log('⏳ Waiting 15 seconds for metrics to export...');
  await new Promise(resolve => setTimeout(resolve, 15000));
  
  console.log('\n✅ Test complete! Check SigNoz dashboard for results:');
  console.log('   http://localhost:3301');
  console.log('   Login: gaylen@signalcartel.io / admin123');
  console.log('\n📊 Look for:');
  console.log('   • Service: signalcartel-trading');
  console.log('   • Traces: HTTP requests and database queries');
  console.log('   • Metrics: trades_executed_total, ai_response_time_ms, etc.');
  
  // Shutdown
  await sdk.shutdown();
  console.log('\n🛑 Telemetry shutdown complete');
  process.exit(0);
}

// Run the tests
runTests().catch(error => {
  console.error('❌ Error running tests:', error);
  process.exit(1);
});
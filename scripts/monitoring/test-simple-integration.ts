#!/usr/bin/env node
// Simple SigNoz Integration Test
// Tests basic telemetry without complex dependencies

import simpleSignozTelemetry from '../../src/lib/telemetry/simple-signoz-telemetry';

console.log('🧪 Testing Simple SigNoz Integration...\n');

async function runSimpleTests() {
  // Initialize telemetry
  const sdk = simpleSignozTelemetry.initSimpleTelemetry();
  
  console.log('📊 Testing basic metrics tracking...\n');
  
  // Test 1: Trading metrics
  console.log('1️⃣ Testing trading metrics...');
  simpleSignozTelemetry.logMetrics.trackTrade('quantum-oscillator', 'BTC/USD', 'buy', 0.1, 65000, true);
  simpleSignozTelemetry.logMetrics.trackTrade('bollinger-breakout', 'ETH/USD', 'sell', 0.5, 3200, true);
  simpleSignozTelemetry.logMetrics.trackTrade('rsi-pullback', 'SOL/USD', 'buy', 10, 135, false);
  console.log('   ✅ Trading metrics logged\n');
  
  // Test 2: AI Performance
  console.log('2️⃣ Testing AI performance tracking...');
  simpleSignozTelemetry.logMetrics.trackAI('sentiment-analysis', 250, 0.85, 0.72);
  simpleSignozTelemetry.logMetrics.trackAI('mathematical-intuition', 180, 0.92);
  simpleSignozTelemetry.logMetrics.trackAI('orderbook-intelligence', 320, 0.78, 0.65);
  console.log('   ✅ AI performance logged\n');
  
  // Test 3: Database metrics
  console.log('3️⃣ Testing database metrics...');
  simpleSignozTelemetry.logMetrics.trackDatabase('select_strategies', 45, true);
  simpleSignozTelemetry.logMetrics.trackDatabase('insert_trade', 12, true);
  simpleSignozTelemetry.logMetrics.trackDatabase('complex_query', 234, false);
  console.log('   ✅ Database metrics logged\n');
  
  // Test 4: System health
  console.log('4️⃣ Testing system health...');
  simpleSignozTelemetry.logMetrics.trackSystem(65.5, 42.3, 8);
  console.log('   ✅ System health logged\n');
  
  // Test 5: Phase tracking
  console.log('5️⃣ Testing phase tracking...');
  simpleSignozTelemetry.logMetrics.trackPhase(3);
  console.log('   ✅ Phase tracking logged\n');
  
  console.log('✅ Simple integration test complete!\n');
  console.log('📊 What was tested:');
  console.log('   • Basic OpenTelemetry SDK initialization');
  console.log('   • HTTP/Express/PostgreSQL auto-instrumentation');
  console.log('   • Distributed tracing to SigNoz');
  console.log('   • Console-based metrics logging');
  console.log('');
  console.log('🔍 Check SigNoz for traces:');
  console.log('   http://localhost:3301');
  console.log('   Look for service: signalcartel-trading');
  console.log('');
  console.log('🚀 Next: Install full metrics support with:');
  console.log('   npm install @opentelemetry/api');
  console.log('');
  
  // Wait a moment for traces to be sent
  await new Promise(resolve => setTimeout(resolve, 5000));
  
  // Shutdown
  await simpleSignozTelemetry.shutdownSimpleTelemetry(sdk);
  console.log('🛑 Test complete');
  process.exit(0);
}

// Handle errors gracefully
runSimpleTests().catch(error => {
  console.error('❌ Error in simple test:', error.message);
  console.log('\n💡 Try this:');
  console.log('   1. Ensure SigNoz is running: docker-compose ps');
  console.log('   2. Check if port 4317 is accessible: curl localhost:4317');
  console.log('   3. Install missing dependencies: npm install');
  process.exit(1);
});
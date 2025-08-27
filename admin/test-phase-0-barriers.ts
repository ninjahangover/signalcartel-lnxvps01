#!/usr/bin/env npx tsx
/**
 * Test Phase 0 Ultra-Low Barriers Configuration
 * Verify that Phase 0 generates more trades with minimal barriers
 */

import { phaseManager } from './src/lib/quantum-forge-phase-config';
import { positionService } from './src/lib/position-management/position-service';

// Get real price helper
async function getRealPrice(symbol: string): Promise<number> {
  const { realTimePriceFetcher } = await import('./src/lib/real-time-price-fetcher');
  const priceData = await realTimePriceFetcher.getCurrentPrice(symbol);
  
  if (!priceData.success || priceData.price <= 0) {
    throw new Error(`❌ Cannot get real price for ${symbol}: ${priceData.error || 'Invalid price'}`);
  }
  
  return priceData.price;
}

async function testPhase0Barriers() {
  console.log('🎯 TESTING PHASE 0 ULTRA-LOW BARRIERS');
  console.log('=' .repeat(80));
  
  try {
    // Force Phase 0 configuration
    phaseManager.setManualPhase(0);
    
    // Get current phase config
    const currentPhase = await phaseManager.getCurrentPhase();
    console.log('📊 PHASE 0 CONFIGURATION:');
    console.log(`   Phase: ${currentPhase.phase} - ${currentPhase.name}`);
    console.log(`   Confidence Threshold: ${(currentPhase.features.confidenceThreshold * 100).toFixed(1)}% (Ultra-low!)`);
    console.log(`   Position Sizing: ${(currentPhase.features.positionSizing * 100).toFixed(1)}% per trade`);
    console.log(`   Stop Loss: ${currentPhase.features.stopLossPercent}%`);
    console.log(`   Take Profit: ${currentPhase.features.takeProfitPercent}%`);
    console.log(`   Sentiment Enabled: ${currentPhase.features.sentimentEnabled}`);
    console.log(`   Multi-Layer AI: ${currentPhase.features.multiLayerAIEnabled}`);
    console.log(`   Description: ${currentPhase.description}`);
    
    console.log('\n🚀 TESTING SIGNAL GENERATION WITH ULTRA-LOW BARRIERS...');
    
    // Test signal 1: Very low confidence (should pass in Phase 0)
    const lowConfidenceSignal = {
      action: 'BUY' as const,
      symbol: 'BTCUSD',
      price: await getRealPrice('BTCUSD'),
      confidence: 0.15, // 15% - very low but should pass 10% threshold
      quantity: 0.001,
      strategy: 'phase-0-test',
      reason: 'Ultra-low barrier test signal',
      timestamp: new Date()
    };
    
    console.log(`\n📈 Testing 15% confidence signal (should PASS in Phase 0):`);
    console.log(`   Confidence: ${(lowConfidenceSignal.confidence * 100).toFixed(1)}%`);
    console.log(`   Phase 0 Threshold: ${(currentPhase.features.confidenceThreshold * 100).toFixed(1)}%`);
    console.log(`   Expected: PASS ✅`);
    
    const result1 = await positionService.processSignal(lowConfidenceSignal);
    console.log(`   Result: ${result1.action} ${result1.action === 'opened' ? '✅ PASSED' : '❌ FAILED'}`);
    
    // Test signal 2: Even lower confidence (should still pass)
    const veryLowSignal = {
      action: 'BUY' as const,
      symbol: 'BTCUSD', 
      price: 65100,
      confidence: 0.12, // 12% - barely above 10% threshold
      quantity: 0.001,
      strategy: 'phase-0-test-2',
      reason: 'Extremely low barrier test',
      timestamp: new Date()
    };
    
    console.log(`\n📈 Testing 12% confidence signal (should PASS in Phase 0):`);
    console.log(`   Confidence: ${(veryLowSignal.confidence * 100).toFixed(1)}%`);
    console.log(`   Phase 0 Threshold: ${(currentPhase.features.confidenceThreshold * 100).toFixed(1)}%`);
    console.log(`   Expected: PASS ✅`);
    
    const result2 = await positionService.processSignal(veryLowSignal);
    console.log(`   Result: ${result2.action} ${result2.action === 'opened' ? '✅ PASSED' : '❌ FAILED'}`);
    
    // Test signal 3: Below threshold (should fail)
    const belowThresholdSignal = {
      action: 'BUY' as const,
      symbol: 'BTCUSD',
      price: 65200,
      confidence: 0.05, // 5% - below 10% threshold
      quantity: 0.001,
      strategy: 'phase-0-test-3',
      reason: 'Below threshold test',
      timestamp: new Date()
    };
    
    console.log(`\n📈 Testing 5% confidence signal (should FAIL even in Phase 0):`);
    console.log(`   Confidence: ${(belowThresholdSignal.confidence * 100).toFixed(1)}%`);
    console.log(`   Phase 0 Threshold: ${(currentPhase.features.confidenceThreshold * 100).toFixed(1)}%`);
    console.log(`   Expected: FAIL ❌`);
    
    const result3 = await positionService.processSignal(belowThresholdSignal);
    console.log(`   Result: ${result3.action} ${result3.action === 'ignored' ? '✅ CORRECTLY FAILED' : '❌ UNEXPECTEDLY PASSED'}`);
    
    // Compare with what would happen in Phase 4
    console.log('\n🔄 COMPARING WITH PHASE 4 BARRIERS...');
    phaseManager.setManualPhase(4);
    const phase4Config = await phaseManager.getCurrentPhase();
    
    console.log(`📊 Phase 4 threshold: ${(phase4Config.features.confidenceThreshold * 100).toFixed(1)}%`);
    console.log(`📊 Phase 0 threshold: ${(currentPhase.features.confidenceThreshold * 100).toFixed(1)}%`);
    console.log(`📊 Difference: ${((phase4Config.features.confidenceThreshold - currentPhase.features.confidenceThreshold) * 100).toFixed(1)}% more restrictive in Phase 4`);
    
    // Test the same 15% signal in Phase 4 (should fail)
    console.log(`\n📈 Testing same 15% signal in Phase 4 (should FAIL):`);
    const result4 = await positionService.processSignal(lowConfidenceSignal);
    console.log(`   Phase 4 Result: ${result4.action} ${result4.action === 'ignored' ? '✅ CORRECTLY BLOCKED' : '❌ UNEXPECTEDLY PASSED'}`);
    
    console.log('\n✅ PHASE 0 ULTRA-LOW BARRIERS TEST RESULTS:');
    console.log('=' .repeat(80));
    console.log(`   Phase 0 allows signals as low as ${(currentPhase.features.confidenceThreshold * 100).toFixed(1)}% confidence`);
    console.log(`   Phase 4 requires ${(phase4Config.features.confidenceThreshold * 100).toFixed(1)}% confidence minimum`);
    console.log(`   Barrier reduction: ${((phase4Config.features.confidenceThreshold - currentPhase.features.confidenceThreshold) * 100).toFixed(1)}% lower threshold in Phase 0`);
    console.log(`   Expected trade frequency increase: ~${(phase4Config.features.confidenceThreshold / currentPhase.features.confidenceThreshold).toFixed(1)}x more signals`);
    
    // Reset to auto mode
    phaseManager.enableAutoPhase();
    console.log(`\n🔄 Reset to automatic phase management`);
    
  } catch (error) {
    console.error('❌ Phase 0 barrier test failed:', error);
  }
  
  console.log('\n' + '=' .repeat(80));
  console.log('🎯 PHASE 0 ULTRA-LOW BARRIERS TEST COMPLETE');
}

testPhase0Barriers().catch(console.error);
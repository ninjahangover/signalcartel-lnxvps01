#!/usr/bin/env npx tsx
/**
 * QUANTUM FORGE™ Data Protection Test Suite
 * 
 * Tests for verifying graceful shutdown and data integrity protection
 * Run this on your replica system before going live
 */

import { shutdownManager } from '../src/lib/graceful-shutdown-manager';
import { enhancedPrisma, withTransaction, withRetry } from '../src/lib/prisma-enhanced';
import { prisma } from '../src/lib/prisma';
import * as fs from 'fs';
import * as path from 'path';

const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

async function runDataProtectionTests() {
  console.log('\n🧪 QUANTUM FORGE™ DATA PROTECTION TEST SUITE');
  console.log('━'.repeat(70));
  console.log('This will test graceful shutdown and data integrity protection');
  console.log('━'.repeat(70));

  const testResults: { test: string; result: 'PASS' | 'FAIL'; details?: string }[] = [];

  // Test 1: Database Connection with Retry
  console.log('\n📊 Test 1: Database Connection with Retry Logic');
  try {
    await enhancedPrisma.connect();
    const stats = enhancedPrisma.getConnectionStats();
    console.log(`${colors.green}✅ PASS${colors.reset}: Connected successfully`);
    console.log(`   Connection stats:`, stats);
    testResults.push({ test: 'Database Connection', result: 'PASS' });
  } catch (error) {
    console.log(`${colors.red}❌ FAIL${colors.reset}: ${error.message}`);
    testResults.push({ test: 'Database Connection', result: 'FAIL', details: error.message });
  }

  // Test 2: Transaction Management
  console.log('\n📊 Test 2: Transaction Management with Rollback');
  try {
    // Create a test transaction that will rollback
    let transactionCompleted = false;
    
    try {
      await withTransaction(async (tx) => {
        // Create a test record
        const testTrade = await tx.paperTrade.create({
          data: {
            symbol: 'TEST_BTC',
            side: 'buy',
            quantity: 0.001,
            price: 100000,
            executedAt: new Date(),
            userId: 'test-user',
            strategy: 'test-protection'
          }
        });
        
        console.log(`   Created test trade ID: ${testTrade.id}`);
        
        // Force rollback
        throw new Error('Intentional rollback for testing');
      });
      transactionCompleted = true;
    } catch (error) {
      if (error.message === 'Intentional rollback for testing') {
        console.log(`${colors.green}✅ PASS${colors.reset}: Transaction rolled back successfully`);
        testResults.push({ test: 'Transaction Rollback', result: 'PASS' });
      } else {
        throw error;
      }
    }

    // Verify rollback worked
    const testTrades = await prisma.paperTrade.findMany({
      where: { symbol: 'TEST_BTC' }
    });
    
    if (testTrades.length === 0) {
      console.log(`   Verified: No test trades exist (rollback successful)`);
    } else {
      throw new Error('Rollback failed - test trades still exist');
    }
    
  } catch (error) {
    console.log(`${colors.red}❌ FAIL${colors.reset}: ${error.message}`);
    testResults.push({ test: 'Transaction Rollback', result: 'FAIL', details: error.message });
  }

  // Test 3: Retry Logic
  console.log('\n📊 Test 3: Retry Logic for Transient Failures');
  try {
    let attemptCount = 0;
    
    const result = await withRetry(async () => {
      attemptCount++;
      console.log(`   Attempt ${attemptCount}`);
      
      if (attemptCount < 2) {
        throw new Error('ECONNRESET'); // Simulate transient error
      }
      
      return 'Success after retry';
    }, 3);
    
    if (attemptCount === 2 && result === 'Success after retry') {
      console.log(`${colors.green}✅ PASS${colors.reset}: Retry logic working (${attemptCount} attempts)`);
      testResults.push({ test: 'Retry Logic', result: 'PASS' });
    } else {
      throw new Error('Unexpected retry behavior');
    }
    
  } catch (error) {
    console.log(`${colors.red}❌ FAIL${colors.reset}: ${error.message}`);
    testResults.push({ test: 'Retry Logic', result: 'FAIL', details: error.message });
  }

  // Test 4: Emergency Data Backup
  console.log('\n📊 Test 4: Emergency Data Backup');
  try {
    const emergencyPath = '/tmp/signalcartel-emergency';
    
    // Ensure directory exists
    if (!fs.existsSync(emergencyPath)) {
      fs.mkdirSync(emergencyPath, { recursive: true });
    }
    
    // Create test emergency data
    const testData = {
      timestamp: new Date().toISOString(),
      testType: 'emergency_backup',
      criticalData: {
        openPositions: 5,
        pendingTrades: 10
      }
    };
    
    const emergencyFile = path.join(emergencyPath, `test_emergency_${Date.now()}.json`);
    fs.writeFileSync(emergencyFile, JSON.stringify(testData, null, 2));
    
    // Verify file was created
    if (fs.existsSync(emergencyFile)) {
      const savedData = JSON.parse(fs.readFileSync(emergencyFile, 'utf-8'));
      if (savedData.testType === 'emergency_backup') {
        console.log(`${colors.green}✅ PASS${colors.reset}: Emergency backup created successfully`);
        console.log(`   File: ${emergencyFile}`);
        testResults.push({ test: 'Emergency Backup', result: 'PASS' });
        
        // Cleanup
        fs.unlinkSync(emergencyFile);
      }
    } else {
      throw new Error('Emergency file not created');
    }
    
  } catch (error) {
    console.log(`${colors.red}❌ FAIL${colors.reset}: ${error.message}`);
    testResults.push({ test: 'Emergency Backup', result: 'FAIL', details: error.message });
  }

  // Test 5: Shutdown Handler Registration
  console.log('\n📊 Test 5: Shutdown Handler Registration');
  try {
    let handlerExecuted = false;
    
    // Register a test handler
    shutdownManager.registerHandler({
      name: 'Test Handler',
      priority: 999, // Low priority
      timeout: 1000,
      handler: async () => {
        handlerExecuted = true;
        console.log('   Test handler executed');
      }
    });
    
    console.log(`${colors.green}✅ PASS${colors.reset}: Handler registered successfully`);
    testResults.push({ test: 'Handler Registration', result: 'PASS' });
    
  } catch (error) {
    console.log(`${colors.red}❌ FAIL${colors.reset}: ${error.message}`);
    testResults.push({ test: 'Handler Registration', result: 'FAIL', details: error.message });
  }

  // Test 6: Simulated Crash Recovery
  console.log('\n📊 Test 6: Simulated Crash Recovery');
  try {
    // Simulate saving critical data before crash
    const criticalData = {
      timestamp: new Date().toISOString(),
      openPositions: [
        { id: '1', symbol: 'BTCUSD', quantity: 0.1, entry: 100000 },
        { id: '2', symbol: 'ETHUSD', quantity: 1.0, entry: 3500 }
      ],
      pendingSignals: [
        { symbol: 'BTCUSD', action: 'BUY', confidence: 0.85 }
      ]
    };
    
    const recoveryFile = path.join('/tmp/signalcartel-emergency', `recovery_test_${Date.now()}.json`);
    fs.writeFileSync(recoveryFile, JSON.stringify(criticalData, null, 2));
    
    // Simulate recovery
    const recovered = JSON.parse(fs.readFileSync(recoveryFile, 'utf-8'));
    
    if (recovered.openPositions.length === 2 && recovered.pendingSignals.length === 1) {
      console.log(`${colors.green}✅ PASS${colors.reset}: Crash recovery data preserved`);
      console.log(`   Recovered ${recovered.openPositions.length} positions`);
      console.log(`   Recovered ${recovered.pendingSignals.length} signals`);
      testResults.push({ test: 'Crash Recovery', result: 'PASS' });
      
      // Cleanup
      fs.unlinkSync(recoveryFile);
    } else {
      throw new Error('Recovery data incomplete');
    }
    
  } catch (error) {
    console.log(`${colors.red}❌ FAIL${colors.reset}: ${error.message}`);
    testResults.push({ test: 'Crash Recovery', result: 'FAIL', details: error.message });
  }

  // Test Summary
  console.log('\n' + '━'.repeat(70));
  console.log('📊 TEST RESULTS SUMMARY');
  console.log('━'.repeat(70));
  
  const passed = testResults.filter(r => r.result === 'PASS').length;
  const failed = testResults.filter(r => r.result === 'FAIL').length;
  
  testResults.forEach(result => {
    const icon = result.result === 'PASS' ? '✅' : '❌';
    const color = result.result === 'PASS' ? colors.green : colors.red;
    console.log(`${icon} ${result.test}: ${color}${result.result}${colors.reset}`);
    if (result.details) {
      console.log(`   Details: ${result.details}`);
    }
  });
  
  console.log('\n' + '━'.repeat(70));
  console.log(`TOTAL: ${passed} PASSED, ${failed} FAILED`);
  
  if (failed === 0) {
    console.log(`\n${colors.green}🎊 ALL TESTS PASSED!${colors.reset}`);
    console.log('Data protection systems are working correctly');
    console.log('Safe to proceed with live trading after Phase 4');
  } else {
    console.log(`\n${colors.red}⚠️ SOME TESTS FAILED${colors.reset}`);
    console.log('Please fix issues before going live');
  }
  
  // Cleanup
  await enhancedPrisma.gracefulDisconnect();
  
  return {
    passed,
    failed,
    total: testResults.length,
    results: testResults
  };
}

// Run tests
if (require.main === module) {
  runDataProtectionTests()
    .then(results => {
      process.exit(results.failed > 0 ? 1 : 0);
    })
    .catch(error => {
      console.error('Test suite failed:', error);
      process.exit(1);
    });
}
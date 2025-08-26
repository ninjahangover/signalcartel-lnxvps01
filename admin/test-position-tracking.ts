#!/usr/bin/env npx tsx
/**
 * Test Position Management Complete Trade Tracking
 * Verifies every open position gets closed properly
 */

import { PrismaClient } from '@prisma/client';
import { positionService } from './src/lib/position-management/position-service';

const prisma = new PrismaClient();

async function testPositionTracking() {
  console.log('🧪 TESTING QUANTUM FORGE™ POSITION MANAGEMENT');
  console.log('=' .repeat(80));
  
  try {
    // Test 1: Create a BUY position
    console.log('\n📈 TEST 1: Opening a BUY position...');
    const buySignal = {
      action: 'BUY' as const,
      symbol: 'BTCUSD',
      price: 65000,
      confidence: 0.75,
      quantity: 0.001,
      strategy: 'test-strategy',
      reason: 'Test buy signal',
      timestamp: new Date()
    };
    
    const buyResult = await positionService.processSignal(buySignal);
    console.log('Buy Result:', buyResult);
    
    if (buyResult.action !== 'opened' || !buyResult.position) {
      console.error('❌ Failed to open position:', buyResult.error || 'Unknown error');
      return;
    }
    
    const positionId = buyResult.position.id;
    console.log(`✅ Position opened with ID: ${positionId}`);
    
    // Wait 2 seconds to simulate time passing
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Test 2: Check open positions
    console.log('\n📊 TEST 2: Checking open positions...');
    const openPositions = await prisma.managedPosition.findMany({
      where: { status: 'OPEN' },
      include: { 
        entryTrade: true,
        exitTrade: true
      }
    });
    
    console.log(`Found ${openPositions.length} open positions`);
    openPositions.forEach(pos => {
      console.log(`- Position ${pos.id}: ${pos.symbol} ${pos.side} @ ${pos.entryPrice}`);
      console.log(`  Entry Trade: ${pos.entryTrade ? 'YES' : 'NO'}`);
      console.log(`  Exit Trade: ${pos.exitTrade ? 'NO (Still Open)' : 'NO (Still Open)'}`);
    });
    
    // Test 3: Send a SELL signal to close the position
    console.log('\n💰 TEST 3: Closing the position with SELL signal...');
    const sellSignal = {
      action: 'SELL' as const,
      symbol: 'BTCUSD',
      price: 65500, // Higher price for profit
      confidence: 0.80,
      quantity: 0.001,
      strategy: 'test-strategy',
      reason: 'Test sell signal to close',
      timestamp: new Date()
    };
    
    const sellResult = await positionService.processSignal(sellSignal);
    console.log('Sell Result:', sellResult);
    
    // Test 4: Verify position was closed
    console.log('\n✅ TEST 4: Verifying position closure...');
    const closedPosition = await prisma.managedPosition.findUnique({
      where: { id: positionId },
      include: { 
        entryTrade: true,
        exitTrade: true
      }
    });
    
    if (closedPosition) {
      console.log(`Position Status: ${closedPosition.status}`);
      console.log(`Entry Price: $${closedPosition.entryPrice}`);
      console.log(`Exit Price: $${closedPosition.exitPrice || 'Not set'}`);
      console.log(`P&L: $${closedPosition.realizedPnL || 0}`);
      console.log(`Entry Trade ID: ${closedPosition.entryTradeId}`);
      console.log(`Exit Trade ID: ${closedPosition.exitTradeId || 'None'}`);
      
      if (closedPosition.status === 'CLOSED' && closedPosition.exitTradeId) {
        console.log('✅ SUCCESS: Position properly tracked from entry to exit!');
      } else {
        console.log('⚠️ WARNING: Position not properly closed');
      }
    }
    
    // Test 5: Check for orphaned positions (open without recent activity)
    console.log('\n🔍 TEST 5: Checking for orphaned positions...');
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const orphanedPositions = await prisma.managedPosition.findMany({
      where: {
        status: 'OPEN',
        entryTime: {
          lt: oneHourAgo
        }
      }
    });
    
    if (orphanedPositions.length > 0) {
      console.log(`⚠️ Found ${orphanedPositions.length} orphaned positions older than 1 hour:`);
      orphanedPositions.forEach(pos => {
        const age = Math.round((Date.now() - pos.entryTime.getTime()) / 1000 / 60);
        console.log(`- ${pos.symbol} opened ${age} minutes ago`);
      });
    } else {
      console.log('✅ No orphaned positions found');
    }
    
    // Test 6: Summary statistics
    console.log('\n📊 TEST 6: Position Management Statistics...');
    const stats = await prisma.managedPosition.groupBy({
      by: ['status'],
      _count: true
    });
    
    console.log('Position Status Summary:');
    stats.forEach(stat => {
      console.log(`- ${stat.status}: ${stat._count} positions`);
    });
    
    const completeTrades = await prisma.managedPosition.count({
      where: {
        status: 'CLOSED',
        exitTradeId: { not: null }
      }
    });
    
    const incompleteTrades = await prisma.managedPosition.count({
      where: {
        status: 'CLOSED',
        exitTradeId: null
      }
    });
    
    console.log(`\nTrade Completion Rate:`);
    console.log(`- Complete (entry + exit): ${completeTrades}`);
    console.log(`- Incomplete (missing exit): ${incompleteTrades}`);
    
    const totalClosed = completeTrades + incompleteTrades;
    if (totalClosed > 0) {
      const completionRate = (completeTrades / totalClosed * 100).toFixed(1);
      console.log(`- Completion Rate: ${completionRate}%`);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
  
  console.log('\n' + '=' .repeat(80));
  console.log('🧪 POSITION TRACKING TEST COMPLETE');
}

testPositionTracking().catch(console.error);
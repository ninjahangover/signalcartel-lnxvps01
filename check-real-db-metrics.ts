#!/usr/bin/env npx tsx
/**
 * Check real database metrics to replace fake pipeline data
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: "postgresql://warehouse_user:quantum_forge_warehouse_2024@localhost:5433/signalcartel?schema=public"
    }
  }
});

async function checkRealDatabaseMetrics() {
  try {
    console.log('🔍 CHECKING REAL DATABASE METRICS...');
    console.log('=' .repeat(50));
    
    // Get real database statistics
    const paperTradeCount = await prisma.paperTrade.count();
    const signalCount = await prisma.enhancedTradingSignal.count();
    const strategyCount = await prisma.pineStrategy.count();
    
    console.log('📊 REAL DATABASE METRICS:');
    console.log('- Paper Trades:', paperTradeCount);
    console.log('- Enhanced Signals:', signalCount);
    console.log('- Active Strategies:', strategyCount);
    
    // Get recent activity (last hour)
    const recentSignals = await prisma.enhancedTradingSignal.count({
      where: {
        signalTime: {
          gte: new Date(Date.now() - 60 * 60 * 1000)
        }
      }
    });
    
    console.log('- Recent Signals (last hour):', recentSignals);
    
    // Get strategy performance data
    const activeStrategies = await prisma.pineStrategy.count({
      where: {
        isActive: true
      }
    });
    
    console.log('- Active Strategies:', activeStrategies);
    
    if (paperTradeCount > 0 || signalCount > 0) {
      console.log('✅ We have real data to use instead of fake pipeline data');
    } else {
      console.log('❌ No real data available - should show 0 values');
    }
    
  } catch (error) {
    console.error('❌ Database error:', error.message);
    console.log('Should show error or 0 values instead of fake data');
  } finally {
    await prisma.$disconnect();
  }
}

checkRealDatabaseMetrics().catch(console.error);
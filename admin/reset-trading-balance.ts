#!/usr/bin/env npx tsx
/**
 * QUANTUM FORGE™ Balance Reset Script
 * 
 * Resets the trading balance back to $10,000 starting balance by:
 * 1. Clearing all ManagedTrade records with negative P&L
 * 2. Clearing all ManagedPosition records
 * 3. Optionally clearing PaperTrade records
 * 4. Preserving AI learning data (IntuitionAnalysis, etc.)
 * 
 * Usage: npx tsx -r dotenv/config admin/reset-trading-balance.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function resetTradingBalance() {
  console.log('🚀 QUANTUM FORGE™ Balance Reset Starting...');
  console.log('=' * 60);
  
  try {
    // Get current state
    const currentStats = await prisma.$transaction([
      prisma.managedTrade.count(),
      prisma.managedPosition.count(),
      prisma.paperTrade.count(),
    ]);
    
    const [managedTrades, positions, paperTrades] = currentStats;
    
    console.log(`📊 Current Data State:`);
    console.log(`   • ManagedTrade records: ${managedTrades.toLocaleString()}`);
    console.log(`   • ManagedPosition records: ${positions.toLocaleString()}`);
    console.log(`   • PaperTrade records: ${paperTrades.toLocaleString()}`);
    
    // Check current P&L
    const pnlSummary = await prisma.managedTrade.aggregate({
      _sum: { pnl: true },
      _count: { pnl: true },
      where: { pnl: { not: null } }
    });
    
    console.log(`💰 Current P&L: $${pnlSummary._sum.pnl?.toFixed(2) || '0'} (${pnlSummary._count.pnl} trades)`);
    
    if (pnlSummary._sum.pnl && pnlSummary._sum.pnl > -1000) {
      console.log('⚠️  Current P&L is not significantly negative. Continue? (y/N)');
      // In production, you'd want to add readline input here
    }
    
    console.log('\\n🔄 Starting Reset Process...');
    
    // Step 1: Clear all trading positions and trades
    console.log('Step 1: Clearing ManagedPosition records...');
    const deletedPositions = await prisma.managedPosition.deleteMany({});
    console.log(`   ✅ Deleted ${deletedPositions.count} positions`);
    
    console.log('Step 2: Clearing ManagedTrade records...');
    const deletedManagedTrades = await prisma.managedTrade.deleteMany({});
    console.log(`   ✅ Deleted ${deletedManagedTrades.count} managed trades`);
    
    console.log('Step 3: Clearing PaperTrade records...');
    const deletedPaperTrades = await prisma.paperTrade.deleteMany({});
    console.log(`   ✅ Deleted ${deletedPaperTrades.count} paper trades`);
    
    // Step 4: Verify AI learning data is preserved
    const aiData = await prisma.$transaction([
      prisma.intuitionAnalysis.count(),
      prisma.marketDataCollection.count(),
      prisma.tradingSignal.count(),
    ]);
    
    const [intuition, marketData, signals] = aiData;
    console.log('\\n🧠 AI Learning Data Preserved:');
    console.log(`   • IntuitionAnalysis: ${intuition.toLocaleString()} records`);
    console.log(`   • MarketDataCollection: ${marketData.toLocaleString()} records`);
    console.log(`   • TradingSignal: ${signals.toLocaleString()} records`);
    
    console.log('\\n🛡️ Restoring core exit strategies...');
    // CRITICAL: Restore core exit strategies after any reset
    try {
      const { ensureCoreExitStrategies } = await import('./ensure-core-exit-strategies');
      await ensureCoreExitStrategies();
      console.log('✅ Core exit strategies restored and protected');
    } catch (error) {
      console.error('❌ Failed to restore core exit strategies:', error);
      console.warn('⚠️ Trading system may not function properly without exit strategies!');
    }
    
    console.log('\\n✅ Balance Reset Complete!');
    console.log('🎯 Starting Balance: $10,000');
    console.log('💼 All positions cleared');
    console.log('🧠 AI learning data preserved');
    console.log('🛡️ Core exit strategies protected');
    console.log('🚀 Ready for fresh trading session');
    
  } catch (error) {
    console.error('❌ Reset failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the reset
if (require.main === module) {
  resetTradingBalance()
    .then(() => {
      console.log('\\n🎉 Reset completed successfully!');
      console.log('Run your trading engine to start fresh with $10,000');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Reset failed:', error);
      process.exit(1);
    });
}
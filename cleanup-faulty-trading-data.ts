/**
 * Cleanup Faulty Trading Data
 * Removes all the meaningless entry-only trading records while preserving valuable market intelligence
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function cleanupFaultyTradingData() {
  console.log('🗑️  CLEANING UP FAULTY TRADING DATA');
  console.log('=' + '='.repeat(60));
  console.log('⚠️  This will remove entry-only trading records that have no real value');
  console.log('✅ This will preserve: sentiment data, market data, user data, strategies');
  console.log();

  try {
    // Get counts before cleanup
    const paperTradeCount = await prisma.paperTrade.count();
    const enhancedSignalCount = await prisma.enhancedTradingSignal.count();
    const executionLogCount = await prisma.strategyExecutionLog.count();
    
    console.log('📊 CURRENT FAULTY DATA COUNTS:');
    console.log(`   Paper Trades: ${paperTradeCount.toLocaleString()}`);
    console.log(`   Enhanced Signals: ${enhancedSignalCount.toLocaleString()}`);  
    console.log(`   Execution Logs: ${executionLogCount.toLocaleString()}`);
    console.log(`   Total faulty records: ${(paperTradeCount + enhancedSignalCount + executionLogCount).toLocaleString()}`);
    console.log();

    // Confirm deletion
    console.log('🚨 PROCEEDING WITH CLEANUP IN 5 SECONDS...');
    console.log('   (Press Ctrl+C to abort)');
    await new Promise(resolve => setTimeout(resolve, 5000));

    console.log('🗑️  Starting cleanup...');

    // Delete faulty trading data (keep market intelligence)
    const deletePaperTrades = prisma.paperTrade.deleteMany({});
    const deleteEnhancedSignals = prisma.enhancedTradingSignal.deleteMany({});
    const deleteExecutionLogs = prisma.strategyExecutionLog.deleteMany({});

    // Execute deletions
    const [paperResult, signalResult, logResult] = await Promise.all([
      deletePaperTrades,
      deleteEnhancedSignals, 
      deleteExecutionLogs
    ]);

    console.log('✅ CLEANUP COMPLETED:');
    console.log(`   ✅ Deleted ${paperResult.count.toLocaleString()} paper trades`);
    console.log(`   ✅ Deleted ${signalResult.count.toLocaleString()} enhanced signals`);
    console.log(`   ✅ Deleted ${logResult.count.toLocaleString()} execution logs`);
    console.log(`   ✅ Total cleaned: ${(paperResult.count + signalResult.count + logResult.count).toLocaleString()} faulty records`);
    console.log();

    // Verify what's preserved
    const preservedCounts = await Promise.all([
      prisma.sentimentData.count(),
      prisma.sentimentAnalysis.count(),
      prisma.pineStrategy.count(),
      prisma.user.count(),
      prisma.managedPosition.count(),
      prisma.managedTrade.count()
    ]);

    console.log('✅ PRESERVED VALUABLE DATA:');
    console.log(`   ✅ Sentiment Data: ${preservedCounts[0].toLocaleString()} records`);
    console.log(`   ✅ Sentiment Analysis: ${preservedCounts[1].toLocaleString()} records`);
    console.log(`   ✅ Strategies: ${preservedCounts[2]} strategies`);
    console.log(`   ✅ Users: ${preservedCounts[3]} users`);
    console.log(`   ✅ Position-Managed Positions: ${preservedCounts[4]} positions`);
    console.log(`   ✅ Position-Managed Trades: ${preservedCounts[5]} trades`);
    console.log();

    console.log('🎉 CLEANUP COMPLETE!');
    console.log('   ✅ All faulty entry-only trading data removed');
    console.log('   ✅ All valuable market intelligence preserved');
    console.log('   ✅ Position management system ready for fresh start');
    console.log();
    console.log('💡 NEXT STEPS:');
    console.log('   1. Start position-managed trading: ENABLE_GPU_STRATEGIES=true npx tsx -r dotenv/config load-position-managed-strategies.ts');
    console.log('   2. All future trading will use proper position lifecycle management');
    console.log('   3. Only real P&L data will be tracked going forward');

  } catch (error) {
    console.error('❌ Cleanup failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run cleanup if this file is executed directly
if (require.main === module) {
  cleanupFaultyTradingData()
    .then(() => {
      console.log('\n🎯 Ready to start fresh with position management!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Cleanup failed:', error);
      process.exit(1);
    });
}

export { cleanupFaultyTradingData };
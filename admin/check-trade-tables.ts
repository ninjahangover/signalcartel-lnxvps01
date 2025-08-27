import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkTrades() {
  try {
    const basicTrades = await prisma.trade.count();
    const managedTrades = await prisma.managedTrade.count();
    const managedPositions = await prisma.managedPosition.count();
    
    console.log('📊 TRADE COUNT COMPARISON:');
    console.log(`  Basic Trade table: ${basicTrades} trades`);
    console.log(`  ManagedTrade table: ${managedTrades} trades`);
    console.log(`  ManagedPosition table: ${managedPositions} positions`);
    
    console.log('\n🔍 PHASE SYSTEM EXPECTATIONS:');
    console.log('  Phase system counts: managedTrade.count({ where: { isEntry: true } })');
    console.log('  Custom paper trading writes to: Trade table');
    console.log('\n💡 SOLUTION: Phase system needs to count Trade table OR');
    console.log('     Custom trading needs to use ManagedTrade table');
    
    if (basicTrades > 0) {
      console.log('\n🎯 PHASE TRANSITION ANALYSIS:');
      console.log(`  With ${basicTrades} trades, system should be in:`)
      if (basicTrades >= 2000) {
        console.log('  🚀 Phase 4: Full QUANTUM FORGE™');
      } else if (basicTrades >= 1000) {
        console.log('  📊 Phase 3: Order Book Intelligence');
      } else if (basicTrades >= 500) {
        console.log('  🧠 Phase 2: Multi-Source Sentiment');
      } else if (basicTrades >= 100) {
        console.log('  📈 Phase 1: Basic Sentiment');
      } else {
        console.log('  🔥 Phase 0: Maximum Data Collection (current)');
      }
    }
    
  } catch (error) {
    console.error('❌ Database error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkTrades();
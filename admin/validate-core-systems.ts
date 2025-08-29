#!/usr/bin/env npx tsx
/**
 * 🔍 CORE SYSTEM VALIDATION
 * 
 * Validates that all critical trading system components are working properly.
 * Run this before starting any trading operations to ensure system integrity.
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function validateCoreSystem(): Promise<boolean> {
  console.log('🔍 CORE SYSTEM VALIDATION');
  console.log('=' * 50);
  
  let allValid = true;
  
  try {
    // 1. Database Connection
    console.log('📊 Validating database connection...');
    await prisma.$queryRaw`SELECT 1`;
    console.log('✅ Database connection: OK');
    
    // 2. Exit Strategies
    console.log('🛡️ Validating exit strategies...');
    const exitStrategies = await prisma.exitStrategy.findMany();
    
    const requiredStrategies = [
      'phase-0-ai-basic-technical',
      'phase-1-ai-basic-technical', 
      'phase-2-ai-multi-sentiment',
      'phase-3-ai-orderbook-intelligence',
      'phase-4-ai-full-quantum-forge'
    ];
    
    const existingStrategies = exitStrategies.map(s => s.strategy);
    const missingStrategies = requiredStrategies.filter(s => !existingStrategies.includes(s));
    
    if (missingStrategies.length > 0) {
      console.error(`❌ Missing exit strategies: ${missingStrategies.join(', ')}`);
      allValid = false;
    } else {
      console.log(`✅ Exit strategies: ${exitStrategies.length} found, all core strategies present`);
    }
    
    // 3. Database Tables - Test via Prisma methods instead of raw SQL
    console.log('🗄️ Validating database schema...');
    try {
      await prisma.managedPosition.count();
      console.log('✅ ManagedPosition table: OK');
      
      await prisma.managedTrade.count();
      console.log('✅ ManagedTrade table: OK');
      
      await prisma.exitStrategy.count();
      console.log('✅ ExitStrategy table: OK');
      
      await prisma.intuitionAnalysis.count();
      console.log('✅ IntuitionAnalysis table: OK');
      
      await prisma.marketDataCollection.count();
      console.log('✅ MarketDataCollection table: OK');
      
    } catch (error) {
      console.error('❌ Database schema validation failed:', error.message);
      allValid = false;
    }
    
    // 4. Position System Test
    console.log('🎯 Testing position management system...');
    try {
      const openPositions = await prisma.managedPosition.count({ where: { status: 'open' } });
      const closedPositions = await prisma.managedPosition.count({ where: { status: 'closed' } });
      console.log(`✅ Position system: ${openPositions} open, ${closedPositions} closed positions`);
    } catch (error) {
      console.error('❌ Position system: Failed to query positions');
      allValid = false;
    }
    
    // 5. Phase System
    console.log('⚡ Validating phase system...');
    const totalTrades = await prisma.managedTrade.count({ where: { isEntry: true } });
    const currentPhase = totalTrades < 100 ? 0 : 
                        totalTrades < 500 ? 1 :
                        totalTrades < 1000 ? 2 :
                        totalTrades < 2000 ? 3 : 4;
    console.log(`✅ Phase system: Phase ${currentPhase} (${totalTrades} trades completed)`);
    
    // Summary
    console.log('');
    if (allValid) {
      console.log('✅ ALL CORE SYSTEMS VALIDATED SUCCESSFULLY');
      console.log('🚀 System is ready for trading operations');
    } else {
      console.log('❌ SYSTEM VALIDATION FAILED');
      console.log('🚨 Fix issues before starting trading operations');
    }
    
    return allValid;
    
  } catch (error) {
    console.error('❌ System validation error:', error);
    return false;
  } finally {
    await prisma.$disconnect();
  }
}

// Export for use in other modules
export { validateCoreSystem };

// Run if called directly
if (require.main === module) {
  validateCoreSystem()
    .then((isValid) => {
      process.exit(isValid ? 0 : 1);
    })
    .catch((error) => {
      console.error('💥 Validation failed:', error);
      process.exit(1);
    });
}
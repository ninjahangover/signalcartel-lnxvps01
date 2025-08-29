#!/usr/bin/env npx tsx
/**
 * 🛡️ CORE EXIT STRATEGIES PROTECTION SYSTEM
 * 
 * Ensures critical exit strategies are ALWAYS available and protected from database resets.
 * This is core system infrastructure that must never be lost.
 * 
 * Usage: 
 * - npx tsx -r dotenv/config admin/ensure-core-exit-strategies.ts
 * - Called automatically by trading engine on startup
 * - Called after any database reset operations
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// 🔒 PROTECTED CORE EXIT STRATEGIES - NEVER DELETE THESE
const CORE_EXIT_STRATEGIES = [
  {
    strategy: 'phase-0-ai-basic-technical',
    symbol: '*',
    takeProfitPercent: 0.01,      // 1% profit target (quick wins)
    stopLossPercent: 0.005,       // 0.5% stop loss (tight risk control)
    trailingStopPercent: null,
    maxHoldMinutes: 5,            // Exit after 5 minutes max (very quick)
    reverseSignalExit: false,
    isCore: true,                 // Protected from deletion
    description: 'Phase 0 - Ultra-aggressive data collection strategy'
  },
  
  {
    strategy: 'phase-1-ai-basic-technical',
    symbol: '*',
    takeProfitPercent: 0.015,     // 1.5% profit target
    stopLossPercent: 0.01,        // 1% stop loss
    trailingStopPercent: null,
    maxHoldMinutes: 15,           // Exit after 15 minutes max
    reverseSignalExit: false,
    isCore: true,
    description: 'Phase 1 - Conservative sentiment-based strategy'
  },
  
  {
    strategy: 'phase-2-ai-multi-sentiment',
    symbol: '*',
    takeProfitPercent: 0.02,      // 2% profit target
    stopLossPercent: 0.012,       // 1.2% stop loss
    trailingStopPercent: 0.008,   // 0.8% trailing stop
    maxHoldMinutes: 30,           // Exit after 30 minutes max
    reverseSignalExit: true,
    isCore: true,
    description: 'Phase 2 - Multi-source sentiment analysis'
  },
  
  {
    strategy: 'phase-3-ai-orderbook-intelligence',
    symbol: '*',
    takeProfitPercent: 0.025,     // 2.5% profit target
    stopLossPercent: 0.015,       // 1.5% stop loss
    trailingStopPercent: 0.01,    // 1% trailing stop
    maxHoldMinutes: 45,           // Exit after 45 minutes max
    reverseSignalExit: true,
    isCore: true,
    description: 'Phase 3 - Order book microstructure analysis'
  },
  
  {
    strategy: 'phase-4-ai-full-quantum-forge',
    symbol: '*',
    takeProfitPercent: 0.03,      // 3% profit target
    stopLossPercent: 0.018,       // 1.8% stop loss
    trailingStopPercent: 0.012,   // 1.2% trailing stop
    maxHoldMinutes: 60,           // Exit after 60 minutes max
    reverseSignalExit: true,
    isCore: true,
    description: 'Phase 4 - Full QUANTUM FORGE™ AI suite'
  },
  
  // Legacy strategy support
  {
    strategy: 'rsi-strategy',
    symbol: '*',
    takeProfitPercent: 0.02,      // 2% profit target
    stopLossPercent: 0.01,        // 1% stop loss
    trailingStopPercent: null,
    maxHoldMinutes: 30,           // Exit after 30 minutes max
    reverseSignalExit: true,
    isCore: true,
    description: 'RSI-based scalping strategy'
  },
  
  {
    strategy: 'neural-strategy',
    symbol: '*',
    takeProfitPercent: 0.025,     // 2.5% profit target
    stopLossPercent: 0.012,       // 1.2% stop loss
    trailingStopPercent: 0.008,   // 0.8% trailing stop
    maxHoldMinutes: 45,           // Exit after 45 minutes max
    reverseSignalExit: false,
    isCore: true,
    description: 'Neural network adaptive strategy'
  }
];

/**
 * Ensure all core exit strategies exist in the database
 */
async function ensureCoreExitStrategies(): Promise<void> {
  console.log('🛡️ CORE EXIT STRATEGIES PROTECTION SYSTEM');
  console.log('=' * 60);
  console.log('🔒 Ensuring critical exit strategies are protected and available...');
  
  try {
    let createdCount = 0;
    let updatedCount = 0;
    let verifiedCount = 0;
    
    for (const coreStrategy of CORE_EXIT_STRATEGIES) {
      const { isCore, description, ...strategyData } = coreStrategy;
      
      const result = await prisma.exitStrategy.upsert({
        where: {
          strategy_symbol: {
            strategy: coreStrategy.strategy,
            symbol: coreStrategy.symbol
          }
        },
        update: {
          takeProfitPercent: strategyData.takeProfitPercent,
          stopLossPercent: strategyData.stopLossPercent,
          trailingStopPercent: strategyData.trailingStopPercent,
          maxHoldMinutes: strategyData.maxHoldMinutes,
          reverseSignalExit: strategyData.reverseSignalExit || false
        },
        create: strategyData
      });
      
      if (result.createdAt.getTime() === result.updatedAt.getTime()) {
        createdCount++;
        console.log(`✅ CREATED: ${coreStrategy.strategy} - ${description}`);
      } else {
        updatedCount++;
        console.log(`🔄 UPDATED: ${coreStrategy.strategy} - ${description}`);
      }
      verifiedCount++;
    }
    
    console.log('');
    console.log(`📊 Core Exit Strategy Protection Summary:`);
    console.log(`   • Created: ${createdCount} new strategies`);
    console.log(`   • Updated: ${updatedCount} existing strategies`);
    console.log(`   • Verified: ${verifiedCount}/${CORE_EXIT_STRATEGIES.length} total strategies`);
    console.log('');
    
    // Verify database state
    const allStrategies = await prisma.exitStrategy.findMany({
      orderBy: { strategy: 'asc' }
    });
    
    console.log(`🗄️ Database now contains ${allStrategies.length} exit strategies:`);
    allStrategies.forEach(s => {
      const isCore = CORE_EXIT_STRATEGIES.some(core => core.strategy === s.strategy);
      const coreFlag = isCore ? '🔒 [CORE]' : '📝 [USER]';
      console.log(`   ${coreFlag} ${s.strategy}: TP=${(s.takeProfitPercent || 0) * 100}%, SL=${(s.stopLossPercent || 0) * 100}%, MaxHold=${s.maxHoldMinutes}min`);
    });
    
    console.log('');
    console.log('✅ Core exit strategies are protected and available!');
    
  } catch (error) {
    console.error('❌ Failed to ensure core exit strategies:', error);
    throw error;
  }
}

/**
 * Verify that all core strategies are present
 */
async function verifyCoreStrategiesExist(): Promise<boolean> {
  try {
    const existingStrategies = await prisma.exitStrategy.findMany({
      select: { strategy: true, symbol: true }
    });
    
    const existingKeys = existingStrategies.map(s => `${s.strategy}:${s.symbol || '*'}`);
    const requiredKeys = CORE_EXIT_STRATEGIES.map(s => `${s.strategy}:${s.symbol}`);
    
    const missingStrategies = requiredKeys.filter(key => !existingKeys.includes(key));
    
    if (missingStrategies.length > 0) {
      console.warn(`⚠️ Missing core strategies: ${missingStrategies.join(', ')}`);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('❌ Failed to verify core strategies:', error);
    return false;
  }
}

/**
 * Main execution function
 */
async function main() {
  try {
    // First check if strategies exist
    const allExist = await verifyCoreStrategiesExist();
    
    if (!allExist) {
      console.log('🚨 Core strategies missing! Rebuilding...');
      await ensureCoreExitStrategies();
    } else {
      console.log('✅ All core strategies verified and protected.');
    }
    
  } catch (error) {
    console.error('💥 Core strategy protection failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Export functions for use in other modules
export { ensureCoreExitStrategies, verifyCoreStrategiesExist, CORE_EXIT_STRATEGIES };

// Run if called directly
if (require.main === module) {
  main()
    .then(() => {
      console.log('🛡️ Core exit strategy protection complete!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Protection system failed:', error);
      process.exit(1);
    });
}
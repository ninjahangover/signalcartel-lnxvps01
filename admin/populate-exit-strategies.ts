#!/usr/bin/env npx tsx
/**
 * Populate Exit Strategies in Database
 * Creates the exit strategies in the database so they load properly
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function populateExitStrategies() {
  console.log('🎯 Populating Exit Strategies in Database...');
  
  const exitStrategies = [
    // Phase-0 AI Strategy - Very aggressive for data collection
    {
      strategy: 'phase-0-ai-basic-technical',
      symbol: null,
      takeProfitPercent: 0.01, // 1% profit target (quick wins)
      stopLossPercent: 0.005,  // 0.5% stop loss (tight risk control)
      trailingStopPercent: null,
      maxHoldMinutes: 5,       // Exit after 5 minutes max (very quick)
      reverseSignalExit: false
    },
    
    // Phase-1 AI Strategy - Conservative
    {
      strategy: 'phase-1-ai-basic-technical',
      symbol: null,
      takeProfitPercent: 0.015, // 1.5% profit target
      stopLossPercent: 0.01,   // 1% stop loss
      trailingStopPercent: null,
      maxHoldMinutes: 15,      // Exit after 15 minutes max
      reverseSignalExit: false
    },
    
    // RSI Strategy - Quick scalping with tight stops
    {
      strategy: 'rsi-strategy',
      symbol: null,
      takeProfitPercent: 0.02, // 2% profit target
      stopLossPercent: 0.01,   // 1% stop loss
      trailingStopPercent: null,
      maxHoldMinutes: 30,      // Exit after 30 minutes max
      reverseSignalExit: true  // Exit when opposite RSI signal occurs
    },
    
    // Bollinger Bands - Medium-term mean reversion
    {
      strategy: 'bollinger-strategy',
      symbol: null,
      takeProfitPercent: 0.03, // 3% profit target
      stopLossPercent: 0.015,  // 1.5% stop loss
      trailingStopPercent: null,
      maxHoldMinutes: 60,      // Exit after 1 hour max
      reverseSignalExit: true
    },
    
    // Neural Network - Adaptive strategy
    {
      strategy: 'neural-strategy',
      symbol: null,
      takeProfitPercent: 0.025, // 2.5% profit target
      stopLossPercent: 0.012,   // 1.2% stop loss
      trailingStopPercent: 0.008, // 0.8% trailing stop
      maxHoldMinutes: 45,       // Exit after 45 minutes max
      reverseSignalExit: false
    },
    
    // Quantum Oscillator - Momentum-based
    {
      strategy: 'quantum-oscillator',
      symbol: null,
      takeProfitPercent: 0.04, // 4% profit target (higher risk/reward)
      stopLossPercent: 0.02,   // 2% stop loss
      trailingStopPercent: null,
      maxHoldMinutes: 90,      // Exit after 90 minutes max
      reverseSignalExit: true
    }
  ];
  
  try {
    for (const strategy of exitStrategies) {
      console.log(`📋 Creating exit strategy for ${strategy.strategy}...`);
      
      await prisma.exitStrategy.upsert({
        where: {
          strategy_symbol: {
            strategy: strategy.strategy,
            symbol: strategy.symbol
          }
        },
        update: {
          takeProfitPercent: strategy.takeProfitPercent,
          stopLossPercent: strategy.stopLossPercent,
          trailingStopPercent: strategy.trailingStopPercent,
          maxHoldMinutes: strategy.maxHoldMinutes,
          reverseSignalExit: strategy.reverseSignalExit
        },
        create: strategy
      });
      
      console.log(`✅ Created/updated: ${strategy.strategy}`);
    }
    
    console.log(`\n🎯 Successfully populated ${exitStrategies.length} exit strategies in database!`);
    
    // Verify what's in the database
    const dbStrategies = await prisma.exitStrategy.findMany();
    console.log(`\n📊 Database now contains ${dbStrategies.length} exit strategies:`);
    dbStrategies.forEach(s => {
      console.log(`   • ${s.strategy}: TP=${(s.takeProfitPercent || 0) * 100}%, SL=${(s.stopLossPercent || 0) * 100}%, MaxHold=${s.maxHoldMinutes}min`);
    });
    
  } catch (error) {
    console.error('❌ Failed to populate exit strategies:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the population
if (require.main === module) {
  populateExitStrategies()
    .then(() => {
      console.log('\n✅ Exit strategies population completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Exit strategies population failed:', error);
      process.exit(1);
    });
}
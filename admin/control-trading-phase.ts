#!/usr/bin/env npx tsx
/**
 * QUANTUM FORGE™ PHASE CONTROL SYSTEM
 * Manage trading intelligence phases and data accumulation
 */

import { phaseManager } from './src/lib/quantum-forge-phase-config';
import { PrismaClient } from '@prisma/client';
import readline from 'readline';

const prisma = new PrismaClient();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

async function displayStatus() {
  await phaseManager.initialize();
  
  const currentPhase = await phaseManager.getCurrentPhase();
  const progress = await phaseManager.getProgressToNextPhase();
  const overrideStatus = phaseManager.getOverrideStatus();
  
  // Get real trade counts
  const completedTrades = await prisma.managedTrade.count({
    where: {
      exitPrice: { not: null },
      exitTime: { not: null }
    }
  });
  
  const openPositions = await prisma.managedPosition.count({
    where: {
      status: 'OPEN'
    }
  });
  
  const recentTrades = await prisma.managedTrade.findMany({
    where: {
      exitTime: { not: null }
    },
    orderBy: {
      exitTime: 'desc'
    },
    take: 5
  });
  
  // Calculate win rate
  const winningTrades = await prisma.managedTrade.count({
    where: {
      exitPrice: { not: null },
      pnl: { gt: 0 }
    }
  });
  
  const winRate = completedTrades > 0 ? (winningTrades / completedTrades * 100).toFixed(1) : '0.0';
  
  console.log('\n' + '='.repeat(80));
  console.log('🔥 QUANTUM FORGE™ PHASE CONTROL SYSTEM');
  console.log('='.repeat(80));
  
  console.log(`\n📊 CURRENT STATUS:`);
  console.log(`   Phase: ${currentPhase.phase} - ${currentPhase.name}`);
  console.log(`   Mode: ${overrideStatus.mode.toUpperCase()}${overrideStatus.forcedPhase !== undefined ? ` (Forced to Phase ${overrideStatus.forcedPhase})` : ''}`);
  console.log(`   Description: ${currentPhase.description}`);
  
  console.log(`\n📈 TRADING METRICS:`);
  console.log(`   Completed Trades: ${completedTrades}`);
  console.log(`   Open Positions: ${openPositions}`);
  console.log(`   Win Rate: ${winRate}%`);
  console.log(`   Progress to Next Phase: ${progress.progress}% (${progress.tradesNeeded} trades needed)`);
  
  console.log(`\n⚙️ ACTIVE FEATURES:`);
  const features = currentPhase.features;
  console.log(`   ✅ Base Strategy: ${features.baseStrategyEnabled ? 'ENABLED' : 'DISABLED'}`);
  console.log(`   ${features.sentimentEnabled ? '✅' : '❌'} Sentiment Analysis: ${features.sentimentEnabled ? `${features.sentimentSources.length} sources` : 'DISABLED'}`);
  console.log(`   ${features.orderBookEnabled ? '✅' : '❌'} Order Book Intelligence: ${features.orderBookEnabled ? 'ENABLED' : 'DISABLED'}`);
  console.log(`   ${features.multiLayerAIEnabled ? '✅' : '❌'} Multi-Layer AI: ${features.multiLayerAIEnabled ? 'ENABLED' : 'DISABLED'}`);
  console.log(`   ${features.mathematicalIntuitionEnabled ? '✅' : '❌'} Mathematical Intuition: ${features.mathematicalIntuitionEnabled ? 'ENABLED' : 'DISABLED'}`);
  console.log(`   ${features.markovChainEnabled ? '✅' : '❌'} Markov Chain Analysis: ${features.markovChainEnabled ? 'ENABLED' : 'DISABLED'}`);
  
  console.log(`\n🎯 THRESHOLDS:`);
  console.log(`   Confidence Threshold: ${(features.confidenceThreshold * 100).toFixed(0)}%`);
  console.log(`   Sentiment Threshold: ${features.sentimentEnabled ? (features.sentimentThreshold * 100).toFixed(0) + '%' : 'N/A'}`);
  console.log(`   Order Book Threshold: ${features.orderBookEnabled ? (features.orderBookThreshold * 100).toFixed(0) + '%' : 'N/A'}`);
  console.log(`   Position Size: ${(features.positionSizing * 100).toFixed(1)}% per trade`);
  console.log(`   Stop Loss: ${features.stopLossPercent}%`);
  console.log(`   Take Profit: ${features.takeProfitPercent}%`);
  
  if (recentTrades.length > 0) {
    console.log(`\n📊 RECENT TRADES:`);
    recentTrades.forEach((trade, i) => {
      const pnlPercent = trade.entryPrice ? ((trade.pnl || 0) / trade.entryPrice * 100).toFixed(2) : '0.00';
      const result = (trade.pnl || 0) > 0 ? '✅' : '❌';
      console.log(`   ${i + 1}. ${result} ${trade.symbol} - P&L: ${pnlPercent}% ($${trade.pnl?.toFixed(2) || '0.00'})`);
    });
  }
  
  console.log('\n' + '='.repeat(80));
}

async function showMenu() {
  console.log('\n📋 CONTROL OPTIONS:');
  console.log('   1. Enable AUTO phase progression (based on trade count)');
  console.log('   2. Force Phase 0 - Data Accumulation (minimal barriers)');
  console.log('   3. Force Phase 1 - Basic Sentiment');
  console.log('   4. Force Phase 2 - Multi-Source Sentiment');
  console.log('   5. Force Phase 3 - Order Book Intelligence');
  console.log('   6. Force Phase 4 - Full QUANTUM FORGE™');
  console.log('   7. Enable UNRESTRICTED mode (no barriers at all)');
  console.log('   8. Show current status');
  console.log('   9. Exit');
  console.log('');
}

async function handleChoice(choice: string) {
  switch (choice.trim()) {
    case '1':
      phaseManager.enableAutoPhase();
      console.log('✅ AUTO phase progression enabled');
      break;
      
    case '2':
      phaseManager.setManualPhase(0);
      console.log('⚡ Forced to Phase 0 - Data Accumulation');
      break;
      
    case '3':
      phaseManager.setManualPhase(1);
      console.log('⚡ Forced to Phase 1 - Basic Sentiment');
      break;
      
    case '4':
      phaseManager.setManualPhase(2);
      console.log('⚡ Forced to Phase 2 - Multi-Source Sentiment');
      break;
      
    case '5':
      phaseManager.setManualPhase(3);
      console.log('⚡ Forced to Phase 3 - Order Book Intelligence');
      break;
      
    case '6':
      phaseManager.setManualPhase(4);
      console.log('⚡ Forced to Phase 4 - Full QUANTUM FORGE™');
      break;
      
    case '7':
      phaseManager.disablePhaseSystem();
      console.log('🔥 UNRESTRICTED mode enabled - All barriers disabled!');
      break;
      
    case '8':
      await displayStatus();
      break;
      
    case '9':
      console.log('👋 Exiting phase control...');
      process.exit(0);
      break;
      
    default:
      console.log('❌ Invalid choice. Please select 1-9.');
  }
}

async function main() {
  console.log('🚀 QUANTUM FORGE™ PHASE CONTROL SYSTEM');
  console.log('Control trading intelligence layers and data accumulation');
  
  // Show initial status
  await displayStatus();
  
  // Interactive menu loop
  const prompt = () => {
    showMenu();
    rl.question('Select option (1-9): ', async (answer) => {
      await handleChoice(answer);
      
      if (answer !== '9') {
        // Show status after any change
        if (answer !== '8') {
          await displayStatus();
        }
        prompt(); // Continue loop
      } else {
        rl.close();
        await prisma.$disconnect();
      }
    });
  };
  
  prompt();
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n\n👋 Shutting down phase control...');
  rl.close();
  await prisma.$disconnect();
  process.exit(0);
});

main().catch(async (error) => {
  console.error('❌ Error:', error);
  await prisma.$disconnect();
  process.exit(1);
});
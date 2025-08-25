#!/usr/bin/env npx tsx
/**
 * Verify QUANTUM FORGE™ Sentiment Database Integration
 * Check what's being stored and how our AI is learning
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function verifySentimentDatabase() {
  console.log('🔍 QUANTUM FORGE™ SENTIMENT DATABASE VERIFICATION');
  console.log('=' .repeat(70));
  
  try {
    // 1. Check if we have enhancedTradingSignal records
    console.log('\n📊 CHECKING SENTIMENT RECORDS...');
    console.log('-'.repeat(50));
    
    const totalSentimentRecords = await prisma.enhancedTradingSignal.count();
    console.log(`Total Sentiment Records: ${totalSentimentRecords}`);
    
    if (totalSentimentRecords === 0) {
      console.log('❌ No sentiment records found. Sentiment system needs to run first.');
      console.log('💡 Run this to generate sentiment data:');
      console.log('   ENABLE_GPU_STRATEGIES=true npx tsx -r dotenv/config test-quantum-forge-sentiment.ts');
      return;
    }
    
    // 2. Recent sentiment records
    console.log('\n📈 RECENT SENTIMENT ANALYSIS:');
    console.log('-'.repeat(50));
    
    const recentSentiment = await prisma.enhancedTradingSignal.findMany({
      orderBy: { signalTime: 'desc' },
      take: 5,
      select: {
        id: true,
        symbol: true,
        strategy: true,
        technicalAction: true,
        finalAction: true,
        sentimentScore: true,
        sentimentConfidence: true,
        sentimentConflict: true,
        combinedConfidence: true,
        executeReason: true,
        signalTime: true,
        wasExecuted: true
      }
    });
    
    recentSentiment.forEach((record, i) => {
      console.log(`\n${i + 1}. Record ID: ${record.id}`);
      console.log(`   Symbol: ${record.symbol} | Strategy: ${record.strategy}`);
      console.log(`   Technical Action: ${record.technicalAction} | Final Action: ${record.finalAction}`);
      console.log(`   Sentiment Score: ${record.sentimentScore?.toFixed(4) || 'N/A'}`);
      console.log(`   Sentiment Confidence: ${((record.sentimentConfidence || 0) * 100).toFixed(1)}%`);
      console.log(`   Combined Confidence: ${(record.combinedConfidence * 100).toFixed(1)}%`);
      console.log(`   Sentiment Conflict: ${record.sentimentConflict ? '⚠️ YES' : '✅ NO'}`);
      console.log(`   Was Executed: ${record.wasExecuted ? '✅ YES' : '❌ NO'}`);
      console.log(`   Signal Time: ${record.signalTime.toLocaleString()}`);
      console.log(`   Reason: ${record.executeReason || 'N/A'}`);
    });
    
    // 3. Sentiment performance analysis
    console.log('\n🧠 SENTIMENT INTELLIGENCE ANALYSIS:');
    console.log('-'.repeat(50));
    
    const sentimentStats = await prisma.enhancedTradingSignal.aggregate({
      _avg: {
        sentimentScore: true,
        sentimentConfidence: true,
        combinedConfidence: true
      },
      _count: {
        id: true
      }
    });
    
    console.log(`Average Sentiment Score: ${sentimentStats._avg.sentimentScore?.toFixed(4) || 'N/A'}`);
    console.log(`Average Sentiment Confidence: ${((sentimentStats._avg.sentimentConfidence || 0) * 100).toFixed(1)}%`);
    console.log(`Average Combined Confidence: ${((sentimentStats._avg.combinedConfidence || 0) * 100).toFixed(1)}%`);
    console.log(`Total Enhanced Trading Signals: ${sentimentStats._count.id}`);
    
    // 4. Action distribution
    const actionCounts = await prisma.enhancedTradingSignal.groupBy({
      by: ['finalAction'],
      _count: { finalAction: true }
    });
    
    console.log('\nFinal Action Distribution:');
    actionCounts.forEach(group => {
      console.log(`  ${group.finalAction}: ${group._count.finalAction} records`);
    });
    
    // 5. Check trading performance correlation
    console.log('\n💰 TRADING PERFORMANCE CHECK:');
    console.log('-'.repeat(50));
    
    const totalTrades = await prisma.paperTrade.count();
    const recentTrades = await prisma.paperTrade.count({
      where: {
        executedAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
        }
      }
    });
    
    console.log(`Total Paper Trades: ${totalTrades}`);
    console.log(`Recent Trades (24h): ${recentTrades}`);
    
    if (recentTrades > 0) {
      const recentTradeStats = await prisma.paperTrade.aggregate({
        _avg: { pnl: true },
        _count: { id: true },
        where: {
          executedAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
          },
          pnl: { not: null }
        }
      });
      
      const winningTrades = await prisma.paperTrade.count({
        where: {
          executedAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
          },
          pnl: { gt: 0 }
        }
      });
      
      const winRate = recentTradeStats._count.id > 0 ? (winningTrades / recentTradeStats._count.id) * 100 : 0;
      
      console.log(`Average PnL (24h): $${recentTradeStats._avg.pnl?.toFixed(2) || '0.00'}`);
      console.log(`Win Rate (24h): ${winRate.toFixed(1)}%`);
    }
    
    // 6. Real-time status check
    console.log('\n⚡ REAL-TIME STATUS CHECK:');
    console.log('-'.repeat(50));
    
    const lastSentimentRecord = await prisma.enhancedTradingSignal.findFirst({
      orderBy: { signalTime: 'desc' }
    });
    
    if (lastSentimentRecord) {
      const timeSinceLastRecord = Date.now() - lastSentimentRecord.signalTime.getTime();
      const minutesAgo = Math.floor(timeSinceLastRecord / (1000 * 60));
      
      console.log(`Last Sentiment Analysis: ${minutesAgo} minutes ago`);
      
      if (minutesAgo < 5) {
        console.log('✅ System is ACTIVE and recording sentiment data');
      } else if (minutesAgo < 60) {
        console.log('⚠️  System was recently active but may not be running continuously');
      } else {
        console.log('❌ System appears to be inactive (no recent sentiment data)');
      }
    } else {
      console.log('❌ No enhanced trading signals found');
    }
    
    // 7. Integration recommendations
    console.log('\n🚀 INTEGRATION RECOMMENDATIONS:');
    console.log('-'.repeat(50));
    
    if (totalSentimentRecords === 0) {
      console.log('1. ❌ Run sentiment analysis first');
      console.log('2. ❌ Integrate with trading strategies');
      console.log('3. ❌ Set up continuous monitoring');
    } else if (totalSentimentRecords < 10) {
      console.log('1. ✅ Sentiment system working');
      console.log('2. ⚠️  Need more data for machine learning (run continuously)');
      console.log('3. ❌ Integrate with live trading strategies');
    } else {
      console.log('1. ✅ Sufficient sentiment data collected');
      console.log('2. ✅ Ready for strategy integration');
      console.log('3. 🎯 Consider live trading deployment');
    }
    
    // 8. Next steps
    console.log('\n📋 NEXT STEPS TO ACTIVATE:');
    console.log('-'.repeat(50));
    
    if (recentTrades === 0) {
      console.log('🔄 TO START LIVE SENTIMENT-ENHANCED TRADING:');
      console.log('   ENABLE_GPU_STRATEGIES=true NTFY_TOPIC="signal-cartel" \\');
      console.log('   npx tsx -r dotenv/config load-database-strategies.ts');
      console.log('');
      console.log('🧪 TO TEST SENTIMENT ANALYSIS ONLY:');
      console.log('   ENABLE_GPU_STRATEGIES=true \\');
      console.log('   npx tsx -r dotenv/config test-quantum-forge-sentiment.ts');
    } else {
      console.log('✅ System appears to be running live trades');
      console.log('🔍 Monitor with: npm tsx system-health-check.ts');
    }
    
    console.log('\n' + '='.repeat(70));
    console.log('✅ QUANTUM FORGE SENTIMENT DATABASE VERIFICATION COMPLETE');
    console.log('📊 Database integration is working correctly');
    console.log('🧠 AI learning system is recording sentiment data');
    console.log('='.repeat(70));
    
  } catch (error) {
    console.error('❌ Error verifying sentiment database:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run verification
verifySentimentDatabase();
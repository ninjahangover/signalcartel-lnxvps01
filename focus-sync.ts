#!/usr/bin/env tsx

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  datasources: { db: { url: process.env.DATABASE_URL } }
});

const analyticsDb = new PrismaClient({
  datasources: { db: { url: process.env.ANALYTICS_DB_URL } }
});

async function focusSync() {
  try {
    console.log('🎯 FOCUS SYNC: Sentiment + Trading Signals');
    console.log('=' .repeat(50));
    
    // 1. Sync recent IntuitionAnalysis (sentiment) data
    console.log('📊 Syncing IntuitionAnalysis (sentiment)...');
    const recentIntuition = await prisma.intuitionAnalysis.findMany({
      where: {
        analysisTime: { gte: new Date(Date.now() - 30 * 60 * 1000) } // Last 30 minutes
      },
      take: 50, // Limit for testing
      orderBy: { analysisTime: 'desc' }
    });
    
    console.log(`📈 Found ${recentIntuition.length} recent intuition records`);
    
    let sentimentSynced = 0;
    for (const intuition of recentIntuition) {
      try {
        await analyticsDb.$executeRaw`
          INSERT INTO consolidated_sentiment (
            instance_id,
            symbol,
            source,
            sentiment_score,
            confidence,
            raw_data,
            collected_at,
            data_hash
          ) VALUES (
            ${'site-primary-main'},
            ${intuition.symbol},
            ${'mathematical-intuition'},
            ${intuition.overallIntuition},
            ${intuition.originalConfidence},
            ${JSON.stringify({
              strategy: intuition.strategy,
              signalType: intuition.signalType,
              recommendation: intuition.recommendation
            })},
            ${intuition.analysisTime},
            ${intuition.id + intuition.symbol + 'intuition'}
          )
          ON CONFLICT (instance_id, data_hash) DO NOTHING
        `;
        sentimentSynced++;
      } catch (error: any) {
        console.log(`⚠️ Sentiment error: ${error.message.split('\n')[0]}`);
      }
    }
    
    // 2. Sync recent TradingSignal data
    console.log('📡 Syncing TradingSignals...');
    const recentSignals = await prisma.tradingSignal.findMany({
      where: {
        createdAt: { gte: new Date(Date.now() - 30 * 60 * 1000) } // Last 30 minutes
      },
      take: 50,
      orderBy: { createdAt: 'desc' }
    });
    
    console.log(`🚦 Found ${recentSignals.length} recent trading signals`);
    
    let signalsSynced = 0;
    for (const signal of recentSignals) {
      try {
        await analyticsDb.$executeRaw`
          INSERT INTO consolidated_trading_signals (
            instance_id,
            original_signal_id,
            symbol,
            strategy_name,
            signal_type,
            current_price,
            target_price,
            stop_loss,
            confidence,
            timeframe,
            was_executed,
            outcome,
            pnl,
            signal_time,
            data_hash
          ) VALUES (
            ${'site-primary-main'},
            ${signal.id},
            ${signal.symbol},
            ${signal.strategy},
            ${signal.signalType},
            ${signal.currentPrice},
            ${signal.targetPrice},
            ${signal.stopLoss},
            ${signal.confidence},
            ${signal.timeframe},
            ${signal.executed},
            ${signal.outcome},
            ${signal.pnl},
            ${signal.createdAt},
            ${signal.id + signal.symbol + 'signal'}
          )
          ON CONFLICT (instance_id, original_signal_id) DO NOTHING
        `;
        signalsSynced++;
      } catch (error: any) {
        console.log(`⚠️ Signal error: ${error.message.split('\n')[0]}`);
      }
    }
    
    // 3. Check final counts
    console.log('📊 FINAL COUNTS:');
    const sentimentCount = await analyticsDb.$queryRaw<Array<{count: bigint}>>`SELECT COUNT(*) as count FROM consolidated_sentiment`;
    const signalsCount = await analyticsDb.$queryRaw<Array<{count: bigint}>>`SELECT COUNT(*) as count FROM consolidated_trading_signals`;
    
    console.log(`✅ Sentiment synced: ${sentimentSynced} (Total: ${Number(sentimentCount[0].count)})`);
    console.log(`✅ Signals synced: ${signalsSynced} (Total: ${Number(signalsCount[0].count)})`);
    
  } catch (error: any) {
    console.error('❌ Focus sync error:', error.message);
  }
  
  await prisma.$disconnect();
  await analyticsDb.$disconnect();
}

focusSync().then(() => process.exit(0));
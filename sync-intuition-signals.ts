#!/usr/bin/env tsx

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  datasources: { db: { url: process.env.DATABASE_URL } }
});

const analyticsDb = new PrismaClient({
  datasources: { db: { url: process.env.ANALYTICS_DB_URL } }
});

async function syncIntuitionAsSignals() {
  try {
    console.log('📡 SYNCING INTUITION ANALYSIS AS TRADING SIGNALS');
    console.log('=' .repeat(50));
    
    // Get recent IntuitionAnalysis records (these are the real trading signals)
    const signals = await prisma.intuitionAnalysis.findMany({
      where: {
        analysisTime: { gte: new Date(Date.now() - 2 * 60 * 60 * 1000) } // Last 2 hours
      },
      take: 200,
      orderBy: { analysisTime: 'desc' },
      select: {
        id: true,
        symbol: true,
        signalType: true,
        originalConfidence: true,
        signalPrice: true,
        recommendation: true,
        analysisTime: true,
        expectancyScore: true
      }
    });
    
    console.log(`📊 Found ${signals.length} intuition trading signals to sync`);
    
    let synced = 0;
    for (const signal of signals) {
      try {
        await analyticsDb.$executeRaw`
          INSERT INTO consolidated_trading_signals (
            instance_id,
            original_signal_id,
            symbol,
            signal_type,
            current_price,
            confidence,
            signal_time,
            data_hash,
            last_updated
          ) VALUES (
            ${'site-primary-main'},
            ${signal.id},
            ${signal.symbol},
            ${signal.recommendation || signal.signalType || 'ANALYZE'},
            ${Number(signal.signalPrice) || 0},
            ${Number(signal.originalConfidence) || 0},
            ${signal.analysisTime},
            ${'intuition-' + signal.id},
            NOW()
          ) ON CONFLICT (instance_id, original_signal_id) DO NOTHING
        `;
        synced++;
      } catch (error: any) {
        if (synced < 5) {
          console.log(`⚠️ Skip signal ${signal.symbol}:`, error.message.split('\n')[0]);
        }
      }
    }
    
    // Get final count
    const totalResult = await analyticsDb.$queryRaw<Array<{count: bigint}>>`
      SELECT COUNT(*) as count FROM consolidated_trading_signals
    `;
    
    console.log('');
    console.log('🎯 INTUITION SIGNALS SYNC COMPLETE:');
    console.log(`✅ Synced: ${synced} new signals`);
    console.log(`📊 Total: ${Number(totalResult[0].count)} trading signals available to AI`);
    console.log('');
    console.log('🧠 AI services now have access to real-time trading signals!');
    
  } catch (error: any) {
    console.error('❌ Sync error:', error.message);
  }
  
  await prisma.$disconnect();
  await analyticsDb.$disconnect();
}

syncIntuitionAsSignals().then(() => process.exit(0));
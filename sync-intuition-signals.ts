#!/usr/bin/env tsx

/**
 * Targeted Sentiment Sync - IntuitionAnalysis data (most important) 
 * Focuses on Mathematical Intuition Engine results which are the core AI sentiment
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  datasources: { db: { url: process.env.DATABASE_URL } }
});

const analyticsDb = new PrismaClient({
  datasources: { db: { url: process.env.ANALYTICS_DB_URL } }
});

const instanceId = process.env.INSTANCE_ID || 'site-primary-main';

async function syncIntuitionSignals() {
  try {
    console.log('🧠 TARGETED SENTIMENT SYNC - IntuitionAnalysis Data');
    console.log('==================================================');
    console.log('Instance ID:', instanceId);
    console.log('Focus: Mathematical Intuition Engine results');
    console.log('');

    // 1. Sync IntuitionAnalysis data (the real sentiment system)
    console.log('🔮 Syncing Mathematical Intuition Analysis data...');
    const intuitionData = await prisma.intuitionAnalysis.findMany({
      where: {
        analysisTime: { gte: new Date(Date.now() - 2 * 60 * 60 * 1000) } // Last 2 hours
      },
      take: 500, // Get more records since this is the primary AI system
      orderBy: { analysisTime: 'desc' },
      select: {
        id: true,
        symbol: true,
        strategy: true,
        signalType: true,
        originalConfidence: true,
        overallIntuition: true,
        expectancyScore: true,
        recommendation: true,
        marketConditions: true,
        analysisTime: true,
        flowFieldResonance: true,
        patternResonance: true,
        temporalIntuition: true,
        signalPrice: true
      }
    });

    console.log(`📊 Found ${intuitionData.length} IntuitionAnalysis records`);

    let sentimentSynced = 0;
    for (const analysis of intuitionData) {
      try {
        // Sync as sentiment data (our working JSONB fix)
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
            ${instanceId},
            ${analysis.symbol},
            ${'mathematical-intuition'},
            ${analysis.overallIntuition || 0.5},
            ${analysis.originalConfidence || 0.5},
            ${JSON.stringify({
              strategy: analysis.strategy,
              signalType: analysis.signalType,
              expectancyScore: analysis.expectancyScore,
              recommendation: analysis.recommendation,
              marketConditions: analysis.marketConditions,
              flowFieldResonance: analysis.flowFieldResonance,
              patternResonance: analysis.patternResonance,
              temporalIntuition: analysis.temporalIntuition
            })}::jsonb,
            ${analysis.analysisTime},
            ${analysis.id + '-' + analysis.symbol + '-intuition'}
          )
          ON CONFLICT (instance_id, data_hash)
          DO UPDATE SET 
            sentiment_score = EXCLUDED.sentiment_score,
            confidence = EXCLUDED.confidence,
            raw_data = EXCLUDED.raw_data
        `;

        // Also sync as trading signals (cleaner approach from remote)
        if (analysis.recommendation || analysis.signalType) {
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
              ${instanceId},
              ${analysis.id},
              ${analysis.symbol},
              ${analysis.recommendation || analysis.signalType || 'ANALYZE'},
              ${Number(analysis.signalPrice) || 0},
              ${Number(analysis.originalConfidence) || 0},
              ${analysis.analysisTime},
              ${'intuition-signal-' + analysis.id},
              NOW()
            ) ON CONFLICT (instance_id, original_signal_id) DO NOTHING
          `;
        }
        
        sentimentSynced++;
      } catch (error: any) {
        if (sentimentSynced < 5) {
          console.log(`⚠️ Skip ${analysis.symbol}:`, error.message.split('\n')[0]);
        }
      }
    }

    // Get final counts
    const [sentimentCount, signalsCount] = await Promise.all([
      analyticsDb.$queryRaw<Array<{count: bigint}>>`SELECT COUNT(*) as count FROM consolidated_sentiment WHERE instance_id = ${instanceId}`,
      analyticsDb.$queryRaw<Array<{count: bigint}>>`SELECT COUNT(*) as count FROM consolidated_trading_signals WHERE instance_id = ${instanceId}`
    ]);
    
    console.log('');
    console.log('🎯 INTUITION SYNC COMPLETE:');
    console.log(`✅ Synced: ${sentimentSynced} new records`);
    console.log(`📊 Sentiment Total: ${Number(sentimentCount[0].count)} records`);
    console.log(`📡 Signals Total: ${Number(signalsCount[0].count)} trading signals`);
    console.log('');
    console.log('🧠 AI services now have access to Mathematical Intuition data!');
    
  } catch (error: any) {
    console.error('❌ Sync error:', error.message);
  }
  
  await prisma.$disconnect();
  await analyticsDb.$disconnect();
}

syncIntuitionSignals().then(() => process.exit(0));
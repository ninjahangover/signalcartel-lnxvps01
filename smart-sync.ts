#!/usr/bin/env tsx

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  datasources: { db: { url: process.env.DATABASE_URL } }
});

const analyticsDb = new PrismaClient({
  datasources: { db: { url: process.env.ANALYTICS_DB_URL } }
});

async function smartSync() {
  try {
    console.log('🧠 SMART SYNC: Only Essential Data for AI Services');
    console.log('=' .repeat(55));
    
    // 1. Sentiment: Only what AI needs (symbol, score, confidence, timestamp)
    console.log('🎯 Syncing essential sentiment data...');
    const recentIntuition = await prisma.intuitionAnalysis.findMany({
      where: {
        analysisTime: { gte: new Date(Date.now() - 60 * 60 * 1000) } // Last hour
      },
      take: 100,
      orderBy: { analysisTime: 'desc' },
      select: {
        id: true,
        symbol: true,
        overallIntuition: true,    // AI needs: sentiment score
        originalConfidence: true,   // AI needs: confidence level
        analysisTime: true         // AI needs: when
      }
    });
    
    console.log(`📊 Found ${recentIntuition.length} sentiment records`);
    
    let sentimentSynced = 0;
    for (const data of recentIntuition) {
      try {
        // Simple insert with only essential fields
        await analyticsDb.$executeRaw`
          INSERT INTO consolidated_sentiment (
            instance_id, symbol, source, sentiment_score, confidence, collected_at, data_hash
          ) VALUES (
            ${'site-primary-main'}, 
            ${data.symbol}, 
            ${'mathematical-intuition'}, 
            ${Number(data.overallIntuition) || 0}, 
            ${Number(data.originalConfidence) || 0}, 
            ${data.analysisTime}, 
            ${'smart-' + data.id}
          ) ON CONFLICT (instance_id, data_hash) DO NOTHING
        `;
        sentimentSynced++;
      } catch (error: any) {
        // Skip bad records instead of failing
        if (sentimentSynced < 5) console.log(`⚠️ Skipped bad sentiment record: ${error.message.split('\n')[0]}`);
      }
    }
    
    // 2. Trading Signals: Only what AI needs (symbol, type, price, confidence)
    console.log('📡 Syncing essential trading signals...');
    const recentSignals = await prisma.tradingSignal.findMany({
      where: {
        createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } // Last 24 hours
      },
      take: 100,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        symbol: true,
        signalType: true,     // AI needs: BUY/SELL
        currentPrice: true,   // AI needs: price context
        confidence: true,     // AI needs: signal strength
        createdAt: true       // AI needs: when
      }
    });
    
    console.log(`🚦 Found ${recentSignals.length} trading signals`);
    
    let signalsSynced = 0;
    for (const signal of recentSignals) {
      try {
        await analyticsDb.$executeRaw`
          INSERT INTO consolidated_trading_signals (
            instance_id, original_signal_id, symbol, signal_type, current_price, confidence, signal_time, data_hash
          ) VALUES (
            ${'site-primary-main'}, 
            ${signal.id}, 
            ${signal.symbol}, 
            ${signal.signalType}, 
            ${Number(signal.currentPrice) || 0}, 
            ${Number(signal.confidence) || 0}, 
            ${signal.createdAt}, 
            ${'smart-' + signal.id}
          ) ON CONFLICT (instance_id, original_signal_id) DO NOTHING
        `;
        signalsSynced++;
      } catch (error: any) {
        if (signalsSynced < 5) console.log(`⚠️ Skipped bad signal record: ${error.message.split('\n')[0]}`);
      }
    }
    
    // 3. Market Data: Only recent high-value data points
    console.log('💹 Syncing essential market data...');
    const recentMarketData = await prisma.marketData.findMany({
      where: {
        timestamp: { gte: new Date(Date.now() - 2 * 60 * 60 * 1000) } // Last 2 hours
      },
      take: 200,
      orderBy: { timestamp: 'desc' },
      select: {
        id: true,
        symbol: true,
        timeframe: true,
        timestamp: true,
        close: true,        // AI needs: price
        volume: true,       // AI needs: activity
        rsi: true          // AI needs: momentum
      }
    });
    
    console.log(`📈 Found ${recentMarketData.length} market data points`);
    
    let marketSynced = 0;
    for (const data of recentMarketData) {
      try {
        await analyticsDb.$executeRaw`
          INSERT INTO consolidated_market_data (
            instance_id, original_data_id, symbol, timeframe, timestamp, close_price, volume, rsi, data_hash
          ) VALUES (
            ${'site-primary-main'}, 
            ${data.id}, 
            ${data.symbol}, 
            ${data.timeframe}, 
            ${data.timestamp}, 
            ${Number(data.close) || 0}, 
            ${Number(data.volume) || 0}, 
            ${Number(data.rsi) || 0}, 
            ${'smart-' + data.id}
          ) ON CONFLICT (instance_id, original_data_id) DO NOTHING
        `;
        marketSynced++;
      } catch (error: any) {
        if (marketSynced < 5) console.log(`⚠️ Skipped bad market data: ${error.message.split('\n')[0]}`);
      }
    }
    
    // 4. Final counts
    const [sentimentCount, signalsCount, marketCount] = await Promise.all([
      analyticsDb.$queryRaw<Array<{count: bigint}>>`SELECT COUNT(*) as count FROM consolidated_sentiment`,
      analyticsDb.$queryRaw<Array<{count: bigint}>>`SELECT COUNT(*) as count FROM consolidated_trading_signals`, 
      analyticsDb.$queryRaw<Array<{count: bigint}>>`SELECT COUNT(*) as count FROM consolidated_market_data`
    ]);
    
    console.log('');
    console.log('🎯 SMART SYNC RESULTS:');
    console.log(`✅ Sentiment: ${sentimentSynced} synced (Total: ${Number(sentimentCount[0].count)})`);
    console.log(`✅ Signals: ${signalsSynced} synced (Total: ${Number(signalsCount[0].count)})`);
    console.log(`✅ Market Data: ${marketSynced} synced (Total: ${Number(marketCount[0].count)})`);
    console.log('');
    console.log('🧠 AI services now have access to essential cross-site data!');
    
  } catch (error: any) {
    console.error('❌ Smart sync error:', error.message);
  }
  
  await prisma.$disconnect();
  await analyticsDb.$disconnect();
}

smartSync().then(() => process.exit(0));
#!/usr/bin/env tsx

/**
 * Smart Sync - Essential data for AI services
 * Handles schema issues by focusing on core data needed for cross-site AI
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  datasources: { db: { url: process.env.DATABASE_URL } }
});

const analyticsDb = new PrismaClient({
  datasources: { db: { url: process.env.ANALYTICS_DB_URL } }
});

const instanceId = process.env.INSTANCE_ID || 'site-primary-main';

async function smartSync() {
  console.log('🧠 SMART SYNC - Essential Data for AI Services');
  console.log('================================================');
  console.log('Instance ID:', instanceId);
  console.log('Target Analytics DB:', process.env.ANALYTICS_DB_URL?.split('@')[1]?.split('/')[0] || 'localhost:5433');
  console.log('');

  try {
    // 1. Sync essential position data with minimal fields
    console.log('📊 Syncing essential position data...');
    const positions = await prisma.managedPosition.findMany({
      take: 200,
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
        symbol: true,
        strategy: true,
        entryPrice: true,
        exitPrice: true,
        quantity: true,
        realizedPnL: true,
        status: true,
        entryTime: true,
        exitTime: true
      }
    });

    let positionsSynced = 0;
    for (const position of positions) {
      try {
        await analyticsDb.$executeRaw`
          INSERT INTO consolidated_positions (
            instance_id, 
            original_position_id, 
            symbol, 
            strategy_name, 
            entry_price, 
            exit_price, 
            quantity, 
            pnl_realized,
            entry_time,
            exit_time,
            data_hash
          ) VALUES (
            ${instanceId},
            ${position.id},
            ${position.symbol || 'UNKNOWN'},
            ${position.strategy || 'default'},
            ${position.entryPrice || 0},
            ${position.exitPrice},
            ${position.quantity || 0},
            ${position.realizedPnL},
            ${position.entryTime},
            ${position.exitTime},
            ${position.id + '-' + (position.symbol || 'UNKNOWN')}
          )
          ON CONFLICT (instance_id, original_position_id) 
          DO UPDATE SET 
            exit_price = EXCLUDED.exit_price,
            exit_time = EXCLUDED.exit_time,
            pnl_realized = EXCLUDED.pnl_realized
        `;
        positionsSynced++;
      } catch (error: any) {
        if (!error.message.includes('duplicate key')) {
          console.log(`  ⚠️ Position ${position.id}: ${error.message.split('\\n')[0]}`);
        }
      }
    }
    console.log(`  ✅ Synced ${positionsSynced}/${positions.length} positions`);

    // 2. Sync essential trade data
    console.log('💱 Syncing essential trade data...');
    const trades = await prisma.managedTrade.findMany({
      take: 200,
      orderBy: { executedAt: 'desc' },
      select: {
        id: true,
        symbol: true,
        side: true,
        quantity: true,
        price: true,
        executedAt: true,
        positionId: true
      }
    });

    // Get position mapping
    const positionMapping = await analyticsDb.$queryRaw<Array<{id: number; original_position_id: string}>>`
      SELECT id, original_position_id 
      FROM consolidated_positions 
      WHERE instance_id = ${instanceId}
    `;
    const positionIdMap = new Map(positionMapping.map(p => [p.original_position_id, p.id]));

    let tradesSynced = 0;
    for (const trade of trades) {
      try {
        const mappedPositionId = trade.positionId ? positionIdMap.get(trade.positionId) : null;
        
        await analyticsDb.$executeRaw`
          INSERT INTO consolidated_trades (
            instance_id,
            original_trade_id,
            position_id,
            symbol,
            side,
            quantity,
            price,
            executed_at,
            data_hash
          ) VALUES (
            ${instanceId},
            ${trade.id},
            ${mappedPositionId},
            ${trade.symbol || 'UNKNOWN'},
            ${trade.side || 'BUY'},
            ${trade.quantity || 0},
            ${trade.price || 0},
            ${trade.executedAt},
            ${trade.id + '-' + (trade.symbol || 'UNKNOWN')}
          )
          ON CONFLICT (instance_id, original_trade_id)
          DO UPDATE SET executed_at = EXCLUDED.executed_at
        `;
        tradesSynced++;
      } catch (error: any) {
        if (!error.message.includes('duplicate key')) {
          console.log(`  ⚠️ Trade ${trade.id}: ${error.message.split('\\n')[0]}`);
        }
      }
    }
    console.log(`  ✅ Synced ${tradesSynced}/${trades.length} trades`);

    // 3. Sync essential sentiment data (IntuitionAnalysis)
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
            ${instanceId}, 
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
        if (sentimentSynced < 5) console.log(`⚠️ Skipped bad sentiment record: ${error.message.split('\\n')[0]}`);
      }
    }

    // 4. Skip market data sync - not supported in analytics database
    console.log('📈 Skipping market data sync (not supported in analytics database)');
    const marketDataSynced = 0;

    console.log('');
    console.log('✅ SMART SYNC COMPLETED SUCCESSFULLY');
    console.log(`   Positions: ${positionsSynced} synced`);
    console.log(`   Trades: ${tradesSynced} synced`);
    console.log(`   Sentiment: ${sentimentSynced} synced`);
    console.log(`   Market Data: ${marketDataSynced} synced (skipped - not supported)`);

  } catch (error: any) {
    console.error('❌ Smart sync failed:', error.message);
    process.exit(1);
  } finally {
    await analyticsDb.$disconnect();
    await prisma.$disconnect();
  }
}

// Run smart sync
smartSync().catch(console.error);
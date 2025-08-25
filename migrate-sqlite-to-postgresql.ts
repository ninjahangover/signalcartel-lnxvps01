#!/usr/bin/env tsx
/**
 * Migrate trading data from SQLite to PostgreSQL warehouse container
 * This is the proper scalable solution
 */

import { PrismaClient } from '@prisma/client';

async function migrateFromSQLiteToPostgreSQL() {
  console.log('🚀 Starting SQLite → PostgreSQL migration for scalability...');
  
  // Source: SQLite with your 4,975 trades
  const sourceDb = new PrismaClient({
    datasources: {
      db: {
        url: "file:./dev.db?connection_limit=1&pool_timeout=60&socket_timeout=60"
      }
    }
  });

  // Target: PostgreSQL warehouse container (proper scalable solution)
  const targetDb = new PrismaClient({
    datasources: {
      db: {
        url: "postgresql://warehouse_user:quantum_forge_warehouse_2024@172.18.0.8:5432/signalcartel?schema=public"
      }
    }
  });

  try {
    // Get counts from source (SQLite)
    const sourceTrades = await sourceDb.paperTrade.count();
    const sourceSignals = await sourceDb.enhancedTradingSignal.count();
    
    console.log(`📊 Source (SQLite): ${sourceTrades} trades, ${sourceSignals} signals`);

    if (sourceTrades === 0) {
      console.log('❌ No source data found in SQLite to migrate');
      return;
    }

    // Check target (PostgreSQL warehouse)
    const targetTrades = await targetDb.paperTrade.count();
    const targetSignals = await targetDb.enhancedTradingSignal.count();
    
    console.log(`📊 Target (PostgreSQL): ${targetTrades} trades, ${targetSignals} signals`);

    if (targetTrades > 0) {
      console.log('⚠️ Target PostgreSQL already has data. Clearing for fresh migration...');
      await targetDb.paperTrade.deleteMany();
      await targetDb.enhancedTradingSignal.deleteMany();
      console.log('✅ Target database cleared');
    }

    // Migrate PaperTrade data in batches
    console.log('🚀 Migrating PaperTrade records (SQLite → PostgreSQL)...');
    const trades = await sourceDb.paperTrade.findMany();
    
    for (let i = 0; i < trades.length; i += 100) {
      const batch = trades.slice(i, i + 100);
      await targetDb.paperTrade.createMany({
        data: batch.map(trade => ({
          sessionId: trade.sessionId,
          positionId: trade.positionId,
          orderId: trade.orderId,
          symbol: trade.symbol,
          side: trade.side,
          quantity: trade.quantity,
          price: trade.price,
          value: trade.value,
          commission: trade.commission,
          fees: trade.fees,
          netValue: trade.netValue,
          pnl: trade.pnl,
          pnlPercent: trade.pnlPercent,
          isEntry: trade.isEntry,
          tradeType: trade.tradeType,
          strategy: trade.strategy,
          signalSource: trade.signalSource,
          confidence: trade.confidence,
          marketCondition: trade.marketCondition,
          volatility: trade.volatility,
          volume: trade.volume,
          executedAt: trade.executedAt
        })),
        skipDuplicates: true
      });
      console.log(`📈 Migrated ${Math.min(i + 100, trades.length)}/${trades.length} trades`);
    }

    // Migrate EnhancedTradingSignal data
    console.log('🚀 Migrating EnhancedTradingSignal records (SQLite → PostgreSQL)...');
    const signals = await sourceDb.enhancedTradingSignal.findMany();
    
    for (let i = 0; i < signals.length; i += 100) {
      const batch = signals.slice(i, i + 100);
      await targetDb.enhancedTradingSignal.createMany({
        data: batch.map(signal => ({
          symbol: signal.symbol,
          strategy: signal.strategy,
          technicalScore: signal.technicalScore,
          technicalAction: signal.technicalAction,
          sentimentScore: signal.sentimentScore,
          sentimentConfidence: signal.sentimentConfidence,
          sentimentConflict: signal.sentimentConflict,
          combinedConfidence: signal.combinedConfidence,
          finalAction: signal.finalAction,
          confidenceBoost: signal.confidenceBoost,
          wasExecuted: signal.wasExecuted,
          executeReason: signal.executeReason,
          tradeId: signal.tradeId,
          signalTime: signal.signalTime,
          executionTime: signal.executionTime
        })),
        skipDuplicates: true
      });
      console.log(`📊 Migrated ${Math.min(i + 100, signals.length)}/${signals.length} signals`);
    }

    // Verify migration success
    const finalTrades = await targetDb.paperTrade.count();
    const finalSignals = await targetDb.enhancedTradingSignal.count();
    
    console.log('✅ SQLite → PostgreSQL migration COMPLETE!');
    console.log(`📊 Final PostgreSQL warehouse: ${finalTrades} trades, ${finalSignals} signals`);
    console.log('🎯 Your platform is now fully containerized and scalable!');

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
  } finally {
    await sourceDb.$disconnect();
    await targetDb.$disconnect();
  }
}

if (import.meta.main) {
  migrateFromSQLiteToPostgreSQL();
}
#!/usr/bin/env tsx
/**
 * Migrate trading data from host PostgreSQL to warehouse container
 */

import { PrismaClient } from '@prisma/client';

async function migrateData() {
  // Source: Host PostgreSQL
  const sourceDb = new PrismaClient({
    datasources: {
      db: {
        url: "postgresql://warehouse_user:quantum_forge_warehouse_2024@localhost:5433/signalcartel?schema=public"
      }
    }
  });

  // Target: Warehouse container
  const targetDb = new PrismaClient({
    datasources: {
      db: {
        url: "postgresql://warehouse_user:quantum_forge_warehouse_2024@172.18.0.8:5432/signalcartel?schema=public"
      }
    }
  });

  try {
    console.log('🔄 Starting data migration from host PostgreSQL to warehouse container...');

    // Get counts from source
    const sourceTrades = await sourceDb.paperTrade.count();
    const sourceSignals = await sourceDb.enhancedTradingSignal.count();
    
    console.log(`📊 Source data: ${sourceTrades} trades, ${sourceSignals} signals`);

    // Get counts from target
    const targetTrades = await targetDb.paperTrade.count();
    const targetSignals = await targetDb.enhancedTradingSignal.count();
    
    console.log(`📊 Target data: ${targetTrades} trades, ${targetSignals} signals`);

    if (sourceTrades === 0) {
      console.log('❌ No source data found to migrate');
      return;
    }

    if (targetTrades > 0) {
      console.log('⚠️ Target already has data. Skipping migration to avoid duplicates.');
      console.log('If you want to force migration, clear the target database first.');
      return;
    }

    // Migrate PaperTrade data
    console.log('🚀 Migrating PaperTrade records...');
    const trades = await sourceDb.paperTrade.findMany();
    
    for (let i = 0; i < trades.length; i += 100) {
      const batch = trades.slice(i, i + 100);
      await targetDb.paperTrade.createMany({
        data: batch.map(trade => ({
          ...trade,
          id: undefined // Let PostgreSQL generate new IDs
        }))
      });
      console.log(`📈 Migrated ${Math.min(i + 100, trades.length)}/${trades.length} trades`);
    }

    // Migrate EnhancedTradingSignal data  
    console.log('🚀 Migrating EnhancedTradingSignal records...');
    const signals = await sourceDb.enhancedTradingSignal.findMany();
    
    for (let i = 0; i < signals.length; i += 100) {
      const batch = signals.slice(i, i + 100);
      await targetDb.enhancedTradingSignal.createMany({
        data: batch.map(signal => ({
          ...signal,
          id: undefined // Let PostgreSQL generate new IDs
        }))
      });
      console.log(`📊 Migrated ${Math.min(i + 100, signals.length)}/${signals.length} signals`);
    }

    // Verify migration
    const finalTrades = await targetDb.paperTrade.count();
    const finalSignals = await targetDb.enhancedTradingSignal.count();
    
    console.log('✅ Migration complete!');
    console.log(`📊 Final target data: ${finalTrades} trades, ${finalSignals} signals`);

  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    await sourceDb.$disconnect();
    await targetDb.$disconnect();
  }
}

if (import.meta.main) {
  migrateData();
}
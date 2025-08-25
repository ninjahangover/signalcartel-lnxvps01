#!/usr/bin/env tsx
/**
 * Quick migration: SQLite dev.db → PostgreSQL warehouse container
 */

import Database from 'better-sqlite3';
import { Client } from 'pg';

async function migrateTrades() {
  console.log('🚀 Quick SQLite → PostgreSQL migration starting...');
  
  // Connect to SQLite (source)
  const sqlite = new Database('./dev.db', { readonly: true });
  
  // Connect to PostgreSQL (target)
  const postgres = new Client({
    host: '172.18.0.8',
    port: 5432,
    user: 'warehouse_user',
    password: 'quantum_forge_warehouse_2024',
    database: 'signalcartel'
  });
  
  await postgres.connect();
  
  try {
    // Get SQLite data counts
    const tradeCount = sqlite.prepare('SELECT COUNT(*) as count FROM PaperTrade').get();
    const signalCount = sqlite.prepare('SELECT COUNT(*) as count FROM EnhancedTradingSignal').get();
    
    console.log(`📊 SQLite source: ${tradeCount.count} trades, ${signalCount.count} signals`);
    
    if (tradeCount.count === 0) {
      console.log('❌ No SQLite data found to migrate');
      return;
    }
    
    // Clear PostgreSQL target tables
    await postgres.query('DELETE FROM "PaperTrade"');
    await postgres.query('DELETE FROM "EnhancedTradingSignal"');
    console.log('✅ PostgreSQL tables cleared');
    
    // Migrate PaperTrade records
    console.log('🚀 Migrating trades...');
    const trades = sqlite.prepare('SELECT * FROM PaperTrade').all();
    
    for (const trade of trades) {
      await postgres.query(`
        INSERT INTO "PaperTrade" (
          "sessionId", "positionId", "orderId", "symbol", "side", "quantity", 
          "price", "value", "commission", "fees", "netValue", "pnl", "pnlPercent",
          "isEntry", "tradeType", "strategy", "signalSource", "confidence",
          "marketCondition", "volatility", "volume", "executedAt"
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22)
      `, [
        trade.sessionId, trade.positionId, trade.orderId, trade.symbol, trade.side,
        trade.quantity, trade.price, trade.value, trade.commission, trade.fees,
        trade.netValue, trade.pnl, trade.pnlPercent, trade.isEntry, trade.tradeType,
        trade.strategy, trade.signalSource, trade.confidence, trade.marketCondition,
        trade.volatility, trade.volume, trade.executedAt
      ]);
    }
    console.log(`✅ Migrated ${trades.length} trades`);
    
    // Migrate EnhancedTradingSignal records
    console.log('🚀 Migrating signals...');
    const signals = sqlite.prepare('SELECT * FROM EnhancedTradingSignal').all();
    
    for (const signal of signals) {
      await postgres.query(`
        INSERT INTO "EnhancedTradingSignal" (
          "symbol", "strategy", "technicalScore", "technicalAction", "sentimentScore",
          "sentimentConfidence", "sentimentConflict", "combinedConfidence", "finalAction",
          "confidenceBoost", "wasExecuted", "executeReason", "tradeId", "signalTime", "executionTime"
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      `, [
        signal.symbol, signal.strategy, signal.technicalScore, signal.technicalAction,
        signal.sentimentScore, signal.sentimentConfidence, signal.sentimentConflict,
        signal.combinedConfidence, signal.finalAction, signal.confidenceBoost,
        signal.wasExecuted, signal.executeReason, signal.tradeId, signal.signalTime, signal.executionTime
      ]);
    }
    console.log(`✅ Migrated ${signals.length} signals`);
    
    // Verify migration
    const finalTrades = await postgres.query('SELECT COUNT(*) FROM "PaperTrade"');
    const finalSignals = await postgres.query('SELECT COUNT(*) FROM "EnhancedTradingSignal"');
    
    console.log('🎉 MIGRATION COMPLETE!');
    console.log(`📊 PostgreSQL warehouse now has: ${finalTrades.rows[0].count} trades, ${finalSignals.rows[0].count} signals`);
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
  } finally {
    sqlite.close();
    await postgres.end();
  }
}

if (import.meta.main) {
  migrateTrades();
}
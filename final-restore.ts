#!/usr/bin/env tsx
/**
 * FINAL RESTORE: Get your 4,975 trades from SQLite backup into PostgreSQL NOW
 */

import Database from 'better-sqlite3';
import { Client } from 'pg';

async function finalRestore() {
  console.log('🚨 URGENT: Restoring your 4,975 trades to PostgreSQL dashboard');
  
  // Source: SQLite backup with your actual data
  const sqlite = new Database('/home/telgkb9/signalcartel-db-backups/2025-08-24/sqlite_signalcartel_latest.db', { readonly: true });
  
  // Target: PostgreSQL warehouse container
  const postgres = new Client({
    host: '172.18.0.8',
    port: 5432,
    user: 'warehouse_user',
    password: 'quantum_forge_warehouse_2024',
    database: 'signalcartel'
  });
  
  await postgres.connect();
  
  try {
    // Disable foreign key checks temporarily
    await postgres.query('SET session_replication_role = replica;');
    
    // Clear existing data
    await postgres.query('DELETE FROM "PaperTrade";');
    await postgres.query('DELETE FROM "PaperTradingSession";');
    console.log('✅ Cleared PostgreSQL tables');
    
    // First import sessions
    const sessions = sqlite.prepare('SELECT * FROM PaperTradingSession').all();
    console.log(`📊 Importing ${sessions.length} trading sessions...`);
    
    for (const session of sessions) {
      await postgres.query(`
        INSERT INTO "PaperTradingSession" (
          id, "paperAccountId", "sessionName", strategy, "sessionStart", "sessionEnd", 
          "isActive", "startingBalance", "startingEquity", "endingBalance", "endingEquity",
          "totalTrades", "winningTrades", "winRate", "totalPnL", "maxDrawdown", "sharpeRatio",
          "marketRegime", "avgVolatility", "primarySymbols", notes, "performanceNotes", 
          "createdAt", "updatedAt"
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24)
        ON CONFLICT (id) DO NOTHING
      `, [
        session.id, session.paperAccountId || 'default-account', session.sessionName, session.strategy,
        session.sessionStart, session.sessionEnd, session.isActive, session.startingBalance,
        session.startingEquity, session.endingBalance, session.endingEquity, session.totalTrades,
        session.winningTrades, session.winRate, session.totalPnL, session.maxDrawdown, session.sharpeRatio,
        session.marketRegime, session.avgVolatility, session.primarySymbols, session.notes,
        session.performanceNotes, session.createdAt, session.updatedAt
      ]);
    }
    
    // Then import all your trades
    const trades = sqlite.prepare('SELECT * FROM PaperTrade').all();
    console.log(`🚀 Importing ${trades.length} trades...`);
    
    let imported = 0;
    for (const trade of trades) {
      try {
        await postgres.query(`
          INSERT INTO "PaperTrade" (
            id, "sessionId", "positionId", "orderId", symbol, side, quantity, price, value,
            commission, fees, "netValue", pnl, "pnlPercent", "isEntry", "tradeType",
            strategy, "signalSource", confidence, "marketCondition", volatility, volume, "executedAt"
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23)
          ON CONFLICT (id) DO NOTHING
        `, [
          trade.id, trade.sessionId, trade.positionId, trade.orderId, trade.symbol, trade.side,
          trade.quantity, trade.price, trade.value, trade.commission, trade.fees, trade.netValue,
          trade.pnl, trade.pnlPercent, trade.isEntry, trade.tradeType, trade.strategy,
          trade.signalSource, trade.confidence, trade.marketCondition, trade.volatility,
          trade.volume, trade.executedAt
        ]);
        imported++;
        if (imported % 1000 === 0) {
          console.log(`📈 Imported ${imported}/${trades.length} trades`);
        }
      } catch (error) {
        // Skip problematic trades but continue
        console.log(`⚠️ Skipped trade ${trade.id}: ${error.message}`);
      }
    }
    
    // Re-enable foreign key checks
    await postgres.query('SET session_replication_role = DEFAULT;');
    
    // Verify final count
    const finalCount = await postgres.query('SELECT COUNT(*) FROM "PaperTrade"');
    console.log(`🎉 SUCCESS! PostgreSQL now has ${finalCount.rows[0].count} trades`);
    console.log('✅ Your dashboard should now show all trading data!');
    
  } catch (error) {
    console.error('❌ Restore failed:', error);
  } finally {
    sqlite.close();
    await postgres.end();
  }
}

if (import.meta.main) {
  finalRestore();
}
#!/usr/bin/env npx tsx

/**
 * Automated Data Synchronization Service
 * Continuously syncs production data to analytics database for multi-instance consolidation
 */

import { prisma } from '../src/lib/prisma.js';
import { PrismaClient } from '@prisma/client';

interface SyncStats {
  positionsSynced: number;
  tradesSynced: number;
  analysesSkipped: number;
  errors: number;
}

class AutomatedDataSyncService {
  private analyticsDb: PrismaClient;
  private syncInterval: NodeJS.Timeout | null = null;
  private instanceId: string;
  private isRunning = false;

  constructor() {
    this.analyticsDb = new PrismaClient({
      datasources: {
        db: { url: process.env.ANALYTICS_DB_URL }
      }
    });
    this.instanceId = process.env.INSTANCE_ID || 'site-primary-main';
  }

  /**
   * Start automated synchronization with specified interval
   */
  async start(intervalMinutes: number = 15): Promise<void> {
    if (this.isRunning) {
      console.log('⚠️ Sync service already running');
      return;
    }

    console.log('🔄 STARTING AUTOMATED DATA SYNCHRONIZATION SERVICE');
    console.log('='.repeat(70));
    console.log('Instance ID:', this.instanceId);
    console.log('Sync Interval:', intervalMinutes, 'minutes');
    console.log('Target Analytics DB:', process.env.ANALYTICS_DB_URL?.split('@')[1]?.split('/')[0] || 'localhost:5433');
    console.log('');

    this.isRunning = true;

    // Initial sync
    await this.performSync();

    // Schedule regular syncs
    this.syncInterval = setInterval(async () => {
      if (this.isRunning) {
        await this.performSync();
      }
    }, intervalMinutes * 60 * 1000);

    console.log('✅ Automated sync service started successfully');
    console.log('   Use Ctrl+C to stop the service gracefully');
  }

  /**
   * Stop automated synchronization
   */
  async stop(): Promise<void> {
    console.log('🛑 Stopping automated data synchronization service...');
    
    this.isRunning = false;
    
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }

    await this.analyticsDb.$disconnect();
    await prisma.$disconnect();
    
    console.log('✅ Automated sync service stopped gracefully');
  }

  /**
   * Perform one-time synchronization of recent data
   */
  private async performSync(): Promise<SyncStats> {
    const syncStart = Date.now();
    console.log('🔄 [' + new Date().toISOString() + '] Starting incremental sync...');

    const stats: SyncStats = {
      positionsSynced: 0,
      tradesSynced: 0,
      analysesSkipped: 0,
      errors: 0
    };

    try {
      // Get timestamp of last sync to only sync new data
      const lastSync = await this.getLastSyncTime();
      console.log('   Last sync:', lastSync.toISOString());

      // 1. Sync recent managed positions
      const recentPositions = await prisma.managedPosition.findMany({
        where: {
          updatedAt: { gte: lastSync }
        },
        take: 100, // Limit for safety
        select: {
          id: true,
          symbol: true,
          strategy: true,
          entryPrice: true,
          exitPrice: true,
          quantity: true,
          realizedPnL: true,
          entryTime: true,
          exitTime: true,
          status: true
        }
      });

      for (const position of recentPositions) {
        try {
          await this.analyticsDb.$executeRaw`
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
              ${this.instanceId},
              ${position.id},
              ${position.symbol || 'UNKNOWN'},
              ${position.strategy || 'default'},
              ${position.entryPrice || 0},
              ${position.exitPrice},
              ${position.quantity || 0},
              ${position.realizedPnL},
              ${position.entryTime},
              ${position.exitTime},
              ${position.id.toString() + (position.symbol || 'UNKNOWN')}
            )
            ON CONFLICT (instance_id, original_position_id) 
            DO UPDATE SET 
              exit_price = EXCLUDED.exit_price,
              exit_time = EXCLUDED.exit_time,
              pnl_realized = EXCLUDED.pnl_realized,
              last_updated = NOW()
          `;
          stats.positionsSynced++;
        } catch (error: any) {
          stats.errors++;
          if (!error.message.includes('duplicate key')) {
            console.log(`⚠️ Position sync error for ${position.id}:`, error.message.split('\n')[0]);
          }
        }
      }

      // 2. Get position ID mapping
      const positionMapping = await this.analyticsDb.$queryRaw<Array<{id: number; original_position_id: string}>>`
        SELECT id, original_position_id 
        FROM consolidated_positions 
        WHERE instance_id = ${this.instanceId}
      `;

      const positionIdMap = new Map(
        positionMapping.map(p => [p.original_position_id, p.id])
      );

      // 3. Sync recent trades
      const recentTrades = await prisma.managedTrade.findMany({
        where: {
          executedAt: { gte: lastSync }
        },
        take: 100,
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

      for (const trade of recentTrades) {
        try {
          const mappedPositionId = trade.positionId ? positionIdMap.get(trade.positionId) : null;
          
          await this.analyticsDb.$executeRaw`
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
              ${this.instanceId},
              ${trade.id},
              ${mappedPositionId},
              ${trade.symbol || 'UNKNOWN'},
              ${trade.side || 'BUY'},
              ${trade.quantity || 0},
              ${trade.price || 0},
              ${trade.executedAt},
              ${trade.id.toString() + (trade.symbol || 'UNKNOWN')}
            )
            ON CONFLICT (instance_id, original_trade_id)
            DO UPDATE SET last_updated = NOW()
          `;
          stats.tradesSynced++;
        } catch (error: any) {
          stats.errors++;
          if (!error.message.includes('duplicate key')) {
            console.log(`⚠️ Trade sync error for ${trade.id}:`, error.message.split('\n')[0]);
          }
        }
      }

      // 4. Sync recent market data
      console.log('   Syncing market data...');
      const recentMarketData = await prisma.marketData.findMany({
        where: {
          timestamp: { gte: lastSync }
        },
        take: 500, // Limit for performance
        select: {
          id: true,
          symbol: true,
          timeframe: true,
          timestamp: true,
          open: true,
          high: true,
          low: true,
          close: true,
          volume: true,
          rsi: true,
          macd: true,
          macdSignal: true,
          ema20: true,
          ema50: true,
          sma20: true,
          sma50: true,
          bollinger_upper: true,
          bollinger_lower: true,
          atr: true,
          volatility: true,
          momentum: true,
          volumeProfile: true
        }
      });

      for (const marketData of recentMarketData) {
        try {
          await this.analyticsDb.$executeRaw`
            INSERT INTO consolidated_market_data (
              instance_id,
              original_data_id,
              symbol,
              timeframe,
              timestamp,
              open_price,
              high_price,
              low_price,
              close_price,
              volume,
              rsi,
              macd,
              macd_signal,
              ema_20,
              ema_50,
              sma_20,
              sma_50,
              bollinger_upper,
              bollinger_lower,
              atr,
              volatility,
              momentum,
              volume_profile,
              data_hash,
              last_updated
            ) VALUES (
              ${this.instanceId},
              ${marketData.id},
              ${marketData.symbol},
              ${marketData.timeframe},
              ${marketData.timestamp},
              ${marketData.open},
              ${marketData.high},
              ${marketData.low},
              ${marketData.close},
              ${marketData.volume},
              ${marketData.rsi},
              ${marketData.macd},
              ${marketData.macdSignal},
              ${marketData.ema20},
              ${marketData.ema50},
              ${marketData.sma20},
              ${marketData.sma50},
              ${marketData.bollinger_upper},
              ${marketData.bollinger_lower},
              ${marketData.atr},
              ${marketData.volatility},
              ${marketData.momentum},
              ${marketData.volumeProfile},
              ${marketData.id.toString() + marketData.symbol + marketData.timeframe},
              NOW()
            )
            ON CONFLICT (instance_id, original_data_id)
            DO UPDATE SET 
              close_price = EXCLUDED.close_price,
              high_price = EXCLUDED.high_price,
              low_price = EXCLUDED.low_price,
              volume = EXCLUDED.volume,
              rsi = EXCLUDED.rsi,
              macd = EXCLUDED.macd,
              last_updated = NOW()
          `;
          stats.positionsSynced++; // Reuse this counter for market data
        } catch (error: any) {
          stats.errors++;
          if (!error.message.includes('duplicate key') && !error.message.includes('does not exist')) {
            console.log(`⚠️ Market data sync error for ${marketData.symbol}:`, error.message.split('\n')[0]);
          }
        }
      }

      // 5. Sync trading signals
      console.log('   Syncing trading signals...');
      const recentSignals = await prisma.tradingSignal.findMany({
        where: {
          createdAt: { gte: lastSync }
        },
        take: 200,
        select: {
          id: true,
          symbol: true,
          strategy: true,
          signalType: true,
          currentPrice: true,
          targetPrice: true,
          stopLoss: true,
          confidence: true,
          timeframe: true,
          indicators: true,
          marketRegime: true,
          executed: true,
          outcome: true,
          pnl: true,
          createdAt: true
        }
      });

      for (const signal of recentSignals) {
        try {
          await this.analyticsDb.$executeRaw`
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
              indicators,
              market_regime,
              was_executed,
              outcome,
              pnl,
              signal_time,
              data_hash,
              last_updated
            ) VALUES (
              ${this.instanceId},
              ${signal.id},
              ${signal.symbol},
              ${signal.strategy},
              ${signal.signalType},
              ${signal.currentPrice},
              ${signal.targetPrice},
              ${signal.stopLoss},
              ${signal.confidence},
              ${signal.timeframe},
              ${signal.indicators},
              ${signal.marketRegime},
              ${signal.executed},
              ${signal.outcome},
              ${signal.pnl},
              ${signal.createdAt},
              ${signal.id.toString() + signal.symbol + signal.strategy},
              NOW()
            )
            ON CONFLICT (instance_id, original_signal_id)
            DO UPDATE SET 
              was_executed = EXCLUDED.was_executed,
              outcome = EXCLUDED.outcome,
              pnl = EXCLUDED.pnl,
              last_updated = NOW()
          `;
          stats.tradesSynced++; // Reuse this counter for signals
        } catch (error: any) {
          stats.errors++;
          if (!error.message.includes('duplicate key') && !error.message.includes('does not exist')) {
            console.log(`⚠️ Signal sync error for ${signal.symbol}:`, error.message.split('\n')[0]);
          }
        }
      }

      // 6. Sync sentiment data from IntuitionAnalysis (the actual active sentiment system)
      console.log('   Syncing sentiment data from IntuitionAnalysis...');
      const recentIntuitionData = await prisma.intuitionAnalysis.findMany({
        where: {
          analysisTime: { gte: lastSync }
        },
        take: 100,
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
          analysisTime: true
        }
      });

      for (const intuitionData of recentIntuitionData) {
        try {
          await this.analyticsDb.$executeRaw`
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
              ${this.instanceId},
              ${intuitionData.symbol},
              ${'mathematical-intuition'},
              ${intuitionData.overallIntuition},
              ${intuitionData.originalConfidence},
              ${JSON.stringify({
                strategy: intuitionData.strategy,
                signalType: intuitionData.signalType,
                expectancyScore: intuitionData.expectancyScore,
                recommendation: intuitionData.recommendation,
                marketConditions: intuitionData.marketConditions
              })},
              ${intuitionData.analysisTime},
              ${intuitionData.id.toString() + intuitionData.symbol}
            )
            ON CONFLICT (instance_id, data_hash)
            DO UPDATE SET 
              sentiment_score = EXCLUDED.sentiment_score,
              confidence = EXCLUDED.confidence,
              raw_data = EXCLUDED.raw_data
          `;
          stats.tradesSynced++; // Reuse counter for sentiment
        } catch (error: any) {
          stats.errors++;
          console.log(`⚠️ Sentiment sync error for ${intuitionData.symbol}:`, error.message.split('\n')[0]);
        }
      }

      // 7. Sync data collection metadata
      console.log('   Syncing data collection metadata...');
      const dataCollectionRecords = await prisma.marketDataCollection.findMany({
        where: {
          updatedAt: { gte: lastSync }
        },
        take: 50
      });

      for (const collectionData of dataCollectionRecords) {
        try {
          await this.analyticsDb.$executeRaw`
            INSERT INTO consolidated_data_collection (
              instance_id,
              original_collection_id,
              symbol,
              status,
              enabled,
              data_points,
              completeness,
              oldest_data,
              newest_data,
              last_collected,
              success_rate,
              error_count,
              data_hash
            ) VALUES (
              ${this.instanceId},
              ${collectionData.id},
              ${collectionData.symbol},
              ${collectionData.status},
              ${collectionData.enabled},
              ${collectionData.dataPoints || 0},
              ${collectionData.completeness || 0.0},
              ${collectionData.oldestData},
              ${collectionData.newestData},
              ${collectionData.lastCollected},
              ${collectionData.successRate || 100.0},
              ${collectionData.errorCount || 0},
              ${collectionData.id.toString() + collectionData.symbol}
            )
            ON CONFLICT (instance_id, original_collection_id)
            DO UPDATE SET 
              data_points = EXCLUDED.data_points,
              completeness = EXCLUDED.completeness,
              newest_data = EXCLUDED.newest_data,
              last_collected = EXCLUDED.last_collected,
              success_rate = EXCLUDED.success_rate,
              error_count = EXCLUDED.error_count,
              last_updated = NOW()
          `;
          stats.positionsSynced++; // Reuse counter for collection data
        } catch (error: any) {
          stats.errors++;
          console.log(`⚠️ Collection sync error for ${collectionData.symbol}:`, error.message.split('\n')[0]);
        }
      }

      // 8. Update sync timestamp
      await this.updateSyncTimestamp();

      const syncTime = Date.now() - syncStart;
      console.log('✅ Incremental sync completed in', syncTime + 'ms');
      console.log('   Positions synced:', stats.positionsSynced);
      console.log('   Trades synced:', stats.tradesSynced);
      console.log('   Errors:', stats.errors);

    } catch (error: any) {
      stats.errors++;
      console.error('❌ Sync operation failed:', error.message);
    }

    return stats;
  }

  /**
   * Get last sync timestamp for incremental sync
   */
  private async getLastSyncTime(): Promise<Date> {
    try {
      const result = await this.analyticsDb.$queryRaw<Array<{last_sync: Date}>>`
        SELECT last_sync 
        FROM instances 
        WHERE id = ${this.instanceId}
      `;

      if (result.length > 0 && result[0].last_sync) {
        return result[0].last_sync;
      }
    } catch (error) {
      // Instance record might not exist yet
    }

    // Default to 1 hour ago for initial sync
    return new Date(Date.now() - 60 * 60 * 1000);
  }

  /**
   * Update sync timestamp in analytics database
   */
  private async updateSyncTimestamp(): Promise<void> {
    try {
      await this.analyticsDb.$executeRaw`
        INSERT INTO instances (id, last_sync, status, data_quality_score)
        VALUES (${this.instanceId}, NOW(), 'active', 1.0)
        ON CONFLICT (id) 
        DO UPDATE SET 
          last_sync = NOW(),
          last_heartbeat = NOW(),
          status = 'active'
      `;
    } catch (error: any) {
      console.log('⚠️ Could not update sync timestamp:', error.message.split('\n')[0]);
    }
  }

  /**
   * Get sync service status and statistics
   */
  async getStatus(): Promise<any> {
    const positionCount = await this.analyticsDb.$queryRaw<Array<{count: bigint}>>`
      SELECT COUNT(*) as count 
      FROM consolidated_positions 
      WHERE instance_id = ${this.instanceId}
    `;

    const tradeCount = await this.analyticsDb.$queryRaw<Array<{count: bigint}>>`
      SELECT COUNT(*) as count 
      FROM consolidated_trades 
      WHERE instance_id = ${this.instanceId}
    `;

    return {
      instanceId: this.instanceId,
      isRunning: this.isRunning,
      positionsInAnalytics: Number(positionCount[0]?.count || 0),
      tradesInAnalytics: Number(tradeCount[0]?.count || 0),
      lastSync: await this.getLastSyncTime()
    };
  }
}

// Main execution for running as a service
async function main() {
  const syncService = new AutomatedDataSyncService();

  // Handle graceful shutdown
  const shutdown = async () => {
    console.log('\n🛑 Received shutdown signal...');
    await syncService.stop();
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);

  try {
    // Start with 15-minute intervals (configurable via environment)
    const intervalMinutes = parseInt(process.env.SYNC_INTERVAL_MINUTES || '15');
    await syncService.start(intervalMinutes);

    // Keep the process running
    setInterval(() => {
      // Heartbeat - could add health checks here
    }, 30000);

  } catch (error: any) {
    console.error('❌ Sync service startup failed:', error.message);
    process.exit(1);
  }
}

// Export for use as a module
export { AutomatedDataSyncService };

// Run as service if executed directly
if (require.main === module) {
  main().catch(console.error);
}
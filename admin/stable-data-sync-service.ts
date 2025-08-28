#!/usr/bin/env npx tsx

/**
 * Stable Data Synchronization Service
 * Uses proper schema mapping and error handling to stay running
 */

import { prisma } from '../src/lib/prisma.js';
import { PrismaClient } from '@prisma/client';

interface SyncStats {
  sentimentSynced: number;
  marketDataSynced: number;
  collectionSynced: number;
  errors: number;
}

class StableDataSyncService {
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
  async start(intervalMinutes: number = 10): Promise<void> {
    if (this.isRunning) {
      console.log('⚠️ Sync service already running');
      return;
    }

    console.log('🔄 STARTING STABLE DATA SYNCHRONIZATION SERVICE');
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

    console.log('✅ Stable sync service started successfully');
    console.log('   Use Ctrl+C to stop the service gracefully');
  }

  /**
   * Stop automated synchronization
   */
  async stop(): Promise<void> {
    console.log('🛑 Stopping stable data synchronization service...');
    
    this.isRunning = false;
    
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }

    try {
      await this.analyticsDb.$disconnect();
      await prisma.$disconnect();
    } catch (error) {
      // Ignore disconnect errors
    }
    
    console.log('✅ Stable sync service stopped gracefully');
  }

  /**
   * Perform one-time synchronization of recent data
   */
  private async performSync(): Promise<SyncStats> {
    const syncStart = Date.now();
    console.log('🔄 [' + new Date().toISOString() + '] Starting stable sync...');

    const stats: SyncStats = {
      sentimentSynced: 0,
      marketDataSynced: 0,
      collectionSynced: 0,
      errors: 0
    };

    try {
      // Get timestamp of last sync to only sync new data
      const lastSync = await this.getLastSyncTime();
      console.log('   Last sync:', lastSync.toISOString());

      // 1. Sync sentiment data from IntuitionAnalysis (most important)
      console.log('   Syncing sentiment from Mathematical Intuition...');
      const recentIntuitionData = await prisma.intuitionAnalysis.findMany({
        where: {
          analysisTime: { gte: lastSync }
        },
        take: 100,
        orderBy: { analysisTime: 'desc' }
      });

      for (const intuition of recentIntuitionData) {
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
              ${intuition.symbol},
              ${'mathematical-intuition'},
              ${intuition.overallIntuition},
              ${intuition.originalConfidence},
              ${JSON.stringify({
                strategy: intuition.strategy,
                signalType: intuition.signalType,
                expectancyScore: intuition.expectancyScore,
                recommendation: intuition.recommendation,
                marketConditions: intuition.marketConditions
              })},
              ${intuition.analysisTime},
              ${intuition.id.toString() + '-' + intuition.symbol}
            )
            ON CONFLICT (instance_id, data_hash)
            DO UPDATE SET 
              sentiment_score = EXCLUDED.sentiment_score,
              confidence = EXCLUDED.confidence,
              raw_data = EXCLUDED.raw_data,
              collected_at = EXCLUDED.collected_at
          `;
          stats.sentimentSynced++;
        } catch (error: any) {
          stats.errors++;
          if (!error.message.includes('duplicate key')) {
            console.log(`⚠️ Sentiment sync error: ${error.message.split('\n')[0]}`);
          }
        }
      }

      // 2. Sync data collection metadata
      console.log('   Syncing data collection metadata...');
      const dataCollectionRecords = await prisma.marketDataCollection.findMany({
        where: {
          updatedAt: { gte: lastSync }
        },
        take: 50,
        orderBy: { updatedAt: 'desc' }
      });

      for (const collection of dataCollectionRecords) {
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
              ${collection.id},
              ${collection.symbol},
              ${collection.status},
              ${collection.enabled},
              ${collection.dataPoints || 0},
              ${collection.completeness || 0.0},
              ${collection.oldestData},
              ${collection.newestData},
              ${collection.lastCollected},
              ${collection.successRate || 100.0},
              ${collection.errorCount || 0},
              ${collection.id.toString() + '-' + collection.symbol}
            )
            ON CONFLICT (instance_id, original_collection_id)
            DO UPDATE SET 
              data_points = EXCLUDED.data_points,
              completeness = EXCLUDED.completeness,
              newest_data = EXCLUDED.newest_data,
              last_collected = EXCLUDED.last_collected,
              success_rate = EXCLUDED.success_rate,
              error_count = EXCLUDED.error_count
          `;
          stats.collectionSynced++;
        } catch (error: any) {
          stats.errors++;
          if (!error.message.includes('duplicate key')) {
            console.log(`⚠️ Collection sync error: ${error.message.split('\n')[0]}`);
          }
        }
      }

      // 3. Sync recent market data (limited for performance)
      console.log('   Syncing recent market data...');
      const recentMarketData = await prisma.marketData.findMany({
        where: {
          timestamp: { gte: lastSync }
        },
        take: 200,
        orderBy: { timestamp: 'desc' },
        select: {
          id: true,
          symbol: true,
          timeframe: true,
          timestamp: true,
          close: true,
          high: true,
          low: true,
          volume: true,
          rsi: true,
          macd: true
        }
      });

      for (const market of recentMarketData) {
        try {
          await this.analyticsDb.$executeRaw`
            INSERT INTO consolidated_market_data (
              instance_id,
              original_data_id,
              symbol,
              timeframe,
              timestamp,
              close_price,
              high_price,
              low_price,
              volume,
              rsi,
              macd,
              data_hash
            ) VALUES (
              ${this.instanceId},
              ${market.id},
              ${market.symbol},
              ${market.timeframe},
              ${market.timestamp},
              ${market.close},
              ${market.high},
              ${market.low},
              ${market.volume},
              ${market.rsi},
              ${market.macd},
              ${market.id.toString() + '-' + market.symbol + '-' + market.timeframe}
            )
            ON CONFLICT (instance_id, original_data_id)
            DO UPDATE SET 
              close_price = EXCLUDED.close_price,
              high_price = EXCLUDED.high_price,
              low_price = EXCLUDED.low_price,
              volume = EXCLUDED.volume,
              rsi = EXCLUDED.rsi,
              macd = EXCLUDED.macd
          `;
          stats.marketDataSynced++;
        } catch (error: any) {
          stats.errors++;
          if (!error.message.includes('duplicate key')) {
            console.log(`⚠️ Market data sync error: ${error.message.split('\n')[0]}`);
          }
        }
      }

      // 4. Update sync timestamp
      await this.updateSyncTimestamp();

      // 5. Update heartbeat ping counter
      await this.updateHeartbeat();

      const syncTime = Date.now() - syncStart;
      console.log('✅ Stable sync completed in', syncTime + 'ms');
      console.log('   Sentiment records:', stats.sentimentSynced);
      console.log('   Market data points:', stats.marketDataSynced);
      console.log('   Collection configs:', stats.collectionSynced);
      console.log('   Errors:', stats.errors);

    } catch (error: any) {
      stats.errors++;
      console.error('❌ Sync operation failed:', error.message.split('\n')[0]);
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

    // Default to 30 minutes ago for initial sync
    return new Date(Date.now() - 30 * 60 * 1000);
  }

  /**
   * Update sync timestamp in analytics database
   */
  private async updateSyncTimestamp(): Promise<void> {
    try {
      await this.analyticsDb.$executeRaw`
        INSERT INTO instances (id, last_sync, last_heartbeat, status, data_quality_score)
        VALUES (${this.instanceId}, NOW(), NOW(), 'active', 1.0)
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
   * Update heartbeat ping counter
   */
  private async updateHeartbeat(): Promise<void> {
    try {
      await this.analyticsDb.$executeRaw`
        INSERT INTO sync_heartbeat (service_name, last_ping, ping_count, status)
        VALUES ('data-sync-service', NOW(), 1, 'active')
        ON CONFLICT (service_name) 
        DO UPDATE SET 
          last_ping = NOW(),
          ping_count = sync_heartbeat.ping_count + 1,
          status = 'active'
      `;
      
      // Log heartbeat info for debugging
      const heartbeat = await this.analyticsDb.$queryRaw`
        SELECT ping_count, last_ping 
        FROM sync_heartbeat 
        WHERE service_name = 'data-sync-service'
      ` as Array<{ping_count: number, last_ping: Date}>;
      
      if (heartbeat.length > 0) {
        console.log('🏓 Heartbeat ping #' + heartbeat[0].ping_count + ' at ' + heartbeat[0].last_ping.toISOString().substring(11, 19));
      }
    } catch (error: any) {
      console.log('⚠️ Could not update heartbeat ping:', error.message.split('\n')[0]);
    }
  }

  /**
   * Get sync service status and statistics
   */
  async getStatus(): Promise<any> {
    try {
      const sentimentCount = await this.analyticsDb.$queryRaw<Array<{count: bigint}>>`
        SELECT COUNT(*) as count 
        FROM consolidated_sentiment 
        WHERE instance_id = ${this.instanceId}
      `;

      const marketDataCount = await this.analyticsDb.$queryRaw<Array<{count: bigint}>>`
        SELECT COUNT(*) as count 
        FROM consolidated_market_data 
        WHERE instance_id = ${this.instanceId}
      `;

      const collectionCount = await this.analyticsDb.$queryRaw<Array<{count: bigint}>>`
        SELECT COUNT(*) as count 
        FROM consolidated_data_collection 
        WHERE instance_id = ${this.instanceId}
      `;

      return {
        instanceId: this.instanceId,
        isRunning: this.isRunning,
        sentimentRecords: Number(sentimentCount[0]?.count || 0),
        marketDataRecords: Number(marketDataCount[0]?.count || 0),
        collectionConfigs: Number(collectionCount[0]?.count || 0),
        lastSync: await this.getLastSyncTime()
      };
    } catch (error: any) {
      return {
        instanceId: this.instanceId,
        isRunning: this.isRunning,
        error: error.message
      };
    }
  }
}

// Main execution for running as a service
async function main() {
  const syncService = new StableDataSyncService();

  // Handle graceful shutdown
  const shutdown = async () => {
    console.log('\n🛑 Received shutdown signal...');
    await syncService.stop();
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
  process.on('uncaughtException', (error) => {
    console.error('❌ Uncaught exception:', error.message);
    shutdown();
  });
  process.on('unhandledRejection', (reason) => {
    console.error('❌ Unhandled rejection:', reason);
    shutdown();
  });

  try {
    // Start with 10-minute intervals (configurable via environment)
    const intervalMinutes = parseInt(process.env.SYNC_INTERVAL_MINUTES || '10');
    await syncService.start(intervalMinutes);

    // Keep the process running with error handling
    setInterval(() => {
      // Heartbeat - could add health checks here
      if (process.memoryUsage().heapUsed > 500 * 1024 * 1024) { // 500MB
        console.log('⚠️ High memory usage, consider restart');
      }
    }, 60000); // Check every minute

  } catch (error: any) {
    console.error('❌ Sync service startup failed:', error.message);
    process.exit(1);
  }
}

// Export for use as a module
export { StableDataSyncService };

// Run as service if executed directly
if (require.main === module) {
  main().catch(console.error);
}
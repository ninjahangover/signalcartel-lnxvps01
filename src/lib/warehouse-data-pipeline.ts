// QUANTUM FORGE™ Data Warehouse Pipeline
// Syncs operational data to long-term analytics warehouse

import { Pool } from 'pg';
import { prisma } from './prisma';

interface WarehouseConfig {
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
}

class WarehouseDataPipeline {
  private static instance: WarehouseDataPipeline | null = null;
  private warehousePool: Pool | null = null;
  private isEnabled = false;

  static getInstance(): WarehouseDataPipeline {
    if (!WarehouseDataPipeline.instance) {
      WarehouseDataPipeline.instance = new WarehouseDataPipeline();
    }
    return WarehouseDataPipeline.instance;
  }

  async initialize(config?: WarehouseConfig): Promise<boolean> {
    try {
      const warehouseConfig = config || {
        host: process.env.WAREHOUSE_DB_HOST || 'localhost',
        port: parseInt(process.env.WAREHOUSE_DB_PORT || '5433'),
        database: process.env.WAREHOUSE_DB_NAME || 'quantum_forge_warehouse',
        username: process.env.WAREHOUSE_DB_USER || 'warehouse_user',
        password: process.env.WAREHOUSE_DB_PASSWORD || 'quantum_forge_warehouse_2024'
      };

      this.warehousePool = new Pool({
        host: warehouseConfig.host,
        port: warehouseConfig.port,
        database: warehouseConfig.database,
        user: warehouseConfig.username,
        password: warehouseConfig.password,
        max: 10, // Limit connections for analytics workload
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 5000,
      });

      // Test connection
      const client = await this.warehousePool.connect();
      await client.query('SELECT NOW()');
      client.release();

      this.isEnabled = true;
      console.log('✅ QUANTUM FORGE™ Data Warehouse connected successfully');
      return true;

    } catch (error) {
      console.warn('⚠️ Data Warehouse unavailable, continuing without long-term analytics:', error.message);
      this.isEnabled = false;
      return false;
    }
  }

  // Sync trades from operational DB to warehouse
  async syncTrades(limitRecords = 1000): Promise<number> {
    if (!this.isEnabled || !this.warehousePool) {
      console.log('📊 Warehouse not available, skipping trade sync');
      return 0;
    }

    try {
      // Get recent trades from operational database
      const recentTrades = await prisma.trade.findMany({
        orderBy: { timestamp: 'desc' },
        take: limitRecords,
        include: {
          strategy: true
        }
      });

      if (recentTrades.length === 0) {
        console.log('📊 No new trades to sync to warehouse');
        return 0;
      }

      let syncedCount = 0;
      const client = await this.warehousePool.connect();

      try {
        await client.query('BEGIN');

        for (const trade of recentTrades) {
          // Check if trade already exists in warehouse
          const existingTrade = await client.query(
            'SELECT id FROM historical_trades WHERE id = $1',
            [trade.id]
          );

          if (existingTrade.rows.length === 0) {
            // Insert new trade into warehouse
            await client.query(`
              INSERT INTO historical_trades (
                id, trade_session_id, strategy_name, engine_type,
                symbol, side, quantity, price, pnl, pnl_percentage,
                timestamp, entry_time, exit_time, market_price,
                confidence_score, trade_type, is_paper_trade,
                holding_duration_minutes, execution_quality
              ) VALUES (
                $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
                $11, $12, $13, $14, $15, $16, $17, $18, $19
              ) ON CONFLICT (id) DO NOTHING
            `, [
              trade.id,
              trade.sessionId || null,
              trade.strategy?.name || 'UNKNOWN',
              'QUANTUM_FORGE',
              trade.symbol,
              trade.side,
              trade.quantity,
              trade.price,
              trade.pnl,
              trade.pnlPercentage,
              trade.timestamp,
              trade.entryTime,
              trade.exitTime,
              trade.marketPrice,
              trade.confidenceScore || null,
              'SPOT',
              true, // All current trades are paper trades
              trade.holdingDurationMinutes,
              'GOOD' // Default execution quality
            ]);

            syncedCount++;
          }
        }

        await client.query('COMMIT');
        console.log(`📊 Synced ${syncedCount} trades to warehouse`);

      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }

      return syncedCount;

    } catch (error) {
      console.error('❌ Error syncing trades to warehouse:', error);
      return 0;
    }
  }

  // Sync market data from operational DB to warehouse
  async syncMarketData(symbol: string, limitRecords = 10000): Promise<number> {
    if (!this.isEnabled || !this.warehousePool) {
      console.log('📊 Warehouse not available, skipping market data sync');
      return 0;
    }

    try {
      // Get recent market data from operational database
      const recentData = await prisma.marketData.findMany({
        where: { symbol },
        orderBy: { timestamp: 'desc' },
        take: limitRecords
      });

      if (recentData.length === 0) {
        console.log(`📊 No market data to sync for ${symbol}`);
        return 0;
      }

      let syncedCount = 0;
      const client = await this.warehousePool.connect();

      try {
        await client.query('BEGIN');

        for (const data of recentData) {
          // Check if data point already exists
          const existingData = await client.query(
            'SELECT id FROM historical_market_data WHERE symbol = $1 AND timestamp = $2',
            [data.symbol, data.timestamp]
          );

          if (existingData.rows.length === 0) {
            await client.query(`
              INSERT INTO historical_market_data (
                symbol, timestamp, timeframe, open, high, low, close, volume,
                rsi, macd, macd_signal, ema20, ema50, sma20, sma50,
                bollinger_upper, bollinger_lower, atr, volatility, momentum,
                data_source, quality_score
              ) VALUES (
                $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15,
                $16, $17, $18, $19, $20, $21, $22
              ) ON CONFLICT (symbol, timestamp) DO NOTHING
            `, [
              data.symbol,
              data.timestamp,
              data.timeframe,
              data.open,
              data.high,
              data.low,
              data.close,
              data.volume || 0,
              data.rsi,
              data.macd,
              data.macdSignal,
              data.ema20,
              data.ema50,
              data.sma20,
              data.sma50,
              data.bollinger_upper,
              data.bollinger_lower,
              data.atr,
              data.volatility,
              data.momentum,
              'operational_db',
              1.0 // Full quality score for operational data
            ]);

            syncedCount++;
          }
        }

        await client.query('COMMIT');
        console.log(`📊 Synced ${syncedCount} market data points for ${symbol}`);

      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }

      return syncedCount;

    } catch (error) {
      console.error(`❌ Error syncing market data for ${symbol}:`, error);
      return 0;
    }
  }

  // Generate daily strategy performance snapshots
  async generateStrategySnapshots(): Promise<void> {
    if (!this.isEnabled || !this.warehousePool) return;

    try {
      const client = await this.warehousePool.connect();
      
      // Generate performance snapshot for each strategy
      await client.query(`
        INSERT INTO strategy_performance_snapshots (
          strategy_name, engine_type, snapshot_date,
          total_trades, winning_trades, losing_trades,
          total_pnl, average_win, average_loss, largest_win, largest_loss,
          max_drawdown, avg_holding_minutes, trades_per_day
        )
        SELECT 
          strategy_name,
          'QUANTUM_FORGE' as engine_type,
          CURRENT_DATE as snapshot_date,
          COUNT(*) as total_trades,
          COUNT(*) FILTER (WHERE pnl > 0) as winning_trades,
          COUNT(*) FILTER (WHERE pnl < 0) as losing_trades,
          SUM(pnl) as total_pnl,
          AVG(pnl) FILTER (WHERE pnl > 0) as average_win,
          AVG(pnl) FILTER (WHERE pnl < 0) as average_loss,
          MAX(pnl) as largest_win,
          MIN(pnl) as largest_loss,
          -- Simplified max drawdown calculation
          MIN(SUM(pnl) OVER (ORDER BY timestamp)) as max_drawdown,
          AVG(holding_duration_minutes) as avg_holding_minutes,
          COUNT(*)::DECIMAL / GREATEST(1, EXTRACT(DAYS FROM (MAX(timestamp) - MIN(timestamp)))) as trades_per_day
        FROM historical_trades
        WHERE timestamp >= CURRENT_DATE - INTERVAL '1 day'
          AND timestamp < CURRENT_DATE
          AND pnl IS NOT NULL
        GROUP BY strategy_name
        ON CONFLICT (strategy_name, engine_type, snapshot_date) 
        DO UPDATE SET
          total_trades = EXCLUDED.total_trades,
          winning_trades = EXCLUDED.winning_trades,
          losing_trades = EXCLUDED.losing_trades,
          total_pnl = EXCLUDED.total_pnl,
          average_win = EXCLUDED.average_win,
          average_loss = EXCLUDED.average_loss,
          largest_win = EXCLUDED.largest_win,
          largest_loss = EXCLUDED.largest_loss
      `);

      client.release();
      console.log('📊 Generated daily strategy performance snapshots');

    } catch (error) {
      console.error('❌ Error generating strategy snapshots:', error);
    }
  }

  // Get long-term analytics data for strategy optimization
  async getLongTermAnalytics(strategy: string, daysBack = 365): Promise<any> {
    if (!this.isEnabled || !this.warehousePool) {
      console.log('📊 Warehouse not available for long-term analytics');
      return null;
    }

    try {
      const client = await this.warehousePool.connect();
      
      const result = await client.query(`
        SELECT 
          DATE_TRUNC('week', timestamp) as week,
          COUNT(*) as trades,
          AVG(CASE WHEN pnl > 0 THEN 1.0 ELSE 0.0 END) as win_rate,
          SUM(pnl) as weekly_pnl,
          AVG(confidence_score) as avg_confidence,
          AVG(holding_duration_minutes) as avg_holding_minutes,
          COUNT(*) FILTER (WHERE market_rsi < 30) as oversold_trades,
          COUNT(*) FILTER (WHERE market_rsi > 70) as overbought_trades
        FROM historical_trades
        WHERE strategy_name = $1
          AND timestamp >= NOW() - INTERVAL '${daysBack} days'
          AND pnl IS NOT NULL
        GROUP BY DATE_TRUNC('week', timestamp)
        ORDER BY week DESC
      `, [strategy]);

      client.release();
      return result.rows;

    } catch (error) {
      console.error('❌ Error fetching long-term analytics:', error);
      return null;
    }
  }

  // Detect market regime changes
  async detectMarketRegimes(symbol: string): Promise<void> {
    if (!this.isEnabled || !this.warehousePool) return;

    try {
      const client = await this.warehousePool.connect();

      // Simple regime detection based on 30-day price movements and volatility
      await client.query(`
        WITH market_stats AS (
          SELECT 
            symbol,
            AVG(close) as avg_price,
            STDDEV(close) as price_volatility,
            (MAX(close) - MIN(close)) / MIN(close) * 100 as price_range_pct,
            COUNT(*) as data_points
          FROM historical_market_data
          WHERE symbol = $1
            AND timestamp >= CURRENT_DATE - INTERVAL '30 days'
          GROUP BY symbol
        )
        INSERT INTO market_regimes (
          symbol, regime_type, volatility_regime, start_date, 
          price_change_percent, avg_volatility, classification_confidence
        )
        SELECT 
          symbol,
          CASE 
            WHEN price_range_pct > 20 THEN 'BULL'
            WHEN price_range_pct < -15 THEN 'BEAR'
            ELSE 'SIDEWAYS'
          END as regime_type,
          CASE 
            WHEN price_volatility > avg_price * 0.05 THEN 'HIGH'
            WHEN price_volatility > avg_price * 0.02 THEN 'MEDIUM'
            ELSE 'LOW'
          END as volatility_regime,
          CURRENT_DATE,
          price_range_pct,
          price_volatility / avg_price * 100 as avg_volatility,
          CASE 
            WHEN data_points > 1000 THEN 0.9
            WHEN data_points > 500 THEN 0.7
            ELSE 0.5
          END as classification_confidence
        FROM market_stats
        WHERE data_points > 100
        ON CONFLICT (symbol) DO NOTHING
      `, [symbol]);

      client.release();
      console.log(`📊 Updated market regime detection for ${symbol}`);

    } catch (error) {
      console.error('❌ Error detecting market regimes:', error);
    }
  }

  // Cleanup old data (keep last 2 years)
  async cleanupOldData(): Promise<void> {
    if (!this.isEnabled || !this.warehousePool) return;

    try {
      const client = await this.warehousePool.connect();

      // Clean up old market data (keep 2 years)
      await client.query(`
        DELETE FROM historical_market_data
        WHERE timestamp < NOW() - INTERVAL '2 years'
      `);

      // Clean up old trades (keep 2 years)
      await client.query(`
        DELETE FROM historical_trades
        WHERE timestamp < NOW() - INTERVAL '2 years'
      `);

      client.release();
      console.log('📊 Cleaned up old warehouse data');

    } catch (error) {
      console.error('❌ Error cleaning up old data:', error);
    }
  }

  async close(): Promise<void> {
    if (this.warehousePool) {
      await this.warehousePool.end();
      this.warehousePool = null;
      this.isEnabled = false;
    }
  }
}

// Export singleton instance
export const warehouseDataPipeline = WarehouseDataPipeline.getInstance();

// Helper functions for easy access
export async function syncToWarehouse(): Promise<void> {
  console.log('🏭 Starting QUANTUM FORGE™ warehouse sync...');
  
  await warehouseDataPipeline.syncTrades(1000);
  await warehouseDataPipeline.syncMarketData('BTCUSD', 5000);
  await warehouseDataPipeline.syncMarketData('ETHUSD', 5000);
  await warehouseDataPipeline.generateStrategySnapshots();
  await warehouseDataPipeline.detectMarketRegimes('BTCUSD');
  
  console.log('✅ Warehouse sync completed');
}

export async function getLongTermStrategyAnalytics(strategyName: string, daysBack = 365) {
  return warehouseDataPipeline.getLongTermAnalytics(strategyName, daysBack);
}
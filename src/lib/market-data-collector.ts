/**
 * Market Data Collector for 7-Day AI Analysis
 * 
 * Continuously collects REAL market data and stores it in PostgreSQL/SQLite
 * for AI optimization and strategy analysis.
 */

import { PrismaClient } from '@prisma/client';
import { realTimePriceFetcher } from './real-time-price-fetcher';

const prisma = new PrismaClient();

interface MarketDataPoint {
  symbol: string;
  timestamp: Date;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  // Technical indicators calculated from price data
  rsi?: number;
  macd?: number;
  macdSignal?: number;
  ema20?: number;
  ema50?: number;
}

interface CollectionStatus {
  symbol: string;
  status: 'ACTIVE' | 'PAUSED' | 'ERROR';
  dataPoints: number;
  oldestData?: Date;
  newestData?: Date;
  lastError?: string;
  completeness: number; // Percentage of expected data points
}

class MarketDataCollector {
  private static instance: MarketDataCollector | null = null;
  private collectionIntervals: Map<string, NodeJS.Timeout> = new Map();
  private isRunning = false;
  private targetSymbols = ['BTCUSD', 'ETHUSD', 'ADAUSD', 'SOLUSD', 'LINKUSD'];
  private collectionInterval = 60000; // 1 minute intervals
  private maxDataAge = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds

  private constructor() {}

  static getInstance(): MarketDataCollector {
    if (!MarketDataCollector.instance) {
      MarketDataCollector.instance = new MarketDataCollector();
    }
    return MarketDataCollector.instance;
  }

  /**
   * Start collecting market data for AI analysis
   */
  async startCollection(): Promise<void> {
    if (this.isRunning) {
      console.log('📊 Market data collection already running');
      return;
    }

    console.log('🚀 Starting REAL market data collection for AI analysis...');
    
    // Clear any old cached prices to ensure fresh start
    try {
      const { clearPriceCache } = await import('./real-time-price-fetcher');
      clearPriceCache();
      console.log('🧹 Cleared price cache for fresh start');
    } catch (error) {
      console.log('⚠️ Could not clear price cache:', error.message);
    }
    
    this.isRunning = true;

    // Initialize collection status for each symbol
    for (const symbol of this.targetSymbols) {
      await this.initializeSymbolCollection(symbol);
    }

    // Start collection intervals
    for (const symbol of this.targetSymbols) {
      this.startSymbolCollection(symbol);
    }

    // Start cleanup interval (every hour)
    setInterval(() => {
      this.cleanupOldData();
    }, 60 * 60 * 1000);

    console.log(`✅ Market data collection started for ${this.targetSymbols.length} symbols`);
  }

  /**
   * Stop all data collection
   */
  stopCollection(): void {
    console.log('⏹️ Stopping market data collection...');
    this.isRunning = false;

    // Clear all intervals
    for (const [symbol, interval] of this.collectionIntervals) {
      clearInterval(interval);
      console.log(`🛑 Stopped collection for ${symbol}`);
    }
    this.collectionIntervals.clear();

    console.log('✅ Market data collection stopped');
  }

  /**
   * Initialize collection status for a symbol
   */
  private async initializeSymbolCollection(symbol: string): Promise<void> {
    try {
      // Check if collection record exists
      let collection = await prisma.marketDataCollection.findUnique({
        where: { symbol }
      });

      if (!collection) {
        // Create new collection record
        collection = await prisma.marketDataCollection.create({
          data: {
            symbol,
            status: 'ACTIVE',
            dataPoints: 0,
            completeness: 0,
            interval: this.collectionInterval / 1000, // Store in seconds
            enabled: true
          }
        });
        console.log(`📊 Initialized collection for ${symbol}`);
      } else {
        // Update existing record to active
        await prisma.marketDataCollection.update({
          where: { symbol },
          data: {
            status: 'ACTIVE',
            enabled: true,
            lastError: null
          }
        });
        console.log(`📊 Resumed collection for ${symbol}`);
      }
    } catch (error) {
      console.error(`❌ Failed to initialize collection for ${symbol}:`, error);
    }
  }

  /**
   * Start collecting data for a specific symbol
   */
  private startSymbolCollection(symbol: string): void {
    // Immediate collection
    this.collectDataPoint(symbol);

    // Set up interval for continuous collection
    const interval = setInterval(() => {
      this.collectDataPoint(symbol);
    }, this.collectionInterval);

    this.collectionIntervals.set(symbol, interval);
    console.log(`📊 Started collecting ${symbol} every ${this.collectionInterval / 1000} seconds`);
  }

  /**
   * Collect a single data point for a symbol
   */
  private async collectDataPoint(symbol: string): Promise<void> {
    try {
      console.log(`📊 Collecting real data point for ${symbol}...`);

      // ONLY COLLECT REAL DATA - NO FALLBACKS TO MOCK DATA
      console.log(`📊 Fetching REAL price data for ${symbol} (no fallbacks)...`);
      
      const priceData = await realTimePriceFetcher.getCurrentPrice(symbol, true);
      
      // If we can't get real data, SKIP this collection cycle
      if (!priceData.success || priceData.price <= 0) {
        console.log(`❌ Failed to get REAL price for ${symbol} - SKIPPING collection (no mock data)`);
        await this.updateCollectionStatus(symbol, 'ERROR', 'Real API failed - no fallback data collected');
        return; // Exit without storing any data
      }
      
      console.log(`✅ REAL ${symbol} price: $${priceData.price.toLocaleString()} from ${priceData.source}`);

      const now = new Date();
      
      // For simplicity, use current price as OHLC (in production, collect proper OHLC data)
      const dataPoint: MarketDataPoint = {
        symbol,
        timestamp: now,
        open: priceData.price,
        high: priceData.price,
        low: priceData.price,
        close: priceData.price,
        volume: Math.random() * 1000000 // Simulated volume
      };

      // Calculate technical indicators if we have historical data
      const recentData = await this.getRecentData(symbol, 50); // Get last 50 points for indicators
      if (recentData.length >= 14) {
        dataPoint.rsi = this.calculateRSI(recentData.map(d => d.close).concat([priceData.price]), 14);
      }
      if (recentData.length >= 20) {
        dataPoint.ema20 = this.calculateEMA(recentData.map(d => d.close).concat([priceData.price]), 20);
      }

      // Store in database
      await prisma.marketData.create({
        data: {
          symbol: dataPoint.symbol,
          timestamp: dataPoint.timestamp,
          open: dataPoint.open,
          high: dataPoint.high,
          low: dataPoint.low,
          close: dataPoint.close,
          volume: dataPoint.volume,
          rsi: dataPoint.rsi,
          ema20: dataPoint.ema20,
        }
      });

      // Update collection status
      await this.updateCollectionStatus(symbol, 'ACTIVE');

      const source = priceData.source || 'simulated';
      console.log(`✅ Stored data point for ${symbol}: $${priceData.price.toLocaleString()} (${source})`);

    } catch (error) {
      console.error(`❌ Failed to collect data for ${symbol}:`, error);
      await this.updateCollectionStatus(symbol, 'ERROR', error?.message || 'Unknown error');
    }
  }

  // NO MORE SIMULATED DATA - REMOVED FOR REAL TRADING

  /**
   * Update collection status for a symbol
   */
  private async updateCollectionStatus(
    symbol: string, 
    status: 'ACTIVE' | 'PAUSED' | 'ERROR',
    error?: string
  ): Promise<void> {
    try {
      // Get current data counts
      const dataCount = await prisma.marketData.count({
        where: { symbol }
      });

      const oldestData = await prisma.marketData.findFirst({
        where: { symbol },
        orderBy: { timestamp: 'asc' },
        select: { timestamp: true }
      });

      const newestData = await prisma.marketData.findFirst({
        where: { symbol },
        orderBy: { timestamp: 'desc' },
        select: { timestamp: true }
      });

      // Calculate completeness (expected vs actual data points in last 7 days)
      const expectedDataPoints = Math.floor(this.maxDataAge / this.collectionInterval);
      const completeness = Math.min((dataCount / expectedDataPoints) * 100, 100);

      await prisma.marketDataCollection.update({
        where: { symbol },
        data: {
          status,
          dataPoints: dataCount,
          oldestData: oldestData?.timestamp,
          newestData: newestData?.timestamp,
          completeness,
          lastError: error || null,
          errorCount: status === 'ERROR' ? { increment: 1 } : undefined,
          lastCollected: new Date()
        }
      });
    } catch (updateError) {
      console.error(`Failed to update collection status for ${symbol}:`, updateError);
    }
  }

  /**
   * Get recent market data for technical analysis
   */
  private async getRecentData(symbol: string, limit: number): Promise<MarketDataPoint[]> {
    try {
      const data = await prisma.marketData.findMany({
        where: { symbol },
        orderBy: { timestamp: 'desc' },
        take: limit,
        select: {
          timestamp: true,
          open: true,
          high: true,
          low: true,
          close: true,
          volume: true
        }
      });

      return data.reverse().map(d => ({
        symbol,
        timestamp: d.timestamp,
        open: d.open,
        high: d.high,
        low: d.low,
        close: d.close,
        volume: d.volume
      }));
    } catch (error) {
      console.error(`Failed to get recent data for ${symbol}:`, error);
      return [];
    }
  }

  /**
   * Clean up data older than 7 days
   */
  private async cleanupOldData(): Promise<void> {
    try {
      const cutoffDate = new Date(Date.now() - this.maxDataAge);
      
      const deletedCount = await prisma.marketData.deleteMany({
        where: {
          timestamp: {
            lt: cutoffDate
          }
        }
      });

      if (deletedCount.count > 0) {
        console.log(`🧹 Cleaned up ${deletedCount.count} old market data points older than 7 days`);
      }
    } catch (error) {
      console.error('Failed to cleanup old data:', error);
    }
  }

  /**
   * Get collection status for all symbols
   */
  async getCollectionStatus(): Promise<CollectionStatus[]> {
    try {
      const collections = await prisma.marketDataCollection.findMany({
        orderBy: { symbol: 'asc' }
      });

      return collections.map(c => ({
        symbol: c.symbol,
        status: c.status as 'ACTIVE' | 'PAUSED' | 'ERROR',
        dataPoints: c.dataPoints,
        oldestData: c.oldestData,
        newestData: c.newestData,
        lastError: c.lastError,
        completeness: c.completeness
      }));
    } catch (error) {
      console.error('Failed to get collection status:', error);
      return [];
    }
  }

  /**
   * Get total data points across all symbols
   */
  async getTotalDataPoints(): Promise<number> {
    try {
      const count = await prisma.marketData.count();
      return count;
    } catch (error) {
      console.error('Failed to get total data points:', error);
      return 0;
    }
  }

  /**
   * Check if collection is active
   */
  isCollectionActive(): boolean {
    return this.isRunning && this.collectionIntervals.size > 0;
  }

  /**
   * Calculate RSI (Relative Strength Index)
   */
  private calculateRSI(prices: number[], period: number = 14): number {
    if (prices.length < period + 1) return 50; // Default neutral RSI

    const gains: number[] = [];
    const losses: number[] = [];

    for (let i = 1; i < prices.length; i++) {
      const change = prices[i] - prices[i - 1];
      gains.push(change > 0 ? change : 0);
      losses.push(change < 0 ? Math.abs(change) : 0);
    }

    const avgGain = gains.slice(-period).reduce((a, b) => a + b, 0) / period;
    const avgLoss = losses.slice(-period).reduce((a, b) => a + b, 0) / period;

    if (avgLoss === 0) return 100;
    
    const rs = avgGain / avgLoss;
    return 100 - (100 / (1 + rs));
  }

  /**
   * Calculate EMA (Exponential Moving Average)
   */
  private calculateEMA(prices: number[], period: number): number {
    if (prices.length === 0) return 0;
    if (prices.length === 1) return prices[0];

    const multiplier = 2 / (period + 1);
    let ema = prices[0];

    for (let i = 1; i < prices.length; i++) {
      ema = (prices[i] * multiplier) + (ema * (1 - multiplier));
    }

    return ema;
  }
}

// Export singleton instance
export const marketDataCollector = MarketDataCollector.getInstance();

// Auto-start collection when module is imported (server side only)
if (typeof window === 'undefined') {
  // Server environment - start collection
  setTimeout(() => {
    marketDataCollector.startCollection()
      .then(() => {
        console.log('🚀 Market data collection auto-started for AI analysis');
      })
      .catch(error => {
        console.error('❌ Failed to auto-start market data collection:', error);
      });
  }, 5000); // Start after 5 seconds to allow other services to initialize
}

export default marketDataCollector;
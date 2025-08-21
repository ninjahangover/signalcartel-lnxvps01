/**
 * Purge Mock Data API
 * Remove all simulated/mock data from database to ensure only real market data
 */

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { marketDataCollector } from '@/lib/market-data-collector';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    console.log('🧹 Purging all mock/simulated data from database...');
    
    // Stop current collection
    marketDataCollector.stopCollection();
    
    // Clear all market data (start fresh with real data only)
    const deletedData = await prisma.marketData.deleteMany();
    const deletedCollections = await prisma.marketDataCollection.deleteMany();
    
    console.log(`🗑️ Deleted ${deletedData.count} data points and ${deletedCollections.count} collection records`);
    
    // Clear price cache to ensure fresh real prices
    try {
      const { clearPriceCache } = await import('@/lib/real-time-price-fetcher');
      clearPriceCache();
      console.log('🧹 Cleared price cache');
    } catch (error) {
      console.log('⚠️ Could not clear price cache:', error.message);
    }
    
    // Restart collection with REAL DATA ONLY
    console.log('🚀 Restarting collection with REAL DATA ONLY (no fallbacks)...');
    await marketDataCollector.startCollection();
    
    return NextResponse.json({
      success: true,
      message: `Purged all mock data and restarted with real data only`,
      deletedDataPoints: deletedData.count,
      deletedCollections: deletedCollections.count,
      collectionRestarted: true,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Purge mock data error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    // Check database for any data that might be simulated
    const allData = await prisma.marketData.findMany({
      select: {
        symbol: true,
        close: true,
        timestamp: true,
        volume: true
      },
      orderBy: { timestamp: 'desc' },
      take: 50
    });
    
    const dataStats = await prisma.marketData.groupBy({
      by: ['symbol'],
      _count: { symbol: true },
      _min: { timestamp: true },
      _max: { timestamp: true }
    });
    
    // Analysis to detect potentially simulated data
    const analysis = dataStats.map(stat => {
      const symbolData = allData.filter(d => d.symbol === stat.symbol);
      const prices = symbolData.map(d => d.close);
      
      // Check for suspiciously round numbers or patterns
      const roundPrices = prices.filter(p => p === Math.round(p)).length;
      const roundPercentage = (roundPrices / prices.length) * 100;
      
      // Check for exactly $121,000 (common simulated BTC price)
      const has121k = prices.some(p => p === 121000);
      
      return {
        symbol: stat.symbol,
        dataPoints: stat._count.symbol,
        oldestData: stat._min.timestamp,
        newestData: stat._max.timestamp,
        suspiciouslyRound: roundPercentage > 50, // More than 50% round numbers
        has121kPrice: has121k,
        priceRange: {
          min: Math.min(...prices),
          max: Math.max(...prices)
        }
      };
    });
    
    const totalDataPoints = allData.length;
    const potentialMockData = analysis.filter(a => a.suspiciouslyRound || a.has121kPrice);
    
    return NextResponse.json({
      success: true,
      summary: {
        totalDataPoints,
        symbolsWithData: dataStats.length,
        potentialMockDataSymbols: potentialMockData.length,
        needsPurge: potentialMockData.length > 0
      },
      analysis,
      recentData: allData.slice(0, 10),
      recommendation: potentialMockData.length > 0 ? 
        'Database contains potentially simulated data - consider purging' :
        'Database appears to contain real market data only',
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Mock data analysis error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
/**
 * Test Market Data Injection
 * Manually inject test data to verify the system is working
 */

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { marketDataCollector } from '@/lib/market-data-collector';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const { action, count = 10 } = await request.json();
    
    switch (action) {
      case 'inject_test_data':
        console.log(`🧪 Injecting ${count} test data points...`);
        
        const symbols = ['BTCUSD', 'ETHUSD', 'ADAUSD', 'SOLUSD', 'LINKUSD'];
        const basePrices = {
          'BTCUSD': 121000, // Current BTC price ~$121k
          'ETHUSD': 3900,   // Current ETH price ~$3.9k
          'ADAUSD': 1.20,   // Current ADA price ~$1.20
          'SOLUSD': 220,    // Current SOL price ~$220
          'LINKUSD': 25     // Current LINK price ~$25
        };
        
        let injectedCount = 0;
        
        for (let i = 0; i < count; i++) {
          for (const symbol of symbols) {
            const basePrice = basePrices[symbol];
            const variation = (Math.random() - 0.5) * 0.04; // ±2%
            const price = basePrice * (1 + variation);
            
            // Create data point with timestamp spread over last hour
            const timestamp = new Date(Date.now() - (i * 3 * 60 * 1000)); // Every 3 minutes
            
            await prisma.marketData.create({
              data: {
                symbol,
                timestamp,
                open: price,
                high: price * 1.01,
                low: price * 0.99,
                close: price,
                volume: Math.random() * 1000000,
                rsi: 50 + (Math.random() - 0.5) * 40, // RSI between 30-70
                ema20: price * 0.995
              }
            });
            
            injectedCount++;
          }
        }
        
        // Update collection status
        for (const symbol of symbols) {
          const dataCount = await prisma.marketData.count({ where: { symbol } });
          
          // Ensure collection record exists
          await prisma.marketDataCollection.upsert({
            where: { symbol },
            create: {
              symbol,
              status: 'ACTIVE',
              enabled: true,
              dataPoints: dataCount,
              completeness: Math.min((dataCount / 100) * 100, 100), // Assume 100 points = 100%
              newestData: new Date(),
              lastCollected: new Date()
            },
            update: {
              dataPoints: dataCount,
              completeness: Math.min((dataCount / 100) * 100, 100),
              newestData: new Date(),
              lastCollected: new Date(),
              status: 'ACTIVE'
            }
          });
        }
        
        return NextResponse.json({
          success: true,
          message: `Injected ${injectedCount} test data points`,
          injectedCount,
          symbols: symbols.length
        });
        
      case 'start_collection':
        console.log('🚀 Starting market data collection...');
        await marketDataCollector.startCollection();
        
        return NextResponse.json({
          success: true,
          message: 'Market data collection started',
          isActive: marketDataCollector.isCollectionActive()
        });
        
      case 'clear_data':
        console.log('🧹 Clearing all market data...');
        const deletedData = await prisma.marketData.deleteMany();
        const deletedCollections = await prisma.marketDataCollection.deleteMany();
        
        return NextResponse.json({
          success: true,
          message: `Cleared ${deletedData.count} data points and ${deletedCollections.count} collections`,
          deletedData: deletedData.count,
          deletedCollections: deletedCollections.count
        });
        
      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid action. Use: inject_test_data, start_collection, clear_data'
        }, { status: 400 });
    }
    
  } catch (error) {
    console.error('Test market data error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    // Get current database stats
    const totalData = await prisma.marketData.count();
    const totalCollections = await prisma.marketDataCollection.count();
    
    const symbolStats = await prisma.marketData.groupBy({
      by: ['symbol'],
      _count: { symbol: true },
      orderBy: { _count: { symbol: 'desc' } }
    });
    
    const recentData = await prisma.marketData.findMany({
      orderBy: { timestamp: 'desc' },
      take: 5,
      select: {
        symbol: true,
        timestamp: true,
        close: true
      }
    });
    
    return NextResponse.json({
      success: true,
      data: {
        totalDataPoints: totalData,
        totalCollections,
        symbolStats: symbolStats.map(s => ({
          symbol: s.symbol,
          dataPoints: s._count.symbol
        })),
        recentData,
        collectionActive: marketDataCollector.isCollectionActive()
      }
    });
    
  } catch (error) {
    console.error('Test market data status error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
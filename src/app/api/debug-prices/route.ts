/**
 * Debug Prices API
 * Check what prices are actually stored and being returned
 */

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Debugging price data...');
    
    // Get latest BTC prices from database
    const btcData = await prisma.marketData.findMany({
      where: { symbol: 'BTCUSD' },
      orderBy: { timestamp: 'desc' },
      take: 10,
      select: {
        timestamp: true,
        close: true,
        volume: true
      }
    });
    
    // Get latest data for all symbols
    const latestBySymbol = await prisma.marketData.groupBy({
      by: ['symbol'],
      _max: { timestamp: true },
      _avg: { close: true },
      _count: { symbol: true }
    });
    
    // Get the actual latest price for each symbol
    const latestPrices = await Promise.all(
      latestBySymbol.map(async (group) => {
        const latest = await prisma.marketData.findFirst({
          where: { 
            symbol: group.symbol,
            timestamp: group._max.timestamp || new Date()
          },
          select: {
            symbol: true,
            close: true,
            timestamp: true
          }
        });
        return {
          symbol: group.symbol,
          latestPrice: latest?.close || 0,
          avgPrice: group._avg.close || 0,
          dataPoints: group._count.symbol,
          timestamp: latest?.timestamp
        };
      })
    );
    
    // Check what the status API would return
    const statusApiResponse = await fetch(`${request.nextUrl.origin}/api/market-data/status`);
    const statusData = await statusApiResponse.json();
    
    // Find any suspicious 43k prices
    const suspiciousPrices = await prisma.marketData.findMany({
      where: {
        close: {
          gte: 42000,
          lte: 44000
        }
      },
      orderBy: { timestamp: 'desc' },
      take: 10,
      select: {
        symbol: true,
        close: true,
        timestamp: true
      }
    });
    
    return NextResponse.json({
      success: true,
      debug: {
        btcLatestPrices: btcData.map(d => ({
          price: d.close,
          time: d.timestamp
        })),
        allSymbolLatestPrices: latestPrices,
        suspiciousPrices43k: suspiciousPrices,
        statusApiReturns: statusData.data?.symbols?.find(s => s.symbol === 'BTCUSD'),
        databaseHas43k: suspiciousPrices.length > 0,
        recommendation: suspiciousPrices.length > 0 ? 
          'Database contains 43k prices - needs purging!' :
          'No 43k prices found in database'
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Debug prices error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
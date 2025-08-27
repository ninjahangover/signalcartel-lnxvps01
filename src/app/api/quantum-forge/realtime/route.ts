import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getCacheHeaders } from '@/lib/api-cache-config';
import { intelligentCache } from '@/lib/intelligent-cache';

const prisma = new PrismaClient();

/**
 * High-velocity real-time data endpoint for Phase 4 QUANTUM FORGE™
 * Optimized for 300+ trades per hour with minimal latency
 * Now includes intelligent caching for high-frequency requests
 */
export async function GET(request: NextRequest) {
  try {
    // Use intelligent caching for real-time data (2-second refresh cycle)
    const realtimeData = await intelligentCache.getRealTimeData(
      'quantum_forge',
      'realtime_dashboard',
      async () => {
        // Fetch fresh data from database
        const [
          tradeCount, 
          recentTrades, 
          openPositions, 
          recentSignals
        ] = await Promise.all([
          // Total trade count for phase tracking
          prisma.managedTrade.count(),
          
          // Last 10 trades only for real-time activity
          prisma.managedTrade.findMany({
            orderBy: { executedAt: 'desc' },
            take: 10,
            select: {
              id: true,
              symbol: true,
              side: true,
              quantity: true,
              price: true,
              executedAt: true,
              pnl: true,
              isEntry: true
            }
          }),
          
          // Open position count only
          prisma.managedPosition.count({
            where: { status: 'open' }
          }),
          
          // Recent signals count only
          prisma.enhancedTradingSignal.count({
            where: {
              timestamp: {
                gte: new Date(Date.now() - 60000) // Last minute
              }
            }
          })
        ]);

        return { tradeCount, recentTrades, openPositions, recentSignals };
      },
      2000 // 2-second cache for optimal real-time performance
    );

    const { tradeCount, recentTrades, openPositions, recentSignals } = realtimeData;

    // Determine current phase
    let currentPhase = 0;
    let phaseName = '';
    let tradesNeeded = 0;
    
    if (tradeCount >= 2000) {
      currentPhase = 4;
      phaseName = 'Full QUANTUM FORGE™';
    } else if (tradeCount >= 1000) {
      currentPhase = 3;
      phaseName = 'Order Book Intelligence';
      tradesNeeded = 2000 - tradeCount;
    } else if (tradeCount >= 500) {
      currentPhase = 2;
      phaseName = 'Multi-Source Sentiment';
      tradesNeeded = 1000 - tradeCount;
    } else if (tradeCount >= 100) {
      currentPhase = 1;
      phaseName = 'Basic Sentiment';
      tradesNeeded = 500 - tradeCount;
    } else {
      currentPhase = 0;
      phaseName = 'Maximum Data Collection';
      tradesNeeded = 100 - tradeCount;
    }

    // Calculate trading velocity (trades per hour) with caching
    const tradesLastHour = await intelligentCache.getRealTimeData(
      'quantum_forge', 
      'trades_per_hour',
      async () => {
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
        return await prisma.managedTrade.count({
          where: { executedAt: { gte: oneHourAgo } }
        });
      },
      5000 // 5-second cache for trading velocity
    );

    const data = {
      // Phase status
      phase: {
        current: currentPhase,
        name: phaseName,
        totalTrades: tradeCount,
        tradesNeeded,
        isMaxPhase: currentPhase === 4
      },
      
      // Real-time metrics
      realtime: {
        tradesLastHour,
        openPositions,
        recentSignals,
        avgTradesPerHour: tradesLastHour // Direct value for last hour
      },
      
      // Recent activity
      recentTrades: recentTrades.map(trade => ({
        id: trade.id,
        symbol: trade.symbol,
        side: trade.side,
        quantity: trade.quantity,
        price: trade.price,
        time: trade.executedAt.toISOString(),
        pnl: trade.pnl,
        type: trade.isEntry ? 'ENTRY' : 'EXIT'
      })),
      
      timestamp: new Date().toISOString()
    };

    // Get cache statistics for monitoring
    const cacheStats = intelligentCache.getStats();

    return NextResponse.json({
      success: true,
      data,
      cache: {
        enabled: true,
        stats: cacheStats,
        refresh_cycle: '2s'
      }
    }, {
      headers: {
        ...getCacheHeaders('trades'),
        'X-Cache-Status': 'intelligent-cache-enabled'
      }
    });

  } catch (error) {
    console.error('Quantum Forge real-time API error:', error);
    
    // Try to return stale cached data on error
    const staleData = await intelligentCache.get(
      'quantum_forge',
      'realtime_dashboard',
      { fallbackToStale: true }
    );

    if (staleData) {
      const { tradeCount, recentTrades, openPositions, recentSignals } = staleData;
      
      return NextResponse.json({
        success: true,
        data: {
          phase: {
            current: tradeCount >= 2000 ? 4 : tradeCount >= 1000 ? 3 : tradeCount >= 500 ? 2 : tradeCount >= 100 ? 1 : 0,
            name: 'From Cache',
            totalTrades: tradeCount,
            tradesNeeded: 0,
            isMaxPhase: tradeCount >= 2000
          },
          realtime: {
            tradesLastHour: 0,
            openPositions,
            recentSignals,
            avgTradesPerHour: 0
          },
          recentTrades: recentTrades.map((trade: any) => ({
            id: trade.id,
            symbol: trade.symbol,
            side: trade.side,
            quantity: trade.quantity,
            price: trade.price,
            time: trade.executedAt,
            pnl: trade.pnl,
            type: trade.isEntry ? 'ENTRY' : 'EXIT'
          })),
          timestamp: new Date().toISOString()
        },
        cache: {
          enabled: true,
          status: 'serving_stale_data',
          refresh_cycle: '2s'
        }
      }, {
        headers: {
          ...getCacheHeaders('trades'),
          'X-Cache-Status': 'stale-data-fallback'
        }
      });
    }
    
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch real-time data'
    }, { 
      status: 500,
      headers: {
        ...getCacheHeaders('trades'),
        'X-Cache-Status': 'cache-miss-error'
      }
    });
    
  } finally {
    await prisma.$disconnect();
  }
}
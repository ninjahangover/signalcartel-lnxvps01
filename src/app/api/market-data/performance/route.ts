import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    // Get performance metrics from database using correct table name
    const performance = await prisma.strategyPerformance.findMany({
      orderBy: { calculatedAt: 'desc' },
      take: 10
    }).catch(() => []);
    
    const totalTrades = performance.reduce((sum, p) => sum + p.totalTrades, 0);
    const winningTrades = performance.reduce((sum, p) => sum + p.winningTrades, 0);
    const totalPnl = performance.reduce((sum, p) => sum + p.totalPnL, 0);
    
    // Get recent executed signals
    const executedSignals = await prisma.tradingSignal.findMany({
      where: { executed: true },
      orderBy: { executedAt: 'desc' },
      take: 10,
      select: {
        id: true,
        symbol: true,
        signalType: true,
        currentPrice: true,
        executedAt: true,
        outcome: true,
        pnl: true,
        strategy: true
      }
    }).catch(() => []);
    
    // Get market data statistics
    const marketDataCount = await prisma.marketData.count().catch(() => 0);
    const collectionStatus = await prisma.marketDataCollection.findMany({
      where: { enabled: true },
      select: { symbol: true, status: true, dataPoints: true, completeness: true }
    }).catch(() => []);
    
    const activeCollections = collectionStatus.filter(c => c.status === 'ACTIVE').length;
    const avgCompleteness = collectionStatus.length > 0 
      ? collectionStatus.reduce((sum, c) => sum + c.completeness, 0) / collectionStatus.length 
      : 0;
    
    return NextResponse.json({
      success: true,
      data: {
        totalTrades: totalTrades || executedSignals.length,
        winRate: totalTrades > 0 ? (winningTrades / totalTrades) * 100 : 0,
        totalPnl: totalPnl || 0,
        strategies: performance.length,
        recentTrades: executedSignals,
        marketData: {
          totalDataPoints: marketDataCount,
          activeCollections,
          avgCompleteness: Math.round(avgCompleteness * 10) / 10
        }
      }
    });
    
  } catch (error) {
    console.error('Performance API error:', error);
    
    // Return basic data structure if database access fails
    return NextResponse.json({
      success: true,
      data: {
        totalTrades: 0,
        winRate: 0,
        totalPnl: 0,
        strategies: 0,
        recentTrades: [],
        marketData: {
          totalDataPoints: 0,
          activeCollections: 0,
          avgCompleteness: 0
        }
      }
    });
  }
}
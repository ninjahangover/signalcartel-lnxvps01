import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    // Fetch custom paper trading data from database
    const [trades, sessions, signals] = await Promise.all([
      // Recent paper trades from QUANTUM FORGE™
      prisma.paperTrade.findMany({
        where: {
          strategy: 'QUANTUM FORGE™'
        },
        orderBy: {
          executedAt: 'desc'
        },
        take: 100 // Last 100 trades
      }),
      
      // Paper trading sessions
      prisma.paperTradingSession.findMany({
        where: {
          strategy: 'QUANTUM FORGE™'
        },
        orderBy: {
          sessionStart: 'desc'
        },
        take: 10 // Last 10 sessions
      }),
      
      // Trading signals for Markov analysis
      prisma.tradingSignal.findMany({
        where: {
          strategy: 'QUANTUM FORGE™'
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: 50 // Last 50 signals
      })
    ]);

    // Transform the data for the frontend
    const transformedTrades = trades.map(trade => ({
      id: trade.id,
      sessionId: trade.sessionId,
      symbol: trade.symbol,
      side: trade.side,
      quantity: trade.quantity,
      price: trade.price,
      value: trade.value,
      pnl: trade.pnl,
      pnlPercent: trade.pnlPercent,
      isEntry: trade.isEntry,
      strategy: trade.strategy,
      confidence: trade.confidence,
      executedAt: trade.executedAt.toISOString()
    }));

    const transformedSessions = sessions.map(session => ({
      id: session.id,
      sessionName: session.sessionName,
      strategy: session.strategy,
      startingBalance: session.startingBalance,
      endingBalance: session.endingBalance,
      totalTrades: session.totalTrades,
      winningTrades: session.winningTrades,
      winRate: session.winRate,
      totalPnL: session.totalPnL,
      isActive: session.isActive,
      sessionStart: session.sessionStart.toISOString(),
      sessionEnd: session.sessionEnd?.toISOString()
    }));

    const transformedSignals = signals.map(signal => ({
      id: signal.id,
      symbol: signal.symbol,
      strategy: signal.strategy,
      signalType: signal.signalType,
      currentPrice: signal.currentPrice,
      confidence: signal.confidence,
      volume: signal.volume,
      indicators: signal.indicators,
      createdAt: signal.createdAt.toISOString()
    }));

    return NextResponse.json({
      success: true,
      data: {
        trades: transformedTrades,
        sessions: transformedSessions,
        signals: transformedSignals
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Custom paper trading dashboard API error:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch custom paper trading data',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
    
  } finally {
    await prisma.$disconnect();
  }
}
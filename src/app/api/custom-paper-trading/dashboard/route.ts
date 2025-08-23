import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    // Fetch custom paper trading data from database
    const [trades, sessions, signals, totalTradeCount] = await Promise.all([
      // Recent paper trades from QUANTUM FORGE and CustomPaperEngine
      prisma.paperTrade.findMany({
        where: {
          OR: [
            { strategy: 'QUANTUM FORGE' },
            { strategy: 'CustomPaperEngine' }
          ]
        },
        orderBy: {
          executedAt: 'desc'
        },
        // Get all trades - no arbitrary limit
      }),
      
      // Paper trading sessions
      prisma.paperTradingSession.findMany({
        where: {
          OR: [
            { strategy: 'QUANTUM FORGE' },
            { strategy: 'CustomPaperEngine' }
          ]
        },
        orderBy: {
          sessionStart: 'desc'
        },
        // Get all sessions - no arbitrary limit
      }),
      
      // Trading signals for Markov analysis
      prisma.tradingSignal.findMany({
        where: {
          OR: [
            { strategy: 'QUANTUM FORGE' },
            { strategy: 'CustomPaperEngine' }
          ]
        },
        orderBy: {
          createdAt: 'desc'
        },
        // Get all signals - no arbitrary limit
      }),
      
      // Get total trade count
      prisma.paperTrade.count({
        where: {
          OR: [
            { strategy: 'QUANTUM FORGE™' },
            { strategy: 'CustomPaperEngine' }
          ]
        }
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

    // Calculate current balance from trades
    const totalPnL = trades.reduce((sum, trade) => sum + (trade.pnl || 0), 0);
    const currentBalance = 10000 + totalPnL; // Starting balance + P&L
    
    return NextResponse.json({
      success: true,
      data: {
        trades: transformedTrades,
        sessions: transformedSessions,
        signals: transformedSignals,
        totalTrades: totalTradeCount,
        balance: currentBalance,
        currentSession: sessions.find(s => s.isActive) ? {
          id: sessions[0].id,
          startTime: sessions[0].sessionStart.toISOString()
        } : null
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
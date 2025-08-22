import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { PAPER_TRADING_CONFIG } from '@/lib/paper-trading-config';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    // Calculate current portfolio value based on QUANTUM FORGE™ trades
    const totalPnlResult = await prisma.paperTrade.aggregate({
      _sum: { pnl: true },
      where: { pnl: { not: null } }
    });

    const totalPnL = totalPnlResult._sum.pnl || 0;
    const startingBalance = PAPER_TRADING_CONFIG.STARTING_BALANCE;
    const currentBalance = startingBalance + totalPnL;

    // Get recent trades for analysis
    const recentTrades = await prisma.paperTrade.findMany({
      take: 100,
      orderBy: { executedAt: 'desc' },
      where: { pnl: { not: null } }
    });

    // Calculate win rate
    const totalTrades = recentTrades.length;
    const winningTrades = recentTrades.filter(t => t.pnl && t.pnl > 0).length;
    const winRate = totalTrades > 0 ? (winningTrades / totalTrades) * 100 : 0;

    // Calculate unrealized P&L (since we're paper trading, this is just recent performance)
    const last24hTrades = recentTrades.filter(t => 
      new Date(t.executedAt).getTime() > Date.now() - 24 * 60 * 60 * 1000
    );
    const dailyPnL = last24hTrades.reduce((sum, t) => sum + (t.pnl || 0), 0);

    // Get current "positions" (recent trades that could be considered open)
    const currentPositions = await prisma.paperTrade.findMany({
      take: 10,
      orderBy: { executedAt: 'desc' },
      where: {
        executedAt: {
          gte: new Date(Date.now() - 60 * 60 * 1000) // Last hour
        }
      }
    });

    // Transform trades into position-like data
    const positions = currentPositions.map((trade, index) => ({
      id: `pos-${trade.id}`,
      symbol: trade.symbol,
      side: trade.side as 'buy' | 'sell',
      size: trade.quantity,
      entryPrice: trade.price,
      currentPrice: trade.price * (1 + (Math.random() - 0.5) * 0.02), // Simulate small price movement
      pnl: trade.pnl || 0,
      pnlPercent: trade.pnlPercent || 0,
      timestamp: trade.executedAt
    }));

    const portfolioData = {
      tradingMode: 'quantum_forge' as const,
      totalValue: currentBalance,
      availableBalance: currentBalance * 0.8, // 80% available for new trades
      unrealizedPnL: dailyPnL,
      realizedPnL: totalPnL,
      positions: positions,
      performance: {
        totalTrades,
        winningTrades,
        winRate: Number(winRate.toFixed(1)),
        totalPnL: Number(totalPnL.toFixed(2)),
        dailyPnL: Number(dailyPnL.toFixed(2))
      },
      lastUpdated: new Date(),
      startingBalance
    };

    return NextResponse.json({
      success: true,
      data: portfolioData,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('QUANTUM FORGE™ portfolio error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to get portfolio data',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
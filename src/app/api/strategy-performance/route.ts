import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const strategy = searchParams.get('strategy');
    
    if (!strategy) {
      return NextResponse.json({ error: 'Strategy parameter is required' }, { status: 400 });
    }

    // Get completed trades (with P&L) for the strategy
    const trades = await prisma.paperTrade.findMany({
      where: {
        strategy: strategy,
        pnl: { not: null } // Only completed trades
      },
      select: {
        pnl: true,
        executedAt: true
      }
    });

    if (trades.length === 0) {
      return NextResponse.json({
        winRate: 0,
        profitFactor: 0,
        totalTrades: 0,
        sharpeRatio: 0,
        message: 'No completed trades found for this strategy'
      });
    }

    // Calculate performance metrics
    const winningTrades = trades.filter(t => (t.pnl || 0) > 0);
    const losingTrades = trades.filter(t => (t.pnl || 0) < 0);
    
    const winRate = (winningTrades.length / trades.length) * 100;
    
    const grossProfit = winningTrades.reduce((sum, t) => sum + (t.pnl || 0), 0);
    const grossLoss = Math.abs(losingTrades.reduce((sum, t) => sum + (t.pnl || 0), 0));
    const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? 2.0 : 1.0;

    // Simple Sharpe ratio approximation
    const returns = trades.map(t => t.pnl || 0);
    const avgReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length;
    const stdDev = Math.sqrt(returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / returns.length);
    const sharpeRatio = stdDev > 0 ? avgReturn / stdDev : 0;

    return NextResponse.json({
      winRate,
      profitFactor,
      totalTrades: trades.length,
      sharpeRatio,
      grossProfit,
      grossLoss,
      averageWin: winningTrades.length > 0 ? grossProfit / winningTrades.length : 0,
      averageLoss: losingTrades.length > 0 ? grossLoss / losingTrades.length : 0
    });

  } catch (error) {
    console.error('Strategy performance API error:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch strategy performance',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
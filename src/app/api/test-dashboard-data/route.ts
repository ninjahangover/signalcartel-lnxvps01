import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    // Simple, direct queries
    const totalTrades = await prisma.paperTrade.count();
    
    const completedTrades = await prisma.paperTrade.findMany({
      where: { pnl: { not: null } }
    });
    
    const recentTrades = await prisma.paperTrade.findMany({
      take: 10,
      orderBy: { executedAt: 'desc' }
    });

    const totalPnL = completedTrades.reduce((sum, trade) => sum + (trade.pnl || 0), 0);
    const winningTrades = completedTrades.filter(trade => (trade.pnl || 0) > 0).length;
    const winRate = completedTrades.length > 0 ? (winningTrades / completedTrades.length) * 100 : 0;
    const currentBalance = 10000 + totalPnL;

    return NextResponse.json({
      success: true,
      data: {
        totalTrades,
        completedTrades: completedTrades.length,
        recentTrades: recentTrades.length,
        totalPnL,
        winRate: Math.round(winRate * 10) / 10,
        currentBalance: Math.round(currentBalance * 100) / 100,
        isActive: recentTrades.length > 0,
        lastTradeTime: recentTrades.length > 0 ? recentTrades[0].executedAt : null,
        strategies: {
          quantumForge: recentTrades.filter(t => t.strategy === 'QUANTUM FORGE™').length,
          customPaper: recentTrades.filter(t => t.strategy === 'CustomPaperEngine').length
        }
      }
    });

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
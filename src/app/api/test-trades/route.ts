import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const trades = await prisma.paperTrade.findMany({
      where: {
        OR: [
          { strategy: 'QUANTUM FORGE™' },
          { strategy: 'CustomPaperEngine' }
        ]
      },
      orderBy: {
        executedAt: 'desc'
      },
      take: 10
    });

    const totalCount = await prisma.paperTrade.count({
      where: {
        OR: [
          { strategy: 'QUANTUM FORGE™' },
          { strategy: 'CustomPaperEngine' }
        ]
      }
    });

    const totalPnL = trades.reduce((sum, trade) => sum + (trade.pnl || 0), 0);
    const balance = 10000 + totalPnL;

    return NextResponse.json({
      success: true,
      tradeCount: trades.length,
      totalCount: totalCount,
      balance: balance,
      trades: trades.slice(0, 3).map(t => ({
        id: t.id,
        symbol: t.symbol,
        strategy: t.strategy,
        pnl: t.pnl
      }))
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  } finally {
    await prisma.$disconnect();
  }
}
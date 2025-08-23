// API Route to get all strategies for the AI Strategies page
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    // Get all strategies from database including the Bollinger Band and other GPU strategies
    const strategies = await prisma.pineStrategy.findMany({
      include: {
        parameters: true,
      },
      orderBy: {
        updatedAt: 'desc'
      }
    });

    // Transform to include real performance data
    const strategiesWithPerformance = await Promise.all(
      strategies.map(async (strategy) => {
        // Get real trade data for this strategy
        const trades = await prisma.paperTrade.findMany({
          where: {
            OR: [
              { strategy: strategy.name },
              { strategy: strategy.id },
              { signalSource: strategy.id }
            ]
          }
        });

        // Calculate real performance metrics
        const completedTrades = trades.filter(t => t.pnl !== null && t.pnl !== undefined);
        const totalTrades = completedTrades.length;
        const winningTrades = completedTrades.filter(t => t.pnl > 0);
        const winRate = totalTrades > 0 ? (winningTrades.length / totalTrades) * 100 : 0;
        const totalPnL = completedTrades.reduce((sum, t) => sum + (t.pnl || 0), 0);
        const avgReturn = totalTrades > 0 ? totalPnL / totalTrades : 0;
        
        // Calculate Sharpe ratio
        const returns = completedTrades.map(t => (t.pnl || 0) / 1000); // Normalize to percentages
        const meanReturn = returns.length > 0 ? returns.reduce((sum, r) => sum + r, 0) / returns.length : 0;
        const variance = returns.length > 1 ? 
          returns.reduce((sum, r) => sum + Math.pow(r - meanReturn, 2), 0) / (returns.length - 1) : 0;
        const stdDev = Math.sqrt(variance);
        const sharpeRatio = stdDev > 0 ? meanReturn / stdDev : 0;

        return {
          id: strategy.id,
          name: strategy.name,
          description: strategy.description || `${strategy.strategyType} strategy`,
          strategyType: strategy.strategyType,
          isActive: strategy.isActive,
          pineScriptCode: strategy.pineScriptCode,
          parameters: strategy.parameters,
          performance: {
            totalTrades,
            winRate: winRate,
            totalPnL: totalPnL,
            avgReturn: avgReturn,
            sharpeRatio: sharpeRatio,
            profitFactor: winningTrades.length > 0 && (completedTrades.length - winningTrades.length) > 0 
              ? Math.abs(winningTrades.reduce((sum, t) => sum + t.pnl, 0) / 
                  completedTrades.filter(t => t.pnl < 0).reduce((sum, t) => sum + Math.abs(t.pnl), 0)) 
              : 0,
            lastTradeTime: trades.length > 0 ? trades[0].executedAt : null
          },
          lastUpdated: strategy.updatedAt
        };
      })
    );

    return NextResponse.json({
      success: true,
      data: {
        strategies: strategiesWithPerformance,
        totalStrategies: strategies.length,
        activeStrategies: strategies.filter(s => s.isActive).length
      }
    });

  } catch (error) {
    console.error('Error fetching all strategies:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to fetch strategies',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
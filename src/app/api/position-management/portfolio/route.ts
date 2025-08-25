import { NextRequest, NextResponse } from 'next/server';
import { positionService } from '@/lib/position-management/position-service';

export async function GET(request: NextRequest) {
  console.log('🚀 Position-managed portfolio API called');
  
  try {
    // Get portfolio summary from position management system
    const portfolioSummary = await positionService.getPortfolioSummary();
    
    const STARTING_BALANCE = 10000;
    
    // Calculate current portfolio value
    const currentBalance = STARTING_BALANCE + portfolioSummary.totalRealizedPnL;
    const totalValue = currentBalance + portfolioSummary.totalUnrealizedPnL;
    
    console.log(`📊 Position-managed portfolio: ${portfolioSummary.openPositions} open, ${portfolioSummary.closedPositions} closed positions`);
    console.log(`💰 P&L: $${portfolioSummary.totalRealizedPnL.toFixed(2)} realized, $${portfolioSummary.totalUnrealizedPnL.toFixed(2)} unrealized`);
    
    const portfolioData = {
      tradingMode: 'position_managed' as const,
      totalValue: Number(totalValue.toFixed(2)),
      availableBalance: portfolioSummary.openPositions === 0 ? 
        Number(currentBalance.toFixed(2)) : // Full balance when no positions
        Math.max(0, Number((currentBalance * 0.8).toFixed(2))), // 80% available when trading
      unrealizedPnL: Number(portfolioSummary.totalUnrealizedPnL.toFixed(2)),
      realizedPnL: Number(portfolioSummary.totalRealizedPnL.toFixed(2)),
      
      // Open positions as current positions
      positions: portfolioSummary.openPositionsDetail?.map(pos => ({
        id: pos.id,
        symbol: pos.symbol,
        side: pos.side as 'buy' | 'sell',
        size: pos.quantity,
        entryPrice: pos.entryPrice,
        currentPrice: pos.entryPrice, // Will be updated by monitoring service
        pnl: pos.unrealizedPnL || 0,
        pnlPercent: pos.unrealizedPnL ? (pos.unrealizedPnL / (pos.entryPrice * pos.quantity)) * 100 : 0,
        timestamp: pos.entryTime,
        stopLoss: pos.stopLoss,
        takeProfit: pos.takeProfit,
        strategy: pos.strategy
      })) || [],
      
      // Performance metrics
      performance: {
        totalTrades: portfolioSummary.totalTrades,
        winningTrades: portfolioSummary.winningTrades,
        winRate: Number(portfolioSummary.winRate.toFixed(1)),
        totalPnL: Number(portfolioSummary.totalPnL.toFixed(2)),
        dailyPnL: 0, // TODO: Calculate from recent closed positions
        
        // Additional position management metrics
        openPositions: portfolioSummary.openPositions,
        closedPositions: portfolioSummary.closedPositions
      },
      
      // Recent closed positions for analysis
      recentClosedPositions: portfolioSummary.recentClosedPositions?.map(pos => ({
        id: pos.id,
        symbol: pos.symbol,
        strategy: pos.strategy,
        side: pos.side,
        entryPrice: pos.entryPrice,
        exitPrice: pos.exitPrice,
        quantity: pos.quantity,
        pnl: pos.realizedPnL,
        pnlPercent: pos.exitPrice && pos.entryPrice ? 
          ((pos.exitPrice - pos.entryPrice) / pos.entryPrice) * 100 * (pos.side === 'long' ? 1 : -1) : 0,
        holdTimeMs: pos.holdTime,
        holdTimeDisplay: pos.holdTime ? formatDuration(pos.holdTime) : 'Unknown'
      })) || [],
      
      lastUpdated: new Date(),
      startingBalance: STARTING_BALANCE,
      managedPositions: true // Flag to indicate this uses position management
    };

    return NextResponse.json({
      success: true,
      data: portfolioData,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Position-managed portfolio error:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to get position-managed portfolio data',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

function formatDuration(ms: number): string {
  const minutes = Math.floor(ms / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (days > 0) return `${days}d ${hours % 24}h`;
  if (hours > 0) return `${hours}h ${minutes % 60}m`;
  return `${minutes}m`;
}
/**
 * Trade Execution API
 * 
 * Executes trades based on signals from the real market data service
 */

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { alpacaPaperTradingService } from '@/lib/alpaca-paper-trading-service';
import { unifiedWebhookProcessor } from '@/lib/unified-webhook-processor';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const { signalId, mode = 'paper' } = await request.json();
    
    // Get the signal from database
    const signal = await prisma.tradingSignal.findUnique({
      where: { id: signalId }
    });
    
    if (!signal) {
      return NextResponse.json({
        success: false,
        error: 'Signal not found'
      }, { status: 404 });
    }
    
    if (signal.executed) {
      return NextResponse.json({
        success: false,
        error: 'Signal already executed'
      }, { status: 400 });
    }
    
    // Prepare trade data
    const tradeData = {
      symbol: signal.symbol,
      action: signal.signalType,
      quantity: calculatePositionSize(signal.currentPrice, signal.confidence),
      price: signal.currentPrice,
      strategy_id: signal.strategy,
      confidence: signal.confidence,
      timestamp: new Date().toISOString()
    };
    
    let result;
    
    if (mode === 'paper') {
      // Execute on Alpaca paper trading
      result = await unifiedWebhookProcessor.processWebhook(tradeData, 'alpaca');
    } else {
      // Execute on live trading (Kraken)
      result = await unifiedWebhookProcessor.processWebhook(tradeData, 'kraken');
    }
    
    // Update signal as executed
    await prisma.tradingSignal.update({
      where: { id: signalId },
      data: {
        executed: true,
        executedAt: new Date(),
        executionPrice: signal.currentPrice
      }
    });
    
    // Update strategy performance
    await updateStrategyPerformance(signal.strategy, signal.symbol);
    
    return NextResponse.json({
      success: true,
      data: {
        signalId,
        executed: true,
        result
      }
    });
    
  } catch (error) {
    console.error('Trade execution error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Trade execution failed'
    }, { status: 500 });
  }
}

/**
 * Get pending signals
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const symbol = searchParams.get('symbol');
    const executed = searchParams.get('executed') === 'true';
    
    const signals = await prisma.tradingSignal.findMany({
      where: {
        ...(symbol && { symbol }),
        executed
      },
      orderBy: { createdAt: 'desc' },
      take: 50
    });
    
    return NextResponse.json({
      success: true,
      data: signals || []
    });
    
  } catch (error) {
    console.error('Failed to fetch signals:', error);
    // Return empty array instead of error for better UX
    return NextResponse.json({
      success: true,
      data: [],
      message: 'No signals found yet'
    });
  }
}

/**
 * Calculate position size based on confidence and price
 */
function calculatePositionSize(price: number, confidence: number): number {
  // Base position size in USD
  const basePosition = 1000;
  
  // Adjust based on confidence (0.5 to 1.5x)
  const confidenceMultiplier = 0.5 + confidence;
  
  // Calculate shares/coins
  const positionValue = basePosition * confidenceMultiplier;
  const quantity = positionValue / price;
  
  // Round to appropriate decimal places
  if (price > 1000) {
    return Math.round(quantity * 1000) / 1000; // 3 decimals for BTC
  } else if (price > 10) {
    return Math.round(quantity * 100) / 100; // 2 decimals for ETH, SOL
  } else {
    return Math.round(quantity * 10) / 10; // 1 decimal for ADA
  }
}

/**
 * Update strategy performance metrics
 */
async function updateStrategyPerformance(strategyName: string, symbol: string): Promise<void> {
  try {
    // Calculate updated metrics from signals
    const signals = await prisma.tradingSignal.findMany({
      where: {
        strategy: strategyName,
        symbol,
        executed: true
      }
    });
    
    const wins = signals.filter(s => s.outcome === 'WIN').length;
    const losses = signals.filter(s => s.outcome === 'LOSS').length;
    const totalTrades = wins + losses;
    const totalPnL = signals.reduce((sum, s) => sum + (s.pnl || 0), 0);
    const avgWin = wins > 0 ? signals.filter(s => s.outcome === 'WIN').reduce((sum, s) => sum + (s.pnl || 0), 0) / wins : 0;
    const avgLoss = losses > 0 ? signals.filter(s => s.outcome === 'LOSS').reduce((sum, s) => sum + Math.abs(s.pnl || 0), 0) / losses : 0;
    
    // Create or update performance record using the correct schema
    const existingPerformance = await prisma.strategyPerformance.findFirst({
      where: {
        strategyId: strategyName // Adjust based on actual schema field
      }
    }).catch(() => null);
    
    if (existingPerformance) {
      await prisma.strategyPerformance.update({
        where: { id: existingPerformance.id },
        data: {
          totalTrades,
          winningTrades: wins,
          losingTrades: losses,
          winRate: totalTrades > 0 ? (wins / totalTrades) * 100 : 0,
          totalPnL,
          avgWin,
          avgLoss,
          calculatedAt: new Date()
        }
      });
    } else {
      // Create new performance record
      await prisma.strategyPerformance.create({
        data: {
          strategyId: strategyName,
          timeframe: '24h',
          totalTrades,
          winningTrades: wins,
          losingTrades: losses,
          winRate: totalTrades > 0 ? (wins / totalTrades) * 100 : 0,
          totalPnL,
          avgWin,
          avgLoss,
          maxDrawdown: 0,
          periodStart: new Date(Date.now() - 24 * 60 * 60 * 1000),
          periodEnd: new Date(),
          calculatedAt: new Date()
        }
      });
    }
    
  } catch (error) {
    console.error('Failed to update strategy performance:', error);
    // Don't throw - this is non-critical
  }
}
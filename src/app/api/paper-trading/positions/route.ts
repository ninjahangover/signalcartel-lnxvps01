import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { alpacaPaperTradingService } from '@/lib/alpaca-paper-trading-service';

interface OpenPosition {
  id: string;
  pair: string;
  side: 'buy' | 'sell';
  quantity: number;
  entryPrice: number;
  currentPrice: number;
  unrealizedPnL: number;
  strategy?: string;
}

// Get open positions from Alpaca Paper Trading
async function getOpenPositions(): Promise<OpenPosition[]> {
  try {
    console.log('📊 Fetching open positions from Alpaca Paper Trading...');
    
    // Get positions from Alpaca Paper Trading Service
    const positions = await alpacaPaperTradingService.getPositions();
    
    if (positions && positions.length > 0) {
      // Convert Alpaca positions to our format
      const openPositions: OpenPosition[] = positions.map((pos, index) => ({
        id: `alpaca_pos_${pos.symbol}`,
        pair: pos.symbol,
        side: parseFloat(pos.qty) > 0 ? 'buy' : 'sell',
        quantity: Math.abs(parseFloat(pos.qty)),
        entryPrice: parseFloat(pos.avg_entry_price || '0'),
        currentPrice: parseFloat(pos.market_value || '0') / parseFloat(pos.qty) || 0,
        unrealizedPnL: parseFloat(pos.unrealized_pl || '0'),
        strategy: 'Alpaca Paper Trading'
      }));
      
      console.log(`✅ Found ${openPositions.length} paper positions from Alpaca`);
      return openPositions;
    }
    
    console.log('📊 No open positions found in Alpaca Paper Trading');
    return [];
    
  } catch (error) {
    console.error('❌ Error fetching Alpaca positions:', error);
    return [];
  }
}

// Close position using Alpaca Paper Trading API
async function closePosition(positionId: string, pair: string, side: 'buy' | 'sell', quantity: number) {
  console.log(`📤 Closing position via Alpaca Paper Trading: ${positionId} - ${side === 'buy' ? 'SELL' : 'BUY'} ${quantity} ${pair}`);
  
  try {
    // Use Alpaca Paper Trading API to place closing order
    const closeOrder = await alpacaPaperTradingService.placeOrder({
      symbol: pair,
      qty: quantity,
      side: side === 'buy' ? 'sell' : 'buy', // Reverse the position
      type: 'market',
      timeInForce: 'day'
    });

    if (closeOrder) {
      console.log('✅ Position close order placed successfully:', closeOrder.id);
      return { 
        success: true, 
        positionId, 
        orderId: closeOrder.id,
        message: 'Position close order placed via Alpaca Paper Trading',
        response: closeOrder 
      };
    } else {
      console.error('❌ Failed to place close order via Alpaca');
      return { success: false, positionId, error: 'Failed to place close order' };
    }

  } catch (error) {
    console.error('❌ Error closing position via Alpaca:', error);
    return { success: false, positionId, error: `Alpaca close order failed: ${error}` };
  }
}

// GET - Check for open positions
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const openPositions = await getOpenPositions();
    
    return NextResponse.json({
      hasOpenPositions: openPositions.length > 0,
      positions: openPositions,
      totalUnrealizedPnL: openPositions.reduce((sum, pos) => sum + pos.unrealizedPnL, 0),
      platform: 'alpaca',
      tradingMode: 'paper'
    });
  } catch (error) {
    console.error('Error fetching open positions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch open positions' },
      { status: 500 }
    );
  }
}

// POST - Close all open positions
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { action, strategyName } = await request.json();
    
    if (action !== 'close_all') {
      return NextResponse.json(
        { error: 'Invalid action. Use "close_all"' },
        { status: 400 }
      );
    }

    const openPositions = await getOpenPositions();
    
    if (openPositions.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No open positions to close',
        closedPositions: [],
        platform: 'alpaca',
        tradingMode: 'paper'
      });
    }

    console.log(`🧹 Closing ${openPositions.length} open positions for strategy: ${strategyName} (Alpaca Paper)`);
    
    // Close all positions in parallel
    const closeResults = await Promise.all(
      openPositions.map(position => 
        closePosition(position.id, position.pair, position.side, position.quantity)
      )
    );

    const successfulCloses = closeResults.filter(result => result.success);
    const failedCloses = closeResults.filter(result => !result.success);

    return NextResponse.json({
      success: failedCloses.length === 0,
      message: `Closed ${successfulCloses.length} of ${openPositions.length} positions (Alpaca Paper)`,
      closedPositions: successfulCloses.length,
      failedPositions: failedCloses.length,
      results: closeResults,
      strategy: strategyName,
      platform: 'alpaca',
      tradingMode: 'paper'
    });

  } catch (error) {
    console.error('Error closing positions:', error);
    return NextResponse.json(
      { error: 'Failed to close positions' },
      { status: 500 }
    );
  }
}
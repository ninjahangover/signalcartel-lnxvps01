import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { alpacaPaperTradingService } from '@/lib/alpaca-paper-trading-service';
import { paperAccountCyclingService } from '@/lib/paper-account-cycling-service';

// GET - Get Alpaca paper trading account info
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const url = new URL(request.url);
    const action = url.searchParams.get('action');

    switch (action) {
      case 'account':
        const accountInfo = await alpacaPaperTradingService.getAccountInfo();
        const currentAccount = alpacaPaperTradingService.getCurrentAccount();
        
        return NextResponse.json({
          success: true,
          account: currentAccount,
          alpacaAccount: accountInfo,
          isActive: alpacaPaperTradingService.isAccountActive()
        });

      case 'positions':
        const positions = await alpacaPaperTradingService.getPositions();
        return NextResponse.json({
          success: true,
          positions
        });

      case 'orders':
        const orders = await alpacaPaperTradingService.getOpenOrders();
        return NextResponse.json({
          success: true,
          orders
        });

      case 'market-data':
        const symbols = url.searchParams.get('symbols')?.split(',') || ['BTCUSD', 'ETHUSD', 'ADAUSD'];
        const marketData = await alpacaPaperTradingService.getMarketData(symbols);
        return NextResponse.json({
          success: true,
          marketData
        });

      case 'cycling-stats':
        const stats = await paperAccountCyclingService.getCyclingStats(session.user.id);
        return NextResponse.json({
          success: true,
          stats
        });

      default:
        return NextResponse.json({
          error: 'Invalid action. Use: account, positions, orders, market-data, cycling-stats'
        }, { status: 400 });
    }

  } catch (error) {
    console.error('❌ Alpaca paper trading API error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// POST - Initialize account, place orders, or manage account
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { action } = body;

    switch (action) {
      case 'initialize':
        console.log('🚀 Initializing Alpaca paper trading account...');
        
        const paperAccount = await alpacaPaperTradingService.initializeAccount(
          session.user.id,
          process.env.ALPACA_PAPER_API_KEY || '',
          process.env.ALPACA_PAPER_API_SECRET || ''
        );

        if (!paperAccount) {
          return NextResponse.json({
            success: false,
            error: 'Failed to initialize paper trading account'
          }, { status: 500 });
        }

        // Start account cycling monitoring
        await paperAccountCyclingService.startUserMonitoring(session.user.id);

        return NextResponse.json({
          success: true,
          message: 'Paper trading account initialized successfully',
          account: paperAccount
        });

      case 'place-order':
        const { symbol, qty, side, type, limitPrice } = body;
        
        if (!symbol || !qty || !side || !type) {
          return NextResponse.json({
            error: 'Missing required order parameters: symbol, qty, side, type'
          }, { status: 400 });
        }

        const order = await alpacaPaperTradingService.placeOrder({
          symbol: symbol.toUpperCase(),
          qty: parseFloat(qty),
          side,
          type,
          ...(limitPrice && { limitPrice: parseFloat(limitPrice) })
        });

        if (!order) {
          return NextResponse.json({
            success: false,
            error: 'Failed to place order'
          }, { status: 500 });
        }

        return NextResponse.json({
          success: true,
          message: 'Order placed successfully',
          order
        });

      case 'cancel-order':
        const { orderId } = body;
        
        if (!orderId) {
          return NextResponse.json({
            error: 'Order ID is required'
          }, { status: 400 });
        }

        const cancelSuccess = await alpacaPaperTradingService.cancelOrder(orderId);
        
        return NextResponse.json({
          success: cancelSuccess,
          message: cancelSuccess ? 'Order cancelled successfully' : 'Failed to cancel order'
        });

      case 'cycle-account':
        const { reason = 'Manual cycle requested' } = body;
        
        console.log('🔄 Cycling paper trading account...');
        
        const newAccount = await paperAccountCyclingService.manualCycle(session.user.id, reason);
        
        if (!newAccount) {
          return NextResponse.json({
            success: false,
            error: 'Failed to cycle account'
          }, { status: 500 });
        }

        return NextResponse.json({
          success: true,
          message: 'Account cycled successfully',
          newAccount
        });

      case 'reset-account':
        const { newBalance = 100000 } = body;
        
        console.log('🔄 Resetting paper trading account...');
        
        const resetSuccess = await alpacaPaperTradingService.resetAccount(newBalance);
        
        return NextResponse.json({
          success: resetSuccess,
          message: resetSuccess ? 'Account reset successfully' : 'Failed to reset account'
        });

      case 'update-cycling-config':
        const { config } = body;
        
        if (!config) {
          return NextResponse.json({
            error: 'Cycling configuration is required'
          }, { status: 400 });
        }

        paperAccountCyclingService.setUserConfig(session.user.id, config);
        
        return NextResponse.json({
          success: true,
          message: 'Cycling configuration updated successfully'
        });

      default:
        return NextResponse.json({
          error: 'Invalid action. Use: initialize, place-order, cancel-order, cycle-account, reset-account, update-cycling-config'
        }, { status: 400 });
    }

  } catch (error) {
    console.error('❌ Alpaca paper trading POST error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
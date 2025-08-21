import { NextRequest, NextResponse } from 'next/server';
import { alpacaPaperTradingService } from '@/lib/alpaca-paper-trading-service';

export async function GET() {
  try {
    console.log('🧪 Testing Alpaca Paper Trading API connection...');

    // Test basic connection
    const accountInfo = await alpacaPaperTradingService.getAccountInfo();
    
    if (!accountInfo) {
      return NextResponse.json({
        success: false,
        error: 'Failed to connect to Alpaca Paper Trading API',
        details: 'Check your API credentials in environment variables'
      }, { status: 500 });
    }

    // Get current market data for a test symbol
    const marketData = await alpacaPaperTradingService.getMarketData(['BTCUSD']);

    return NextResponse.json({
      success: true,
      message: 'Alpaca Paper Trading API connection successful',
      data: {
        account: {
          id: accountInfo.id,
          status: accountInfo.account_status,
          balance: accountInfo.cash,
          buyingPower: accountInfo.buying_power,
          equity: accountInfo.equity,
          dayTrading: accountInfo.daytrade_count
        },
        marketData: marketData[0] || null,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ Paper trading API test failed:', error);
    
    return NextResponse.json({
      success: false,
      error: 'API test failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json();
    
    if (!userId) {
      return NextResponse.json({
        success: false,
        error: 'User ID is required'
      }, { status: 400 });
    }

    console.log('🚀 Initializing paper trading account for user:', userId);

    // Initialize paper trading account
    const paperAccount = await alpacaPaperTradingService.initializeAccount(
      userId,
      process.env.ALPACA_PAPER_API_KEY || '',
      process.env.ALPACA_PAPER_API_SECRET || ''
    );

    if (!paperAccount) {
      return NextResponse.json({
        success: false,
        error: 'Failed to initialize paper trading account'
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Paper trading account initialized successfully',
      account: {
        id: paperAccount.id,
        userId: paperAccount.userId,
        platform: 'alpaca',
        balance: paperAccount.currentBalance,
        buyingPower: paperAccount.buyingPower,
        createdAt: paperAccount.createdAt
      }
    });

  } catch (error) {
    console.error('❌ Failed to initialize paper trading account:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to initialize account',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
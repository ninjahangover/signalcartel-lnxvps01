/**
 * Force Trade Endpoint for Testing
 * This endpoint bypasses AI validations to ensure trades can execute for testing
 */

import { NextRequest, NextResponse } from 'next/server';
import { alpacaPaperTradingService } from '@/lib/alpaca-paper-trading-service';

export async function POST(request: NextRequest) {
  try {
    const tradeData = await request.json();
    
    console.log('🔓 Force trade endpoint - bypassing validations for testing');
    console.log('📊 Trade data:', tradeData);
    
    // Extract basic trade parameters
    const symbol = tradeData.symbol || tradeData.ticker || 'BTCUSD';
    const action = tradeData.action || tradeData.side || 'buy';
    const quantity = parseFloat(tradeData.quantity || tradeData.qty || '1');
    
    // Ensure we have valid parameters
    if (!symbol || !action || !quantity) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: symbol, action, quantity'
      }, { status: 400 });
    }
    
    // Initialize Alpaca if needed
    const apiKey = process.env.ALPACA_PAPER_API_KEY;
    const apiSecret = process.env.ALPACA_PAPER_API_SECRET;
    
    if (!apiKey || !apiSecret) {
      return NextResponse.json({
        success: false,
        error: 'Alpaca API credentials not configured'
      }, { status: 500 });
    }
    
    // Initialize account if needed
    const account = await alpacaPaperTradingService.initializeAccount(
      'test-user',
      apiKey,
      apiSecret
    );
    
    if (!account) {
      return NextResponse.json({
        success: false,
        error: 'Failed to initialize Alpaca account'
      }, { status: 500 });
    }
    
    console.log('✅ Account ready:', {
      balance: account.currentBalance,
      buyingPower: account.buyingPower
    });
    
    // Place the order directly without any validations
    console.log(`📤 Placing ${action} order for ${quantity} ${symbol}...`);
    
    const order = await alpacaPaperTradingService.placeOrder({
      symbol: symbol.replace(/USD$/, ''), // Remove USD suffix for Alpaca
      qty: quantity,
      side: action.toLowerCase() as 'buy' | 'sell',
      type: 'market',
      timeInForce: 'day'
    });
    
    if (order) {
      console.log('✅ Order placed successfully!', order);
      
      return NextResponse.json({
        success: true,
        message: 'Trade executed successfully (validations bypassed for testing)',
        order: {
          id: order.id,
          symbol: order.symbol,
          side: order.side,
          qty: order.qty,
          status: order.status,
          submittedAt: order.submittedAt
        },
        account: {
          balance: account.currentBalance,
          buyingPower: account.buyingPower,
          platform: 'alpaca',
          mode: 'paper'
        }
      });
    } else {
      return NextResponse.json({
        success: false,
        error: 'Order placement failed - check Alpaca API response'
      }, { status: 500 });
    }
    
  } catch (error) {
    console.error('❌ Force trade error:', error);
    
    // Detailed error response
    return NextResponse.json({
      success: false,
      error: 'Trade execution failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      troubleshooting: {
        checkCredentials: 'Verify ALPACA_PAPER_API_KEY and ALPACA_PAPER_API_SECRET',
        checkSymbol: 'Ensure symbol is valid (e.g., AAPL, not AAPLUSD)',
        checkMarketHours: 'Market might be closed',
        checkBalance: 'Ensure account has sufficient buying power'
      }
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    endpoint: '/api/paper-trading/force-trade',
    method: 'POST',
    purpose: 'Force a trade execution for testing (bypasses AI validations)',
    requiredFields: {
      symbol: 'Stock symbol (e.g., AAPL)',
      action: 'buy or sell',
      quantity: 'Number of shares'
    },
    example: {
      symbol: 'AAPL',
      action: 'buy',
      quantity: 10
    },
    warning: 'This endpoint bypasses all safety checks - for testing only!'
  });
}
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { symbol, side, quantity, orderType = 'market', limitPrice, strategy = 'manual' } = await request.json();

    // Validate required fields
    if (!symbol || !side || !quantity) {
      return NextResponse.json(
        { error: 'Missing required fields: symbol, side, quantity' },
        { status: 400 }
      );
    }

    // Mock trade execution - we'll connect to real Alpaca API later
    const mockPrice = symbol.toLowerCase().includes('btc') ? 113750 : 
                     symbol.toLowerCase().includes('eth') ? 4300 : 
                     symbol.toLowerCase().includes('sol') ? 184 : 25;

    const mockTradeResult = {
      success: true,
      orderId: `MOCK_${Date.now()}`,
      status: 'filled',
      price: mockPrice,
      quantity: parseFloat(quantity),
      symbol: symbol.toUpperCase(),
      side: side.toLowerCase(),
      strategy,
      orderType,
      timestamp: new Date().toISOString(),
      type: 'manual'
    };

    console.log('🎯 Manual Trade Executed:', mockTradeResult);

    return NextResponse.json({
      success: true,
      trade: mockTradeResult,
      message: 'Mock trade executed successfully - ready for real integration!'
    });

  } catch (error) {
    console.error('Error executing manual trade:', error);
    return NextResponse.json(
      { error: 'Failed to execute trade', details: error.message },
      { status: 500 }
    );
  }
}
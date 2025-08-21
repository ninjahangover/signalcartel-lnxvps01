import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');

    const Alpaca = (await import('@alpacahq/alpaca-trade-api')).default;
    
    const alpaca = new Alpaca({
      keyId: process.env.ALPACA_PAPER_API_KEY || process.env.NEXT_PUBLIC_ALPACA_PAPER_API_KEY || '',
      secretKey: process.env.ALPACA_PAPER_API_SECRET || process.env.NEXT_PUBLIC_ALPACA_PAPER_API_SECRET || '',
      paper: true,
      usePolygon: false
    });

    const orders = await alpaca.getOrders({
      status: 'all',
      limit: limit,
      direction: 'desc'
    });

    const ordersData = orders.map(order => ({
      id: order.id,
      symbol: order.symbol,
      side: order.side,
      qty: parseFloat(order.qty),
      type: order.type,
      status: order.status,
      filled_qty: parseFloat(order.filled_qty || '0'),
      filled_avg_price: parseFloat(order.filled_avg_price || '0'),
      created_at: order.created_at,
      filled_at: order.filled_at
    }));

    return NextResponse.json(ordersData);
  } catch (error) {
    console.error('Alpaca orders API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch orders' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { symbol, qty, side, type = 'market', limit_price } = body;

    const Alpaca = (await import('@alpacahq/alpaca-trade-api')).default;
    
    const alpaca = new Alpaca({
      keyId: process.env.ALPACA_PAPER_API_KEY || process.env.NEXT_PUBLIC_ALPACA_PAPER_API_KEY || '',
      secretKey: process.env.ALPACA_PAPER_API_SECRET || process.env.NEXT_PUBLIC_ALPACA_PAPER_API_SECRET || '',
      paper: true,
      usePolygon: false
    });

    const orderData: any = {
      symbol: symbol.replace('USD', ''),
      qty: qty,
      side: side,
      type: type,
      time_in_force: 'day'
    };

    if (type === 'limit' && limit_price) {
      orderData.limit_price = limit_price;
    }

    console.log(`📈 Placing REAL ${side} order via API: ${qty} ${symbol}`);
    
    const order = await alpaca.createOrder(orderData);

    console.log(`✅ REAL order placed! Order ID: ${order.id}`);

    // Wait a moment for the order to potentially fill
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Get the updated order status
    const filledOrder = await alpaca.getOrder(order.id);

    const result = {
      success: true,
      orderId: filledOrder.id,
      symbol: filledOrder.symbol,
      qty: parseFloat(filledOrder.qty),
      side: filledOrder.side,
      orderType: filledOrder.type,
      filledAt: filledOrder.filled_at,
      filledQty: parseFloat(filledOrder.filled_qty || '0'),
      filledAvgPrice: parseFloat(filledOrder.filled_avg_price || '0'),
      status: filledOrder.status,
      timestamp: new Date()
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error('Alpaca order placement API error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error.message,
        timestamp: new Date()
      },
      { status: 500 }
    );
  }
}
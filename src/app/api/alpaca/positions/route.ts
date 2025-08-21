import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const Alpaca = (await import('@alpacahq/alpaca-trade-api')).default;
    
    const alpaca = new Alpaca({
      keyId: process.env.ALPACA_PAPER_API_KEY || process.env.NEXT_PUBLIC_ALPACA_PAPER_API_KEY || '',
      secretKey: process.env.ALPACA_PAPER_API_SECRET || process.env.NEXT_PUBLIC_ALPACA_PAPER_API_SECRET || '',
      paper: true,
      usePolygon: false
    });

    const positions = await alpaca.getPositions();

    const positionsData = positions.map(pos => ({
      symbol: pos.symbol,
      qty: parseFloat(pos.qty),
      side: parseFloat(pos.qty) > 0 ? 'long' : 'short',
      market_value: parseFloat(pos.market_value),
      cost_basis: parseFloat(pos.cost_basis),
      unrealized_pl: parseFloat(pos.unrealized_pl),
      unrealized_plpc: parseFloat(pos.unrealized_plpc),
      current_price: parseFloat(pos.current_price || '0'),
      avg_entry_price: parseFloat(pos.avg_entry_price)
    }));

    return NextResponse.json(positionsData);
  } catch (error) {
    console.error('Alpaca positions API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch positions' },
      { status: 500 }
    );
  }
}
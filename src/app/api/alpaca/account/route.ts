import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Dynamic import to avoid client-side issues
    const Alpaca = (await import('@alpacahq/alpaca-trade-api')).default;
    
    const alpaca = new Alpaca({
      keyId: process.env.ALPACA_PAPER_API_KEY || process.env.NEXT_PUBLIC_ALPACA_PAPER_API_KEY || '',
      secretKey: process.env.ALPACA_PAPER_API_SECRET || process.env.NEXT_PUBLIC_ALPACA_PAPER_API_SECRET || '',
      paper: true,
      usePolygon: false
    });

    const [account, positions] = await Promise.all([
      alpaca.getAccount(),
      alpaca.getPositions()
    ]);

    const accountInfo = {
      buying_power: parseFloat(account.buying_power),
      cash: parseFloat(account.cash),
      portfolio_value: parseFloat(account.portfolio_value),
      trading_blocked: account.trading_blocked,
      account_blocked: account.account_blocked,
      positions: positions.map(pos => ({
        symbol: pos.symbol,
        qty: parseFloat(pos.qty),
        market_value: parseFloat(pos.market_value),
        unrealized_pl: parseFloat(pos.unrealized_pl),
        unrealized_plpc: parseFloat(pos.unrealized_plpc)
      }))
    };

    return NextResponse.json(accountInfo);
  } catch (error) {
    console.error('Alpaca account API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch account data' },
      { status: 500 }
    );
  }
}
import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  { params }: { params: { symbol: string } }
) {
  try {
    const { symbol } = params;
    
    // For now, return mock data - we'll connect to real Kraken webhook later
    const mockPrice = symbol.toLowerCase().includes('btc') ? 113750 : 
                     symbol.toLowerCase().includes('eth') ? 4300 : 
                     symbol.toLowerCase().includes('sol') ? 184 : 25;
    
    return NextResponse.json({
      symbol: symbol.toUpperCase(),
      price: mockPrice,
      timestamp: new Date().toISOString(),
      source: 'kraken-webhook',
      status: 'mock'
    });
  } catch (error) {
    console.error('Error fetching market data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch market data' },
      { status: 500 }
    );
  }
}
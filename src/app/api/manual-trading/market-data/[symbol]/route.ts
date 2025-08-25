import { NextResponse } from 'next/server';

// Fetch real price from multiple sources
async function getRealPrice(symbol: string): Promise<number> {
  const symbolMap: Record<string, string> = {
    'BTC': 'XXBTZUSD',
    'ETH': 'XETHZUSD',
    'SOL': 'SOLUSD',
    'ADA': 'ADAUSD'
  };
  
  const baseSymbol = symbol.replace(/USD[T]?$/, '').toUpperCase();
  const krakenSymbol = symbolMap[baseSymbol] || 'XXBTZUSD';
  
  try {
    // Kraken API
    const response = await fetch(`https://api.kraken.com/0/public/Ticker?pair=${krakenSymbol}`);
    if (response.ok) {
      const data = await response.json();
      const tickerData = Object.values(data.result)[0] as any;
      return parseFloat(tickerData.c[0]);
    }
  } catch (error) {
    console.error('Kraken API failed:', error);
  }
  
  // CoinGecko fallback
  try {
    const coinMap: Record<string, string> = {
      'BTC': 'bitcoin',
      'ETH': 'ethereum', 
      'SOL': 'solana',
      'ADA': 'cardano'
    };
    
    const coinId = coinMap[baseSymbol];
    if (coinId) {
      const response = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=usd`);
      if (response.ok) {
        const data = await response.json();
        return data[coinId].usd;
      }
    }
  } catch (error) {
    console.error('CoinGecko fallback failed:', error);
  }
  
  throw new Error('All real price APIs failed');
}

export async function GET(
  request: Request,
  { params }: { params: { symbol: string } }
) {
  try {
    const { symbol } = params;
    
    // Get real price from exchange APIs
    const realPrice = await getRealPrice(symbol);
    
    return NextResponse.json({
      symbol: symbol.toUpperCase(),
      price: realPrice,
      timestamp: new Date().toISOString(),
      source: 'kraken/coingecko-real',
      status: 'live'
    });
  } catch (error) {
    console.error('❌ Error fetching real market data:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch real market data - all APIs failed',
        details: error instanceof Error ? error.message : 'Unknown error',
        noMockData: true
      },
      { status: 500 }
    );
  }
}
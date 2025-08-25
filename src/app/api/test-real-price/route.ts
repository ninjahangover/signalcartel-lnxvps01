import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    console.log('🔥 TEST ENDPOINT: Fetching REAL BTC price...');
    
    // Fetch REAL price from Kraken
    const response = await fetch('https://api.kraken.com/0/public/Ticker?pair=XXBTZUSD');
    const data = await response.json();
    const btcPrice = parseFloat(Object.values(data.result as any)[0].c[0]);
    
    console.log('✅ REAL BTC Price fetched:', btcPrice);
    
    return NextResponse.json({
      success: true,
      realPrice: btcPrice,
      message: 'REAL DATA WORKING',
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ REAL PRICE FETCH FAILED:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch real price',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
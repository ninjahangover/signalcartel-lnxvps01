/**
 * Real BTC Price Test API
 * Force fetch real Bitcoin price to verify it's working
 */

import { NextRequest, NextResponse } from 'next/server';
import { realTimePriceFetcher } from '@/lib/real-time-price-fetcher';

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Testing real BTC price fetching...');
    
    // Force fetch real BTC price
    const btcPrice = await realTimePriceFetcher.getCurrentPrice('BTCUSD');
    
    // Also test other major cryptos
    const ethPrice = await realTimePriceFetcher.getCurrentPrice('ETHUSD');
    const adaPrice = await realTimePriceFetcher.getCurrentPrice('ADAUSD');
    
    const results = {
      BTCUSD: btcPrice,
      ETHUSD: ethPrice,
      ADAUSD: adaPrice
    };
    
    const successful = Object.values(results).filter(r => r.success).length;
    const total = Object.keys(results).length;
    
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      summary: {
        successful,
        total,
        successRate: `${Math.round((successful / total) * 100)}%`
      },
      prices: results,
      message: successful > 0 ? 
        `Successfully fetched ${successful}/${total} real prices` : 
        'All real price APIs failed - using simulated data'
    });
    
  } catch (error) {
    console.error('Real BTC price test error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { symbol = 'BTCUSD' } = await request.json();
    
    console.log(`🔍 Force fetching real price for ${symbol}...`);
    
    // Force multiple attempts to get real price
    const attempts = [];
    
    for (let i = 0; i < 3; i++) {
      const result = await realTimePriceFetcher.getCurrentPrice(symbol);
      attempts.push({
        attempt: i + 1,
        ...result
      });
      
      if (result.success && result.price > 0) {
        break; // Success on first try
      }
      
      // Wait 1 second between attempts
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    const lastAttempt = attempts[attempts.length - 1];
    
    return NextResponse.json({
      success: lastAttempt.success,
      symbol,
      price: lastAttempt.price,
      source: lastAttempt.source,
      timestamp: new Date().toISOString(),
      attempts: attempts.length,
      allAttempts: attempts,
      message: lastAttempt.success ? 
        `Successfully fetched real ${symbol} price: $${lastAttempt.price.toLocaleString()}` :
        `Failed to fetch real ${symbol} price after ${attempts.length} attempts`
    });
    
  } catch (error) {
    console.error('Force real price fetch error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
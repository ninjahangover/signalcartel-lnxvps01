/**
 * Simple endpoint to test if real prices are working
 */

import { NextRequest, NextResponse } from 'next/server';
import marketDataService from '@/lib/market-data-service';

export async function GET(request: NextRequest) {
  try {
    console.log('🧪 Testing real market data...');
    
    // Force a fresh fetch for core symbols
    const symbols = ['BTCUSD', 'ETHUSD', 'XRPUSD'];
    
    // Clear any failed attempts to force retry
    marketDataService.clearFailedAttempts();
    
    // Wait a moment for fresh data
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const results: any = {};
    
    for (const symbol of symbols) {
      try {
        const data = marketDataService.getCurrentData(symbol);
        if (data && data.price > 0) {
          results[symbol] = {
            price: data.price,
            timestamp: new Date(data.timestamp).toISOString(),
            source: 'real_kraken_data',
            age_seconds: Math.floor((Date.now() - data.timestamp) / 1000)
          };
        } else {
          results[symbol] = {
            error: 'No real data available',
            source: 'none'
          };
        }
      } catch (error) {
        results[symbol] = {
          error: error instanceof Error ? error.message : 'Unknown error',
          source: 'error'
        };
      }
    }
    
    // Get system status
    const symbolStatus = marketDataService.getSymbolStatus();
    
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      message: 'Real market data test results',
      data: {
        prices: results,
        system_status: {
          total_symbols: symbolStatus.length,
          working_symbols: symbolStatus.filter(s => s.failedAttempts === 0).length,
          failed_symbols: symbolStatus.filter(s => s.failedAttempts > 0).length,
          symbol_details: symbolStatus
        }
      }
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
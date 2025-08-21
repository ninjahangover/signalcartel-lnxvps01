/**
 * DEPRECATED: Kraken Demo Test Endpoint Removed
 * 
 * This endpoint has been removed as part of the paper/real trading separation.
 * 
 * Paper Trading: Use Alpaca APIs only
 * Real Trading: Use Kraken APIs only (not demo)
 */

import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  return NextResponse.json({
    success: false,
    error: 'Kraken demo testing removed from paper trading system',
    message: 'Paper trading now uses Alpaca only. Real trading uses Kraken (not demo).',
    redirects: {
      paperTrading: '/api/paper-trading/test',
      realTrading: '/api/kraken-proxy'
    }
  }, { status: 410 }); // 410 Gone
}

export async function POST(request: NextRequest) {
  return NextResponse.json({
    success: false,
    error: 'Kraken demo testing removed from paper trading system',
    message: 'Paper trading now uses Alpaca only. Real trading uses Kraken (not demo).',
    redirects: {
      paperTrading: '/api/paper-trading/test',
      realTrading: '/api/kraken-proxy'
    }
  }, { status: 410 }); // 410 Gone
}
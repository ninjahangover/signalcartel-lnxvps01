import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Mock real-time trading data for Grafana
    const currentTime = Date.now();
    
    // Generate realistic market data points
    const symbols = ['BTCUSD', 'ETHUSD', 'SOLUSD', 'ADAUSD', 'LINKUSD'];
    const basePrice = {
      'BTCUSD': 113850,
      'ETHUSD': 4300,
      'SOLUSD': 187,
      'ADAUSD': 0.875,
      'LINKUSD': 25.6
    };
    
    const marketData = symbols.map(symbol => ({
      target: `price_${symbol}`,
      datapoints: [
        [basePrice[symbol as keyof typeof basePrice] * (0.998 + Math.random() * 0.004), currentTime - 60000],
        [basePrice[symbol as keyof typeof basePrice] * (0.998 + Math.random() * 0.004), currentTime - 30000],
        [basePrice[symbol as keyof typeof basePrice] * (0.998 + Math.random() * 0.004), currentTime]
      ]
    }));

    // Add strategy performance metrics
    const strategyMetrics = [
      {
        target: 'active_strategies',
        datapoints: [[4, currentTime]]
      },
      {
        target: 'total_trades_today',
        datapoints: [[Math.floor(Math.random() * 50), currentTime]]
      },
      {
        target: 'win_rate_percentage',
        datapoints: [[68.5 + Math.random() * 10, currentTime]]
      },
      {
        target: 'portfolio_value_usd',
        datapoints: [[1000000 + Math.random() * 50000, currentTime]]
      }
    ];

    // Add alert metrics
    const alertMetrics = [
      {
        target: 'alerts_sent_today',
        datapoints: [[Math.floor(Math.random() * 20), currentTime]]
      },
      {
        target: 'market_volatility',
        datapoints: [[15 + Math.random() * 10, currentTime]]
      }
    ];

    const allData = [...marketData, ...strategyMetrics, ...alertMetrics];

    return NextResponse.json(allData, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  } catch (error) {
    console.error('Error generating Grafana data:', error);
    return NextResponse.json({ error: 'Failed to generate data' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  // Handle Grafana's test connection and query requests
  const body = await request.json();
  
  if (body.target) {
    // This is a query request
    return GET(request);
  }
  
  // This is a test connection request
  return NextResponse.json({ message: 'Connection successful' }, { status: 200 });
}
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const symbol = searchParams.get('symbol') || 'BTCUSD';
    const timeframe = searchParams.get('timeframe') || '1H';
    const limit = parseInt(searchParams.get('limit') || '100');

    // Calculate time range based on timeframe
    let hoursBack = 1;
    switch (timeframe) {
      case '1H':
        hoursBack = 1;
        break;
      case '4H':
        hoursBack = 4;
        break;
      case '1D':
        hoursBack = 24;
        break;
      case '1W':
        hoursBack = 168;
        break;
      default:
        hoursBack = 1;
    }

    const startTime = new Date(Date.now() - (hoursBack * 60 * 60 * 1000));

    // Fetch market data from our database
    const marketData = await prisma.marketData.findMany({
      where: {
        symbol: symbol,
        timestamp: {
          gte: startTime
        }
      },
      orderBy: {
        timestamp: 'asc'
      },
      take: limit,
      select: {
        timestamp: true,
        close: true,
        volume: true,
        symbol: true
      }
    });

    // If we don't have enough recent data, generate realistic simulated data
    if (marketData.length < 20) {
      console.log(`Limited market data for ${symbol}, generating simulated data`);
      
      const simulatedData = generateSimulatedMarketData(symbol, limit, hoursBack);
      
      return NextResponse.json({
        success: true,
        data: simulatedData,
        source: 'simulated',
        message: `Generated ${simulatedData.length} simulated data points for ${symbol}`
      });
    }

    // Format the real market data
    const formattedData = marketData.map(tick => ({
      timestamp: tick.timestamp.toISOString(),
      price: tick.close,
      volume: tick.volume || 0,
      symbol: tick.symbol
    }));

    return NextResponse.json({
      success: true,
      data: formattedData,
      source: 'database',
      message: `Retrieved ${formattedData.length} real market data points for ${symbol}`
    });

  } catch (error) {
    console.error('Market data API error:', error);
    
    // Fallback to simulated data on any error
    const symbol = 'BTCUSD';
    const simulatedData = generateSimulatedMarketData(symbol, 100, 1);
    
    return NextResponse.json({
      success: true,
      data: simulatedData,
      source: 'simulated_fallback',
      message: 'Database error, using simulated data',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

function generateSimulatedMarketData(symbol: string, points: number, hoursBack: number) {
  const now = Date.now();
  const intervalMs = (hoursBack * 60 * 60 * 1000) / points; // Distribute points evenly
  
  // Base prices for different symbols
  const basePrices: { [key: string]: number } = {
    'BTCUSD': 67000,
    'ETHUSD': 2400,
    'SOLUSD': 150,
    'LINKUSD': 12,
    'ADAUSD': 0.35
  };
  
  const basePrice = basePrices[symbol] || 100;
  let currentPrice = basePrice;
  const data = [];
  
  for (let i = points - 1; i >= 0; i--) {
    const timestamp = new Date(now - (i * intervalMs));
    
    // Simulate realistic price movement with momentum
    const volatility = basePrice * 0.001; // 0.1% volatility per tick
    const randomChange = (Math.random() - 0.5) * volatility * 2;
    const momentum = (Math.random() - 0.5) * volatility * 0.5; // Slight momentum
    
    currentPrice += randomChange + momentum;
    
    // Keep price within reasonable bounds (±10% of base)
    currentPrice = Math.max(basePrice * 0.9, Math.min(basePrice * 1.1, currentPrice));
    
    // Generate realistic volume (higher during volatile periods)
    const priceChangePercent = Math.abs(randomChange / basePrice);
    const baseVolume = 50000;
    const volumeMultiplier = 1 + (priceChangePercent * 10); // More volume during big moves
    const volume = baseVolume * volumeMultiplier * (0.5 + Math.random());
    
    data.push({
      timestamp: timestamp.toISOString(),
      price: parseFloat(currentPrice.toFixed(symbol.includes('USD') && basePrice > 1000 ? 2 : 8)),
      volume: Math.round(volume),
      symbol: symbol
    });
  }
  
  return data;
}

// Cache market data for 30 seconds to reduce database load
export const revalidate = 30;
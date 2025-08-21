import { NextResponse } from 'next/server';

export async function GET() {
  try {
    return NextResponse.json({
      strategies: [
        {
          name: 'RSI Pullback Pro',
          status: 'active',
          lastSignal: '2025-08-19T10:30:00Z',
          currentRSI: 45.2,
          threshold: { buy: 30, sell: 70 },
          reason: 'RSI not in oversold/overbought range'
        },
        {
          name: 'Claude Quantum Oscillator',
          status: 'active', 
          lastSignal: '2025-08-18T15:45:00Z',
          currentValue: 0.65,
          threshold: { buy: 0.8, sell: 0.2 },
          reason: 'Signal strength below threshold'
        },
        {
          name: 'Stratus Core Neural',
          status: 'active',
          lastSignal: '2025-08-20T09:15:00Z',
          confidence: 0.72,
          threshold: { minimum: 0.8 },
          reason: 'Neural confidence below minimum threshold'
        }
      ],
      marketConditions: {
        btcPrice: 113750,
        volatility: 'medium',
        trend: 'sideways',
        volume: 'normal'
      },
      status: 'All strategies loaded but no triggers met',
      lastUpdate: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching strategy status:', error);
    return NextResponse.json(
      { error: 'Failed to fetch strategy status' },
      { status: 500 }
    );
  }
}
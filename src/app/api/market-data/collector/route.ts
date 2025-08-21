import { NextRequest, NextResponse } from 'next/server';
import { marketDataCollector } from '@/lib/market-data-collector';

export async function POST(request: NextRequest) {
  try {
    const { action } = await request.json();

    switch (action) {
      case 'start':
        await marketDataCollector.startCollection();
        return NextResponse.json({
          success: true,
          message: 'Market data collection started',
          isActive: marketDataCollector.isCollectionActive()
        });

      case 'stop':
        marketDataCollector.stopCollection();
        return NextResponse.json({
          success: true,
          message: 'Market data collection stopped',
          isActive: marketDataCollector.isCollectionActive()
        });

      case 'status':
        const status = await marketDataCollector.getCollectionStatus();
        const totalDataPoints = await marketDataCollector.getTotalDataPoints();
        
        return NextResponse.json({
          success: true,
          data: {
            isActive: marketDataCollector.isCollectionActive(),
            totalDataPoints,
            symbols: status,
            message: marketDataCollector.isCollectionActive() 
              ? 'Real-time data collection active' 
              : 'Data collection stopped'
          }
        });

      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid action. Use: start, stop, or status'
        }, { status: 400 });
    }
  } catch (error) {
    console.error('Market data collector API error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    // Get current collection status
    const status = await marketDataCollector.getCollectionStatus();
    const totalDataPoints = await marketDataCollector.getTotalDataPoints();
    
    return NextResponse.json({
      success: true,
      data: {
        isActive: marketDataCollector.isCollectionActive(),
        totalDataPoints,
        symbols: status,
        message: marketDataCollector.isCollectionActive() 
          ? 'Real-time data collection active' 
          : 'Data collection stopped'
      }
    });
  } catch (error) {
    console.error('Market data collector status error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to get collection status'
    }, { status: 500 });
  }
}
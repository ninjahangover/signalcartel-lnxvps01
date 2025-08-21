/**
 * API endpoint for market data diagnostics and recovery
 */

import { NextRequest, NextResponse } from 'next/server';
import marketDataDiagnostics from '@/lib/market-data-diagnostics';
import { marketDataCollector } from '@/lib/market-data-collector';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    switch (action) {
      case 'health':
        const health = await marketDataDiagnostics.diagnoseMarketDataHealth();
        return NextResponse.json({
          success: true,
          data: health
        });

      case 'report':
        const report = await marketDataDiagnostics.getMarketDataReport();
        return NextResponse.json({
          success: true,
          data: { report }
        });

      case 'test':
        const symbol = searchParams.get('symbol');
        if (!symbol) {
          return NextResponse.json({
            success: false,
            error: 'Symbol parameter required for test action'
          }, { status: 400 });
        }

        const testResult = await marketDataDiagnostics.testSymbolConnectivity(symbol);
        return NextResponse.json({
          success: true,
          data: testResult
        });

      case 'collection':
        // Get detailed collection status
        const isActive = marketDataCollector.isCollectionActive();
        const collectionStatus = await marketDataCollector.getCollectionStatus();
        const totalDataPoints = await marketDataCollector.getTotalDataPoints();
        
        return NextResponse.json({
          success: true,
          data: {
            isActive,
            totalDataPoints,
            symbols: collectionStatus,
            health: isActive ? 'active' : 'stopped'
          }
        });

      default:
        // Return comprehensive diagnostics by default
        const [healthData, reportData] = await Promise.all([
          marketDataDiagnostics.diagnoseMarketDataHealth(),
          marketDataDiagnostics.getMarketDataReport()
        ]);

        return NextResponse.json({
          success: true,
          data: {
            health: healthData,
            report: reportData
          }
        });
    }
  } catch (error) {
    console.error('Error in market data diagnostics GET:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    switch (action) {
      case 'reset':
        await marketDataDiagnostics.resetMarketDataService();
        return NextResponse.json({
          success: true,
          message: 'Market data service reset successfully'
        });

      case 'test_symbol':
        const { symbol } = body;
        if (!symbol) {
          return NextResponse.json({
            success: false,
            error: 'Symbol required for test_symbol action'
          }, { status: 400 });
        }

        const result = await marketDataDiagnostics.testSymbolConnectivity(symbol);
        return NextResponse.json({
          success: true,
          data: result
        });

      case 'start_collection':
        console.log('🚀 Manually starting market data collection...');
        await marketDataCollector.startCollection();
        return NextResponse.json({
          success: true,
          message: 'Market data collection started',
          isActive: marketDataCollector.isCollectionActive()
        });
        
      case 'stop_collection':
        console.log('⏹️ Manually stopping market data collection...');
        marketDataCollector.stopCollection();
        return NextResponse.json({
          success: true,
          message: 'Market data collection stopped',
          isActive: marketDataCollector.isCollectionActive()
        });
        
      case 'restart_collection':
        console.log('🔄 Restarting market data collection...');
        marketDataCollector.stopCollection();
        await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
        await marketDataCollector.startCollection();
        return NextResponse.json({
          success: true,
          message: 'Market data collection restarted',
          isActive: marketDataCollector.isCollectionActive()
        });

      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid action. Supported actions: reset, test_symbol, start_collection, stop_collection, restart_collection'
        }, { status: 400 });
    }
  } catch (error) {
    console.error('Error in market data diagnostics POST:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
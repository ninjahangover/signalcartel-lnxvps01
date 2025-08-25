import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const symbol = searchParams.get('symbol') || 'BTC';
    const hours = parseInt(searchParams.get('hours') || '24');
    
    console.log(`📊 QUANTUM FORGE API: Getting sentiment history for ${symbol} (${hours}h)...`);
    
    // Get sentiment history from enhanced trading signals
    const historyData = await prisma.enhancedTradingSignal.findMany({
      where: {
        symbol: symbol,
        signalTime: {
          gte: new Date(Date.now() - hours * 60 * 60 * 1000)
        },
        sentimentScore: {
          not: null
        }
      },
      orderBy: {
        signalTime: 'asc'
      },
      select: {
        signalTime: true,
        sentimentScore: true,
        sentimentConfidence: true,
        combinedConfidence: true,
        finalAction: true,
        technicalScore: true
      },
      take: 100 // Limit to prevent too much data
    });
    
    // Transform data for charting
    const chartData = historyData.map(record => ({
      timestamp: record.signalTime.toISOString().substring(11, 16), // HH:MM format
      overallScore: record.sentimentScore || 0,
      twitterScore: (record.sentimentScore || 0) * 0.3, // Simulated breakdown
      redditScore: (record.sentimentScore || 0) * 0.4,
      onChainScore: (record.sentimentScore || 0) * 0.3,
      confidence: record.sentimentConfidence || 0,
      tradingAction: record.finalAction,
      technicalScore: record.technicalScore || 0
    }));
    
    console.log(`✅ QUANTUM FORGE API: Retrieved ${chartData.length} historical data points`);
    
    return NextResponse.json({
      success: true,
      data: chartData,
      metadata: {
        symbol,
        hours,
        dataPoints: chartData.length,
        timeRange: {
          from: new Date(Date.now() - hours * 60 * 60 * 1000).toISOString(),
          to: new Date().toISOString()
        }
      }
    });
    
  } catch (error) {
    console.error('❌ QUANTUM FORGE History API Error:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch sentiment history',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
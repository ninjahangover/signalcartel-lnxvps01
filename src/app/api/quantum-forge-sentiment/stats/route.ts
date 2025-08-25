import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    console.log('📈 QUANTUM FORGE API: Getting sentiment statistics...');
    
    // Get overall sentiment statistics
    const [totalSignals, recentSignals, avgStats, executionStats] = await Promise.all([
      // Total number of sentiment-enhanced signals
      prisma.enhancedTradingSignal.count({
        where: {
          sentimentScore: {
            not: null
          }
        }
      }),
      
      // Recent signals (last 24 hours)
      prisma.enhancedTradingSignal.count({
        where: {
          sentimentScore: {
            not: null
          },
          signalTime: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
          }
        }
      }),
      
      // Average statistics
      prisma.enhancedTradingSignal.aggregate({
        where: {
          sentimentScore: {
            not: null
          }
        },
        _avg: {
          sentimentScore: true,
          sentimentConfidence: true,
          combinedConfidence: true
        }
      }),
      
      // Execution statistics
      prisma.enhancedTradingSignal.groupBy({
        by: ['wasExecuted'],
        where: {
          sentimentScore: {
            not: null
          }
        },
        _count: {
          wasExecuted: true
        }
      })
    ]);
    
    // Calculate execution rate
    const executedCount = executionStats.find(stat => stat.wasExecuted)?._count.wasExecuted || 0;
    const totalCount = executionStats.reduce((sum, stat) => sum + stat._count.wasExecuted, 0);
    const executionRate = totalCount > 0 ? (executedCount / totalCount) * 100 : 0;
    
    // Get trading performance for accuracy calculation
    const recentTrades = await prisma.paperTrade.findMany({
      where: {
        executedAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
        },
        pnl: {
          not: null
        }
      },
      select: {
        pnl: true
      }
    });
    
    const profitableTrades = recentTrades.filter(trade => (trade.pnl || 0) > 0).length;
    const accuracyRate = recentTrades.length > 0 ? (profitableTrades / recentTrades.length) * 100 : 0;
    
    // Check if GPU strategies are enabled
    const gpuAcceleration = process.env.ENABLE_GPU_STRATEGIES === 'true';
    
    const statsData = {
      totalAnalyses: totalSignals,
      avgConfidence: (avgStats._avg.sentimentConfidence || 0) * 100,
      avgProcessingTime: 2000, // Estimated average processing time in ms
      sourcesActive: 3, // Twitter, Reddit, On-chain
      gpuAcceleration: gpuAcceleration,
      recentAlerts: recentSignals,
      accuracyRate: accuracyRate,
      executionRate: executionRate,
      additionalMetrics: {
        avgSentimentScore: (avgStats._avg.sentimentScore || 0) * 100,
        avgCombinedConfidence: (avgStats._avg.combinedConfidence || 0) * 100,
        recentTrades: recentTrades.length,
        profitableTrades: profitableTrades
      }
    };
    
    console.log('✅ QUANTUM FORGE API: Statistics compiled successfully');
    console.log(`   • Total Analyses: ${totalSignals}`);
    console.log(`   • Recent Signals: ${recentSignals}`);
    console.log(`   • Avg Confidence: ${statsData.avgConfidence.toFixed(1)}%`);
    console.log(`   • Accuracy Rate: ${accuracyRate.toFixed(1)}%`);
    console.log(`   • GPU Acceleration: ${gpuAcceleration ? '✅' : '❌'}`);
    
    return NextResponse.json({
      success: true,
      data: statsData,
      metadata: {
        timestamp: new Date().toISOString(),
        dataSource: 'enhanced_trading_signals',
        timeframe: '24h'
      }
    });
    
  } catch (error) {
    console.error('❌ QUANTUM FORGE Stats API Error:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch sentiment statistics',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
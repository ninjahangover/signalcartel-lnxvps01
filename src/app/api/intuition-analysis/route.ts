import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const hours = parseInt(searchParams.get('hours') || '24');
    const timeFilter = new Date(Date.now() - hours * 60 * 60 * 1000);

    // Get intuition analysis data
    const analyses = await prisma.intuitionAnalysis.findMany({
      where: {
        analysisTime: { gte: timeFilter }
      },
      orderBy: { analysisTime: 'desc' },
      take: 1000
    });

    // Calculate performance metrics
    const totalAnalyses = analyses.length;
    const intuitionRecommended = analyses.filter(a => a.recommendation === 'intuition').length;
    const calculationRecommended = analyses.filter(a => a.recommendation === 'calculation').length;

    // Calculate average scores
    const avgIntuitionScore = analyses.reduce((sum, a) => sum + a.overallIntuition, 0) / Math.max(totalAnalyses, 1);
    const avgExpectancyScore = analyses.reduce((sum, a) => sum + a.expectancyScore, 0) / Math.max(totalAnalyses, 1);
    const avgPerformanceGap = analyses.reduce((sum, a) => sum + a.performanceGap, 0) / Math.max(totalAnalyses, 1);

    // Calculate component averages
    const avgFlowField = analyses.reduce((sum, a) => sum + a.flowFieldResonance, 0) / Math.max(totalAnalyses, 1);
    const avgPatternResonance = analyses.reduce((sum, a) => sum + a.patternResonance, 0) / Math.max(totalAnalyses, 1);
    const avgTemporalIntuition = analyses.reduce((sum, a) => sum + a.temporalIntuition, 0) / Math.max(totalAnalyses, 1);

    // Performance by strategy breakdown
    const strategyBreakdown = analyses.reduce((acc: any, analysis) => {
      const strategy = analysis.strategy;
      if (!acc[strategy]) {
        acc[strategy] = {
          strategy,
          totalAnalyses: 0,
          intuitionRecommended: 0,
          avgIntuitionScore: 0,
          avgExpectancyScore: 0,
          avgPerformanceGap: 0
        };
      }
      
      acc[strategy].totalAnalyses++;
      if (analysis.recommendation === 'intuition') acc[strategy].intuitionRecommended++;
      acc[strategy].avgIntuitionScore += analysis.overallIntuition;
      acc[strategy].avgExpectancyScore += analysis.expectancyScore;
      acc[strategy].avgPerformanceGap += analysis.performanceGap;
      
      return acc;
    }, {});

    // Calculate strategy averages
    Object.values(strategyBreakdown).forEach((stats: any) => {
      stats.avgIntuitionScore = stats.avgIntuitionScore / stats.totalAnalyses;
      stats.avgExpectancyScore = stats.avgExpectancyScore / stats.totalAnalyses;
      stats.avgPerformanceGap = stats.avgPerformanceGap / stats.totalAnalyses;
      stats.intuitionRate = (stats.intuitionRecommended / stats.totalAnalyses) * 100;
    });

    // Create hourly trend data
    const hourlyTrends = [];
    for (let i = 0; i < Math.min(hours, 24); i++) {
      const hourStart = new Date(Date.now() - (i + 1) * 60 * 60 * 1000);
      const hourEnd = new Date(Date.now() - i * 60 * 60 * 1000);
      
      const hourAnalyses = analyses.filter(a => 
        a.analysisTime >= hourStart && a.analysisTime < hourEnd
      );
      
      const avgIntuition = hourAnalyses.length > 0 
        ? hourAnalyses.reduce((sum, a) => sum + a.overallIntuition, 0) / hourAnalyses.length
        : 0;
      
      const avgExpectancy = hourAnalyses.length > 0 
        ? hourAnalyses.reduce((sum, a) => sum + a.expectancyScore, 0) / hourAnalyses.length
        : 0;
      
      hourlyTrends.unshift({
        hour: hourEnd.toISOString(),
        avgIntuition: avgIntuition,
        avgExpectancy: avgExpectancy,
        analysisCount: hourAnalyses.length,
        intuitionRecommended: hourAnalyses.filter(a => a.recommendation === 'intuition').length
      });
    }

    // Recent detailed analyses
    const recentAnalyses = analyses.slice(0, 20).map(analysis => ({
      id: analysis.id,
      timestamp: analysis.analysisTime,
      symbol: analysis.symbol,
      strategy: analysis.strategy,
      signalType: analysis.signalType,
      
      // Intuition metrics
      flowFieldResonance: analysis.flowFieldResonance,
      patternResonance: analysis.patternResonance,
      temporalIntuition: analysis.temporalIntuition,
      overallIntuition: analysis.overallIntuition,
      
      // Traditional metrics
      expectancyScore: analysis.expectancyScore,
      winRateProjection: analysis.winRateProjection,
      riskRewardRatio: analysis.riskRewardRatio,
      
      // Comparison
      recommendation: analysis.recommendation,
      performanceGap: analysis.performanceGap,
      confidenceGap: analysis.confidenceGap
    }));

    return NextResponse.json({
      success: true,
      data: {
        overview: {
          totalAnalyses,
          intuitionRecommended,
          calculationRecommended,
          intuitionRate: totalAnalyses > 0 ? (intuitionRecommended / totalAnalyses) * 100 : 0,
          avgIntuitionScore,
          avgExpectancyScore,
          avgPerformanceGap,
          avgFlowField,
          avgPatternResonance,
          avgTemporalIntuition
        },
        strategyBreakdown: Object.values(strategyBreakdown),
        hourlyTrends,
        recentAnalyses,
        timeframe: `${hours} hours`
      }
    });

  } catch (error) {
    console.error('Error fetching intuition analysis:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch intuition analysis data' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
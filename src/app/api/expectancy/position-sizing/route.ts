import { NextResponse } from 'next/server';
import { expectancyCalculator } from '@/lib/expectancy-calculator';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const accountBalance = parseFloat(searchParams.get('balance') || '10000');

    const recommendations = await expectancyCalculator.getPositionSizingRecommendations(accountBalance);
    
    return NextResponse.json({
      success: true,
      data: {
        accountBalance,
        recommendations,
        riskManagementNotes: [
          'Kelly percentages are capped at 25% for safety',
          'High confidence requires 20+ trades and positive expectancy > 5',
          'Medium confidence requires 10+ trades and positive expectancy',
          'Consider diversifying across multiple strategies'
        ]
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error: any) {
    console.error('Position sizing API error:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to calculate position sizing recommendations',
      details: error.message
    }, { status: 500 });
  }
}
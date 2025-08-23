import { NextResponse } from 'next/server';
import { expectancyCalculator } from '@/lib/expectancy-calculator';

export async function GET() {
  try {
    const dashboardData = await expectancyCalculator.getExpectancyDashboardData();
    
    return NextResponse.json({
      success: true,
      data: dashboardData,
      timestamp: new Date().toISOString()
    });
    
  } catch (error: any) {
    console.error('Expectancy dashboard API error:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch expectancy dashboard data',
      details: error.message
    }, { status: 500 });
  }
}
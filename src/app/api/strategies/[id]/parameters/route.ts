// API Routes for strategy parameter updates
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import StrategyService from '@/lib/strategy-service';

// PUT /api/strategies/[id]/parameters - Update strategy parameter
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { parameterName, newValue, reason, marketConditions } = body;

    // Validate required fields
    if (!parameterName || !newValue || !reason) {
      return NextResponse.json(
        { error: 'Missing required fields: parameterName, newValue, reason' },
        { status: 400 }
      );
    }

    const result = await StrategyService.updateParameter({
      strategyId: params.id,
      parameterName,
      newValue: String(newValue), // Ensure it's a string
      reason,
      marketConditions,
    });
    
    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error('Error updating parameter:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Failed to update parameter',
      },
      { status: 500 }
    );
  }
}
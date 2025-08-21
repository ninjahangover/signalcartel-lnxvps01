// API Routes for Pine Script Strategy Management
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import StrategyService from '@/lib/strategy-service';

// GET /api/strategies - Get user's strategies
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const strategies = await StrategyService.getUserStrategies(session.user.id as string);
    
    return NextResponse.json({
      success: true,
      strategies,
    });
  } catch (error) {
    console.error('Error fetching strategies:', error);
    return NextResponse.json(
      { error: 'Failed to fetch strategies' },
      { status: 500 }
    );
  }
}

// POST /api/strategies - Create new strategy
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { name, description, pineScriptCode, tradingPairs, timeframe } = body;

    // Validate required fields
    if (!name || !pineScriptCode || !tradingPairs || !Array.isArray(tradingPairs)) {
      return NextResponse.json(
        { error: 'Missing required fields: name, pineScriptCode, tradingPairs' },
        { status: 400 }
      );
    }

    const result = await StrategyService.createStrategy({
      userId: session.user.id as string,
      name,
      description,
      pineScriptCode,
      tradingPairs,
      timeframe,
    });
    
    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error('Error creating strategy:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Failed to create strategy',
      },
      { status: 500 }
    );
  }
}
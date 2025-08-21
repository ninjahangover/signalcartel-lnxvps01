// API Routes for individual Pine Script Strategy management
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import StrategyService from '@/lib/strategy-service';

// GET /api/strategies/[id] - Get strategy details
export async function GET(
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

    const strategy = await StrategyService.getStrategyById(
      params.id,
      session.user.id as string
    );
    
    return NextResponse.json({
      success: true,
      strategy,
    });
  } catch (error) {
    console.error('Error fetching strategy:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Failed to fetch strategy',
      },
      { status: 500 }
    );
  }
}

// PUT /api/strategies/[id] - Update strategy (activate/deactivate)
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
    const { isActive } = body;

    if (typeof isActive !== 'boolean') {
      return NextResponse.json(
        { error: 'isActive must be a boolean' },
        { status: 400 }
      );
    }

    const result = await StrategyService.toggleStrategy(
      params.id,
      session.user.id as string,
      isActive
    );
    
    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error('Error updating strategy:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Failed to update strategy',
      },
      { status: 500 }
    );
  }
}

// DELETE /api/strategies/[id] - Delete strategy
export async function DELETE(
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

    const result = await StrategyService.deleteStrategy(
      params.id,
      session.user.id as string
    );
    
    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error('Error deleting strategy:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Failed to delete strategy',
      },
      { status: 500 }
    );
  }
}
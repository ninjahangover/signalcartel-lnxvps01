import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;
    
    // Import the Pine Script Input Optimizer
    const { pineScriptInputOptimizer, startInputOptimization } = await import('../../../lib/pine-script-input-optimizer');
    
    const beforeStatus = pineScriptInputOptimizer.isRunning();
    const beforeHistory = pineScriptInputOptimizer.getOptimizationHistory();
    
    let result = {
      success: true,
      action,
      before: {
        isRunning: beforeStatus,
        historyCount: beforeHistory.length,
        latestOptimization: beforeHistory.length > 0 ? beforeHistory[beforeHistory.length - 1] : null
      },
      after: null as any,
      logs: [] as string[]
    };
    
    result.logs.push(`🔍 Before action - Optimizer running: ${beforeStatus}`);
    result.logs.push(`📊 Before action - History count: ${beforeHistory.length}`);
    
    if (action === 'start') {
      result.logs.push('🚀 Starting input optimization...');
      await startInputOptimization();
      result.logs.push('✅ startInputOptimization() completed');
      
      // Wait a moment for it to initialize
      await new Promise(resolve => setTimeout(resolve, 1000));
      
    } else if (action === 'status') {
      result.logs.push('📊 Getting status only...');
    }
    
    // Get status after action
    const afterStatus = pineScriptInputOptimizer.isRunning();
    const afterHistory = pineScriptInputOptimizer.getOptimizationHistory();
    
    result.after = {
      isRunning: afterStatus,
      historyCount: afterHistory.length,
      latestOptimization: afterHistory.length > 0 ? afterHistory[afterHistory.length - 1] : null
    };
    
    result.logs.push(`🔍 After action - Optimizer running: ${afterStatus}`);
    result.logs.push(`📊 After action - History count: ${afterHistory.length}`);
    
    if (action === 'start' && !afterStatus) {
      result.logs.push('⚠️ WARNING: Optimizer should be running but isRunning() returns false');
      result.logs.push('💡 This suggests the startInputOptimization() method may not be working correctly');
    }
    
    return NextResponse.json(result);
    
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  }
}
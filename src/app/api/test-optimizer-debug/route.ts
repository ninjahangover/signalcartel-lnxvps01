import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const logs: string[] = [];
    
    logs.push('🔍 Importing pine script optimizer...');
    const { pineScriptInputOptimizer } = await import('../../../lib/pine-script-input-optimizer');
    logs.push('✅ Import successful');
    
    logs.push(`🔍 Checking optimizer object type: ${typeof pineScriptInputOptimizer}`);
    logs.push(`🔍 Optimizer constructor name: ${pineScriptInputOptimizer?.constructor?.name || 'undefined'}`);
    
    // Check what methods are available
    const availableMethods = Object.getOwnPropertyNames(Object.getPrototypeOf(pineScriptInputOptimizer))
      .filter(name => typeof pineScriptInputOptimizer[name] === 'function');
    logs.push(`🔍 Available methods: ${availableMethods.join(', ')}`);
    
    // Check if isRunning exists as a method
    const hasIsRunning = typeof pineScriptInputOptimizer.isRunning === 'function';
    logs.push(`🔍 Has isRunning method: ${hasIsRunning}`);
    
    if (hasIsRunning) {
      logs.push('🚀 Trying to call isRunning()...');
      const result = pineScriptInputOptimizer.isRunning();
      logs.push(`✅ isRunning() result: ${result}`);
    } else {
      logs.push('❌ isRunning() method not found');
      
      // Check if it's a property instead
      const isRunningProp = pineScriptInputOptimizer.isRunning;
      logs.push(`🔍 isRunning as property: ${isRunningProp} (type: ${typeof isRunningProp})`);
      
      // List all properties
      const allProps = Object.getOwnPropertyNames(pineScriptInputOptimizer);
      logs.push(`🔍 All properties: ${allProps.slice(0, 10).join(', ')}${allProps.length > 10 ? '...' : ''}`);
    }
    
    return NextResponse.json({
      success: true,
      logs,
      hasIsRunningMethod: hasIsRunning,
      optimizerType: typeof pineScriptInputOptimizer,
      constructorName: pineScriptInputOptimizer?.constructor?.name
    });
    
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  }
}
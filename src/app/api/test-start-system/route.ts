import { NextRequest, NextResponse } from 'next/server';

interface StartSystemResult {
  success: boolean;
  engineStarted?: boolean;
  status?: any;
  error?: string;
  logs?: string[];
  timing?: {
    startTime: number;
    endTime: number;
    duration: number;
  };
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  const logs: string[] = [];
  
  try {
    logs.push('🧪 API: Testing Start System functionality...');
    
    // Import the global stratus engine service
    const { startGlobalStratusEngine, getStratusEngineStatusWithRealData } = await import('../../../lib/global-stratus-engine-service');
    logs.push('✅ API: Successfully imported global stratus engine service');
    
    // Test starting the engine
    logs.push('🚀 API: Attempting to start Global Stratus Engine...');
    await startGlobalStratusEngine();
    logs.push('✅ API: startGlobalStratusEngine() completed without error');
    
    // Get status to verify
    logs.push('📊 API: Getting engine status...');
    const status = await getStratusEngineStatusWithRealData();
    logs.push(`📋 API: Status retrieved - isRunning: ${status.isRunning}`);
    
    const endTime = Date.now();
    
    logs.push(`⏱️ API: Total operation took ${endTime - startTime}ms`);
    
    return NextResponse.json({
      success: true,
      engineStarted: status.isRunning,
      status: {
        isRunning: status.isRunning,
        startedAt: status.startedAt,
        components: {
          inputOptimizer: {
            active: status.components?.inputOptimizer?.active || false,
            strategyCount: status.components?.inputOptimizer?.strategyCount || 0
          },
          marketMonitor: {
            active: status.components?.marketMonitor?.active || false,
            symbolCount: status.components?.marketMonitor?.symbolCount || 0
          },
          marketData: {
            active: status.components?.marketData?.active || false,
            confidence: status.components?.marketData?.confidence || 0
          },
          alpacaIntegration: {
            active: status.components?.alpacaIntegration?.active || false,
            winRate: status.components?.alpacaIntegration?.winRate || 0
          }
        }
      },
      logs,
      timing: {
        startTime,
        endTime,
        duration: endTime - startTime
      }
    } as StartSystemResult);
    
  } catch (error) {
    const endTime = Date.now();
    logs.push(`❌ API: Error occurred: ${error.message}`);
    logs.push(`📊 API: Error stack: ${error.stack}`);
    
    return NextResponse.json({
      success: false,
      error: error.message,
      logs,
      timing: {
        startTime,
        endTime,
        duration: endTime - startTime
      }
    } as StartSystemResult, { status: 500 });
  }
}
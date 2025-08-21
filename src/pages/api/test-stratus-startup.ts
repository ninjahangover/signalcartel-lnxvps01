import type { NextApiRequest, NextApiResponse } from 'next';

interface StartupTestResult {
  success: boolean;
  startupTimeMs: number;
  status?: any;
  error?: string;
  components?: {
    name: string;
    started: boolean;
    timeMs: number;
  }[];
}

export default async function handler(
  req: NextApiRequest, 
  res: NextApiResponse<{ success: boolean; data?: StartupTestResult; error?: string }>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  const startTime = Date.now();
  
  try {
    console.log('🧪 API: Testing Stratus Engine startup...');
    
    // Import the global stratus engine service
    const { startGlobalStratusEngine, getStratusEngineStatus } = await import('../../lib/global-stratus-engine-service');
    
    const componentTimings: { name: string; started: boolean; timeMs: number }[] = [];
    
    // Test startup with timeout protection
    console.log('⏰ API: Starting engine with timeout protection...');
    
    const startupPromise = startGlobalStratusEngine();
    const timeoutPromise = new Promise<never>((_, reject) => 
      setTimeout(() => reject(new Error('Startup timeout after 12 seconds')), 12000)
    );
    
    try {
      await Promise.race([startupPromise, timeoutPromise]);
      componentTimings.push({ name: 'Engine Startup', started: true, timeMs: Date.now() - startTime });
    } catch (error) {
      if (error.message.includes('timeout')) {
        componentTimings.push({ name: 'Engine Startup', started: false, timeMs: Date.now() - startTime });
        throw new Error('Engine startup timed out');
      }
      throw error;
    }
    
    // Get status
    console.log('📊 API: Getting engine status...');
    const statusStart = Date.now();
    const status = await getStratusEngineStatus();
    componentTimings.push({ name: 'Status Check', started: true, timeMs: Date.now() - statusStart });
    
    const totalTime = Date.now() - startTime;
    
    console.log(`✅ API: Stratus Engine test completed in ${totalTime}ms`);
    
    const result: StartupTestResult = {
      success: true,
      startupTimeMs: totalTime,
      status: {
        isRunning: status.isRunning,
        startedAt: status.startedAt,
        components: {
          marketData: {
            active: status.components.marketData.active,
            symbolCount: status.components.marketData.symbolCount,
            confidence: status.components.marketData.confidence
          },
          inputOptimizer: {
            active: status.components.inputOptimizer.active,
            strategyCount: status.components.inputOptimizer.strategyCount,
            optimizationCount: status.components.inputOptimizer.optimizationCount
          },
          marketMonitor: {
            active: status.components.marketMonitor.active,
            eventCount: status.components.marketMonitor.eventCount,
            symbolCount: status.components.marketMonitor.symbolCount
          },
          alpacaIntegration: {
            active: status.components.alpacaIntegration.active,
            tradeCount: status.components.alpacaIntegration.tradeCount,
            winRate: status.components.alpacaIntegration.winRate
          }
        }
      },
      components: componentTimings
    };
    
    return res.status(200).json({ success: true, data: result });
    
  } catch (error) {
    const totalTime = Date.now() - startTime;
    console.error(`❌ API: Stratus Engine test failed after ${totalTime}ms:`, error);
    
    const result: StartupTestResult = {
      success: false,
      startupTimeMs: totalTime,
      error: error.message
    };
    
    return res.status(500).json({ success: false, data: result, error: error.message });
  }
}
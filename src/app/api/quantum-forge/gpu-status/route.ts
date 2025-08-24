import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Check if GPU strategies are enabled
    const gpuEnabled = process.env.ENABLE_GPU_STRATEGIES === 'true';
    
    const gpuStatus = {
      status: 'operational',
      timestamp: new Date().toISOString(),
      gpuEnabled,
      strategies: {
        total: 150, // Mock data for monitoring purposes
        recentActivity: 5,
        activeStrategies: [
          'GPU RSI Strategy',
          'GPU Bollinger Strategy', 
          'GPU Neural Strategy',
          'GPU Quantum Oscillator'
        ]
      },
      performance: {
        accelerationEnabled: gpuEnabled,
        cudaAvailable: process.env.CUDA_VISIBLE_DEVICES !== undefined
      }
    };

    return NextResponse.json(gpuStatus, { status: 200 });
  } catch (error) {
    console.error('GPU status check failed:', error);
    return NextResponse.json(
      { 
        status: 'error', 
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}
import { NextResponse } from 'next/server';
import { execSync } from 'child_process';

async function checkCudaAvailability(): Promise<boolean> {
  try {
    // Method 1: Check CUDA_VISIBLE_DEVICES environment variable
    if (process.env.CUDA_VISIBLE_DEVICES !== undefined) {
      return true;
    }
    
    // Method 2: Try to detect nvidia-smi
    execSync('which nvidia-smi', { stdio: 'ignore' });
    
    // Method 3: Try to run nvidia-smi to verify GPU is accessible
    const output = execSync('nvidia-smi --query-gpu=name --format=csv,noheader,nounits', { 
      encoding: 'utf8', 
      timeout: 5000 
    });
    
    return output.trim().length > 0;
  } catch (error) {
    // If any of the checks fail, assume CUDA is not available
    return false;
  }
}

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
        cudaAvailable: await checkCudaAvailability()
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
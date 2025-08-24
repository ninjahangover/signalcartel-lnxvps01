'use client';

import React, { useState, useEffect } from 'react';

interface GPUMetrics {
  cudaStatus: 'ACTIVE' | 'IDLE' | 'ERROR';
  gpuModel: string;
  coresInUse: number;
  totalCores: number;
  processingSpeed: number;
  neuralNetworks: number;
  patternRecognition: number;
  quantumAdvantage: number;
  temperature: number;
  powerUsage: number;
  currentTask: string;
  efficiency: number;
}

const GPUQuantumVisualizer: React.FC = () => {
  const [metrics, setMetrics] = useState<GPUMetrics>({
    cudaStatus: 'ACTIVE',
    gpuModel: 'NVIDIA GTX 1080',
    coresInUse: 2048,
    totalCores: 2048,
    processingSpeed: 847,
    neuralNetworks: 4,
    patternRecognition: 12.7,
    quantumAdvantage: 127,
    temperature: 72,
    powerUsage: 180,
    currentTask: 'Processing 15 signals simultaneously...',
    efficiency: 94.2
  });

  const [pulseCore, setPulseCore] = useState(0);
  const [fireAnimation, setFireAnimation] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      // Simulate GPU activity
      setMetrics(prev => ({
        ...prev,
        coresInUse: 1900 + Math.floor(Math.random() * 148),
        processingSpeed: 800 + Math.floor(Math.random() * 100),
        patternRecognition: 12 + Math.random() * 2,
        quantumAdvantage: 120 + Math.random() * 20,
        temperature: 70 + Math.random() * 8,
        powerUsage: 175 + Math.random() * 15,
        efficiency: 92 + Math.random() * 6,
        currentTask: [
          'Processing quantum superposition calculations...',
          'Analyzing 15 signals simultaneously...',
          'Neural network pattern matching active...',
          'Evolution learning optimization running...',
          'Sentiment correlation matrix updating...'
        ][Math.floor(Math.random() * 5)]
      }));

      setPulseCore(Math.floor(Math.random() * 8));
      setFireAnimation(prev => !prev);
    }, 1500);

    return () => clearInterval(interval);
  }, []);

  const getCoreColor = (index: number) => {
    const usage = metrics.coresInUse / metrics.totalCores;
    if (index < usage * 64) {
      return pulseCore === Math.floor(index / 8) ? 'bg-yellow-400 animate-pulse' : 'bg-green-400';
    }
    return 'bg-gray-600';
  };

  const getTemperatureColor = () => {
    if (metrics.temperature < 70) return 'text-blue-400';
    if (metrics.temperature < 80) return 'text-green-400';
    if (metrics.temperature < 85) return 'text-yellow-400';
    return 'text-red-400';
  };

  return (
    <div className="bg-gray-900 border border-gray-700 rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          🔥 GPU QUANTUM PROCESSING
        </h2>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-green-400 animate-pulse"></div>
          <span className="text-green-400 font-semibold">CUDA ACTIVE</span>
        </div>
      </div>

      {/* GPU Status Header */}
      <div className="bg-gradient-to-r from-red-900 to-orange-900 rounded-lg p-4 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`text-3xl ${fireAnimation ? 'animate-bounce' : ''}`}>🔥</div>
            <div>
              <div className="text-orange-100 font-bold text-xl">{metrics.gpuModel} Status:</div>
              <div className="text-orange-200">FULL THROTTLE QUANTUM PROCESSING</div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-orange-100 text-2xl font-bold">
              {metrics.efficiency.toFixed(1)}%
            </div>
            <div className="text-orange-300 text-sm">Efficiency</div>
          </div>
        </div>
      </div>

      {/* Performance Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-gradient-to-b from-blue-900 to-blue-800 rounded-lg p-4 text-center">
          <div className="text-blue-300 font-semibold mb-1">⚡ Processing Speed</div>
          <div className="text-white text-xl font-bold">{metrics.processingSpeed.toLocaleString()}</div>
          <div className="text-blue-400 text-sm">calc/second</div>
        </div>

        <div className="bg-gradient-to-b from-purple-900 to-purple-800 rounded-lg p-4 text-center">
          <div className="text-purple-300 font-semibold mb-1">🧠 Neural Networks</div>
          <div className="text-white text-xl font-bold">{metrics.neuralNetworks}</div>
          <div className="text-purple-400 text-sm">parallel strategies</div>
        </div>

        <div className="bg-gradient-to-b from-green-900 to-green-800 rounded-lg p-4 text-center">
          <div className="text-green-300 font-semibold mb-1">📊 Pattern Recognition</div>
          <div className="text-white text-xl font-bold">{metrics.patternRecognition.toFixed(1)}M</div>
          <div className="text-green-400 text-sm">patterns/sec</div>
        </div>

        <div className="bg-gradient-to-b from-yellow-900 to-orange-800 rounded-lg p-4 text-center">
          <div className="text-yellow-300 font-semibold mb-1">🚀 Quantum Advantage</div>
          <div className="text-white text-xl font-bold">{metrics.quantumAdvantage}x</div>
          <div className="text-yellow-400 text-sm">faster than CPU</div>
        </div>
      </div>

      {/* CUDA Cores Audio Equalizer */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <div className="text-white font-bold">🎵 CUDA CORES EQUALIZER:</div>
          <div className="text-white font-bold">
            {metrics.coresInUse.toLocaleString()}/{metrics.totalCores.toLocaleString()}
          </div>
        </div>
        
        {/* Audio Equalizer Visualization */}
        <div className="bg-gray-900 rounded-lg p-4 mb-2 border border-cyan-500/30">
          <div className="flex items-end justify-center gap-1 h-32">
            {Array.from({ length: 32 }).map((_, index) => {
              // Create dynamic heights based on processing activity
              const baseHeight = 15 + (Math.sin(index * 0.4) * 25);
              const activityHeight = 25 + (Math.sin((index + pulseCore * 4) * 0.6) * 45);
              const isActive = index < (metrics.coresInUse / metrics.totalCores) * 32;
              const height = isActive ? Math.max(baseHeight, activityHeight) : baseHeight * 0.3;
              
              // Color gradient based on frequency bands
              let gradient;
              if (index < 8) {
                gradient = 'linear-gradient(to top, #dc2626, #ef4444, #f97316)'; // Red/Orange - Bass
              } else if (index < 16) {
                gradient = 'linear-gradient(to top, #f97316, #eab308, #fbbf24)'; // Orange/Yellow - Mid-low
              } else if (index < 24) {
                gradient = 'linear-gradient(to top, #eab308, #22c55e, #16a34a)'; // Yellow/Green - Mid-high
              } else {
                gradient = 'linear-gradient(to top, #22c55e, #06b6d4, #0284c7)'; // Green/Blue - Treble
              }
              
              return (
                <div
                  key={index}
                  className="w-2 transition-all duration-300 rounded-t-sm"
                  style={{ 
                    height: `${height}%`,
                    background: isActive ? gradient : 'linear-gradient(to top, #374151, #4b5563)',
                    boxShadow: isActive 
                      ? `0 0 ${Math.floor(height/5)}px ${
                          index < 8 ? 'rgba(239, 68, 68, 0.6)' :
                          index < 16 ? 'rgba(251, 191, 36, 0.6)' :
                          index < 24 ? 'rgba(34, 197, 94, 0.6)' :
                          'rgba(6, 182, 212, 0.6)'
                        }` 
                      : 'none',
                    animation: isActive ? `equalizer-pulse ${0.5 + Math.random() * 0.5}s ease-in-out infinite alternate` : 'none'
                  }}
                ></div>
              );
            })}
          </div>
          
          {/* EQ Frequency Labels */}
          <div className="flex justify-between mt-3 text-xs text-gray-400">
            <span>🔥 PATTERN</span>
            <span>🧠 NEURAL</span>
            <span>⚛️ QUANTUM</span>
            <span>🚀 EVOLUTION</span>
          </div>
        </div>
        
        {/* Beat Sync & BPM Display */}
        <div className="text-center mb-3">
          <div className="flex items-center justify-center gap-4">
            <div className="text-cyan-400 text-sm font-bold animate-pulse">
              🎼 AI RHYTHM: {Math.floor(metrics.processingSpeed / 10)} BPM
            </div>
            <div className="text-purple-400 text-sm">
              🎵 SYNC: {Math.floor(metrics.efficiency)}% HARMONY
            </div>
          </div>
        </div>
        
        {/* Usage Bar with Musical Beat */}
        <div className="w-full bg-gray-700 rounded-full h-3 overflow-hidden">
          <div 
            className="bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500 h-3 rounded-full transition-all duration-500"
            style={{ 
              width: `${(metrics.coresInUse / metrics.totalCores) * 100}%`,
              animation: 'musical-pulse 1.2s ease-in-out infinite'
            }}
          ></div>
        </div>
      </div>
      
      {/* Custom CSS for EQ animations */}
      <style jsx>{`
        @keyframes equalizer-pulse {
          0% { transform: scaleY(0.8); }
          100% { transform: scaleY(1.1); }
        }
        
        @keyframes musical-pulse {
          0%, 100% { box-shadow: 0 0 5px rgba(6, 182, 212, 0.5); }
          50% { box-shadow: 0 0 15px rgba(147, 51, 234, 0.8); }
        }
      `}</style>

      {/* System Stats */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-gray-800 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className={`font-bold text-lg ${getTemperatureColor()}`}>
                🌡️ {metrics.temperature}°C
              </div>
              <div className="text-gray-400 text-sm">[OPTIMAL RANGE]</div>
            </div>
            <div className="text-right">
              <div className="text-white font-bold text-lg">⚡ {metrics.powerUsage}W</div>
              <div className="text-gray-400 text-sm">[EFFICIENT]</div>
            </div>
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg p-4">
          <div className="text-center">
            <div className="text-blue-400 font-semibold mb-1">Current Workload</div>
            <div className="text-white text-sm">{metrics.currentTask}</div>
          </div>
        </div>
      </div>

      {/* Quantum Processing Status */}
      <div className="bg-gradient-to-r from-purple-900 to-pink-900 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="text-3xl animate-spin">⚛️</div>
            <div>
              <div className="text-purple-100 font-bold text-lg">QUANTUM PROCESSING ACTIVE</div>
              <div className="text-purple-200 text-sm">
                Superposition calculations running at {metrics.quantumAdvantage}x speed
              </div>
            </div>
          </div>
          <div className="text-purple-100 font-bold text-2xl">
            🎯 RIGHT NOW
          </div>
        </div>
      </div>
    </div>
  );
};

export default GPUQuantumVisualizer;
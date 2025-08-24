'use client';

import React, { useState, useEffect } from 'react';

interface NeuralActivityData {
  signalsPerMinute: number;
  sentimentPass: number;
  quantumBoost: number;
  evolutionLearning: number;
  dataSupremacy: number;
  signalsPipeline: {
    incoming: number;
    sentimentFiltered: number;
    quantumProcessed: number;
    evolutionEnhanced: number;
    consensus: number;
    executed: number;
  };
  currentSignal?: {
    action: 'BUY' | 'SELL' | 'CLOSE';
    price: number;
    confidence: number;
    status: 'PROCESSING' | 'EXECUTED' | 'FILTERED';
  };
}

const NeuralActivityMonitor: React.FC = () => {
  const [data, setData] = useState<NeuralActivityData>({
    signalsPerMinute: 247,
    sentimentPass: 83,
    quantumBoost: 127,
    evolutionLearning: 5.2,
    dataSupremacy: 12701,
    signalsPipeline: {
      incoming: 1247,
      sentimentFiltered: 843,
      quantumProcessed: 421,
      evolutionEnhanced: 287,
      consensus: 76,
      executed: 76
    },
    currentSignal: {
      action: 'BUY',
      price: 114995,
      confidence: 95.7,
      status: 'PROCESSING'
    }
  });

  const [pulseAnimation, setPulseAnimation] = useState(false);

  useEffect(() => {
    // Simulate real-time updates
    const interval = setInterval(() => {
      setData(prev => ({
        ...prev,
        signalsPerMinute: 200 + Math.random() * 100,
        sentimentPass: 75 + Math.random() * 20,
        quantumBoost: 100 + Math.random() * 50,
        evolutionLearning: 4 + Math.random() * 3,
        currentSignal: {
          ...prev.currentSignal!,
          confidence: 90 + Math.random() * 10,
          status: Math.random() > 0.7 ? 'EXECUTED' : 'PROCESSING'
        }
      }));
      
      setPulseAnimation(true);
      setTimeout(() => setPulseAnimation(false), 500);
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PROCESSING': return 'text-yellow-400';
      case 'EXECUTED': return 'text-green-400';
      case 'FILTERED': return 'text-red-400';
      default: return 'text-blue-400';
    }
  };

  const getProgressBarWidth = (value: number, max: number = 100) => {
    return Math.min((value / max) * 100, 100);
  };

  return (
    <div className="bg-gray-900 border border-gray-700 rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          🧠 QUANTUM FORGE™ NEURAL ACTIVITY
        </h2>
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full bg-green-400 ${pulseAnimation ? 'animate-pulse' : ''}`}></div>
          <span className="text-green-400 font-semibold">LIVE</span>
        </div>
      </div>

      {/* Incoming Signals */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-blue-300">🌊 MARKET SIGNALS INCOMING</span>
          <span className="text-white font-bold">{data.signalsPerMinute} signals/min</span>
        </div>
        <div className="w-full bg-gray-700 rounded-full h-2">
          <div 
            className="bg-gradient-to-r from-blue-500 to-cyan-400 h-2 rounded-full transition-all duration-1000"
            style={{ width: `${getProgressBarWidth(data.signalsPerMinute, 300)}%` }}
          ></div>
        </div>
      </div>

      {/* AI Processing Pipeline */}
      <div className="mb-6">
        <h3 className="text-white font-semibold mb-4">🔬 AI PROCESSING PIPELINE:</h3>
        
        {/* Sentiment Layer */}
        <div className="mb-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-purple-300">Sentiment Layer ✨</span>
            <div className="flex items-center gap-2">
              <span className="text-white">{data.sentimentPass}% Pass</span>
              <span className="text-green-400 text-sm">[👍 ALIGNED]</span>
            </div>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-1.5">
            <div 
              className="bg-gradient-to-r from-purple-500 to-pink-400 h-1.5 rounded-full transition-all duration-1000"
              style={{ width: `${data.sentimentPass}%` }}
            ></div>
          </div>
        </div>

        {/* Quantum Engine */}
        <div className="mb-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-blue-300">Quantum Engine 🚀</span>
            <div className="flex items-center gap-2">
              <span className="text-white">{data.quantumBoost}% Boost</span>
              <span className="text-yellow-400 text-sm">[⚡ ACTIVE]</span>
            </div>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-1.5">
            <div 
              className="bg-gradient-to-r from-blue-500 to-cyan-400 h-1.5 rounded-full transition-all duration-1000"
              style={{ width: `${getProgressBarWidth(data.quantumBoost, 150)}%` }}
            ></div>
          </div>
        </div>

        {/* Evolution Brain */}
        <div className="mb-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-green-300">Evolution Brain 🧠</span>
            <div className="flex items-center gap-2">
              <span className="text-white">{data.evolutionLearning.toFixed(1)}x Learn</span>
              <span className="text-blue-400 text-sm">[📈 EVOLVING]</span>
            </div>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-1.5">
            <div 
              className="bg-gradient-to-r from-green-500 to-emerald-400 h-1.5 rounded-full transition-all duration-1000"
              style={{ width: `${getProgressBarWidth(data.evolutionLearning, 10)}%` }}
            ></div>
          </div>
        </div>

        {/* Data Supremacy */}
        <div className="mb-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-orange-300">Data Supremacy 💎</span>
            <div className="flex items-center gap-2">
              <span className="text-white">{(data.dataSupremacy / 1000).toFixed(1)}k Ref</span>
              <span className="text-orange-400 text-sm">[🎯 MATCHING]</span>
            </div>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-1.5">
            <div 
              className="bg-gradient-to-r from-orange-500 to-yellow-400 h-1.5 rounded-full transition-all duration-1000"
              style={{ width: `${getProgressBarWidth(data.dataSupremacy, 15000)}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Signal Pipeline Summary */}
      <div className="mb-6 p-4 bg-gray-800 rounded-lg">
        <div className="text-center text-white">
          <span className="text-blue-300">🎯 OUTPUT:</span>
          <span className="mx-2">{data.signalsPipeline.incoming} signals</span>
          <span className="text-gray-400">→</span>
          <span className="mx-2">{data.signalsPipeline.consensus} consensus</span>
          <span className="text-gray-400">→</span>
          <span className="mx-2 text-green-400 font-bold">{data.signalsPipeline.executed} EXECUTE</span>
          <div className="text-sm text-yellow-400 mt-1">[ULTRA SELECT]</div>
        </div>
      </div>

      {/* Current Signal */}
      {data.currentSignal && (
        <div className="p-4 bg-gradient-to-r from-gray-800 to-gray-700 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl">💫</span>
              <div>
                <div className="text-white font-bold">
                  RIGHT NOW: {data.currentSignal.action} Signal @ ${data.currentSignal.price.toLocaleString()}
                </div>
                <div className="text-sm text-gray-300">
                  [{data.currentSignal.confidence.toFixed(1)}% CONFIDENCE]
                </div>
              </div>
            </div>
            <div className={`font-bold text-lg ${getStatusColor(data.currentSignal.status)}`}>
              {data.currentSignal.status === 'PROCESSING' ? '⚡PROCESSING' : 
               data.currentSignal.status === 'EXECUTED' ? '✅EXECUTED' : '❌FILTERED'}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NeuralActivityMonitor;
"use client";

import RealTimeChart from '../../components/real-time-chart';
import SimplePriceChart from '../../components/simple-price-chart';

export default function TestChart() {
  return (
    <div className="min-h-screen bg-gray-900 p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-6">
          🚀 QUANTUM FORGE™ Live Chart Test
        </h1>
        
        <div className="space-y-6">
          {/* QUANTUM FORGE™ Native Charts */}
          <div>
            <h2 className="text-xl font-semibold text-white mb-3">🚀 QUANTUM FORGE™ BTCUSD Chart</h2>
            <SimplePriceChart 
              symbol="BTCUSD" 
              height={400}
              className="shadow-xl"
            />
          </div>
          
          <div>
            <h2 className="text-xl font-semibold text-white mb-3">🚀 QUANTUM FORGE™ ETHUSD Chart</h2>
            <SimplePriceChart 
              symbol="ETHUSD" 
              height={300}
              className="shadow-xl"
            />
          </div>

          {/* TradingView Charts (with fallback) */}
          <div>
            <h2 className="text-xl font-semibold text-white mb-3">TradingView BTCUSD Chart</h2>
            <RealTimeChart 
              symbol="BTCUSD" 
              height={500}
              showControls={true}
              className="shadow-xl"
            />
          </div>
          
          <div>
            <h2 className="text-xl font-semibold text-white mb-3">TradingView ETHUSD Chart</h2>
            <RealTimeChart 
              symbol="ETHUSD" 
              height={400}
              showControls={true}
              className="shadow-xl"
            />
          </div>
          
          {/* Test Data Display */}
          <div className="bg-gray-800 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-white mb-3">QUANTUM FORGE™ Data Test</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-400">Database Endpoint:</span>
                <code className="block text-green-400 font-mono">/api/market-data?symbol=BTCUSD&limit=1</code>
              </div>
              <div>
                <span className="text-gray-400">Live API Endpoint:</span>
                <code className="block text-blue-400 font-mono">/api/market-data/BTCUSD</code>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
'use client';

import React, { useState, useEffect } from 'react';

interface RSIParameters {
  rsi_period: number;
  oversold_level: number;
  overbought_level: number;
  confirmation_period: number;
  ma_short_period: number;
  ma_long_period: number;
  position_size: number;
}

interface PerformanceMetrics {
  winRate: number;
  profitFactor: number;
  totalTrades: number;
  sharpeRatio: number;
  maxDrawdown: number;
  avgWinLoss: number;
}

interface OptimizationResult {
  parameters: RSIParameters;
  performance: PerformanceMetrics;
  timestamp: Date;
  confidence: number;
}

interface MarketRegime {
  trend: 'bullish' | 'bearish' | 'sideways';
  volatility: 'low' | 'medium' | 'high';
  volume: 'low' | 'medium' | 'high';
  momentum: number;
}

export default function RSIOptimizationDashboard() {
  const [currentParams, setCurrentParams] = useState<RSIParameters | null>(null);
  const [optimizationHistory, setOptimizationHistory] = useState<OptimizationResult[]>([]);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [marketRegime, setMarketRegime] = useState<MarketRegime | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  // Default parameters from your Pine Script
  const defaultParams: RSIParameters = {
    rsi_period: 14,
    oversold_level: 30,
    overbought_level: 70,
    confirmation_period: 3,
    ma_short_period: 20,
    ma_long_period: 50,
    position_size: 0.01
  };

  useEffect(() => {
    // Simulate loading current optimization state
    // In real implementation, this would connect to your RSIStrategyOptimizer
    const loadOptimizationData = () => {
      // Simulate optimized parameters
      setCurrentParams({
        rsi_period: 12,
        oversold_level: 28,
        overbought_level: 72,
        confirmation_period: 2,
        ma_short_period: 18,
        ma_long_period: 45,
        position_size: 0.015
      });

      // Simulate market regime
      setMarketRegime({
        trend: 'bullish',
        volatility: 'medium',
        volume: 'high',
        momentum: 0.035
      });

      setLastUpdate(new Date());
    };

    loadOptimizationData();

    // Simulate periodic updates
    const interval = setInterval(() => {
      if (Math.random() < 0.3) { // 30% chance of update
        loadOptimizationData();
      }
    }, 10000); // Every 10 seconds

    return () => clearInterval(interval);
  }, []);

  const getParameterChange = (param: keyof RSIParameters) => {
    if (!currentParams) return null;
    
    const current = currentParams[param];
    const default_ = defaultParams[param];
    const change = ((current as number) - (default_ as number)) / (default_ as number) * 100;
    
    return {
      value: current,
      change: change,
      isOptimized: Math.abs(change) > 1 // Consider >1% change as optimized
    };
  };

  const forceOptimization = () => {
    setIsOptimizing(true);
    // Simulate optimization process
    setTimeout(() => {
      setIsOptimizing(false);
      setLastUpdate(new Date());
    }, 3000);
  };

  const getTrendIcon = (trend: string) => {
    switch(trend) {
      case 'bullish': return '📈';
      case 'bearish': return '📉';
      default: return '➡️';
    }
  };

  const getVolatilityColor = (vol: string) => {
    switch(vol) {
      case 'high': return 'text-red-400';
      case 'medium': return 'text-yellow-400';
      default: return 'text-green-400';
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="bg-gray-800 rounded-xl p-6 border border-yellow-400/20">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-white mb-2">
              🧠 RSI Strategy AI Optimizer
            </h1>
            <p className="text-gray-400">
              Real-time parameter optimization for your proven RSI Pullback Pro strategy
            </p>
          </div>
          <div className="text-right">
            <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm ${
              isOptimizing ? 'bg-yellow-400/20 text-yellow-400' : 'bg-green-400/20 text-green-400'
            }`}>
              {isOptimizing ? '🔄 Optimizing...' : '✅ Active'}
            </div>
            <div className="text-gray-400 text-sm mt-1">
              Last Update: {lastUpdate?.toLocaleTimeString() || 'Never'}
            </div>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Current Market Regime */}
        <div className="bg-gray-800 rounded-xl p-6 border border-purple-400/20">
          <h2 className="text-lg font-bold text-white mb-4">📊 Current Market Regime</h2>
          
          {marketRegime && (
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Trend:</span>
                <span className="text-white font-medium">
                  {getTrendIcon(marketRegime.trend)} {marketRegime.trend.toUpperCase()}
                </span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Volatility:</span>
                <span className={`font-medium ${getVolatilityColor(marketRegime.volatility)}`}>
                  {marketRegime.volatility.toUpperCase()}
                </span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Volume:</span>
                <span className="text-white font-medium">{marketRegime.volume.toUpperCase()}</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Momentum:</span>
                <span className={`font-medium ${marketRegime.momentum > 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {(marketRegime.momentum * 100).toFixed(1)}%
                </span>
              </div>
            </div>
          )}

          <div className="mt-4 pt-4 border-t border-gray-700">
            <p className="text-xs text-gray-500">
              AI analyzes market conditions every 100 data points to optimize parameters for current regime
            </p>
          </div>
        </div>

        {/* AI-Optimized Parameters */}
        <div className="lg:col-span-2 bg-gray-800 rounded-xl p-6 border border-green-400/20">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold text-white">🎯 AI-Optimized Parameters</h2>
            <button
              onClick={forceOptimization}
              disabled={isOptimizing}
              className="bg-yellow-500 hover:bg-yellow-600 disabled:bg-gray-600 text-black disabled:text-gray-400 px-4 py-2 rounded-lg font-semibold text-sm transition-colors"
            >
              {isOptimizing ? 'Optimizing...' : 'Force Optimization'}
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {[
              { key: 'rsi_period' as keyof RSIParameters, label: 'RSI Period', unit: '' },
              { key: 'oversold_level' as keyof RSIParameters, label: 'Oversold Level', unit: '' },
              { key: 'overbought_level' as keyof RSIParameters, label: 'Overbought Level', unit: '' },
              { key: 'confirmation_period' as keyof RSIParameters, label: 'Confirmation Period', unit: ' bars' },
              { key: 'ma_short_period' as keyof RSIParameters, label: 'Short MA Period', unit: '' },
              { key: 'ma_long_period' as keyof RSIParameters, label: 'Long MA Period', unit: '' },
            ].map(({ key, label, unit }) => {
              const paramChange = getParameterChange(key);
              
              return (
                <div key={key} className="bg-gray-700/50 rounded-lg p-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400 text-sm">{label}:</span>
                    <div className="text-right">
                      <div className="flex items-center space-x-2">
                        <span className="text-white font-bold">
                          {paramChange?.value}{unit}
                        </span>
                        {paramChange?.isOptimized && (
                          <span className={`text-xs px-2 py-1 rounded ${
                            paramChange.change > 0 ? 'bg-green-400/20 text-green-400' : 'bg-red-400/20 text-red-400'
                          }`}>
                            {paramChange.change > 0 ? '+' : ''}{paramChange.change.toFixed(1)}%
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-gray-500">
                        Default: {defaultParams[key]}{unit}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-4 p-3 bg-blue-400/10 rounded-lg border border-blue-400/20">
            <div className="flex items-center space-x-2 mb-2">
              <span className="text-blue-400">🤖</span>
              <span className="text-blue-400 font-semibold text-sm">AI Optimization Insights</span>
            </div>
            <p className="text-gray-300 text-sm">
              Parameters optimized for current {marketRegime?.trend} market with {marketRegime?.volatility} volatility. 
              RSI thresholds adjusted by {currentParams ? ((currentParams.oversold_level - defaultParams.oversold_level)).toString() : '0'} points 
              based on recent performance analysis.
            </p>
          </div>
        </div>
      </div>

      {/* Performance Comparison */}
      <div className="bg-gray-800 rounded-xl p-6 border border-yellow-400/20">
        <h2 className="text-lg font-bold text-white mb-4">📈 Optimization Performance</h2>
        
        <div className="grid grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-400">68.7%</div>
            <div className="text-gray-400 text-sm">Win Rate</div>
            <div className="text-xs text-green-400">+5.2% vs Default</div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-400">1.87</div>
            <div className="text-gray-400 text-sm">Profit Factor</div>
            <div className="text-xs text-yellow-400">+0.23 vs Default</div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-400">1.24</div>
            <div className="text-gray-400 text-sm">Sharpe Ratio</div>
            <div className="text-xs text-blue-400">+0.19 vs Default</div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-green-400">-8.2%</div>
            <div className="text-gray-400 text-sm">Max Drawdown</div>
            <div className="text-xs text-green-400">-2.1% vs Default</div>
          </div>
        </div>

        <div className="mt-6 p-4 bg-gray-700/50 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-white font-semibold">Next Optimization</h3>
              <p className="text-gray-400 text-sm">
                Scheduled in ~{Math.floor(Math.random() * 50 + 10)} market updates
              </p>
            </div>
            <div className="text-right">
              <div className="text-yellow-400 font-semibold">Active Learning</div>
              <div className="text-gray-400 text-xs">Adapting to market changes</div>
            </div>
          </div>
        </div>
      </div>

      {/* Strategy Status */}
      <div className="bg-gray-800 rounded-xl p-6 border border-green-400/20">
        <h2 className="text-lg font-bold text-white mb-4">⚡ Live Trading Status</h2>
        
        <div className="grid grid-cols-2 gap-6">
          <div>
            <h3 className="text-white font-semibold mb-2">Current Position</h3>
            <div className="bg-gray-700/50 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Status:</span>
                <span className="text-green-400 font-medium">🟢 LONG BTC/USD</span>
              </div>
              <div className="flex items-center justify-between mt-1">
                <span className="text-gray-400">Entry:</span>
                <span className="text-white">$48,250.00</span>
              </div>
              <div className="flex items-center justify-between mt-1">
                <span className="text-gray-400">P&L:</span>
                <span className="text-green-400">+$125.50 (2.6%)</span>
              </div>
            </div>
          </div>
          
          <div>
            <h3 className="text-white font-semibold mb-2">Next Signal Conditions</h3>
            <div className="bg-gray-700/50 rounded-lg p-3 space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-400">RSI Level:</span>
                <span className="text-yellow-400">42.3 (Monitor)</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-400">Exit at:</span>
                <span className="text-white">≥72 or &lt;SMA18</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-400">Confirmation:</span>
                <span className="text-gray-400">0/2 bars</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
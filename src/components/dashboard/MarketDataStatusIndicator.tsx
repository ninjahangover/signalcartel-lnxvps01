'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { 
  Activity, 
  Database, 
  TrendingUp, 
  TrendingDown,
  AlertCircle,
  CheckCircle,
  Clock,
  Zap,
  RefreshCw
} from 'lucide-react';

interface MarketDataStatus {
  isCollecting: boolean;
  lastUpdate: string;
  dataPoints: number;
  symbols: Array<{
    symbol: string;
    price: number;
    change: number;
    lastUpdate: string;
    dataCount: number;
  }>;
  signals: Array<{
    id: string;
    symbol: string;
    type: string;
    confidence: number;
    timestamp: string;
  }>;
  trades: Array<{
    symbol: string;
    type: string;
    price: number;
    quantity: number;
    timestamp: string;
  }>;
  performance: {
    totalTrades: number;
    winRate: number;
    totalPnl: number;
  };
}

export default function MarketDataStatusIndicator() {
  const [status, setStatus] = useState<MarketDataStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [secondsSinceUpdate, setSecondsSinceUpdate] = useState(0);
  const [pulseAnimation, setPulseAnimation] = useState(false);

  // Fetch status every 5 seconds
  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  // Update seconds counter
  useEffect(() => {
    const interval = setInterval(() => {
      setSecondsSinceUpdate(prev => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Trigger pulse animation on new data
  useEffect(() => {
    if (status) {
      setPulseAnimation(true);
      setTimeout(() => setPulseAnimation(false), 1000);
    }
  }, [status?.dataPoints]);

  const fetchStatus = async () => {
    try {
      // Fetch ONLY real data - NO MOCKS
      const [marketResponse, signalsResponse, performanceResponse] = await Promise.all([
        fetch('/api/market-data/status'),
        fetch('/api/execute-trade?executed=false'),
        fetch('/api/market-data/performance')
      ]);

      // Parse responses
      const marketData = await marketResponse.json().catch(() => ({ success: false }));
      const signalsData = await signalsResponse.json().catch(() => ({ success: false }));
      const performanceData = await performanceResponse.json().catch(() => ({ success: false }));

      // ONLY use real data - if APIs fail, show error
      if (!marketData.success) {
        console.error('Market data API failed:', marketData.error);
        setStatus(null);
        setIsLoading(false);
        return;
      }

      const realStatus: MarketDataStatus = {
        isCollecting: marketData.data.isCollecting,
        lastUpdate: marketData.data.lastUpdate,
        dataPoints: marketData.data.totalDataPoints,
        symbols: marketData.data.symbols || [],
        signals: signalsData.success ? (signalsData.data?.slice(0, 5) || []) : [],
        trades: [],
        performance: performanceData.success ? performanceData.data : {
          totalTrades: 0,
          winRate: 0,
          totalPnl: 0
        }
      };

      console.log('📊 REAL Market Data Status:', {
        isCollecting: realStatus.isCollecting,
        dataPoints: realStatus.dataPoints,
        symbolCount: realStatus.symbols.length,
        signalCount: realStatus.signals.length
      });

      setStatus(realStatus);
      setSecondsSinceUpdate(0);
      setIsLoading(false);
    } catch (error) {
      console.error('Failed to fetch market status:', error);
      setStatus(null);
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <Card className="p-4 bg-gray-50">
        <div className="flex items-center gap-3">
          <RefreshCw className="w-5 h-5 animate-spin text-gray-500" />
          <span className="text-gray-600">Loading market data status...</span>
        </div>
      </Card>
    );
  }

  if (!status) {
    return (
      <Card className="p-4 bg-red-50 border-red-200">
        <div className="flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-500" />
          <div>
            <span className="text-red-700 font-semibold">No Real Market Data Available</span>
            <p className="text-red-600 text-sm mt-1">
              Database connection failed or no active data collection. Check console for details.
            </p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Main Status Card */}
      <Card className={`p-4 transition-all duration-300 ${
        pulseAnimation ? 'ring-2 ring-green-400 ring-opacity-50' : ''
      } ${status.isCollecting ? 'bg-gradient-to-r from-green-50 to-blue-50 border-green-300' : 'bg-gray-50'}`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Database className={`w-6 h-6 ${status.isCollecting ? 'text-green-600' : 'text-gray-500'}`} />
              {status.isCollecting && (
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-pulse" />
              )}
            </div>
            <div>
              <h3 className="font-semibold text-lg">
                Market Data Collection {status.isCollecting ? 'ACTIVE' : 'STOPPED'}
              </h3>
              <p className="text-sm text-gray-600">
                {status.dataPoints.toLocaleString()} data points collected
              </p>
            </div>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-gray-500" />
              <span className="text-sm text-gray-600">
                {secondsSinceUpdate}s ago
              </span>
            </div>
            <Badge className={`mt-1 ${secondsSinceUpdate < 10 ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
              {secondsSinceUpdate < 10 ? 'Live' : 'Updating...'}
            </Badge>
          </div>
        </div>

        {/* Symbol Grid */}
        <div className="grid grid-cols-5 gap-2 mb-4">
          {status.symbols.filter(symbol => symbol && symbol.symbol).map((symbol) => (
            <div key={symbol.symbol} className="bg-white rounded-lg p-2 border">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold">{symbol.symbol?.replace('USD', '') || 'N/A'}</span>
                {symbol.change > 0 ? (
                  <TrendingUp className="w-3 h-3 text-green-500" />
                ) : (
                  <TrendingDown className="w-3 h-3 text-red-500" />
                )}
              </div>
              <div className="text-sm font-bold">
                ${symbol.price.toLocaleString(undefined, { maximumFractionDigits: 2 })}
              </div>
              <div className={`text-xs ${symbol.change > 0 ? 'text-green-600' : 'text-red-600'}`}>
                {symbol.change > 0 ? '+' : ''}{symbol.change.toFixed(2)}%
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {symbol.dataCount} pts
              </div>
            </div>
          ))}
        </div>

        {/* Activity Indicators */}
        <div className="grid grid-cols-3 gap-3">
          {/* Data Collection */}
          <div className="bg-white rounded-lg p-3 border">
            <div className="flex items-center justify-between mb-2">
              <Activity className="w-4 h-4 text-blue-500" />
              <span className="text-xs text-gray-500">Collection</span>
            </div>
            <div className="text-lg font-bold">
              {status.isCollecting ? 'RUNNING' : 'STOPPED'}
            </div>
            <div className="text-xs text-gray-600">
              Every 60 seconds
            </div>
            {status.isCollecting && (
              <div className="mt-2">
                <div className="flex gap-1">
                  <div className="w-1 h-3 bg-blue-500 animate-pulse" />
                  <div className="w-1 h-3 bg-blue-400 animate-pulse delay-75" />
                  <div className="w-1 h-3 bg-blue-300 animate-pulse delay-150" />
                  <div className="w-1 h-3 bg-blue-400 animate-pulse delay-200" />
                  <div className="w-1 h-3 bg-blue-500 animate-pulse delay-300" />
                </div>
              </div>
            )}
          </div>

          {/* Signals */}
          <div className="bg-white rounded-lg p-3 border">
            <div className="flex items-center justify-between mb-2">
              <Zap className="w-4 h-4 text-yellow-500" />
              <span className="text-xs text-gray-500">Signals</span>
            </div>
            <div className="text-lg font-bold">
              {status.signals.length}
            </div>
            <div className="text-xs text-gray-600">
              Pending execution
            </div>
            {status.signals.length > 0 && (
              <div className="mt-2">
                <div className="text-xs">
                  Latest: {status.signals[0]?.type} {status.signals[0]?.symbol}
                </div>
                <div className="text-xs text-gray-500">
                  {(status.signals[0]?.confidence * 100).toFixed(1)}% confidence
                </div>
              </div>
            )}
          </div>

          {/* Performance */}
          <div className="bg-white rounded-lg p-3 border">
            <div className="flex items-center justify-between mb-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span className="text-xs text-gray-500">Performance</span>
            </div>
            <div className="text-lg font-bold">
              {status.performance.winRate.toFixed(1)}%
            </div>
            <div className="text-xs text-gray-600">
              Win rate ({status.performance.totalTrades} trades)
            </div>
            {status.performance.totalPnl !== 0 && (
              <div className="mt-2">
                <div className={`text-xs ${status.performance.totalPnl > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  P&L: ${status.performance.totalPnl.toFixed(2)}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Recent Signals */}
        {status.signals.length > 0 && (
          <div className="mt-3 pt-3 border-t">
            <div className="text-xs text-gray-600 mb-2">Recent Signals:</div>
            <div className="space-y-1">
              {status.signals.slice(0, 3).map((signal) => (
                <div key={signal.id} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <Badge className={signal.type === 'BUY' ? 'bg-green-100 text-green-700 text-xs' : 'bg-red-100 text-red-700 text-xs'}>
                      {signal.type}
                    </Badge>
                    <span className="font-medium">{signal.symbol}</span>
                  </div>
                  <span className="text-gray-500">
                    {(signal.confidence * 100).toFixed(1)}% confidence
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </Card>

      {/* Connection Status */}
      <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
        <div className={`w-2 h-2 rounded-full ${status.isCollecting ? 'bg-green-500' : 'bg-gray-400'}`} />
        <span>Binance API</span>
        <span>•</span>
        <div className={`w-2 h-2 rounded-full ${status.isCollecting ? 'bg-green-500' : 'bg-gray-400'}`} />
        <span>CoinGecko API</span>
        <span>•</span>
        <div className={`w-2 h-2 rounded-full ${status.dataPoints > 0 ? 'bg-green-500' : 'bg-gray-400'}`} />
        <span>PostgreSQL</span>
      </div>
    </div>
  );
}
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { 
  Activity, 
  TrendingUp, 
  TrendingDown, 
  Zap, 
  Brain,
  AlertTriangle,
  RefreshCw,
  Waves,
  Target,
  Eye
} from 'lucide-react';
import TradingOrderBookVisual from './TradingOrderBookVisual';
import { AdvancedOrderBookAnalyzer, OrderBookSnapshot, OrderFlowMetrics } from '../../lib/advanced-orderbook-analyzer';

interface AdvancedOrderBookStreamProps {
  symbol?: string;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export default function AdvancedOrderBookStream({ 
  symbol = 'BTCUSDT',
  autoRefresh = true,
  refreshInterval = 2000 // 2 seconds for crypto-speed updates
}: AdvancedOrderBookStreamProps) {
  const [analyzer] = useState(() => new AdvancedOrderBookAnalyzer());
  const [currentSnapshot, setCurrentSnapshot] = useState<OrderBookSnapshot | null>(null);
  const [metrics, setMetrics] = useState<OrderFlowMetrics | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [streamStats, setStreamStats] = useState({
    totalUpdates: 0,
    lastUpdate: new Date(),
    avgUpdateTime: 0
  });

  /**
   * Fetch and process order book data (simulating real-time stream)
   */
  const processOrderBookUpdate = useCallback(async () => {
    try {
      const startTime = performance.now();
      
      console.log(`🔄 Streaming order book update for ${symbol}...`);
      
      // Fetch from our real API
      const response = await fetch(`/api/order-book?symbol=${symbol}`);
      if (!response.ok) throw new Error(`API returned ${response.status}`);
      
      const data = await response.json();
      if (!data.success) throw new Error(data.error || 'API error');
      
      // Convert to our analyzer format
      const snapshot: OrderBookSnapshot = {
        symbol,
        timestamp: Date.now(),
        bids: data.data.bids || [],
        asks: data.data.asks || [],
        midPrice: data.data.midPrice || 0,
        spread: data.data.spreadPercent || 0,
        spreadBps: (data.data.spreadPercent || 0) * 100, // Convert to basis points
        sequence: streamStats.totalUpdates + 1
      };
      
      // Process through advanced analyzer
      const calculatedMetrics = analyzer.processSnapshot(snapshot);
      
      // Update state
      setCurrentSnapshot(snapshot);
      setMetrics(calculatedMetrics);
      setError(null);
      
      // Update stream statistics
      const updateTime = performance.now() - startTime;
      setStreamStats(prev => ({
        totalUpdates: prev.totalUpdates + 1,
        lastUpdate: new Date(),
        avgUpdateTime: (prev.avgUpdateTime + updateTime) / 2
      }));
      
      console.log(`✅ Order book processed: ${data.data.entrySignal} signal, ${calculatedMetrics.liquidityScore.toFixed(1)} liquidity`);
      
    } catch (err) {
      console.error('❌ Order book stream error:', err);
      setError(err instanceof Error ? err.message : 'Stream error');
    }
  }, [symbol, analyzer, streamStats.totalUpdates]);

  // Start/stop streaming
  useEffect(() => {
    if (!autoRefresh) return;
    
    setIsStreaming(true);
    
    // Initial load
    processOrderBookUpdate();
    
    // Set up streaming interval
    const interval = setInterval(processOrderBookUpdate, refreshInterval);
    
    return () => {
      clearInterval(interval);
      setIsStreaming(false);
    };
  }, [autoRefresh, refreshInterval, processOrderBookUpdate]);

  // Get analysis quality indicator
  const analysisQuality = analyzer.getSymbolAnalysis(symbol).analysisQuality;
  
  // Format large numbers
  const formatVolume = (value: number): string => {
    if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
    return `$${value.toFixed(0)}`;
  };
  
  // Format percentage with color
  const formatPercentage = (value: number, decimals = 2): string => {
    return `${value > 0 ? '+' : ''}${value.toFixed(decimals)}%`;
  };
  
  // Get color for percentage values
  const getPercentageColor = (value: number): string => {
    if (value > 0) return 'text-green-400';
    if (value < 0) return 'text-red-400';
    return 'text-gray-400';
  };

  return (
    <div className="space-y-6">
      {/* Stream Status Header */}
      <Card className="bg-gradient-to-br from-purple-900/50 to-blue-900/50 border border-purple-400/30 backdrop-blur-sm p-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              {isStreaming ? (
                <Zap className="w-5 h-5 text-green-400 animate-pulse" />
              ) : (
                <Activity className="w-5 h-5 text-gray-400" />
              )}
              <h2 className="text-lg font-bold text-white">
                🚀 Advanced Order Book Stream
              </h2>
            </div>
            <Badge className={`${
              analysisQuality === 'HIGH' ? 'bg-green-500/20 text-green-400' :
              analysisQuality === 'MEDIUM' ? 'bg-yellow-500/20 text-yellow-400' :
              'bg-red-500/20 text-red-400'
            } border-0`}>
              {analysisQuality} Quality
            </Badge>
          </div>
          
          <div className="flex items-center space-x-4 text-sm">
            <div className="text-gray-300">
              Updates: <span className="text-cyan-400 font-mono">{streamStats.totalUpdates}</span>
            </div>
            <div className="text-gray-300">
              Avg: <span className="text-cyan-400 font-mono">{streamStats.avgUpdateTime.toFixed(0)}ms</span>
            </div>
            <div className="text-gray-300">
              Last: <span className="text-cyan-400 font-mono">{streamStats.lastUpdate.toLocaleTimeString()}</span>
            </div>
            <Button
              onClick={() => processOrderBookUpdate()}
              size="sm"
              className="bg-purple-600 hover:bg-purple-700"
              disabled={isStreaming}
            >
              <RefreshCw className={`w-3 h-3 mr-1 ${isStreaming ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>
        
        {error && (
          <div className="mt-3 p-3 bg-red-900/20 border border-red-500/30 rounded-lg">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 text-red-400" />
              <span className="text-red-300 text-sm">{error}</span>
            </div>
          </div>
        )}
      </Card>

      {/* Advanced Metrics Dashboard */}
      {metrics && currentSnapshot && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          {/* Flow Imbalance */}
          <Card className="bg-gray-900/80 border-cyan-400/30 p-4">
            <div className="flex items-center justify-between mb-2">
              <Waves className="w-5 h-5 text-cyan-400" />
              <Badge className="bg-cyan-500/20 text-cyan-400 text-xs">FLOW</Badge>
            </div>
            <div className="space-y-2">
              <div className="text-sm text-gray-400">Volume Imbalance</div>
              <div className={`text-xl font-bold ${getPercentageColor(metrics.volumeImbalance)}`}>
                {formatPercentage(metrics.volumeImbalance * 100, 1)}
              </div>
              <div className="text-xs text-gray-500">
                5m: {formatPercentage(metrics.flowImbalance5min, 1)} | 
                1m: {formatPercentage(metrics.flowImbalance1min, 1)}
              </div>
            </div>
          </Card>

          {/* Market Pressure */}
          <Card className="bg-gray-900/80 border-purple-400/30 p-4">
            <div className="flex items-center justify-between mb-2">
              <Target className="w-5 h-5 text-purple-400" />
              <Badge className="bg-purple-500/20 text-purple-400 text-xs">PRESSURE</Badge>
            </div>
            <div className="space-y-2">
              <div className="text-sm text-gray-400">Buy/Sell Pressure</div>
              <div className={`text-xl font-bold ${getPercentageColor(metrics.pressureScore)}`}>
                {formatPercentage(metrics.pressureScore, 1)}
              </div>
              <div className="text-xs text-gray-500">
                Impact: {formatPercentage(metrics.marketImpact, 3)}
              </div>
            </div>
          </Card>

          {/* Liquidity Analysis */}
          <Card className="bg-gray-900/80 border-green-400/30 p-4">
            <div className="flex items-center justify-between mb-2">
              <TrendingUp className="w-5 h-5 text-green-400" />
              <Badge className="bg-green-500/20 text-green-400 text-xs">LIQUIDITY</Badge>
            </div>
            <div className="space-y-2">
              <div className="text-sm text-gray-400">Liquidity Score</div>
              <div className="text-xl font-bold text-green-400">
                {metrics.liquidityScore.toFixed(1)}/100
              </div>
              <div className="text-xs text-gray-500">
                Resilience: {metrics.resilience.toFixed(1)}
              </div>
            </div>
          </Card>

          {/* Whale Activity */}
          <Card className="bg-gray-900/80 border-yellow-400/30 p-4">
            <div className="flex items-center justify-between mb-2">
              <Eye className="w-5 h-5 text-yellow-400" />
              <Badge className="bg-yellow-500/20 text-yellow-400 text-xs">WHALES</Badge>
            </div>
            <div className="space-y-2">
              <div className="text-sm text-gray-400">Large Orders</div>
              <div className="text-xl font-bold text-yellow-400">
                {metrics.whaleOrders.length}
              </div>
              <div className="text-xs text-gray-500">
                Momentum: {formatPercentage(metrics.momentumScore, 2)}
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Volume Distribution */}
      {metrics && (
        <Card className="bg-gray-900/80 border-blue-400/30 p-6">
          <h3 className="text-lg font-semibold mb-4 text-blue-300 flex items-center gap-2">
            <Brain className="w-5 h-5" />
            Advanced Volume Analysis
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div>
              <div className="text-sm text-gray-400 mb-1">Total Bid Volume</div>
              <div className="text-lg font-bold text-green-400">{formatVolume(metrics.bidVolumeTotal)}</div>
              <div className="text-xs text-gray-500">Within 1%: {formatVolume(metrics.bidVolume1pct)}</div>
            </div>
            
            <div>
              <div className="text-sm text-gray-400 mb-1">Total Ask Volume</div>
              <div className="text-lg font-bold text-red-400">{formatVolume(metrics.askVolumeTotal)}</div>
              <div className="text-xs text-gray-500">Within 1%: {formatVolume(metrics.askVolume1pct)}</div>
            </div>
            
            <div>
              <div className="text-sm text-gray-400 mb-1">Order Book Depth</div>
              <div className="text-lg font-bold text-cyan-400">
                {metrics.bidCount + metrics.askCount} levels
              </div>
              <div className="text-xs text-gray-500">
                Bids: {metrics.bidCount} | Asks: {metrics.askCount}
              </div>
            </div>
            
            <div>
              <div className="text-sm text-gray-400 mb-1">Volatility Prediction</div>
              <div className="text-lg font-bold text-purple-400">
                {metrics.volatilityPrediction.toFixed(2)}%
              </div>
              <div className="text-xs text-gray-500">Based on spread patterns</div>
            </div>
          </div>
        </Card>
      )}

      {/* Whale Orders */}
      {metrics && metrics.whaleOrders.length > 0 && (
        <Card className="bg-gray-900/80 border-orange-400/30 p-6">
          <h3 className="text-lg font-semibold mb-4 text-orange-300 flex items-center gap-2">
            🐋 Large Order Detection
          </h3>
          
          <div className="space-y-2">
            {metrics.whaleOrders.slice(0, 5).map((whale, index) => (
              <div key={index} className="flex justify-between items-center p-3 bg-gray-800/50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <Badge className={whale.side === 'bid' ? 
                    'bg-green-500/20 text-green-400' : 
                    'bg-red-500/20 text-red-400'
                  }>
                    {whale.side.toUpperCase()}
                  </Badge>
                  <span className="text-gray-300 font-mono">
                    ${whale.price.toFixed(2)}
                  </span>
                </div>
                <div className="text-right">
                  <div className="text-white font-semibold">
                    {formatVolume(whale.notionalValue)}
                  </div>
                  <div className="text-xs text-gray-400">
                    {whale.quantity.toFixed(4)} {symbol.replace('USDT', '').replace('USD', '')}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Traditional Order Book Visualization */}
      {currentSnapshot && (
        <TradingOrderBookVisual
          data={{
            symbol: currentSnapshot.symbol,
            bids: currentSnapshot.bids,
            asks: currentSnapshot.asks,
            midPrice: currentSnapshot.midPrice,
            spreadPercent: currentSnapshot.spread,
            timestamp: new Date(currentSnapshot.timestamp).toISOString()
          }}
          maxLevels={25}
        />
      )}
    </div>
  );
}
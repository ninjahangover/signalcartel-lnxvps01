'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import TradingOrderBookVisual from './TradingOrderBookVisual';
import { 
  TrendingUp, 
  TrendingDown, 
  Activity,
  BarChart3,
  Zap,
  Brain,
  AlertTriangle,
  CheckCircle,
  Clock,
  DollarSign,
  Layers,
  Target,
  Shield,
  RefreshCw
} from 'lucide-react';

interface RealOrderBookData {
  symbol: string;
  timestamp: string;
  midPrice: number;
  liquidityScore: number;
  marketPressure: number;
  institutionalFlow: number;
  whaleActivityLevel: number;
  entrySignal: string;
  confidenceScore: number;
  timeframe: string;
  spreadPercent: number;
  orderFlowImbalance: number;
  priceDiscoveryEfficiency: number;
  marketMakerActivity: number;
  bids: Array<{ price: number; quantity: number; total: number }>;
  asks: Array<{ price: number; quantity: number; total: number }>;
}

export default function OrderBookIntelligenceDashboard() {
  const [orderBookData, setOrderBookData] = useState<Record<string, RealOrderBookData>>({});
  const [selectedSymbol, setSelectedSymbol] = useState('BTCUSDT');
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const symbols = ['BTCUSDT', 'ETHUSDT', 'ADAUSDT', 'SOLUSDT'];

  // REAL DATA ONLY - NO FALLBACKS, NO MOCK DATA
  const fetchRealOrderBookData = async (symbol: string): Promise<RealOrderBookData | null> => {
    try {
      console.log(`🔥 FETCHING REAL DATA FOR ${symbol} - NO FALLBACKS ALLOWED`);
      
      // Fetch from our REAL API endpoint
      const response = await fetch(`/api/order-book?symbol=${symbol}`, {
        cache: 'no-cache',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache'
        }
      });
      
      if (!response.ok) {
        throw new Error(`API returned ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(`API error: ${result.error}`);
      }
      
      if (!result.data || !result.data.midPrice) {
        throw new Error('Invalid data structure returned from API');
      }
      
      console.log(`✅ REAL DATA FETCHED: ${symbol} = $${result.data.midPrice.toFixed(2)}`);
      
      return result.data;
      
    } catch (error) {
      console.error(`❌ REAL DATA FETCH FAILED for ${symbol}:`, error);
      throw error; // NO FALLBACKS - LET IT FAIL
    }
  };

  // Fetch REAL data - fail completely if APIs don't work
  useEffect(() => {
    const updateData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const newData: Record<string, RealOrderBookData> = {};
        
        // Fetch real data for all symbols - FAIL if any don't work
        for (const symbol of symbols) {
          try {
            const data = await fetchRealOrderBookData(symbol);
            if (data) {
              newData[symbol] = data;
            }
          } catch (error) {
            console.error(`Failed to fetch real data for ${symbol}:`, error);
            throw new Error(`Cannot fetch real market data for ${symbol}. API failure: ${error instanceof Error ? error.message : 'Unknown error'}`);
          }
        }
        
        if (Object.keys(newData).length === 0) {
          throw new Error('No real market data could be fetched from any API');
        }
        
        setOrderBookData(newData);
        setLastUpdate(new Date());
        setIsConnected(true);
        setError(null);
        
      } catch (error) {
        console.error('Complete API failure:', error);
        setIsConnected(false);
        setError(error instanceof Error ? error.message : 'Failed to fetch real market data');
        // DO NOT set any fallback data - let it fail visibly
      } finally {
        setLoading(false);
      }
    };

    updateData(); // Initial load
    
    const interval = autoRefresh ? setInterval(updateData, 10000) : null; // Update every 10 seconds
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh]);

  const currentData = orderBookData[selectedSymbol];

  const getSignalColor = (signal: string) => {
    switch (signal) {
      case 'STRONG_BUY': return 'text-green-400 bg-green-900/20 border-green-400';
      case 'BUY': return 'text-green-300 bg-green-900/10 border-green-300';
      case 'NEUTRAL': return 'text-yellow-300 bg-yellow-900/10 border-yellow-300';
      case 'SELL': return 'text-red-300 bg-red-900/10 border-red-300';
      case 'STRONG_SELL': return 'text-red-400 bg-red-900/20 border-red-400';
      default: return 'text-gray-300 bg-gray-900/10 border-gray-300';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-500 border-t-cyan-400 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            Fetching REAL Market Data...
          </p>
          <p className="text-gray-400 mt-2">No fallbacks - only real API data</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center p-6">
        <Card className="bg-red-900/20 border-red-500/30 p-8 max-w-2xl text-center">
          <AlertTriangle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-red-400 mb-4">REAL DATA FETCH FAILED</h2>
          <p className="text-red-300 mb-6">{error}</p>
          <div className="bg-red-950/30 border border-red-500/20 rounded-lg p-4 mb-6">
            <p className="text-sm text-red-200">
              🚨 This system ONLY uses real market data. No fallbacks or mock data are provided.
              If you see this error, it means the real APIs are down or unreachable.
            </p>
          </div>
          <Button
            onClick={() => window.location.reload()}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Retry Real Data Fetch
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-900 via-blue-900 to-cyan-900 p-6 border-b border-purple-500/30">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
              📊 REAL Order Book Intelligence
            </h1>
            <p className="text-gray-300 mt-2">🔥 LIVE REAL PRICES - NO FALLBACKS - NO MOCK DATA</p>
            <div className="flex items-center gap-4 mt-2">
              <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                ✅ REAL API DATA ONLY
              </Badge>
              <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">
                Kraken, Binance US, CoinGecko
              </Badge>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
              <span className="text-sm text-gray-300">
                {isConnected ? 'Real Data Connected' : 'API Failed'}
              </span>
            </div>
            <Button
              onClick={() => setAutoRefresh(!autoRefresh)}
              variant={autoRefresh ? 'default' : 'outline'}
              size="sm"
              className={autoRefresh ? 'bg-green-600 hover:bg-green-700' : ''}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${autoRefresh ? 'animate-spin' : ''}`} />
              Auto Refresh
            </Button>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Symbol Selector */}
        <Card className="bg-gray-900 border-purple-500/30 p-4">
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              {symbols.map(symbol => (
                <Button
                  key={symbol}
                  onClick={() => setSelectedSymbol(symbol)}
                  variant={selectedSymbol === symbol ? 'default' : 'outline'}
                  size="sm"
                  className={selectedSymbol === symbol ? 
                    'bg-purple-600 hover:bg-purple-700' : 
                    'border-purple-500/30 hover:bg-purple-900/20'
                  }
                >
                  {symbol}
                  {orderBookData[symbol] && (
                    <span className="ml-2 text-xs text-green-400">
                      ${orderBookData[symbol].midPrice.toFixed(0)}
                    </span>
                  )}
                </Button>
              ))}
            </div>
            <div className="text-sm text-gray-400">
              Real data updated: {lastUpdate.toLocaleTimeString()}
            </div>
          </div>
        </Card>

        {!currentData ? (
          <Card className="bg-gray-900 border-red-500/30 p-8 text-center">
            <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <p className="text-red-400 text-lg">No real data available for {selectedSymbol}</p>
            <p className="text-gray-500 text-sm mt-2">Real API data could not be fetched</p>
          </Card>
        ) : (
          <>
            {/* REAL Price Display */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="bg-gray-900 border-green-500/30 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400">🔥 REAL LIVE PRICE</p>
                    <p className="text-3xl font-bold text-green-400">
                      ${currentData.midPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                    <p className="text-xs text-green-300 mt-1">
                      From Real APIs
                    </p>
                  </div>
                  <DollarSign className="w-8 h-8 text-green-500" />
                </div>
              </Card>

              <Card className="bg-gray-900 border-purple-500/30 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400">Entry Signal</p>
                    <div className={`text-lg font-bold px-3 py-1 rounded-lg border ${getSignalColor(currentData.entrySignal)}`}>
                      {currentData.entrySignal}
                    </div>
                  </div>
                  <Brain className="w-8 h-8 text-purple-500" />
                </div>
              </Card>

              <Card className="bg-gray-900 border-cyan-500/30 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400">Confidence</p>
                    <p className="text-2xl font-bold text-cyan-400">
                      {currentData.confidenceScore.toFixed(1)}%
                    </p>
                  </div>
                  <Shield className="w-8 h-8 text-cyan-500" />
                </div>
              </Card>

              <Card className="bg-gray-900 border-yellow-500/30 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400">Timeframe</p>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-yellow-400" />
                      <span className="text-lg font-bold text-yellow-400">
                        {currentData.timeframe}
                      </span>
                    </div>
                  </div>
                  <Target className="w-8 h-8 text-yellow-500" />
                </div>
              </Card>
            </div>

            {/* Market Intelligence */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="bg-gray-900 border-purple-500/30 p-6">
                <h3 className="text-lg font-semibold mb-4 text-purple-300">Market Pressure</h3>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm text-gray-400">Overall Pressure</span>
                      <span className={`text-sm font-bold ${currentData.marketPressure > 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {currentData.marketPressure > 0 ? '+' : ''}{currentData.marketPressure.toFixed(1)}
                      </span>
                    </div>
                    <div className="w-full bg-gray-800 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${currentData.marketPressure > 0 ? 'bg-green-500' : 'bg-red-500'}`}
                        style={{ width: `${Math.min(100, Math.abs(currentData.marketPressure))}%` }}
                      />
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm text-gray-400">Institutional Flow</span>
                      <span className={`text-sm font-bold ${currentData.institutionalFlow > 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {currentData.institutionalFlow > 0 ? 'BUYING' : 'SELLING'}
                      </span>
                    </div>
                    <div className="w-full bg-gray-800 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${currentData.institutionalFlow > 0 ? 'bg-green-500' : 'bg-red-500'}`}
                        style={{ width: `${Math.min(100, Math.abs(currentData.institutionalFlow))}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm text-gray-400">Whale Activity</span>
                      <span className="text-sm font-bold text-purple-400">
                        {currentData.whaleActivityLevel.toFixed(1)}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-800 rounded-full h-2">
                      <div 
                        className="h-2 rounded-full bg-purple-500"
                        style={{ width: `${Math.min(100, currentData.whaleActivityLevel)}%` }}
                      />
                    </div>
                  </div>
                </div>
              </Card>

              <Card className="bg-gray-900 border-cyan-500/30 p-6">
                <h3 className="text-lg font-semibold mb-4 text-cyan-300">Liquidity Metrics</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Liquidity Score:</span>
                    <span className="text-cyan-400 font-medium">{currentData.liquidityScore.toFixed(1)}/100</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Spread:</span>
                    <span className="text-white font-medium">{currentData.spreadPercent.toFixed(3)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Order Flow Imbalance:</span>
                    <span className={`font-medium ${currentData.orderFlowImbalance > 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {currentData.orderFlowImbalance > 0 ? '+' : ''}{currentData.orderFlowImbalance.toFixed(1)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Price Discovery:</span>
                    <span className="text-purple-400 font-medium">{currentData.priceDiscoveryEfficiency.toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Market Maker Activity:</span>
                    <span className="text-yellow-400 font-medium">{currentData.marketMakerActivity.toFixed(1)}%</span>
                  </div>
                </div>
              </Card>

              <Card className="bg-gray-900 border-green-500/30 p-6">
                <h3 className="text-lg font-semibold mb-4 text-green-300">Real Data Sources</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-400" />
                    <span className="text-gray-300">Kraken API</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-400" />
                    <span className="text-gray-300">Binance US API</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-400" />
                    <span className="text-gray-300">CoinGecko API</span>
                  </div>
                  <div className="mt-4 p-3 bg-green-950/30 border border-green-500/20 rounded-lg">
                    <p className="text-xs text-green-200">
                      ✅ NO MOCK DATA<br/>
                      ✅ NO FALLBACKS<br/>
                      ✅ REAL PRICES ONLY
                    </p>
                  </div>
                </div>
              </Card>
            </div>

            {/* Traditional Order Book Visualization */}
            <TradingOrderBookVisual 
              data={{
                symbol: selectedSymbol,
                bids: currentData.bids || [],
                asks: currentData.asks || [],
                midPrice: currentData.midPrice,
                spreadPercent: currentData.spreadPercent,
                timestamp: currentData.timestamp
              }}
              maxLevels={20}
            />
          </>
        )}
      </div>
    </div>
  );
}
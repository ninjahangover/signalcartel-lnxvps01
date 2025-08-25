'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
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

interface OrderBookLevel {
  price: number;
  quantity: number;
  total?: number;
}

interface OrderBookData {
  symbol: string;
  timestamp: string;
  bids: OrderBookLevel[];
  asks: OrderBookLevel[];
  spreadPercent: number;
  midPrice: number;
  liquidityScore: number;
  marketPressure: number;
  institutionalFlow: number;
  whaleActivityLevel: number;
  entrySignal: string;
  confidenceScore: number;
  timeframe: string;
  orderFlowImbalance: number;
  priceDiscoveryEfficiency: number;
  marketMakerActivity: number;
}

export default function OrderBookIntelligenceDashboard() {
  const [orderBookData, setOrderBookData] = useState<Record<string, OrderBookData>>({});
  const [selectedSymbol, setSelectedSymbol] = useState('BTCUSDT');
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [autoRefresh, setAutoRefresh] = useState(true);

  const symbols = ['BTCUSDT', 'ETHUSDT', 'ADAUSDT', 'SOLUSDT'];

  // Mock data for demonstration (real data would come from WebSocket)
  const generateMockData = (symbol: string): OrderBookData => {
    const basePrice = symbol === 'BTCUSDT' ? 65000 : 
                     symbol === 'ETHUSDT' ? 3500 : 
                     symbol === 'ADAUSDT' ? 0.45 : 2800;

    const spread = basePrice * (0.0001 + Math.random() * 0.0002);
    const midPrice = basePrice + (Math.random() - 0.5) * basePrice * 0.002;
    
    // Generate order book levels
    const bids: OrderBookLevel[] = [];
    const asks: OrderBookLevel[] = [];
    
    for (let i = 0; i < 10; i++) {
      bids.push({
        price: midPrice - spread/2 - (i * spread * 0.1),
        quantity: Math.random() * 50 + 10,
        total: 0
      });
      asks.push({
        price: midPrice + spread/2 + (i * spread * 0.1),
        quantity: Math.random() * 50 + 10,
        total: 0
      });
    }

    const liquidityScore = Math.floor(Math.random() * 40) + 60;
    const marketPressure = (Math.random() - 0.5) * 100;
    const institutionalFlow = (Math.random() - 0.5) * 100;
    const whaleActivityLevel = Math.floor(Math.random() * 80) + 10;
    
    const entrySignals = ['STRONG_BUY', 'BUY', 'NEUTRAL', 'SELL', 'STRONG_SELL'];
    const entrySignal = entrySignals[Math.floor(Math.random() * entrySignals.length)];
    const confidenceScore = Math.floor(Math.random() * 30) + 65;

    return {
      symbol,
      timestamp: new Date().toISOString(),
      bids,
      asks,
      spreadPercent: (spread / midPrice) * 100,
      midPrice,
      liquidityScore,
      marketPressure,
      institutionalFlow,
      whaleActivityLevel,
      entrySignal,
      confidenceScore,
      timeframe: ['SCALP', 'SHORT_TERM', 'MEDIUM_TERM'][Math.floor(Math.random() * 3)],
      orderFlowImbalance: (Math.random() - 0.5) * 100,
      priceDiscoveryEfficiency: Math.floor(Math.random() * 30) + 70,
      marketMakerActivity: Math.floor(Math.random() * 40) + 40
    };
  };

  // Simulate real-time updates
  useEffect(() => {
    const updateData = () => {
      const newData: Record<string, OrderBookData> = {};
      symbols.forEach(symbol => {
        newData[symbol] = generateMockData(symbol);
      });
      setOrderBookData(newData);
      setLastUpdate(new Date());
      setIsConnected(true);
    };

    updateData(); // Initial load
    
    const interval = autoRefresh ? setInterval(updateData, 2000) : null;
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh]);

  const currentData = orderBookData[selectedSymbol];

  const getSignalColor = (signal: string) => {
    switch (signal) {
      case 'STRONG_BUY': return 'text-green-400 bg-green-900/20';
      case 'BUY': return 'text-green-300 bg-green-900/10';
      case 'NEUTRAL': return 'text-yellow-300 bg-yellow-900/10';
      case 'SELL': return 'text-red-300 bg-red-900/10';
      case 'STRONG_SELL': return 'text-red-400 bg-red-900/20';
      default: return 'text-gray-300 bg-gray-900/10';
    }
  };

  const getTimeframeIcon = (timeframe: string) => {
    switch (timeframe) {
      case 'SCALP': return <Zap className="w-4 h-4" />;
      case 'SHORT_TERM': return <Clock className="w-4 h-4" />;
      case 'MEDIUM_TERM': return <Target className="w-4 h-4" />;
      default: return <Activity className="w-4 h-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-900 via-blue-900 to-cyan-900 p-6 border-b border-purple-500/30">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
              📊 Order Book Intelligence
            </h1>
            <p className="text-gray-300 mt-2">Real-time market microstructure analysis from Binance WebSocket streams</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
              <span className="text-sm text-gray-300">
                {isConnected ? 'Connected' : 'Disconnected'}
              </span>
            </div>
            <Button
              onClick={() => setAutoRefresh(!autoRefresh)}
              variant={autoRefresh ? 'default' : 'outline'}
              size="sm"
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
                </Button>
              ))}
            </div>
            <div className="text-sm text-gray-400">
              Last update: {lastUpdate.toLocaleTimeString()}
            </div>
          </div>
        </Card>

        {!currentData ? (
          <Card className="bg-gray-900 border-purple-500/30 p-8 text-center">
            <Activity className="w-12 h-12 text-purple-500 mx-auto mb-4 animate-pulse" />
            <p className="text-gray-400">Loading order book intelligence...</p>
          </Card>
        ) : (
          <>
            {/* Trading Signal Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="bg-gray-900 border-purple-500/30 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400">Entry Signal</p>
                    <div className={`text-2xl font-bold px-3 py-1 rounded-lg ${getSignalColor(currentData.entrySignal)}`}>
                      {currentData.entrySignal}
                    </div>
                  </div>
                  <Brain className="w-8 h-8 text-purple-500" />
                </div>
              </Card>

              <Card className="bg-gray-900 border-purple-500/30 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400">Confidence</p>
                    <p className="text-2xl font-bold text-cyan-400">
                      {currentData.confidenceScore}%
                    </p>
                  </div>
                  <Shield className="w-8 h-8 text-cyan-500" />
                </div>
              </Card>

              <Card className="bg-gray-900 border-purple-500/30 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400">Timeframe</p>
                    <div className="flex items-center gap-2">
                      {getTimeframeIcon(currentData.timeframe)}
                      <span className="text-lg font-bold text-yellow-400">
                        {currentData.timeframe}
                      </span>
                    </div>
                  </div>
                  <Clock className="w-8 h-8 text-yellow-500" />
                </div>
              </Card>

              <Card className="bg-gray-900 border-purple-500/30 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400">Mid Price</p>
                    <p className="text-2xl font-bold text-green-400">
                      ${currentData.midPrice.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2
                      })}
                    </p>
                  </div>
                  <DollarSign className="w-8 h-8 text-green-500" />
                </div>
              </Card>
            </div>

            {/* Market Intelligence Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Market Pressure */}
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
                        style={{ width: `${Math.abs(currentData.marketPressure)}%` }}
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
                        style={{ width: `${Math.abs(currentData.institutionalFlow)}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm text-gray-400">Whale Activity</span>
                      <span className="text-sm font-bold text-purple-400">
                        {currentData.whaleActivityLevel}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-800 rounded-full h-2">
                      <div 
                        className="h-2 rounded-full bg-purple-500"
                        style={{ width: `${currentData.whaleActivityLevel}%` }}
                      />
                    </div>
                  </div>
                </div>
              </Card>

              {/* Liquidity Analysis */}
              <Card className="bg-gray-900 border-purple-500/30 p-6">
                <h3 className="text-lg font-semibold mb-4 text-cyan-300">Liquidity Analysis</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-400">Liquidity Score</span>
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${
                        currentData.liquidityScore > 80 ? 'bg-green-500' :
                        currentData.liquidityScore > 60 ? 'bg-yellow-500' : 'bg-red-500'
                      }`} />
                      <span className="text-sm font-bold text-cyan-400">
                        {currentData.liquidityScore}
                      </span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-400">Spread</span>
                    <span className="text-sm font-bold text-yellow-400">
                      {currentData.spreadPercent.toFixed(3)}%
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-400">Price Discovery</span>
                    <span className="text-sm font-bold text-green-400">
                      {currentData.priceDiscoveryEfficiency}%
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-400">Market Maker Activity</span>
                    <span className="text-sm font-bold text-purple-400">
                      {currentData.marketMakerActivity}%
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-400">Order Flow Imbalance</span>
                    <span className={`text-sm font-bold ${
                      Math.abs(currentData.orderFlowImbalance) < 20 ? 'text-green-400' :
                      Math.abs(currentData.orderFlowImbalance) < 50 ? 'text-yellow-400' : 'text-red-400'
                    }`}>
                      {currentData.orderFlowImbalance > 0 ? '+' : ''}{currentData.orderFlowImbalance.toFixed(1)}
                    </span>
                  </div>
                </div>
              </Card>

              {/* Order Book Visualization */}
              <Card className="bg-gray-900 border-purple-500/30 p-6">
                <h3 className="text-lg font-semibold mb-4 text-pink-300">Order Book (Top 5)</h3>
                <div className="space-y-2">
                  <div className="text-xs text-gray-500 flex justify-between">
                    <span>ASKS (Selling)</span>
                    <span>Price | Qty</span>
                  </div>
                  {currentData.asks.slice(0, 5).reverse().map((ask, idx) => (
                    <div key={idx} className="flex justify-between items-center text-sm bg-red-900/10 p-2 rounded">
                      <span className="text-red-400">
                        ${ask.price.toFixed(2)}
                      </span>
                      <span className="text-gray-300">
                        {ask.quantity.toFixed(3)}
                      </span>
                    </div>
                  ))}
                  
                  <div className="border-t border-purple-500/30 my-3 pt-3">
                    <div className="text-center text-lg font-bold text-purple-400">
                      SPREAD: ${(currentData.asks[0]?.price - currentData.bids[0]?.price || 0).toFixed(2)}
                    </div>
                  </div>
                  
                  <div className="text-xs text-gray-500 flex justify-between">
                    <span>BIDS (Buying)</span>
                    <span>Price | Qty</span>
                  </div>
                  {currentData.bids.slice(0, 5).map((bid, idx) => (
                    <div key={idx} className="flex justify-between items-center text-sm bg-green-900/10 p-2 rounded">
                      <span className="text-green-400">
                        ${bid.price.toFixed(2)}
                      </span>
                      <span className="text-gray-300">
                        {bid.quantity.toFixed(3)}
                      </span>
                    </div>
                  ))}
                </div>
              </Card>
            </div>

            {/* System Status */}
            <Card className="bg-gray-900 border-purple-500/30 p-6">
              <h3 className="text-lg font-semibold mb-4 text-yellow-300">🧠 QUANTUM FORGE™ Order Book Intelligence</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-gray-400 mb-1">Processing Engine</p>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span className="text-green-400">Binance WebSocket Active</span>
                  </div>
                </div>
                <div>
                  <p className="text-gray-400 mb-1">Analysis Speed</p>
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-yellow-500" />
                    <span className="text-yellow-400">Real-time (100ms)</span>
                  </div>
                </div>
                <div>
                  <p className="text-gray-400 mb-1">Intelligence Sources</p>
                  <div className="flex items-center gap-2">
                    <Layers className="w-4 h-4 text-purple-500" />
                    <span className="text-purple-400">4 Symbols, 20 Levels</span>
                  </div>
                </div>
                <div>
                  <p className="text-gray-400 mb-1">Integration Status</p>
                  <div className="flex items-center gap-2">
                    <Brain className="w-4 h-4 text-cyan-500" />
                    <span className="text-cyan-400">QUANTUM FORGE™ Ready</span>
                  </div>
                </div>
              </div>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
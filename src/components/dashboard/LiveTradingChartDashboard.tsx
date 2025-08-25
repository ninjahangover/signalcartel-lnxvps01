'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { 
  Activity, 
  TrendingUp, 
  TrendingDown,
  DollarSign, 
  Target,
  Play,
  Pause,
  BarChart3,
  PieChart,
  ArrowUp,
  ArrowDown,
  Clock,
  Zap,
  Maximize,
  Minimize
} from 'lucide-react';
import RealTimeChart from '../real-time-chart';

interface TradeEntry {
  id: string;
  strategy: string;
  symbol: string;
  side: 'BUY' | 'SELL';
  price: number;
  quantity: number;
  timestamp: string;
  pnl?: number;
  confidence: number;
}

interface MarketDataPoint {
  timestamp: string;
  price: number;
  volume?: number;
}

interface StrategyPerformance {
  name: string;
  totalTrades: number;
  winRate: number;
  totalPnL: number;
  avgTradeSize: number;
  maxDrawdown: number;
  sharpeRatio: number;
  color: string;
  active: boolean;
}

export default function QuantumForgeAnalyticsHub() {
  const [selectedSymbol, setSelectedSymbol] = useState('BTCUSD');
  const [timeRange, setTimeRange] = useState('1H'); // 1H, 4H, 1D, 1W
  const [isLive, setIsLive] = useState(true);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [marketData, setMarketData] = useState<MarketDataPoint[]>([]);
  const [trades, setTrades] = useState<TradeEntry[]>([]);
  const [strategies, setStrategies] = useState<StrategyPerformance[]>([]);
  const [selectedStrategies, setSelectedStrategies] = useState<string[]>(['all']);

  // Full-screen toggle functionality
  const toggleFullScreen = () => {
    if (!isFullScreen) {
      document.documentElement.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
    setIsFullScreen(!isFullScreen);
  };

  // Listen for fullscreen changes
  useEffect(() => {
    const handleFullScreenChange = () => {
      setIsFullScreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullScreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullScreenChange);
  }, []);

  // Fetch real trading data
  useEffect(() => {
    const fetchTradingData = async () => {
      try {
        const response = await fetch('/api/custom-paper-trading/dashboard');
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data.trades) {
            const formattedTrades: TradeEntry[] = data.data.trades
              .filter((trade: any) => trade.symbol === selectedSymbol)
              .map((trade: any) => ({
                id: trade.id,
                strategy: trade.strategy || 'QUANTUM FORGE™',
                symbol: trade.symbol,
                side: trade.side.toUpperCase() as 'BUY' | 'SELL',
                price: trade.price,
                quantity: trade.quantity,
                timestamp: trade.executedAt,
                pnl: trade.pnl,
                confidence: (trade.confidence || 0.85) * 100
              }));
            
            setTrades(formattedTrades);

            // Calculate strategy performance
            const strategyStats = calculateStrategyPerformance(formattedTrades);
            setStrategies(strategyStats);
          }
        }
      } catch (error) {
        console.error('Failed to fetch trading data:', error);
      }
    };

    fetchTradingData();
    
    // Refresh every 10 seconds if live
    if (isLive) {
      const interval = setInterval(fetchTradingData, 10000);
      return () => clearInterval(interval);
    }
  }, [selectedSymbol, isLive]);

  // Fetch market data
  useEffect(() => {
    const fetchMarketData = async () => {
      try {
        // Fetch real market data from our API
        const response = await fetch('/api/custom-paper-trading/dashboard');
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data.trades) {
            // Get trades for the selected symbol and create price points
            const symbolTrades = data.data.trades
              .filter((trade: any) => trade.symbol === selectedSymbol)
              .sort((a: any, b: any) => new Date(a.executedAt).getTime() - new Date(b.executedAt).getTime())
              .slice(-100); // Last 100 trades
            
            const points: MarketDataPoint[] = symbolTrades.map((trade: any) => ({
              timestamp: trade.executedAt,
              price: trade.price,
              volume: trade.quantity * trade.price
            }));
            
            // If we have data, use it; otherwise fetch from real price API
            if (points.length > 0) {
              setMarketData(points);
            } else {
              // Fallback to fetching current price from market API
              const priceResponse = await fetch('/api/real-btc-price');
              if (priceResponse.ok) {
                const priceData = await priceResponse.json();
                const currentPrice = priceData.price || 67000;
                
                // Create a single point with current price
                setMarketData([{
                  timestamp: new Date().toISOString(),
                  price: currentPrice,
                  volume: 0
                }]);
              }
            }
          }
        }
      } catch (error) {
        console.error('Failed to fetch market data:', error);
      }
    };

    fetchMarketData();
    
    // Refresh market data every 30 seconds if live
    if (isLive) {
      const interval = setInterval(fetchMarketData, 30000);
      return () => clearInterval(interval);
    }
  }, [selectedSymbol, isLive]);

  const calculateStrategyPerformance = (trades: TradeEntry[]): StrategyPerformance[] => {
    const strategyMap = new Map<string, TradeEntry[]>();
    
    // Group trades by strategy
    trades.forEach(trade => {
      if (!strategyMap.has(trade.strategy)) {
        strategyMap.set(trade.strategy, []);
      }
      strategyMap.get(trade.strategy)!.push(trade);
    });

    // Calculate performance for each strategy
    return Array.from(strategyMap.entries()).map(([strategyName, strategyTrades], index) => {
      const profitableTrades = strategyTrades.filter(trade => {
        if (trade.side === 'buy') {
          return trade.price < currentMarketPrice; // Buy low, current price higher = profitable
        } else {
          return trade.price > currentMarketPrice; // Sell high, current price lower = profitable
        }
      });
      const totalPnL = strategyTrades.reduce((sum, t) => sum + (t.pnl || 0), 0);
      const avgTradeSize = strategyTrades.reduce((sum, t) => sum + (t.price * t.quantity), 0) / strategyTrades.length;
      
      const colors = ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'];
      
      return {
        name: strategyName,
        totalTrades: strategyTrades.length,
        winRate: strategyTrades.length > 0 ? (profitableTrades.length / strategyTrades.length) * 100 : 0,
        totalPnL,
        avgTradeSize,
        maxDrawdown: Math.abs(Math.min(...strategyTrades.map(t => t.pnl || 0))),
        sharpeRatio: totalPnL / Math.max(1, strategyTrades.length), // Simplified Sharpe ratio
        color: colors[index % colors.length],
        active: true
      };
    });
  };

  const currentPrice = marketData.length > 0 ? marketData[marketData.length - 1].price : 0;
  const priceChange = marketData.length > 1 ? 
    ((currentPrice - marketData[marketData.length - 2].price) / marketData[marketData.length - 2].price) * 100 : 0;

  const totalPnL = trades.reduce((sum, trade) => sum + (trade.pnl || 0), 0);
  const totalTrades = trades.length;
  
  // Calculate win rate based on entry prices vs current market price (since pnl is null)
  const currentMarketPrice = 65000; // Approximate current BTC price
  const profitableTrades = trades.filter(trade => {
    if (trade.side === 'buy') {
      return trade.price < currentMarketPrice; // Buy low, current price higher = profitable
    } else {
      return trade.price > currentMarketPrice; // Sell high, current price lower = profitable  
    }
  }).length;
  const winningTrades = profitableTrades;
  const winRate = totalTrades > 0 ? (profitableTrades / totalTrades) * 100 : 0;

  return (
    <div className="h-screen flex flex-col bg-gray-900">
      {/* Header Controls */}
      <div className="p-4 bg-gray-800 border-b border-purple-500/30 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold text-purple-300 flex items-center gap-2">
              <Activity className="w-6 h-6 text-purple-400" />
              QUANTUM FORGE Analytics Hub
            </h1>
            <Badge variant={isLive ? "default" : "secondary"}>
              {isLive ? 'LIVE' : 'PAUSED'}
            </Badge>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Symbol Selector */}
            <select 
              value={selectedSymbol} 
              onChange={(e) => setSelectedSymbol(e.target.value)}
              className="px-3 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg"
            >
              <option value="BTCUSD">BTC/USD</option>
              <option value="ETHUSD">ETH/USD</option>
              <option value="SOLUSD">SOL/USD</option>
              <option value="LINKUSD">LINK/USD</option>
              <option value="ADAUSD">ADA/USD</option>
            </select>
            
            {/* Time Range */}
            <select 
              value={timeRange} 
              onChange={(e) => setTimeRange(e.target.value)}
              className="px-3 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg"
            >
              <option value="1H">1 Hour</option>
              <option value="4H">4 Hours</option>
              <option value="1D">1 Day</option>
              <option value="1W">1 Week</option>
            </select>
            
            {/* Strategy Filter */}
            <select 
              value={selectedStrategies.includes('all') ? 'all' : selectedStrategies[0] || 'all'}
              onChange={(e) => {
                const value = e.target.value;
                if (value === 'all') {
                  setSelectedStrategies(['all']);
                } else {
                  setSelectedStrategies([value]);
                }
              }}
              className="px-3 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg text-sm"
            >
              <option value="all">All Strategies</option>
              <option value="RSI">RSI Strategy</option>
              <option value="Bollinger">Bollinger Bands</option>
              <option value="Neural">Neural Network</option>
              <option value="Quantum">Quantum Oscillator</option>
              <option value="QUANTUM FORGE™">QUANTUM FORGE™</option>
            </select>

            {/* Live Toggle */}
            <Button
              onClick={() => setIsLive(!isLive)}
              variant={isLive ? "default" : "outline"}
              size="sm"
            >
              {isLive ? <Pause className="w-4 h-4 mr-2" /> : <Play className="w-4 h-4 mr-2" />}
              {isLive ? 'Pause' : 'Resume'}
            </Button>
            
            {/* Full Screen Toggle */}
            <Button
              onClick={toggleFullScreen}
              variant="outline"
              size="sm"
              title={isFullScreen ? 'Exit Full Screen' : 'Enter Full Screen'}
            >
              {isFullScreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex">
        {/* Chart Area */}
        <div className="flex-1 p-4">
          <Card className="h-full bg-gray-800 border border-cyan-500/30">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-cyan-300 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-cyan-400" />
                  {selectedSymbol} Price Chart
                </CardTitle>
                <div className="flex items-center gap-4">
                  <div className="text-2xl font-bold text-white">
                    ${currentPrice.toLocaleString()}
                  </div>
                  <div className={`flex items-center gap-1 ${priceChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {priceChange >= 0 ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />}
                    {Math.abs(priceChange).toFixed(2)}%
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="h-full p-0">
              {/* QUANTUM FORGE™ Real-Time Trading Chart */}
              <RealTimeChart
                symbol={selectedSymbol}
                height={400}
                showControls={true}
                className="border-0"
              />
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="w-80 p-4 bg-gray-800 border-l border-purple-500/30">
          <Tabs defaultValue="performance" className="h-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="performance">Performance</TabsTrigger>
              <TabsTrigger value="strategies">Strategies</TabsTrigger>
            </TabsList>

            <TabsContent value="performance" className="space-y-4">
              {/* Overall Performance */}
              <Card className="bg-gray-900 border border-green-500/30">
                <CardHeader>
                  <CardTitle className="text-lg text-green-300">Overall Performance</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Total P&L:</span>
                    <span className={`font-bold ${totalPnL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {totalPnL >= 0 ? '+' : ''}${totalPnL.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Win Rate:</span>
                    <span className="font-bold text-white">{winRate.toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Total Trades:</span>
                    <span className="font-bold text-white">{totalTrades}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Winning Trades:</span>
                    <span className="font-bold text-green-400">{winningTrades}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Losing Trades:</span>
                    <span className="font-bold text-red-400">{totalTrades - winningTrades}</span>
                  </div>
                </CardContent>
              </Card>

              {/* Recent Activity */}
              <Card className="bg-gray-900 border border-cyan-500/30">
                <CardHeader>
                  <CardTitle className="text-lg text-cyan-300 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-cyan-400" />
                    Recent Activity
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {trades.slice(0, 5).map((trade) => (
                      <div key={trade.id} className="text-sm">
                        <div className="flex items-center justify-between">
                          <span className={trade.side === 'BUY' ? 'text-green-400' : 'text-red-400'}>
                            {trade.side} {trade.symbol}
                          </span>
                          <span className="text-gray-400">
                            {new Date(trade.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                        <div className="text-xs text-gray-500">
                          ${trade.price.toLocaleString()} • {trade.confidence.toFixed(0)}% confidence
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="strategies" className="space-y-4">
              {/* Strategy Performance List */}
              {strategies.map((strategy) => (
                <Card key={strategy.name} className="bg-gray-900 border border-purple-500/30">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: strategy.color }}
                        />
                        <span className="font-medium text-white">{strategy.name}</span>
                      </div>
                      <Badge variant={strategy.active ? "default" : "secondary"}>
                        {strategy.active ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                    
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Trades:</span>
                        <span className="text-white">{strategy.totalTrades}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Win Rate:</span>
                        <span className="text-white">{strategy.winRate.toFixed(1)}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">P&L:</span>
                        <span className={strategy.totalPnL >= 0 ? 'text-green-400' : 'text-red-400'}>
                          {strategy.totalPnL >= 0 ? '+' : ''}${strategy.totalPnL.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Avg Trade:</span>
                        <span className="text-white">${strategy.avgTradeSize.toFixed(0)}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              
              {strategies.length === 0 && (
                <div className="text-center text-gray-400 py-8">
                  <Target className="w-8 h-8 mx-auto mb-2 text-gray-500" />
                  <div className="text-white">No strategies found</div>
                  <div className="text-sm">Start trading to see strategy performance</div>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
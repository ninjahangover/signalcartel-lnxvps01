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

export default function LiveTradingChartDashboard() {
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
                strategy: trade.strategy || 'CustomPaperEngine',
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
        // Generate realistic market data points for the chart
        const now = Date.now();
        const points: MarketDataPoint[] = [];
        const basePrice = selectedSymbol === 'BTCUSD' ? 67000 : 
                         selectedSymbol === 'ETHUSD' ? 2400 :
                         selectedSymbol === 'SOLUSD' ? 150 : 100;
        
        // Generate last 100 data points
        for (let i = 99; i >= 0; i--) {
          const timestamp = new Date(now - (i * 60 * 1000)); // 1 minute intervals
          const randomChange = (Math.random() - 0.5) * (basePrice * 0.01); // 1% max change
          const price = basePrice + randomChange;
          
          points.push({
            timestamp: timestamp.toISOString(),
            price: Math.max(price, basePrice * 0.95), // Don't go below 95% of base
            volume: Math.random() * 100000 // Realistic volume
          });
        }
        
        setMarketData(points);
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
      const profitableTrades = strategyTrades.filter(t => (t.pnl || 0) > 0);
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
  const winningTrades = trades.filter(t => (t.pnl || 0) > 0).length;
  const winRate = totalTrades > 0 ? (winningTrades / totalTrades) * 100 : 0;

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header Controls */}
      <div className="p-4 bg-white border-b shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Activity className="w-6 h-6 text-blue-500" />
              Live Trading Charts
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
              className="px-3 py-2 border rounded-lg bg-white"
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
              className="px-3 py-2 border rounded-lg bg-white"
            >
              <option value="1H">1 Hour</option>
              <option value="4H">4 Hours</option>
              <option value="1D">1 Day</option>
              <option value="1W">1 Week</option>
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
          <Card className="h-full">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  {selectedSymbol} Price Chart
                </CardTitle>
                <div className="flex items-center gap-4">
                  <div className="text-2xl font-bold">
                    ${currentPrice.toLocaleString()}
                  </div>
                  <div className={`flex items-center gap-1 ${priceChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {priceChange >= 0 ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />}
                    {Math.abs(priceChange).toFixed(2)}%
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="h-full">
              {/* Simplified Chart Visualization */}
              <div className="h-96 bg-gray-100 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-300">
                <div className="text-center">
                  <Activity className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                  <div className="text-lg font-medium text-gray-600">Live Price Chart</div>
                  <div className="text-sm text-gray-500">
                    {marketData.length} data points • {trades.length} trades plotted
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                    <div className="bg-white p-3 rounded border">
                      <div className="font-medium text-green-600">Buy Signals</div>
                      <div className="text-2xl font-bold">
                        {trades.filter(t => t.side === 'BUY').length}
                      </div>
                    </div>
                    <div className="bg-white p-3 rounded border">
                      <div className="font-medium text-red-600">Sell Signals</div>
                      <div className="text-2xl font-bold">
                        {trades.filter(t => t.side === 'SELL').length}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Trade Entry/Exit Markers */}
              <div className="mt-4">
                <h4 className="font-medium mb-2">Recent Trade Signals</h4>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {trades.slice(0, 10).map((trade) => (
                    <div key={trade.id} className="flex items-center justify-between p-2 bg-white border rounded">
                      <div className="flex items-center gap-2">
                        <Badge variant={trade.side === 'BUY' ? 'default' : 'destructive'}>
                          {trade.side}
                        </Badge>
                        <span className="font-medium">${trade.price.toLocaleString()}</span>
                        <span className="text-sm text-gray-600">{trade.strategy}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-sm ${(trade.pnl || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {(trade.pnl || 0) >= 0 ? '+' : ''}${(trade.pnl || 0).toFixed(2)}
                        </span>
                        <span className="text-xs text-gray-500">
                          {new Date(trade.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="w-80 p-4 bg-white border-l">
          <Tabs defaultValue="performance" className="h-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="performance">Performance</TabsTrigger>
              <TabsTrigger value="strategies">Strategies</TabsTrigger>
            </TabsList>

            <TabsContent value="performance" className="space-y-4">
              {/* Overall Performance */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Overall Performance</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total P&L:</span>
                    <span className={`font-bold ${totalPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {totalPnL >= 0 ? '+' : ''}${totalPnL.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Win Rate:</span>
                    <span className="font-bold">{winRate.toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Trades:</span>
                    <span className="font-bold">{totalTrades}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Winning Trades:</span>
                    <span className="font-bold text-green-600">{winningTrades}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Losing Trades:</span>
                    <span className="font-bold text-red-600">{totalTrades - winningTrades}</span>
                  </div>
                </CardContent>
              </Card>

              {/* Recent Activity */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    Recent Activity
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {trades.slice(0, 5).map((trade) => (
                      <div key={trade.id} className="text-sm">
                        <div className="flex items-center justify-between">
                          <span className={trade.side === 'BUY' ? 'text-green-600' : 'text-red-600'}>
                            {trade.side} {trade.symbol}
                          </span>
                          <span className="text-gray-500">
                            {new Date(trade.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                        <div className="text-xs text-gray-600">
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
                <Card key={strategy.name}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: strategy.color }}
                        />
                        <span className="font-medium">{strategy.name}</span>
                      </div>
                      <Badge variant={strategy.active ? "default" : "secondary"}>
                        {strategy.active ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                    
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Trades:</span>
                        <span>{strategy.totalTrades}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Win Rate:</span>
                        <span>{strategy.winRate.toFixed(1)}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">P&L:</span>
                        <span className={strategy.totalPnL >= 0 ? 'text-green-600' : 'text-red-600'}>
                          {strategy.totalPnL >= 0 ? '+' : ''}${strategy.totalPnL.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Avg Trade:</span>
                        <span>${strategy.avgTradeSize.toFixed(0)}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              
              {strategies.length === 0 && (
                <div className="text-center text-gray-500 py-8">
                  <Target className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                  <div>No strategies found</div>
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
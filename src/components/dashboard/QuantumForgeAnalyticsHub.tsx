'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '../ui/card';
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
  Minimize,
  Brain,
  Cpu,
  Database,
  Network,
  Eye
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
  isActive: boolean;
}

export default function QuantumForgeAnalyticsHub() {
  const [recentTrades, setRecentTrades] = useState<TradeEntry[]>([]);
  const [marketData, setMarketData] = useState<MarketDataPoint[]>([]);
  const [strategyPerformance, setStrategyPerformance] = useState<StrategyPerformance[]>([]);
  const [selectedSymbol, setSelectedSymbol] = useState('BTCUSD');
  const [timeRange, setTimeRange] = useState('1D');
  const [selectedStrategies, setSelectedStrategies] = useState<string[]>(['all']);
  const [isLive, setIsLive] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [loading, setLoading] = useState(true);

  // Fetch real trading data
  const fetchTradingData = async () => {
    try {
      // Fetch from custom paper trading API
      const response = await fetch('/api/custom-paper-trading/dashboard');
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data.trades) {
          const formattedTrades: TradeEntry[] = data.data.trades
            .slice(-20) // Last 20 trades
            .map((trade: any, index: number) => ({
              id: trade.id || `trade-${index}`,
              strategy: trade.strategy || 'QUANTUM FORGE™ Neural Engine',
              symbol: trade.symbol || 'BTCUSD',
              side: trade.action?.toUpperCase() === 'SELL' ? 'SELL' : 'BUY',
              price: trade.price || 0,
              quantity: trade.quantity || 0.01,
              timestamp: trade.timestamp || new Date().toISOString(),
              pnl: trade.pnl || 0,
              confidence: trade.confidence || 0.75
            }));

          setRecentTrades(formattedTrades);

          // Calculate strategy performance
          const strategies = new Map<string, StrategyPerformance>();
          formattedTrades.forEach(trade => {
            const strategyName = trade.strategy;
            const current = strategies.get(strategyName) || {
              name: strategyName,
              totalTrades: 0,
              winRate: 0,
              totalPnL: 0,
              avgTradeSize: 0,
              isActive: true
            };

            current.totalTrades++;
            current.totalPnL += trade.pnl || 0;
            current.avgTradeSize = (current.avgTradeSize * (current.totalTrades - 1) + (trade.price * trade.quantity)) / current.totalTrades;

            strategies.set(strategyName, current);
          });

          // Calculate win rates
          strategies.forEach((strategy, name) => {
            const winningTrades = formattedTrades.filter(
              trade => trade.strategy === name && (trade.pnl || 0) > 0
            ).length;
            strategy.winRate = strategy.totalTrades > 0 ? (winningTrades / strategy.totalTrades) * 100 : 0;
          });

          setStrategyPerformance(Array.from(strategies.values()));
        }
      }

      // Generate mock market data for visualization
      const now = new Date();
      const mockMarketData: MarketDataPoint[] = [];
      for (let i = 23; i >= 0; i--) {
        const timestamp = new Date(now.getTime() - (i * 60 * 60 * 1000));
        const basePrice = 65000;
        const volatility = Math.sin(i * 0.5) * 2000 + Math.random() * 1000;
        
        mockMarketData.push({
          timestamp: timestamp.toISOString(),
          price: basePrice + volatility,
          volume: Math.random() * 1000000
        });
      }
      setMarketData(mockMarketData);
      setLastUpdate(new Date());
      
    } catch (error) {
      console.error('Error fetching trading data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTradingData();
    const interval = setInterval(fetchTradingData, 30000); // Update every 30 seconds
    
    return () => clearInterval(interval);
  }, [selectedSymbol, timeRange]);

  // Calculate aggregated metrics
  const totalTrades = recentTrades.length;
  const profitableTrades = recentTrades.filter(trade => (trade.pnl || 0) > 0).length;
  const totalPnL = recentTrades.reduce((sum, trade) => sum + (trade.pnl || 0), 0);
  const winRate = totalTrades > 0 ? (profitableTrades / totalTrades) * 100 : 0;
  const avgTradeSize = totalTrades > 0 ? recentTrades.reduce((sum, trade) => sum + (trade.price * trade.quantity), 0) / totalTrades : 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <h2 className="text-2xl font-bold text-white">Initializing QUANTUM FORGE™ Analytics Hub...</h2>
          <p className="text-purple-300">Loading neural trading intelligence</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 p-6">
      <div className="space-y-6">
        {/* Hero Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-4">
            📊 <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">QUANTUM FORGE™</span><br />
            <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent drop-shadow-lg">Analytics Hub</span>
          </h1>
          <div className="text-2xl text-cyan-300 mb-2">
            "Advanced Real-Time Trading Analytics & Market Intelligence"
          </div>
          <div className="text-purple-300 italic mb-8">
            "Where Data Transforms Into Neural Intelligence"
          </div>
        </div>

        {/* Control Panel */}
        <div className="bg-gradient-to-br from-gray-900/50 to-black/50 border border-purple-400/30 backdrop-blur-sm rounded-xl p-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                  <BarChart3 className="w-8 h-8 text-purple-400" />
                  Neural Trading Intelligence
                </h2>
                <Badge className={`${isLive ? 'bg-green-900/30 text-green-300 border-green-500/30' : 'bg-gray-900/30 text-gray-300 border-gray-500/30'}`}>
                  {isLive ? '🟢 QUANTUM ACTIVE' : '⏸️ PAUSED'}
                </Badge>
              </div>
            </div>
            
            <div className="flex flex-wrap items-center gap-3">
              {/* Symbol Selector */}
              <select 
                value={selectedSymbol} 
                onChange={(e) => setSelectedSymbol(e.target.value)}
                className="px-4 py-2 bg-gray-800/50 border border-purple-500/30 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 backdrop-blur-sm"
              >
                <option value="BTCUSD">Bitcoin (BTC/USD)</option>
                <option value="ETHUSD">Ethereum (ETH/USD)</option>
                <option value="SOLUSD">Solana (SOL/USD)</option>
                <option value="LINKUSD">Chainlink (LINK/USD)</option>
                <option value="ADAUSD">Cardano (ADA/USD)</option>
              </select>
              
              {/* Time Range */}
              <select 
                value={timeRange} 
                onChange={(e) => setTimeRange(e.target.value)}
                className="px-4 py-2 bg-gray-800/50 border border-purple-500/30 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 backdrop-blur-sm"
              >
                <option value="1H">1 Hour Neural Scan</option>
                <option value="4H">4 Hour Neural Analysis</option>
                <option value="1D">24 Hour Neural Intelligence</option>
                <option value="1W">1 Week Neural Pattern</option>
              </select>
              
              <Button
                onClick={() => setIsLive(!isLive)}
                className={`${isLive ? 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800' : 'bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800'} text-white border border-purple-500/50 backdrop-blur-sm`}
              >
                {isLive ? <Pause className="w-4 h-4 mr-2" /> : <Play className="w-4 h-4 mr-2" />}
                {isLive ? 'Pause Neural Feed' : 'Activate Neural Feed'}
              </Button>
            </div>
          </div>
        </div>

        {/* Neural Performance Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-gradient-to-br from-green-900/30 to-green-900/30 border border-green-400/30 backdrop-blur-sm rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold text-green-300 mb-1">Neural Win Rate</h3>
                <p className="text-3xl font-bold text-white">{winRate.toFixed(1)}%</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-green-400" />
              </div>
            </div>
            <div className="text-sm text-gray-300">
              {profitableTrades}/{totalTrades} profitable trades
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-900/30 to-purple-900/30 border border-purple-400/30 backdrop-blur-sm rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold text-purple-300 mb-1">Total Neural P&L</h3>
                <p className={`text-3xl font-bold ${totalPnL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  ${totalPnL.toFixed(2)}
                </p>
              </div>
              <div className="w-12 h-12 rounded-full bg-purple-500/20 flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-purple-400" />
              </div>
            </div>
            <div className="text-sm text-gray-300">
              Neural profit/loss analysis
            </div>
          </div>

          <div className="bg-gradient-to-br from-cyan-900/30 to-cyan-900/30 border border-cyan-400/30 backdrop-blur-sm rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold text-cyan-300 mb-1">Neural Trades</h3>
                <p className="text-3xl font-bold text-white">{totalTrades}</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-cyan-500/20 flex items-center justify-center">
                <Activity className="w-6 h-6 text-cyan-400" />
              </div>
            </div>
            <div className="text-sm text-gray-300">
              Total neural executions
            </div>
          </div>

          <div className="bg-gradient-to-br from-pink-900/30 to-pink-900/30 border border-pink-400/30 backdrop-blur-sm rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold text-pink-300 mb-1">Avg Trade Size</h3>
                <p className="text-3xl font-bold text-white">${avgTradeSize.toFixed(0)}</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-pink-500/20 flex items-center justify-center">
                <Target className="w-6 h-6 text-pink-400" />
              </div>
            </div>
            <div className="text-sm text-gray-300">
              Neural position sizing
            </div>
          </div>
        </div>

        {/* Neural Trading Chart */}
        <div className="bg-gradient-to-br from-gray-900/50 to-black/50 border border-cyan-400/30 backdrop-blur-sm rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-cyan-300 flex items-center gap-3">
              <Eye className="w-6 h-6 text-cyan-400" />
              Neural Market Intelligence Visualization
            </h2>
            <div className="text-sm text-gray-400">
              Last neural update: {lastUpdate.toLocaleTimeString()}
            </div>
          </div>
          
          {/* QUANTUM FORGE™ Real-Time Trading Chart */}
          <div className="h-96 bg-gray-800/30 rounded-lg border border-gray-700/50 p-4">
            <RealTimeChart 
              data={marketData}
              trades={recentTrades}
              symbol={selectedSymbol}
            />
          </div>
        </div>

        {/* Neural Strategy Performance Matrix */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Strategy Performance */}
          <div className="bg-gradient-to-br from-purple-900/30 to-pink-900/30 border border-purple-400/30 backdrop-blur-sm rounded-xl p-6">
            <h2 className="text-2xl font-bold text-purple-300 mb-6 flex items-center gap-3">
              <Brain className="w-6 h-6 text-purple-400" />
              Neural Strategy Performance
            </h2>
            
            <div className="space-y-4">
              {strategyPerformance.slice(0, 5).map((strategy, index) => (
                <div key={index} className="bg-gray-800/30 rounded-lg p-4 border border-gray-700/30">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-white">{strategy.name}</h3>
                      <div className="flex items-center gap-4 text-sm text-gray-400">
                        <span>{strategy.totalTrades} trades</span>
                        <span>{strategy.winRate.toFixed(1)}% win rate</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-lg font-bold ${strategy.totalPnL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        ${strategy.totalPnL.toFixed(2)}
                      </div>
                      <div className="text-sm text-gray-400">
                        Avg: ${strategy.avgTradeSize.toFixed(0)}
                      </div>
                    </div>
                  </div>
                  
                  {/* Win Rate Progress Bar */}
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${strategy.winRate}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Neural Trades */}
          <div className="bg-gradient-to-br from-cyan-900/30 to-blue-900/30 border border-cyan-400/30 backdrop-blur-sm rounded-xl p-6">
            <h2 className="text-2xl font-bold text-cyan-300 mb-6 flex items-center gap-3">
              <Database className="w-6 h-6 text-cyan-400" />
              Recent Neural Executions
            </h2>
            
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {recentTrades.slice(-10).reverse().map((trade, index) => (
                <div key={index} className="bg-gray-800/30 rounded-lg p-4 border border-gray-700/30">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <Badge className={`${trade.side === 'BUY' ? 'bg-green-900/30 text-green-300 border-green-500/30' : 'bg-red-900/30 text-red-300 border-red-500/30'}`}>
                        {trade.side === 'BUY' ? '📈 NEURAL BUY' : '📉 NEURAL SELL'}
                      </Badge>
                      <span className="font-mono text-white">{trade.symbol}</span>
                    </div>
                    <div className="text-right">
                      <div className={`font-bold ${(trade.pnl || 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {(trade.pnl || 0) >= 0 ? '+' : ''}${(trade.pnl || 0).toFixed(2)}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm text-gray-400">
                    <span>{trade.strategy}</span>
                    <span>Conf: {(trade.confidence * 100).toFixed(0)}%</span>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm text-gray-400 mt-1">
                    <span>${trade.price.toFixed(2)} × {trade.quantity}</span>
                    <span>{new Date(trade.timestamp).toLocaleTimeString()}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Neural System Status */}
        <div className="bg-gradient-to-r from-purple-900/20 via-cyan-900/20 to-green-900/20 border border-green-500/30 backdrop-blur-sm rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-4 h-4 bg-green-500 rounded-full animate-pulse"></div>
              <div>
                <h3 className="text-xl font-bold text-green-300">📊 QUANTUM FORGE™ Analytics Hub Online</h3>
                <p className="text-green-400">
                  Neural trading analytics processing continuously • Last neural analysis: {lastUpdate.toLocaleTimeString()}
                </p>
              </div>
            </div>
            <Button
              onClick={fetchTradingData}
              className="bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700 text-white border border-purple-500/50 backdrop-blur-sm"
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Processing...
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 mr-2" />
                  Refresh Neural Data
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}